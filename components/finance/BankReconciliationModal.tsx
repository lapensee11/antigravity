"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Calendar, Download, RefreshCcw, Building2, Receipt, CheckCircle2, Plus, Trash2, ChevronLeft, ChevronRight, FileUp, FileSpreadsheet, Layers, Check } from "lucide-react";
import { getCMIEntries, saveCMIEntries, getTransactions, saveTransaction } from "@/lib/data-service";
import { CMIEntry as CMIDbEntry, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx-js-style";

interface ReconModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransactionsUpdated?: () => void;
}

interface CMIEntry {
    id: string;
    date: string;
    brut: string;
    commission: string;
    tva: string;
    net: string;
}

export function BankReconciliationModal({ isOpen, onClose, onTransactionsUpdated }: ReconModalProps) {
    const [activeTab, setActiveTab] = useState<"CMI" | "Relevé" | "Rapprochement">("CMI");

    // Month/Year Navigation State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    // Persistent storage for CMI entries by YYYY-MM
    const [allCmiData, setAllCmiData] = useState<Record<string, CMIEntry[]>>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

    // Bank Statement state
    const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<string>("");
    const [statementData, setStatementData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [isCompressed, setIsCompressed] = useState(false);

    // Bank transactions state
    const [bankTransactions, setBankTransactions] = useState<Transaction[]>([]);
    
    // Track reconciled dates (where CMI Net has replaced bank amount)
    const [reconciledDates, setReconciledDates] = useState<Set<string>>(new Set());

    const currentMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const cmiEntries = (allCmiData[currentMonthKey] || []).sort((a, b) => a.date.localeCompare(b.date));

    // Prepare reconciliation table data (filtered by selected month)
    const reconciliationData = useMemo(() => {
        // Get CMI entries for the selected month
        const monthCmiEntries = allCmiData[currentMonthKey] || [];
        
        // Get CMI bank transactions (from Banque account) for the selected month
        const cmiBankTransactions = bankTransactions.filter(tx => {
            if (tx.account !== "Banque") return false;
            if (!(tx.label.toLowerCase().includes("cmi") || tx.tier === "CMI")) return false;
            
            // Filter by selected month
            const txDate = new Date(tx.date);
            return txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonth;
        });
        
        // Create a map of dates to CMI entries
        const cmiByDate = new Map<string, CMIEntry>();
        monthCmiEntries.forEach(entry => {
            if (entry.brut && parseFloat(entry.brut) > 0) {
                cmiByDate.set(entry.date, entry);
            }
        });
        
        // Create a map of dates to bank transactions
        const bankTxByDate = new Map<string, Transaction[]>();
        cmiBankTransactions.forEach(tx => {
            if (!bankTxByDate.has(tx.date)) {
                bankTxByDate.set(tx.date, []);
            }
            bankTxByDate.get(tx.date)!.push(tx);
        });
        
        // Combine all unique dates
        const allDates = new Set<string>();
        cmiByDate.forEach((_, date) => allDates.add(date));
        bankTxByDate.forEach((_, date) => allDates.add(date));
        
        // Sort dates
        const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));
        
        return sortedDates.map(date => {
            const cmiEntry = cmiByDate.get(date);
            const bankTxs = bankTxByDate.get(date) || [];
            const totalBankAmount = bankTxs.reduce((sum, tx) => sum + tx.amount, 0);
            const isReconciled = reconciledDates.has(date);
            const displayAmount = isReconciled && cmiEntry && parseFloat(cmiEntry.net) > 0 
                ? parseFloat(cmiEntry.net) 
                : totalBankAmount;
            
            return {
                date,
                cmiEntry,
                bankTxs,
                totalBankAmount,
                displayAmount,
                isReconciled
            };
        });
    }, [allCmiData, bankTransactions, currentMonthKey, selectedYear, selectedMonth, reconciledDates]);

    // 1. Load data from DB on open
    useEffect(() => {
        if (isOpen && !isLoaded) {
            getCMIEntries().then(entries => {
                const indexed: Record<string, CMIEntry[]> = {};
                entries.forEach(e => {
                    const monthKey = e.date.substring(0, 7); // YYYY-MM
                    if (!indexed[monthKey]) indexed[monthKey] = [];
                    indexed[monthKey].push({
                        ...e,
                        brut: e.brut.toString(),
                        commission: e.commission.toString(),
                        tva: e.tva.toString(),
                        net: e.net.toString()
                    });
                });
                setAllCmiData(indexed);
                setIsLoaded(true);
            });
        }
    }, [isOpen, isLoaded]);

    // Load bank transactions when opening modal or switching to Rapprochement tab
    useEffect(() => {
        if (isOpen && isLoaded) {
            getTransactions().then(txs => {
                setBankTransactions(txs);
                // Check which dates are already reconciled (CMI Net matches bank amount)
                const reconciled = new Set<string>();
                txs.forEach(tx => {
                    if (tx.account === "Banque" && (tx.label.toLowerCase().includes("cmi") || tx.tier === "CMI")) {
                        // Find corresponding CMI entry for this date
                        const allCmiEntries = Object.values(allCmiData).flat();
                        const cmiEntry = allCmiEntries.find(e => e.date === tx.date);
                        if (cmiEntry && parseFloat(cmiEntry.net) > 0) {
                            const cmiNet = parseFloat(cmiEntry.net);
                            // If bank amount matches CMI Net, it's already reconciled
                            if (Math.abs(tx.amount - cmiNet) < 0.01) {
                                reconciled.add(tx.date);
                            }
                        }
                    }
                });
                setReconciledDates(reconciled);
            });
        }
    }, [isOpen, activeTab, isLoaded, allCmiData]);
    
    // Handle reconciliation action
    const handleReconcileCMI = async (date: string, cmiNet: number) => {
        if (cmiNet <= 0) return;
        
        // Find CMI bank transactions for this date
        const cmiBankTxs = bankTransactions.filter(tx => 
            tx.account === "Banque" && 
            tx.date === date &&
            (tx.label.toLowerCase().includes("cmi") || tx.tier === "CMI")
        );
        
        if (cmiBankTxs.length === 0) {
            alert("Aucune transaction CMI trouvée pour cette date dans le journal de banque.");
            return;
        }
        
        // Update all CMI transactions for this date with CMI Net amount
        for (const tx of cmiBankTxs) {
            const updatedTx: Transaction = {
                ...tx,
                amount: cmiNet
            };
            await saveTransaction(updatedTx);
        }
        
        // Reload transactions
        const updatedTxs = await getTransactions();
        setBankTransactions(updatedTxs);
        
        // Mark as reconciled
        setReconciledDates(prev => new Set(prev).add(date));
        
        // Notify parent component to refresh transactions
        if (onTransactionsUpdated) {
            onTransactionsUpdated();
        }
    };

    // 2. Persist any change to DB
    const persistToDb = async (newData: Record<string, CMIEntry[]>) => {
        const flattened: CMIDbEntry[] = Object.values(newData).flat().map(e => ({
            id: e.id,
            date: e.date,
            brut: parseFloat(e.brut) || 0,
            commission: parseFloat(e.commission) || 0,
            tva: parseFloat(e.tva) || 0,
            net: parseFloat(e.net) || 0
        }));
        await saveCMIEntries(flattened);
    };

    // 3. Initialize month if empty (Daily rows)
    useEffect(() => {
        if (isOpen && isLoaded && activeTab === "CMI" && !allCmiData[currentMonthKey]) {
            const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
            const entries: CMIEntry[] = [];

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                entries.push({
                    id: Math.random().toString(36).substr(2, 9),
                    date: dateStr,
                    brut: "",
                    commission: "",
                    tva: "",
                    net: "0.00"
                });
            }

            const updated = {
                ...allCmiData,
                [currentMonthKey]: entries
            };
            setAllCmiData(updated);
            persistToDb(updated);
        }
    }, [currentMonthKey, isOpen, isLoaded, activeTab, allCmiData, selectedYear, selectedMonth]);

    const addCmiRow = () => {
        const newRow: CMIEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: currentMonthKey + "-01",
            brut: "",
            commission: "",
            tva: "",
            net: "0.00"
        };
        const updated = {
            ...allCmiData,
            [currentMonthKey]: [...(allCmiData[currentMonthKey] || []), newRow]
        };
        setAllCmiData(updated);
        persistToDb(updated);
    };

    const removeCmiRow = (id: string) => {
        const updated = {
            ...allCmiData,
            [currentMonthKey]: (allCmiData[currentMonthKey] || []).filter(entry => entry.id !== id)
        };
        setAllCmiData(updated);
        persistToDb(updated);
    };

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    const updateCmiEntry = (id: string, field: keyof CMIEntry, value: string) => {
        const updatedMonthEntries = cmiEntries.map(entry => {
            if (entry.id !== id) return entry;

            const updated = { ...entry, [field]: value };

            // Auto-calculate Net
            if (["brut", "commission", "tva"].includes(field)) {
                const b = parseFloat(updated.brut) || 0;
                const c = parseFloat(updated.commission) || 0;
                const t = parseFloat(updated.tva) || 0;
                updated.net = (b - c - t).toFixed(2);
            }

            return updated;
        });

        const updated = {
            ...allCmiData,
            [currentMonthKey]: updatedMonthEntries
        };
        setAllCmiData(updated);
        persistToDb(updated);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const wb = XLSX.read(data, {
                type: "array",
                cellDates: true,
                dateNF: 'yyyy-mm-dd'
            });

            setWorkbook(wb);
            setSheets(wb.SheetNames);

            if (wb.SheetNames.length === 1) {
                const sheetName = wb.SheetNames[0];
                setSelectedSheet(sheetName);
                const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
                setStatementData(jsonData);
            }
            setIsImporting(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSheetSelect = (sheetName: string) => {
        if (!workbook) return;
        setSelectedSheet(sheetName);
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
        setStatementData(jsonData);
    };

    const formatCellValue = (val: any) => {
        if (val instanceof Date) {
            return val.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
        // Handle potential Excel serial numbers that didn't get converted
        if (typeof val === 'number' && val > 40000 && val < 60000) {
            try {
                const date = new Date((val - 25569) * 86400 * 1000);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            } catch (e) { /* fallback to string */ }
        }
        if (typeof val === 'number') {
            if (val === 0) return "";
            return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return String(val);
    };

    const getProcessedData = () => {
        if (!isCompressed) return statementData;

        const parseNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return parseFloat(String(val).replace(',', '.').replace(/[^-0-9.]/g, '')) || 0;
        };

        const grouped: Record<string, any> = {};
        const others: any[] = [];

        statementData.forEach(row => {
            const fullText = Object.values(row).join(" ").toUpperCase();
            const bankDateStr = formatCellValue(row.Date || row.date || "");

            if (fullText.includes("TPE")) {
                // Extract internal transaction date (DD/MM/YY) and terminal ID
                const dateMatch = fullText.match(/(\d{2}\/\d{2}\/\d{2})/);
                const terminalMatch = fullText.match(/(\d{8,12})/);

                const internalDate = dateMatch ? dateMatch[1] : "";
                const terminalId = terminalMatch ? terminalMatch[1] : "TPE";

                // Grouping key: Bank Date + Internal Date + Terminal ID
                const key = `${bankDateStr}_${internalDate}_${terminalId}`;

                if (!grouped[key]) {
                    grouped[key] = { ...row };
                    Object.keys(row).forEach(keyName => {
                        const lowerKeyName = keyName.toLowerCase();
                        const valStr = String(row[keyName]).toUpperCase();

                        // Identify amount columns to sum
                        if (["débit", "debit", "crédit", "credit", "montant", "euro"].some(kw => lowerKeyName.includes(kw))) {
                            grouped[key][keyName] = parseNum(row[keyName]);
                        }
                        // Update descriptions to the new summary format
                        else if (valStr.includes("TPE") || lowerKeyName.includes("détail") || lowerKeyName.includes("libellé") || lowerKeyName.includes("detail")) {
                            grouped[key][keyName] = internalDate
                                ? `${internalDate} Cumul TPE ${terminalId}`
                                : `Cumul TPE ${terminalId}`;
                        }
                    });
                } else {
                    Object.keys(row).forEach(keyName => {
                        const lowerKeyName = keyName.toLowerCase();
                        if (["débit", "debit", "crédit", "credit", "montant", "euro"].some(kw => lowerKeyName.includes(kw))) {
                            grouped[key][keyName] = Math.round((grouped[key][keyName] + parseNum(row[keyName])) * 100) / 100;
                        }
                    });
                }
            } else {
                others.push(row);
            }
        });

        return [...others, ...Object.values(grouped)].sort((a, b) => {
            const getTimestamp = (row: any) => {
                // Look for the FIRST column that contains "date" in its header
                const dateKey = Object.keys(row).find(k => k.toLowerCase().includes("date"));
                const d = dateKey ? row[dateKey] : "";

                if (d instanceof Date) return d.getTime();
                if (typeof d === 'number' && d > 40000) return (d - 25569) * 86400 * 1000;

                // Parse DD/MM/YYYY or DD/MM/YY strings explicitly if needed
                if (typeof d === 'string' && d.includes('/')) {
                    const parts = d.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        let year = parseInt(parts[2]);
                        if (year < 100) year += 2000;
                        const dateObj = new Date(year, month, day);
                        if (!isNaN(dateObj.getTime())) return dateObj.getTime();
                    }
                }

                const parsed = new Date(d);
                return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
            };
            // Set to ASCENDING (Croissante) as requested
            return getTimestamp(a) - getTimestamp(b);
        });
    };

    const handleExportExcel = () => {
        let dataToExport: any[] = [];
        let filename = "Export_Bako.xlsx";

        const formatDate = (d: any) => {
            if (!d) return "";
            const dateObj = new Date(d);
            if (isNaN(dateObj.getTime())) return String(d);
            return dateObj.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        const numOrEmpty = (val: any) => {
            if (val === 0 || val === "0" || val === "0.00") return "";
            const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').replace(/[^-0-9.]/g, '')) || 0;
            return num === 0 ? "" : num;
        };

        if (activeTab === "CMI") {
            const totalBrut = cmiEntries.reduce((acc, e) => acc + (parseFloat(e.brut) || 0), 0);
            const totalComm = cmiEntries.reduce((acc, e) => acc + (parseFloat(e.commission) || 0), 0);
            const totalTva = cmiEntries.reduce((acc, e) => acc + (parseFloat(e.tva) || 0), 0);
            const totalNet = cmiEntries.reduce((acc, e) => acc + (parseFloat(e.net) || 0), 0);

            dataToExport = cmiEntries.map(e => ({
                "Date": formatDate(e.date),
                "CMI Brut": numOrEmpty(e.brut),
                "Commission": numOrEmpty(e.commission),
                "TVA": numOrEmpty(e.tva),
                "CMI Net": numOrEmpty(e.net),
                "Pointage": ""
            }));

            dataToExport.push({
                "Date": "TOTAUX",
                "CMI Brut": numOrEmpty(totalBrut),
                "Commission": numOrEmpty(totalComm),
                "TVA": numOrEmpty(totalTva),
                "CMI Net": numOrEmpty(totalNet),
                "Pointage": ""
            });
            filename = `Bako_CMI_${currentMonthKey}.xlsx`;
        } else if (activeTab === "Relevé") {
            const displayData = getProcessedData();
            if (displayData.length === 0) return;

            const headers = Object.keys(displayData[0])
                .filter(key => {
                    const lowerKey = key.toLowerCase();
                    return !["détail", "detail", "valeur"].some(ex => lowerKey.includes(ex));
                });

            // Clean data for rows and add Pointage after Credit
            dataToExport = displayData.map(row => {
                const cleanRow: any = {};
                headers.forEach(h => {
                    const lowerH = h.toLowerCase();
                    if (lowerH.includes("date")) {
                        cleanRow[h] = formatDate(row[h]);
                    } else if (["montant", "débit", "debit", "crédit", "credit", "euro"].some(kw => lowerH.includes(kw))) {
                        cleanRow[h] = numOrEmpty(row[h]);
                    } else {
                        cleanRow[h] = row[h];
                    }

                    if (lowerH.includes("crédit") || lowerH.includes("credit")) {
                        cleanRow["Pointage"] = "";
                    }
                });
                if (!cleanRow["Pointage"]) cleanRow["Pointage"] = "";
                return cleanRow;
            });

            // Calculate totals row
            const totalsRow: any = {};
            let hasTotals = false;
            headers.forEach((header, idx) => {
                if (idx === 0) {
                    totalsRow[header] = "TOTAUX";
                } else {
                    const lowerHeader = header.toLowerCase();
                    if (["montant", "débit", "debit", "crédit", "credit", "euro"].some(kw => lowerHeader.includes(kw))) {
                        const total = displayData.reduce((acc, row) => {
                            const val = row[header];
                            const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').replace(/[^-0-9.]/g, '')) || 0;
                            return acc + num;
                        }, 0);
                        totalsRow[header] = numOrEmpty(total);
                        hasTotals = true;
                    } else {
                        totalsRow[header] = "";
                    }

                    if (lowerHeader.includes("crédit") || lowerHeader.includes("credit")) {
                        totalsRow["Pointage"] = "";
                    }
                }
            });

            if (hasTotals) dataToExport.push(totalsRow);
            filename = `Bako_Releve_${selectedSheet || "Import"}.xlsx`;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Custom column widths
        const headersArr = dataToExport.length > 0 ? Object.keys(dataToExport[0]) : [];
        worksheet['!cols'] = headersArr.map(header => {
            const h = header.toLowerCase();
            if (h.includes("date")) return { wch: 18 };
            if (h.includes("libellé") || h.includes("libelle") || h.includes("detail") || h.includes("détail")) return { wch: 45 };
            if (h.includes("débit") || h.includes("debit") || h.includes("crédit") || h.includes("credit") || h.includes("montant")) return { wch: 20 };
            if (h.includes("pointage")) return { wch: 10 }; // Halved
            return { wch: 25 };
        });

        // Apply background styling, borders and font sizing
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        const borderThin = { style: "thin", color: { rgb: "000000" } };
        const borderMedium = { style: "medium", color: { rgb: "000000" } };

        const headerStyle = {
            fill: { fgColor: { rgb: "F2F2F2" } },
            font: { bold: true, color: { rgb: "000000" }, sz: 12 },
            alignment: { vertical: "center", horizontal: "center" },
            border: {
                top: borderMedium,
                bottom: borderMedium,
                left: borderMedium,
                right: borderMedium
            }
        };

        const footerStyle = {
            fill: { fgColor: { rgb: "F2F2F2" } },
            font: { bold: true, sz: 12 },
            border: {
                top: borderMedium,
                bottom: borderMedium,
                left: borderMedium,
                right: borderMedium
            }
        };

        const cellStyle = {
            border: {
                top: borderThin,
                bottom: borderThin,
                left: borderThin,
                right: borderThin
            }
        };

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                if (!cell) continue;

                // Default border for all cells
                cell.s = { ...cellStyle };

                // Header Style (Row 0)
                if (R === 0) {
                    cell.s = { ...headerStyle };
                }

                // Footer Style (Last Row if contains TOTAUX)
                const firstCellInRow = worksheet[XLSX.utils.encode_cell({ r: R, c: 0 })];
                if (String(firstCellInRow?.v || "").includes("TOTAUX")) {
                    cell.s = { ...footerStyle };
                }

                // Numeric Formatting: Always 2 decimals for non-zero numbers
                if (cell.t === 'n') {
                    cell.z = "0.00";
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Données");
        XLSX.writeFile(workbook, filename);
    };

    const clearStatement = () => {
        setWorkbook(null);
        setSheets([]);
        setSelectedSheet("");
        setStatementData([]);
        setIsValidated(false);
        setIsCompressed(false);
    };

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    if (!isOpen) return null;

    const tabs = [
        { id: "CMI", label: "CMI", icon: Building2 },
        { id: "Relevé", label: "Relevé Bancaire", icon: Receipt },
        { id: "Rapprochement", label: "Rapprochement", icon: CheckCircle2 },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:static print:block print:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity print:hidden"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-[#FDFBF7] backdrop-blur-2xl border border-white/50 shadow-[0_32px_128px_rgba(0,0,0,0.15)] rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 print:static print:w-full print:h-auto print:max-w-none print:shadow-none print:border-none print:rounded-none print:bg-white print:overflow-visible print:block">

                {/* Header */}
                <div className="px-10 pt-10 pb-6 flex justify-between items-center text-slate-900 print:hidden">
                    <div>
                        <h2 className="text-3xl font-black font-outfit tracking-tight">
                            Rapprochement Bancaire
                        </h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Synchronisez vos flux bancaires et CMI
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-white/50 hover:bg-red-50 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all group shadow-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Custom Tabs & Month Selector */}
                <div className="px-10 pb-6 flex items-center justify-between print:hidden">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl gap-2 w-fit backdrop-blur-sm">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                                        activeTab === tab.id
                                            ? "bg-white text-blue-600 shadow-sm shadow-blue-100/50"
                                            : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Month Selector - For CMI and Rapprochement */}
                    {(activeTab === "CMI" || activeTab === "Rapprochement") && (
                        <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-2xl border border-white/50 shadow-sm">
                            <button
                                onClick={handlePrevMonth}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all active:scale-90"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-[140px] text-center">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                                    {monthNames[selectedMonth]} {selectedYear}
                                </span>
                            </div>
                            <button
                                onClick={handleNextMonth}
                                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all active:scale-90"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 print:p-0 print:overflow-visible print:block">
                    <div className="flex-1 bg-white/70 border border-slate-200/60 rounded-3xl p-4 shadow-sm backdrop-blur-sm flex flex-col overflow-hidden print:p-0 print:border-none print:bg-white print:shadow-none print:overflow-visible print:block">
                        {activeTab === "CMI" && (
                            <div className="space-y-6 flex-1 flex flex-col print:space-y-0 print:block">
                                <div className="flex justify-between items-center print:hidden">
                                    <h3 className="text-xl font-bold text-slate-800">Saisie Manuelle CMI</h3>
                                    <button
                                        onClick={handleExportExcel}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-all active:scale-95"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Exporter Excel
                                    </button>
                                </div>

                                <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm max-h-[700px] overflow-y-auto custom-scrollbar relative flex-1 print:overflow-visible print:max-h-none print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0" onClick={() => setSelectedRowId(null)}>
                                    <table className="w-full text-sm border-collapse print:text-xs">
                                        <thead className="sticky top-0 z-20 bg-[#EDD1B6] border-b border-[#C8A890]/50 text-[10px] font-black text-[#5D4037] uppercase tracking-widest shadow-md text-center print:static print:shadow-none">
                                            <tr>
                                                <th className="px-4 py-1.5 text-left w-[100px]">Date</th>
                                                <th className="px-4 py-1.5 text-right w-[100px]">CMI Brut</th>
                                                <th className="px-4 py-1.5 text-right w-[90px]">Comm.</th>
                                                <th className="px-4 py-1.5 text-right w-[90px]">TVA/Comm</th>
                                                <th className="px-4 py-1.5 text-right w-[100px]">CMI Net</th>
                                                <th className="px-4 py-1.5 text-center w-[70px] opacity-70 tracking-tighter">% Com</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {cmiEntries.map((entry) => {
                                                const brutNum = parseFloat(entry.brut) || 0;
                                                const netNum = parseFloat(entry.net) || 0;
                                                const costRatio = brutNum > 0 ? ((brutNum - netNum) / brutNum) * 100 : 0;

                                                return (
                                                    <tr
                                                        key={entry.id}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedRowId(entry.id); }}
                                                        className={cn(
                                                            "group transition-all duration-200 border-l-4",
                                                            selectedRowId === entry.id
                                                                ? "bg-[#F2DAC3]/60 border-l-[#C8A890] shadow-sm"
                                                                : "hover:bg-slate-50/50 border-l-transparent"
                                                        )}
                                                    >
                                                        <td className="px-4 py-1">
                                                            <div className="text-slate-700 font-bold text-sm min-w-[90px]">
                                                                {new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-1">
                                                            <input
                                                                type="number"
                                                                value={entry.brut}
                                                                onFocus={() => setSelectedRowId(entry.id)}
                                                                placeholder="0.00"
                                                                onChange={(e) => updateCmiEntry(entry.id, 'brut', e.target.value)}
                                                                className="w-full bg-transparent border-none p-0 text-right text-slate-900 font-black focus:ring-0 text-sm placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-1">
                                                            <input
                                                                type="number"
                                                                value={entry.commission}
                                                                onFocus={() => setSelectedRowId(entry.id)}
                                                                placeholder="0.00"
                                                                onChange={(e) => updateCmiEntry(entry.id, 'commission', e.target.value)}
                                                                className="w-full bg-transparent border-none p-0 text-right text-slate-600 font-bold focus:ring-0 text-sm placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-1">
                                                            <input
                                                                type="number"
                                                                value={entry.tva}
                                                                onFocus={() => setSelectedRowId(entry.id)}
                                                                placeholder="0.00"
                                                                onChange={(e) => updateCmiEntry(entry.id, 'tva', e.target.value)}
                                                                className="w-full bg-transparent border-none p-0 text-right text-slate-600 font-bold focus:ring-0 text-sm placeholder:text-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-1 text-right">
                                                            <span className={cn(
                                                                "font-black text-sm tracking-tight transition-colors",
                                                                selectedRowId === entry.id ? "text-amber-700" : "text-[#C8A890]"
                                                            )}>
                                                                {parseFloat(entry.net).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-1 text-center">
                                                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100/50 px-2 py-0.5 rounded-full border border-slate-200/50">
                                                                {costRatio > 0 ? costRatio.toFixed(1) + '%' : '-'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="sticky bottom-0 z-20 bg-[#EDD1B6] border-t-2 border-[#C8A890]/50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] print:static print:shadow-none">
                                            {(() => {
                                                const totalBrut = cmiEntries.reduce((acc, e) => acc + (parseFloat(e.brut) || 0), 0);
                                                const totalNet = cmiEntries.reduce((acc, e) => acc + (parseFloat(e.net) || 0), 0);
                                                const globalCostRatio = totalBrut > 0 ? ((totalBrut - totalNet) / totalBrut) * 100 : 0;

                                                return (
                                                    <tr className="text-[#5D4037]">
                                                        <td className="px-4 py-2 font-black text-[10px] uppercase tracking-widest">Totaux</td>
                                                        <td className="px-4 py-2 text-right font-black text-base">
                                                            {totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-bold text-sm opacity-80">
                                                            {cmiEntries.reduce((acc, e) => acc + (parseFloat(e.commission) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-bold text-sm opacity-80">
                                                            {cmiEntries.reduce((acc, e) => acc + (parseFloat(e.tva) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-black text-base">
                                                            {totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-1">Com %</span>
                                                                <span className="text-xs font-black bg-white/40 px-2 py-0.5 rounded border border-[#C8A890]/30 shadow-sm">
                                                                    {globalCostRatio > 0 ? globalCostRatio.toFixed(1) + '%' : '-'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === "Relevé" && (
                            <div className="flex flex-col flex-1 min-h-0">
                                {!workbook ? (
                                    <div className="flex flex-col items-center justify-center flex-1 text-center py-20 space-y-6">
                                        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                            <FileUp className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 font-outfit">Relevé de Compte</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                                                Téléchargez votre relevé bancaire (Format CSV ou Excel) pour le comparer à vos écritures.
                                            </p>
                                        </div>
                                        <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100/50 flex items-center gap-3 active:scale-95 group">
                                            <FileSpreadsheet className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                            {isImporting ? "Chargement..." : "Charger le Relevé"}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleFileChange}
                                                disabled={isImporting}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex flex-col flex-1 space-y-6 min-h-0 print:space-y-0 print:block">
                                        {/* File Info Bar - Hidden when validated */}
                                        {!isValidated && (
                                            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600">
                                                        <FileSpreadsheet className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 leading-tight">Fichier Chargé</h4>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {sheets.length} feuille(s) trouvée(s)
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={clearStatement}
                                                    className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-100"
                                                >
                                                    Changer de fichier
                                                </button>
                                            </div>
                                        )}

                                        {sheets.length > 1 && !selectedSheet && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-slate-800">
                                                    <Layers className="w-5 h-5 text-blue-500" />
                                                    <h3 className="text-lg font-bold font-outfit">Choisir une feuille</h3>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {sheets.map((sheetName) => (
                                                        <button
                                                            key={sheetName}
                                                            onClick={() => handleSheetSelect(sheetName)}
                                                            className="flex items-center justify-between p-4 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group text-left shadow-sm"
                                                        >
                                                            <span className="font-bold text-slate-700 group-hover:text-blue-700 truncate mr-2">
                                                                {sheetName}
                                                            </span>
                                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedSheet && (
                                            <div className="space-y-4 flex flex-col flex-1 min-h-0 print:space-y-0 print:block">
                                                <div className="flex items-center justify-between print:hidden">
                                                    <div className="flex items-center gap-2 text-slate-800">
                                                        <ChevronRight className="w-5 h-5 text-emerald-500" />
                                                        <h3 className="text-lg font-bold font-outfit">
                                                            {isValidated ? "Relevé Validé" : "Aperçu"} : <span className="text-emerald-600">{selectedSheet}</span>
                                                        </h3>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {isValidated && (
                                                            <>
                                                                <button
                                                                    onClick={() => setIsCompressed(!isCompressed)}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-xs transition-all",
                                                                        isCompressed
                                                                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                    )}
                                                                >
                                                                    <RefreshCcw className={cn("w-4 h-4", isCompressed && "animate-spin-slow")} />
                                                                    {isCompressed ? "TPE Comprimés" : "Comprimer TPE"}
                                                                </button>
                                                                <button
                                                                    onClick={handleExportExcel}
                                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-all active:scale-95"
                                                                >
                                                                    <FileSpreadsheet className="w-4 h-4" />
                                                                    Exporter Excel
                                                                </button>
                                                                <button
                                                                    onClick={() => setIsValidated(false)}
                                                                    className="text-xs font-bold text-blue-600 hover:underline px-2"
                                                                >
                                                                    Modifier
                                                                </button>
                                                            </>
                                                        )}
                                                        {!isValidated && sheets.length > 1 && (
                                                            <button
                                                                onClick={() => setSelectedSheet("")}
                                                                className="text-xs font-bold text-blue-600 hover:underline"
                                                            >
                                                                Changer de feuille
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm overflow-y-auto custom-scrollbar relative flex-1 bg-white print:overflow-visible print:max-h-none print:border-none print:rounded-none print:block">
                                                    {getProcessedData().length > 0 ? (
                                                        <table className="w-full text-xs border-collapse">
                                                            <thead className="sticky top-0 z-20 bg-[#EDD1B6] border-b border-[#C8A890]/50 text-[10px] font-black text-[#5D4037] uppercase tracking-widest shadow-md text-left print:static print:shadow-none">
                                                                <tr>
                                                                    {Object.keys(getProcessedData()[0])
                                                                        .filter(key => {
                                                                            const lowerKey = key.toLowerCase();
                                                                            return !["détail", "detail", "valeur"].some(ex => lowerKey.includes(ex));
                                                                        })
                                                                        .map((header) => (
                                                                            <th key={header} className="px-4 py-1.5 bg-[#EDD1B6] print:bg-white">
                                                                                {header}
                                                                            </th>
                                                                        ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {(isValidated ? getProcessedData() : getProcessedData().slice(0, 50)).map((row, i) => (
                                                                    <tr key={i} className="group transition-colors hover:bg-slate-50/50">
                                                                        {Object.keys(row)
                                                                            .filter(key => {
                                                                                const lowerKey = key.toLowerCase();
                                                                                return !["détail", "detail", "valeur"].some(ex => lowerKey.includes(ex));
                                                                            })
                                                                            .map((key, j) => (
                                                                                <td key={j} className="px-4 py-1 text-slate-600 font-medium whitespace-nowrap">
                                                                                    {formatCellValue(row[key])}
                                                                                </td>
                                                                            ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot className="sticky bottom-0 z-20 bg-[#EDD1B6] border-t-2 border-[#C8A890]/50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] print:static print:shadow-none">
                                                                {(() => {
                                                                    const displayData = isValidated ? getProcessedData() : getProcessedData().slice(0, 50);
                                                                    const headers = Object.keys(displayData[0] || {})
                                                                        .filter(key => {
                                                                            const lowerKey = key.toLowerCase();
                                                                            return !["détail", "detail", "valeur"].some(ex => lowerKey.includes(ex));
                                                                        });

                                                                    // Calculate totals for any numeric column containing 'débit', 'crédit', or 'montant'
                                                                    const totals: Record<string, number> = {};
                                                                    headers.forEach(header => {
                                                                        const lowerHeader = header.toLowerCase();
                                                                        if (["montant", "débit", "debit", "crédit", "credit", "euro"].some(kw => lowerHeader.includes(kw))) {
                                                                            totals[header] = displayData.reduce((acc, row) => {
                                                                                const val = row[header];
                                                                                const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').replace(/[^-0-9.]/g, '')) || 0;
                                                                                return acc + num;
                                                                            }, 0);
                                                                        }
                                                                    });

                                                                    if (headers.length === 0) return null;

                                                                    return (
                                                                        <tr className="text-[#5D4037]">
                                                                            {headers.map((header, idx) => (
                                                                                <td key={header} className="px-4 py-2">
                                                                                    {idx === 0 ? (
                                                                                        <span className="font-black text-[10px] uppercase tracking-widest">Totaux</span>
                                                                                    ) : totals[header] !== undefined ? (
                                                                                        <span className="font-black text-sm">
                                                                                            {totals[header].toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                        </span>
                                                                                    ) : null}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    );
                                                                })()}
                                                            </tfoot>
                                                        </table>
                                                    ) : (
                                                        <div className="flex items-center justify-center p-20 text-slate-400 font-bold italic">
                                                            Aucune donnée à afficher
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between mt-4 print:hidden">
                                                    <p className="text-[10px] text-slate-400 italic">
                                                        {isValidated ? `Affichage de toutes les lignes` : `Affichage des 50 premières lignes`}. {getProcessedData().length} lignes au total.
                                                    </p>
                                                    {!isValidated && (
                                                        <button
                                                            onClick={() => setIsValidated(true)}
                                                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 group active:scale-95"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                            Valider cet Import
                                                        </button>
                                                    )}
                                                    {isValidated && (
                                                        <button
                                                            onClick={() => setActiveTab("Rapprochement")}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 group active:scale-95 shadow-emerald-100"
                                                        >
                                                            Continuer vers Rapprochement
                                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "Rapprochement" && (
                            <div className="space-y-6 flex-1 flex flex-col print:space-y-0 print:block">
                                <div className="flex justify-between items-center print:hidden">
                                    <h3 className="text-xl font-bold text-slate-800">Rapprochement CMI</h3>
                                </div>
                                
                                {/* Reconciliation Table */}
                                <div className="border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm max-h-[700px] overflow-y-auto custom-scrollbar relative flex-1 print:overflow-visible print:max-h-none print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0">
                                    <table className="w-full text-sm border-collapse print:text-xs">
                                        <thead className="sticky top-0 z-20 bg-[#EDD1B6] border-b border-[#C8A890]/50 text-[10px] font-black text-[#5D4037] uppercase tracking-widest shadow-md text-center print:static print:shadow-none">
                                            <tr>
                                                <th className="px-4 py-1.5 text-left w-[100px]">Date</th>
                                                <th className="px-4 py-1.5 text-right w-[120px]">CMI Brut</th>
                                                <th className="px-4 py-1.5 text-right w-[120px]">CMI Net</th>
                                                <th className="px-4 py-1.5 text-right w-[140px]">Encaissement CMI</th>
                                                <th className="px-4 py-1.5 text-center w-[80px]">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {reconciliationData.length > 0 ? (
                                                reconciliationData.map(({ date, cmiEntry, displayAmount, isReconciled }) => {
                                                    const cmiNet = cmiEntry && parseFloat(cmiEntry.net) > 0 ? parseFloat(cmiEntry.net) : 0;
                                                    
                                                    return (
                                                        <tr
                                                            key={date}
                                                            className="group transition-all duration-200 border-l-4 hover:bg-slate-50/50 border-l-transparent"
                                                        >
                                                            <td className="px-4 py-1">
                                                                <div className="text-slate-700 font-bold text-sm min-w-[90px]">
                                                                    {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-1 text-right">
                                                                <div className="text-slate-900 font-black text-sm">
                                                                    {cmiEntry && parseFloat(cmiEntry.brut) > 0 
                                                                        ? parseFloat(cmiEntry.brut).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                        : <span className="text-slate-300">-</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-1 text-right">
                                                                <div className="text-slate-900 font-black text-sm">
                                                                    {cmiNet > 0 
                                                                        ? cmiNet.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                        : <span className="text-slate-300">-</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-1 text-right">
                                                                <div className={cn(
                                                                    "font-black text-sm",
                                                                    isReconciled ? "text-emerald-700" : "text-emerald-600"
                                                                )}>
                                                                    {displayAmount > 0 
                                                                        ? displayAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                        : <span className="text-slate-300">-</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-1 text-center">
                                                                <button
                                                                    onClick={() => cmiNet > 0 && handleReconcileCMI(date, cmiNet)}
                                                                    disabled={cmiNet <= 0}
                                                                    className={cn(
                                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                                        isReconciled
                                                                            ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-300"
                                                                            : "bg-slate-100 hover:bg-[#F2DAC3] text-slate-600 hover:text-[#5D4037] border-2 border-transparent hover:border-[#C8A890]",
                                                                        cmiNet <= 0 && "opacity-50 cursor-not-allowed"
                                                                    )}
                                                                    title={isReconciled ? "Rapproché" : "Rapprocher avec CMI Net"}
                                                                >
                                                                    {isReconciled ? (
                                                                        <Check className="w-4 h-4" />
                                                                    ) : (
                                                                        <Layers className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                                                        <div className="flex flex-col items-center">
                                                            <RefreshCcw className="w-12 h-12 mb-3 opacity-30" />
                                                            <p className="text-sm font-medium">Aucune donnée CMI disponible</p>
                                                            <p className="text-xs mt-1">Les données apparaîtront après la saisie manuelle de CMI</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {reconciliationData.length > 0 && (
                                            <tfoot className="sticky bottom-0 z-10 bg-[#F2DAC3] border-t-2 border-[#C8A890] print:static">
                                                <tr>
                                                    <td className="px-4 py-2 text-left text-sm font-black text-[#5D4037] uppercase">
                                                        TOTAUX
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-black text-[#5D4037]">
                                                        {reconciliationData.reduce((sum, { cmiEntry }) => 
                                                            sum + (cmiEntry && parseFloat(cmiEntry.brut) > 0 ? parseFloat(cmiEntry.brut) : 0), 0
                                                        ).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-black text-[#5D4037]">
                                                        {reconciliationData.reduce((sum, { cmiEntry }) => 
                                                            sum + (cmiEntry && parseFloat(cmiEntry.net) > 0 ? parseFloat(cmiEntry.net) : 0), 0
                                                        ).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-black text-emerald-700">
                                                        {reconciliationData.reduce((sum, { displayAmount }) => sum + displayAmount, 0)
                                                            .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
