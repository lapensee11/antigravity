"use client";

import { Sidebar } from "@/components/layout/Sidebar";
// TopBar removed to align title with logo as requested
import { GlassCard } from "@/components/ui/GlassCard";
import { SalesInputModal } from "@/components/ventes/SalesInputModal";
import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, TrendingUp, ShieldCheck, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveDayData, getSalesData } from "@/lib/actions/ventes";
import { isTauri } from "@/lib/actions/db-desktop";

// Define the shape of saved data for a day
interface DayData {
    status?: 'draft' | 'synced';
    lastSyncAt?: string;
    bankEntryId?: string; // ID of the bank transaction
    sales: Record<string, string>;
    supplements: { traiteurs: string; caisse: string };
    payments: { nbCmi: string; mtCmi: string; nbChq: string; mtChq: string; especes: string };
    subTotalInput: string;
    nbTickets: string;
    glovo: { brut: string; brutImp: string; brutExo: string; incid: string; cash: string };
    hours: { startH: string; startM: string; endH: string; endM: string };
    coeffExo?: string; // NEW
    coeffImp?: string; // NEW
    calculated: {
        exo: string;
        impHt: string;
        totHt: string;
        ttc: string;
        esp: string;
        cmi: string;
        chq: string;
        glovo: string;
    };
}

// Helper to bridge to Finance Module via LocalStorage
const syncToBank = (data: DayData, date: string, amount: number) => {
    try {
        const STORAGE_KEY = "finance_transactions";
        const stored = window.localStorage.getItem(STORAGE_KEY);
        let transactions: any[] = stored ? JSON.parse(stored) : [];

        // Calculation: 1% Comm HT + 10% TVA on Comm
        // Formula: Comm = Amount * 0.01; TVA = Comm * 0.10;
        const commHT = amount * 0.01;
        const tvaComm = commHT * 0.10;
        const totalDeduct = commHT + tvaComm;
        const netBank = amount - totalDeduct;

        const label = `Enc. CMI ${new Date(date).toLocaleDateString('fr-FR')}`;

        // ROBUST SYNC: Step 1 - Resolve ID
        let existingId = data.bankEntryId;

        // Step 2 - Fallback: Search by Date/Tier if ID not provided or not found
        if (!existingId || !transactions.find(t => t.id === existingId)) {
            const duplicate = transactions.find(t =>
                t.date === date &&
                (t.tier === "CMI" || t.label.includes("Enc. CMI")) &&
                !t.isReconciled // Optional: Don't overwrite reconciled if we found a duplicate that is reconciled? 
                // Actually, if it's reconciled we should catch it below.
            );
            if (duplicate) {
                existingId = duplicate.id;
            }
        }

        // Check Reconciliation on the resolved ID
        if (existingId) {
            const existing = transactions.find(t => t.id === existingId);
            if (existing && existing.isReconciled) {
                return { success: false, error: "L'écriture bancaire est déjà rapprochée pour cette date." };
            }
        }

        // Create or Update Transaction
        const newTx = {
            id: existingId || `tx-cmi-${Date.now()}`,
            date: date,
            label: label,
            amount: parseFloat(netBank.toFixed(2)),
            type: "Recette",
            category: "Vente",
            account: "Banque",
            tier: "CMI",
            pieceNumber: "AUTO-CMI",
            isReconciled: false // Always reset reconciled status on update? Or keep it? 
            // If we are here, it's NOT reconciled (checked above).
        };

        if (existingId) {
            transactions = transactions.map(t => t.id === existingId ? { ...t, ...newTx } : t);
        } else {
            transactions.unshift(newTx);
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return { success: true, txId: newTx.id };

    } catch (e) {
        console.error("Bank Sync Error:", e);
        return { success: false, error: "Erreur de synchronisation bancaire." };
    }
};

// HELPER: Master Sync Logic (Real -> Declared)
const calculateDeclaredFromReal = (realData: DayData, currentDeclared: DayData): DayData => {
    // 1. Get Coefficients (Default or Existing)
    const cExo = parseFloat(currentDeclared.coeffExo || "1.11") || 1.11;
    const cImp = parseFloat(currentDeclared.coeffImp || "0.60") || 0.60;

    // 2. Recalculate Sales
    const sourceSales = realData.sales || {};
    const newSales: Record<string, string> = {};
    let newValExo = 0;
    let newSumOthersTTC = 0;

    if (Object.keys(sourceSales).length > 0) {
        Object.entries(sourceSales).forEach(([key, val]) => {
            const realVal = parseFloat(val as string) || 0;
            let calcVal = 0;
            if (key === "BOULANGERIE") {
                calcVal = realVal * cExo;
                newValExo = calcVal;
            } else {
                calcVal = realVal * cImp;
                newSumOthersTTC += calcVal;
            }
            newSales[key] = calcVal.toFixed(2);
        });
    } else {
        // Fallback if no sales items yet, use Totals if available (rare) or 0
        // We stick to 0 to be safe
    }
    const newTotalTTC = newValExo + newSumOthersTTC;
    const newValImpHT = newSumOthersTTC / 1.2;
    const newTotalHT = newValImpHT + newValExo;

    // 3. Tickets
    const realTickets = parseFloat(realData.nbTickets || "0") || 0;
    const newDeclaredTickets = Math.round(realTickets * cImp);

    // 4. Payments (Copy from Real)
    const payments = realData.payments || { nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" };
    const mtCmi = parseFloat(payments.mtCmi) || 0;
    const mtChq = parseFloat(payments.mtChq) || 0;

    // 5. Glovo Breakdown (10/90 Rule)
    const realGlovo = realData.glovo || { brut: "0", incid: "0", cash: "0" };
    const glovoBrut = parseFloat(realGlovo.brut) || 0;
    const gImp = (glovoBrut * 0.90) / 1.2; // 90% Imposable (HT)
    const gExo = glovoBrut * 0.10;         // 10% Exonerated
    const declaredGlovo = {
        ...realGlovo,
        brutImp: gImp.toFixed(2),
        brutExo: gExo.toFixed(2)
    };

    // 6. Espèces (D)
    // Formula: TTC (D) - CMI - Chèques - Glovo Brut + Glovo Cash
    const valEspDeclared = newTotalTTC - mtCmi - mtChq - glovoBrut + (parseFloat(realGlovo.cash) || 0);

    // 7. Glovo Net (Standard Calc)
    const glovoNet = (glovoBrut * 0.82) - (parseFloat(realGlovo.incid) || 0) - (parseFloat(realGlovo.cash) || 0);

    return {
        ...currentDeclared,
        sales: newSales,
        payments: payments,
        glovo: declaredGlovo,
        nbTickets: String(newDeclaredTickets),
        coeffExo: String(cExo), // Ensure saved as string
        coeffImp: String(cImp), // Ensure saved as string
        calculated: {
            exo: newValExo.toFixed(2),
            impHt: newValImpHT.toFixed(2),
            totHt: newTotalHT.toFixed(2),
            ttc: newTotalTTC.toFixed(2),
            esp: valEspDeclared.toFixed(2),
            cmi: mtCmi.toFixed(2),
            chq: mtChq.toFixed(2),
            glovo: glovoNet.toFixed(2)
        }
    };
};

export function VentesContent({ initialSalesData }: { initialSalesData: Record<string, { real?: DayData; declared?: DayData }> }) {
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalType, setModalType] = useState<"Real" | "Declared" | null>(null);

    // PERSISTENCE STATE: Now powered by props and server actions
    const [salesData, setSalesData] = useState<Record<string, { real?: DayData; declared?: DayData }>>(initialSalesData);

    // Filters State
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedPeriod, setSelectedPeriod] = useState<"FULL" | "Q1" | "Q2">("FULL");
    const [viewMode, setViewMode] = useState<"Saisie" | "Compta">("Saisie"); // NEW: View Mode State

    // Keyboard Navigation State
    const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
    const tableRef = useRef<HTMLTableElement>(null);

    // RUNTIME LOAD (TAURI)
    useEffect(() => {
        const loadSales = async () => {
            if (isTauri()) {
                console.log("VentesContent: Loading live data from SQLite...");
                const liveData = await getSalesData();
                if (Object.keys(liveData).length > 0) {
                    setSalesData(liveData as any);
                }
            }
        };
        loadSales();
    }, []);

    const handleToday = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
        setSelectedPeriod("FULL");
        setSelectedDate(todayStr);

        // Auto-scroll to current day
        setTimeout(() => {
            const day = today.getDate();
            const index = day - 1;
            setFocusedRowIndex(index);
            const row = document.querySelector(`tr[data-index="${index}"]`);
            row?.scrollIntoView({ block: "center", behavior: "smooth" });
        }, 100);
    };

    // Calculate Period Text & Dates
    let startDay = 1;
    let endDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    if (selectedPeriod === "Q1") {
        endDay = 15;
    } else if (selectedPeriod === "Q2") {
        startDay = 16;
    }

    const periodStart = new Date(selectedYear, selectedMonth, startDay).toLocaleDateString('fr-FR');
    const periodEnd = new Date(selectedYear, selectedMonth, endDay).toLocaleDateString('fr-FR');

    useEffect(() => {
        const action = searchParams.get('action');
        const clientName = searchParams.get('clientName');

        if (action === 'new' && clientName) {
            alert(`Création de facture pour le client : ${clientName} (Module à venir)`);
        }
    }, [searchParams]);

    // Handle Save from Modal
    const handleSave = useCallback((data: DayData, isDraft: boolean, targetDate?: string) => {
        if (!modalType) return;

        // Use the explicitly passed date (safest) or fallback to selectedDate
        const dateKey = targetDate || selectedDate;
        const typeKey = modalType === "Real" ? "real" : "declared";

        // 1. Prepare Data Update
        const updatedData = { ...data };
        const now = new Date().toISOString();

        if (isDraft) {
            updatedData.status = 'draft';
        } else {
            // SYNC LOGIC
            updatedData.status = 'synced';
            updatedData.lastSyncAt = now;

            // BANK LOGIC (CMI) - ONLY FOR REAL DATA
            const mtCmi = parseFloat(data.payments.mtCmi) || 0;
            if (modalType === "Real" && mtCmi > 0) {
                // Call Sync Helper
                const result = syncToBank(updatedData, dateKey, mtCmi);

                if (!result.success) {
                    alert(`Erreur: ${result.error}`);
                    return; // Abort sync
                }

                if (result.txId) {
                    updatedData.bankEntryId = result.txId;
                }
            }
        }

        // 2. Perform optimistic update
        setSalesData(prev => {
            const existingDay = prev[dateKey] || {};
            const existingDeclared = existingDay.declared || {} as DayData;
            let newDeclaredData = { ...existingDeclared };

            if (modalType === "Real") {
                newDeclaredData = calculateDeclaredFromReal(updatedData, existingDeclared);
            } else {
                newDeclaredData = updatedData;
            }

            const newState = {
                ...prev,
                [dateKey]: {
                    ...existingDay,
                    real: modalType === "Real" ? updatedData : existingDay.real,
                    declared: newDeclaredData
                }
            };

            // 3. Save to SQLite
            if (modalType === "Real") saveDayData(dateKey, "real", updatedData);
            saveDayData(dateKey, "declared", newDeclaredData);

            return newState;
        });
    }, [modalType, selectedDate]);

    // INLINE COEFF UPDATE (Re-Calc Declared)
    const handleCoeffUpdate = useCallback((dateKey: string, newCoeffImp: string) => {
        setSalesData(prev => {
            const dayReal = prev[dateKey]?.real || {} as DayData;
            const currentDeclared = prev[dateKey]?.declared || {} as DayData;

            const updatedDeclaredBase = {
                ...currentDeclared,
                coeffImp: newCoeffImp
            };

            const updatedDeclared = calculateDeclaredFromReal(dayReal, updatedDeclaredBase);

            // Save to SQLite
            saveDayData(dateKey, "declared", updatedDeclared);

            return {
                ...prev,
                [dateKey]: {
                    ...prev[dateKey],
                    declared: updatedDeclared
                }
            };
        });
    }, []);

    // INLINE GLOVO UPDATE (Real Data + Trigger Declared Recalc)
    const handleGlovoUpdate = useCallback((dateKey: string, field: 'brut' | 'incid' | 'cash', value: string) => {
        setSalesData(prev => {
            const dayReal = prev[dateKey]?.real || {} as DayData;
            const currentDeclared = prev[dateKey]?.declared || {} as DayData;

            const updatedGlovo = { ...dayReal.glovo, [field]: value };
            if (!updatedGlovo.brut) updatedGlovo.brut = "0";
            if (!updatedGlovo.incid) updatedGlovo.incid = "0";
            if (!updatedGlovo.cash) updatedGlovo.cash = "0";

            const glovoBrutVal = parseFloat(updatedGlovo.brut) || 0;
            const glovoIncidVal = parseFloat(updatedGlovo.incid) || 0;
            const glovoCashVal = parseFloat(updatedGlovo.cash) || 0;
            const newGlovoNet = (glovoBrutVal * 0.82) - glovoIncidVal - glovoCashVal;

            const updatedReal: DayData = {
                ...dayReal,
                glovo: updatedGlovo,
                calculated: {
                    ...(dayReal.calculated || {}),
                    glovo: newGlovoNet.toFixed(2)
                }
            };

            const updatedDeclared = calculateDeclaredFromReal(updatedReal, currentDeclared);

            // Save to SQLite
            saveDayData(dateKey, "real", updatedReal);
            saveDayData(dateKey, "declared", updatedDeclared);

            return {
                ...prev,
                [dateKey]: {
                    ...prev[dateKey],
                    real: updatedReal,
                    declared: updatedDeclared
                }
            };
        });
    }, []);

    // Generate Table Rows using Persistence
    const tableRows = useMemo(() => {
        const rows = [];
        for (let day = startDay; day <= endDay; day++) {
            const d = new Date(selectedYear, selectedMonth, day);
            const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
            const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const formattedDate = `${weekdayCap} ${dayStr}`;
            const isoKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const dayReal = salesData[isoKey]?.real;
            const dayDeclared = salesData[isoKey]?.declared;

            rows.push({
                dateObject: d,
                isoKey: isoKey,
                dateStr: formattedDate,
                status: dayReal?.status,
                // Real Data
                exo: dayReal?.calculated?.exo || "0.00",
                impHt: dayReal?.calculated?.impHt || "0.00",
                totHt: dayReal?.calculated?.totHt || "0.00",
                ttc: dayReal?.calculated?.ttc || "0.00",
                cmi: dayReal?.calculated?.cmi || "0.00",
                chq: dayReal?.calculated?.chq || "0.00",
                glovo: dayReal?.calculated?.glovo || "0.00",
                esp: dayReal?.calculated?.esp || "0.00",
                // Declared Data
                declaredTTC: dayDeclared?.calculated?.ttc || "0.00",
                declaredEsp: dayDeclared?.calculated?.esp || "0.00",
                coeffImp: dayDeclared?.coeffImp || "0.60", // Default 0.60

                // COMPTA CALCULATIONS (Based on Declared Data)
                compta: (() => {
                    const dSales = dayDeclared?.sales || {};

                    // 1. Exonéré = Boulangerie (D)
                    const valExo = parseFloat(dSales["BOULANGERIE"] || "0");

                    // 2. Imposable HT = Sum(Others) / 1.2
                    let sumOthersTTC = 0;
                    Object.entries(dSales).forEach(([key, val]) => {
                        if (key !== "BOULANGERIE") {
                            sumOthersTTC += parseFloat(val as string) || 0;
                        }
                    });
                    const valImpHT = sumOthersTTC / 1.2;

                    // 3. Totals
                    const valTotHT = valExo + valImpHT;
                    const valTTC = valExo + sumOthersTTC;

                    return {
                        exo: valExo.toFixed(2),
                        impHt: valImpHT.toFixed(2),
                        totHt: valTotHT.toFixed(2),
                        ttc: valTTC.toFixed(2),
                        glovoExo: salesData[isoKey]?.real?.glovo?.brutExo || "0.00",
                        glovoImp: salesData[isoKey]?.real?.glovo?.brutImp || "0.00"
                    };
                })()
            });
        }
        return rows;
    }, [selectedYear, selectedMonth, startDay, endDay, salesData]);

    const periodTotals = useMemo(() => {
        const totals = {
            exo: 0, impHt: 0, totHt: 0, ttc: 0, cmi: 0, chq: 0, glovo: 0, esp: 0,
            declaredTTC: 0, declaredEsp: 0,
            glovoExo: 0, glovoImp: 0,
            glovoBrut: 0, glovoIncid: 0, glovoCash: 0
        };

        tableRows.forEach(row => {
            if (viewMode === "Compta") {
                // Use Compta Calculated Values
                totals.exo += parseFloat((row as any).compta.exo);
                totals.impHt += parseFloat((row as any).compta.impHt);
                totals.totHt += parseFloat((row as any).compta.totHt);
                totals.ttc += parseFloat((row as any).compta.ttc);
                totals.glovoExo += parseFloat((row as any).compta.glovoExo);
                totals.glovoImp += parseFloat((row as any).compta.glovoImp);
            } else {
                // Use Real Values
                totals.exo += parseFloat(row.exo) || 0;
                totals.impHt += parseFloat(row.impHt) || 0;
                totals.totHt += parseFloat(row.totHt) || 0;
                totals.ttc += parseFloat(row.ttc) || 0;
            }

            totals.cmi += parseFloat(row.cmi) || 0;
            totals.chq += parseFloat(row.chq) || 0;
            totals.glovo += parseFloat(row.glovo) || 0;
            totals.esp += parseFloat(row.esp) || 0;

            // Declared
            totals.declaredTTC += parseFloat(row.declaredTTC) || 0;
            totals.declaredEsp += parseFloat(row.declaredEsp) || 0;

            // Glovo Breakdowns for Saisie Footer
            totals.glovoBrut += parseFloat(salesData[row.isoKey]?.real?.glovo?.brut || "0") || 0;
            totals.glovoIncid += parseFloat(salesData[row.isoKey]?.real?.glovo?.incid || "0") || 0;
            totals.glovoCash += parseFloat(salesData[row.isoKey]?.real?.glovo?.cash || "0") || 0;
        });

        return totals;
    }, [tableRows, viewMode]);


    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (modalType) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedRowIndex(prev => {
                    const next = Math.min(tableRows.length - 1, prev + 1);
                    const row = document.querySelector(`tr[data-index="${next}"]`);
                    row?.scrollIntoView({ block: "nearest" });

                    // Sync Buttons on Arrow Nav
                    const nextRow = tableRows[next];
                    if (nextRow) setSelectedDate(nextRow.isoKey);

                    return next;
                });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedRowIndex(prev => {
                    const next = Math.max(0, prev - 1);
                    const row = document.querySelector(`tr[data-index="${next}"]`);
                    row?.scrollIntoView({ block: "nearest" });

                    // Sync Buttons on Arrow Nav
                    const nextRow = tableRows[next];
                    if (nextRow) setSelectedDate(nextRow.isoKey);

                    return next;
                });
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (focusedRowIndex >= 0 && focusedRowIndex < tableRows.length) {
                    const row = tableRows[focusedRowIndex];
                    setSelectedDate(row.isoKey);
                    setModalType("Real");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedRowIndex, tableRows, modalType]);

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <main className="flex-1 ml-64 h-screen flex flex-col overflow-hidden">

                {/* Header Section - Aligned with Logo (Top Padding reduced to pt-6 matches Sidebar p-6) */}
                <div className="px-8 pt-6 pb-2 flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            {/* Title aligned top, Subtitle Removed */}
                            <h2 className="text-3xl font-bold text-slate-800 font-outfit leading-tight">Ventes Journalières</h2>
                        </div>
                    </div>

                    {/* Buttons & Filters - Compact Spacing */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* REEL Button - Shows Selected Day's Real Data */}
                        <button
                            onClick={() => setModalType("Real")}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-[#1E293B] hover:bg-[#1E293B]/5 backdrop-blur-sm",
                                modalType === "Real" ? "bg-[#1E293B]/10 ring-2 ring-[#1E293B] ring-offset-2" : "bg-white/40"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1E293B]/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-[#1E293B]/10 rounded-lg">
                                            <TrendingUp className="w-4 h-4 text-[#1E293B]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">Réel</h3>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 capitalize">
                                        {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-bold text-[#1E293B] tracking-tight">
                                            {(salesData[selectedDate]?.real?.calculated?.ttc || "0.00").toLocaleString()} <span className="text-xs font-semibold text-slate-400">TTC</span>
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 font-mono">
                                            HT: {(salesData[selectedDate]?.real?.calculated?.totHt || "0.00").toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* DECLARED Button - Shows Selected Day's Declared Data */}
                        <button
                            onClick={() => setModalType("Declared")}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-[#E5D1BD] hover:bg-[#E5D1BD]/5 backdrop-blur-sm",
                                modalType === "Declared" ? "bg-[#E5D1BD]/20 ring-2 ring-[#E5D1BD] ring-offset-2" : "bg-white/40"
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#E5D1BD]/20 to-[#8D6E63]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="text-left">
                                    <div className="flex flex-col items-start">
                                        <span className="text-2xl font-bold text-[#5D4037] tracking-tight">
                                            {(salesData[selectedDate]?.declared?.calculated?.ttc || "0.00").toLocaleString()} <span className="text-xs font-semibold text-[#5D4037]/60">TTC</span>
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 font-mono">
                                            HT: {(salesData[selectedDate]?.declared?.calculated?.totHt || "0.00").toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-2 mb-1">
                                        <div className="p-1.5 bg-[#E5D1BD]/30 rounded-lg">
                                            <ShieldCheck className="w-4 h-4 text-[#5D4037]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">Déclaré</h3>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 capitalize">
                                        {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* FILTERS SECTION */}
                    {/* FILTERS & VIEW MODE SECTION - Reorganized */}
                    <div className="flex items-center justify-between p-2.5">
                        {/* LEFT: View Mode Toggles */}
                        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setViewMode("Saisie")}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                                    viewMode === "Saisie"
                                        ? "bg-[#1E293B] text-white shadow-md ring-1 ring-black/5"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Saisie
                            </button>
                            <button
                                onClick={() => setViewMode("Compta")}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                                    viewMode === "Compta"
                                        ? "bg-[#451a03] text-white shadow-md ring-1 ring-[#451a03]/20"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                )}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Compta
                            </button>
                        </div>

                        {/* RIGHT: Date Controls (Moved here) */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleToday}
                                className={cn(
                                    "px-4 py-1.5 rounded-xl text-sm font-bold transition-colors border flex items-center gap-2 mr-2 shadow-sm",
                                    viewMode === "Compta"
                                        ? "bg-white text-[#451a03] border-slate-200 hover:bg-slate-50"
                                        : "bg-indigo-50 text-[#1E293B] border-indigo-200/50 hover:bg-indigo-100"
                                )}
                            >
                                <Calendar className="w-4 h-4" />
                                Aujourd&apos;hui
                            </button>

                            <div className="h-8 w-px bg-slate-200/60 mx-2"></div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Année</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="bg-transparent border-none text-slate-700 text-sm font-bold rounded-lg px-0 py-0 focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mois</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="bg-transparent border-none text-slate-700 text-sm font-bold rounded-lg px-0 py-0 focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors min-w-[100px]"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => {
                                            const date = new Date(2000, i, 1);
                                            return <option key={i} value={i}>{date.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase()}</option>
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Période</label>
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => setSelectedPeriod(e.target.value as "FULL" | "Q1" | "Q2")}
                                        className="bg-transparent border-none text-slate-700 text-sm font-bold rounded-lg px-0 py-0 focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors min-w-[120px]"
                                    >
                                        <option value="FULL">Mois Complet</option>
                                        <option value="Q1">1ère Quinzaine</option>
                                        <option value="Q2">2ème Quinzaine</option>
                                    </select>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-slate-200/60 mx-2"></div>

                            <div className="flex flex-col text-right">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Affichage</label>
                                <span className={cn("text-sm font-mono font-medium", viewMode === "Compta" ? "text-amber-700" : "text-slate-600")}>
                                    Du <span className="font-bold">{periodStart}</span> au <span className="font-bold">{periodEnd}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-h-0 px-0 pb-6">
                    {/* JOURNAL STYLE TABLE MATCHING PAYE - PETIT ARRONDI & CLEAN LOOK */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden h-full relative z-0 shadow-sm">

                        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent relative z-10">
                            <table className="w-full text-sm text-left border-collapse" ref={tableRef}>
                                <thead className={cn(
                                    "sticky top-0 z-20 text-[10px] font-black pointer-events-none text-slate-300 uppercase tracking-widest shadow-sm transition-colors duration-300 border-t-2 border-white",
                                    viewMode === "Compta" ? "bg-[#451a03] border-b border-amber-900" : "bg-[#1E293B]"
                                )}>
                                    <tr>
                                        {/* Date - Left Aligned with Strong Border */}
                                        <th className={cn(
                                            "px-3 py-3 border-r text-left min-w-[140px] z-30 transition-colors duration-300",
                                            viewMode === "Compta" ? "bg-[#451a03] border-amber-900" : "bg-[#1E293B] border-[#334155]"
                                        )}>Date</th>

                                        {/* CA Group - Layout for Saisie vs Compta */}
                                        {viewMode === "Compta" ? (
                                            <>
                                                {/* 1: Exo */}
                                                <th className="px-3 py-3 text-right text-amber-200/70 min-w-[90px]">Exo</th>
                                                {/* 2: Dont Glovo (Exo) */}
                                                <th className="px-3 py-3 text-right text-yellow-400 font-bold min-w-[100px]">Dont Glovo</th>
                                                {/* 3: Imp. HT */}
                                                <th className="px-3 py-3 text-right text-amber-200/70 min-w-[90px]">Imp. HT</th>
                                                {/* 4: Dont Glovo (Imp) */}
                                                <th className="px-3 py-3 text-right text-yellow-400 font-bold min-w-[100px]">Dont Glovo</th>
                                                {/* 5: Total HT */}
                                                <th className="px-3 py-3 text-right text-amber-100 min-w-[100px]">Total HT</th>
                                                {/* 6: Total TTC */}
                                                <th className="px-3 py-3 text-right text-slate-300 font-extrabold min-w-[100px] border-r-2 border-[#451a03]">Total TTC</th>
                                                {/* 7: CMI */}
                                                <th className="px-3 py-3 text-right text-emerald-400 min-w-[80px]">CMI</th>
                                                {/* 8: Chèques */}
                                                <th className="px-3 py-3 text-right text-emerald-400 min-w-[80px]">Chèques</th>
                                                {/* 8b: Espèces (D) */}
                                                <th className="px-3 py-3 text-right text-orange-400 font-bold min-w-[90px]">Espèces (D)</th>
                                                {/* 9: Glovo Brut */}
                                                <th className="px-2 py-3 text-right text-yellow-400 w-20 min-w-[80px]">Glv Brut</th>
                                                {/* 10: Incid */}
                                                <th className="px-2 py-3 text-right text-yellow-400 w-20 min-w-[70px]">Incid</th>
                                                {/* 11: Cash */}
                                                <th className="px-2 py-3 text-right text-yellow-400 w-20 min-w-[70px]">Cash</th>
                                                {/* 12: Glovo Net */}
                                                <th className="px-3 py-3 text-right text-yellow-400 font-extrabold min-w-[100px] border-r-2 border-[#451a03]">Glovo Net</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-3 py-3 text-right text-slate-300">Exonéré</th>
                                                <th className="px-3 py-3 text-right text-slate-300">Imp. HT</th>
                                                <th className="px-3 py-3 text-right text-slate-300">Total HT</th>
                                                <th className="px-3 py-3 text-right text-slate-300 font-extrabold border-r-2 border-[#1E293B]">Total TTC</th>
                                                <th className="px-3 py-3 text-right text-emerald-400">CMI</th>
                                                <th className="px-3 py-3 text-right text-emerald-400">Chèques</th>
                                                <th className="px-3 py-3 text-right font-black text-emerald-400">Espèces</th>
                                                <th className="px-2 py-3 text-right text-yellow-400 w-20">Glv Brut</th>
                                                {/* ... */}
                                                <th className="px-2 py-3 text-right text-yellow-400 w-20">Incid</th>
                                                <th className="px-2 py-3 text-right text-yellow-400 w-20">Cash</th>
                                                <th className="px-3 py-3 text-right text-yellow-400 font-extrabold border-r-2 border-[#1E293B]">Glovo Net</th>
                                                <th className="px-3 py-3 text-right text-orange-400 font-bold">TTC (D)</th>
                                                <th className="px-3 py-3 text-right text-orange-400 font-bold">D-Cash</th>
                                                <th className="px-3 py-3 text-right text-orange-400 font-bold">Esp (D)</th>
                                                <th className="px-2 py-3 text-center text-orange-400 w-24">Coeff</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {tableRows.map((row, i) => (
                                        <tr
                                            key={i}
                                            data-index={i}
                                            onClick={() => {
                                                setFocusedRowIndex(i);
                                                setSelectedDate(row.isoKey);
                                            }}
                                            className={cn(
                                                "transition-all duration-100 group cursor-pointer border-b border-slate-50",
                                                focusedRowIndex === i
                                                    ? cn(
                                                        "relative z-10",
                                                        viewMode === "Compta"
                                                            ? "bg-gradient-to-r from-amber-950/90 to-amber-900/90"
                                                            : "bg-gradient-to-r from-[#1E293B] to-[#334155]"
                                                    )
                                                    : "hover:bg-slate-50"
                                            )}
                                        >
                                            <td className="px-3 py-2 text-xs font-bold text-slate-700 whitespace-nowrap relative border-r-[2px] border-[#1E293B] text-left">
                                                {/* Selection Indicator */}
                                                {focusedRowIndex === i && (
                                                    <div className={cn(
                                                        "absolute left-0 top-0 bottom-0 w-[4px] rounded-r",
                                                        viewMode === "Compta" ? "bg-amber-500" : "bg-emerald-500"
                                                    )} />
                                                )}

                                                <div className="flex items-center justify-start gap-3">
                                                    {/* Status Dot - Moved to Left of Date - ENLARGED */}
                                                    {row.status === 'synced' && (
                                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-emerald-600 flex-shrink-0" title="Synchronisé" />
                                                    )}
                                                    {row.status === 'draft' && (
                                                        <div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm border border-orange-500 flex-shrink-0" title="Brouillon" />
                                                    )}
                                                    {!row.status && <div className="w-3 h-3 bg-transparent flex-shrink-0" />}

                                                    <span className={cn(
                                                        "uppercase tracking-tight font-mono truncate text-xs",
                                                        focusedRowIndex === i ? "text-white font-black" : "text-slate-600"
                                                    )}>
                                                        {row.dateStr}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* REORDERED COMPTA CELLS (12 fields) vs SAISIE CELLS */}
                                            {viewMode === "Compta" ? (
                                                <>
                                                    {/* 1: Exo */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[90px]", focusedRowIndex === i ? "text-slate-200" : "text-slate-500")}>
                                                        {parseFloat(row.compta.exo) !== 0 ? row.compta.exo : "-"}
                                                    </td>
                                                    {/* 2: Dont Glovo (Exo) */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[100px]", focusedRowIndex === i ? "text-yellow-200" : "text-yellow-600")}>{(row as any).compta.glovoExo}</td>
                                                    {/* 3: Imp. HT */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[90px]", focusedRowIndex === i ? "text-slate-200" : "text-slate-500")}>
                                                        {parseFloat(row.compta.impHt) !== 0 ? row.compta.impHt : "-"}
                                                    </td>
                                                    {/* 4: Dont Glovo (Imp) */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[100px]", focusedRowIndex === i ? "text-yellow-200" : "text-yellow-600")}>{(row as any).compta.glovoImp}</td>
                                                    {/* 5: Total HT */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[100px]", focusedRowIndex === i ? "text-slate-100" : "text-slate-500")}>
                                                        {parseFloat(row.compta.totHt) !== 0 ? row.compta.totHt : "-"}
                                                    </td>
                                                    {/* 6: Total TTC */}
                                                    <td className={cn("px-3 py-2 text-right font-black text-xs font-mono tracking-tight min-w-[100px] border-r-2 border-[#451a03]", focusedRowIndex === i ? "text-white" : "text-slate-500")}>{row.compta.ttc}</td>
                                                    {/* 7: CMI */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[80px]", focusedRowIndex === i ? "text-emerald-300" : "text-emerald-500")}>{row.cmi !== "0.00" ? row.cmi : "-"}</td>
                                                    {/* 8: Chèques */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[80px]", focusedRowIndex === i ? "text-emerald-300" : "text-emerald-500")}>{row.chq !== "0.00" ? row.chq : "-"}</td>
                                                    {/* 8b: Espèces (D) */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight min-w-[90px]", focusedRowIndex === i ? "text-orange-300" : "text-orange-600")}>{row.declaredEsp !== "0.00" ? row.declaredEsp : "-"}</td>
                                                    {/* 9: Glovo Brut */}
                                                    <td className="px-2 py-1 text-right w-20 min-w-[80px] font-mono text-xs font-bold">
                                                        <span className={focusedRowIndex === i ? "text-yellow-300" : "text-yellow-600"}>
                                                            {parseFloat(salesData[row.isoKey]?.real?.glovo?.brut || "0").toFixed(2)}
                                                        </span>
                                                    </td>
                                                    {/* 10: Incid */}
                                                    <td className="px-2 py-1 text-right w-20 min-w-[70px] font-mono text-xs font-bold">
                                                        <span className={focusedRowIndex === i ? "text-yellow-300" : "text-yellow-600"}>
                                                            {parseFloat(salesData[row.isoKey]?.real?.glovo?.incid || "0").toFixed(2)}
                                                        </span>
                                                    </td>
                                                    {/* 11: Cash */}
                                                    <td className="px-2 py-1 text-right w-20 min-w-[70px] font-mono text-xs font-bold">
                                                        <span className={focusedRowIndex === i ? "text-yellow-300" : "text-yellow-700"}>
                                                            {parseFloat(salesData[row.isoKey]?.real?.glovo?.cash || "0").toFixed(2)}
                                                        </span>
                                                    </td>
                                                    {/* 12: Glovo Net */}
                                                    <td className={cn("px-3 py-2 text-right font-black text-xs font-mono tracking-tight border-r-[2px] border-[#451a03] min-w-[100px]", focusedRowIndex === i ? "text-yellow-300" : "text-yellow-600")}>
                                                        {parseFloat(row.glovo || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-slate-200" : "text-slate-500")}>
                                                        {row.exo !== "0.00" ? row.exo : "-"}
                                                    </td>
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-slate-200" : "text-slate-500")}>
                                                        {row.impHt !== "0.00" ? row.impHt : "-"}
                                                    </td>
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-slate-100" : "text-slate-500")}>
                                                        {row.totHt !== "0.00" ? row.totHt : "-"}
                                                    </td>

                                                    <td className={cn(
                                                        "px-3 py-2 text-right font-black text-xs font-mono tracking-tight border-r-2 border-[#1E293B]",
                                                        focusedRowIndex === i ? "text-white" : "text-slate-500"
                                                    )}>
                                                        {row.ttc}
                                                    </td>

                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-emerald-300" : "text-emerald-500")}>{row.cmi !== "0.00" ? row.cmi : "-"}</td>
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-emerald-300" : "text-emerald-500")}>{row.chq !== "0.00" ? row.chq : "-"}</td>

                                                    <td className={cn("px-3 py-2 text-right font-black text-xs border-r-[2px] border-[#1E293B] font-mono tracking-tight", focusedRowIndex === i ? "text-emerald-300 bg-emerald-900/20" : "text-emerald-600 bg-slate-50/50")}>{row.esp}</td>

                                                    {/* GLOVO ROW CELLS - UNIFIED YELLOW */}
                                                    <td className="px-2 py-1 text-right group/cell w-20">
                                                        <input
                                                            type="text"
                                                            value={focusedRowIndex === i ? (salesData[row.isoKey]?.real?.glovo?.brut || "") : parseFloat(salesData[row.isoKey]?.real?.glovo?.brut || "0").toFixed(2)}
                                                            placeholder="0.00"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onFocus={() => setFocusedRowIndex(i)}
                                                            onBlur={(e) => handleGlovoUpdate(row.isoKey, 'brut', parseFloat(e.target.value.replace(',', '.') || "0").toFixed(2))}
                                                            onChange={(e) => handleGlovoUpdate(row.isoKey, 'brut', e.target.value)}
                                                            className={cn(
                                                                "w-full h-7 bg-transparent text-right font-bold text-xs rounded px-1 transition-colors focus:ring-0 focus:outline-none font-mono tracking-tight placeholder:text-yellow-200/50",
                                                                focusedRowIndex === i ? "text-yellow-300" : "text-yellow-600 hover:bg-slate-50"
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-right group/cell w-20">
                                                        <input
                                                            type="text"
                                                            value={focusedRowIndex === i ? (salesData[row.isoKey]?.real?.glovo?.incid || "") : parseFloat(salesData[row.isoKey]?.real?.glovo?.incid || "0").toFixed(2)}
                                                            placeholder="0.00"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onFocus={() => setFocusedRowIndex(i)}
                                                            onBlur={(e) => handleGlovoUpdate(row.isoKey, 'incid', parseFloat(e.target.value.replace(',', '.') || "0").toFixed(2))}
                                                            onChange={(e) => handleGlovoUpdate(row.isoKey, 'incid', e.target.value)}
                                                            className={cn(
                                                                "w-full h-7 bg-transparent text-right font-bold text-xs rounded px-1 transition-colors focus:ring-0 focus:outline-none font-mono tracking-tight placeholder:text-yellow-200/50",
                                                                focusedRowIndex === i ? "text-yellow-300" : "text-yellow-600 hover:bg-slate-50"
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 text-right group/cell w-20">
                                                        <input
                                                            type="text"
                                                            value={focusedRowIndex === i ? (salesData[row.isoKey]?.real?.glovo?.cash || "") : parseFloat(salesData[row.isoKey]?.real?.glovo?.cash || "0").toFixed(2)}
                                                            placeholder="0.00"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onFocus={() => setFocusedRowIndex(i)}
                                                            onBlur={(e) => handleGlovoUpdate(row.isoKey, 'cash', parseFloat(e.target.value.replace(',', '.') || "0").toFixed(2))}
                                                            onChange={(e) => handleGlovoUpdate(row.isoKey, 'cash', e.target.value)}
                                                            className={cn(
                                                                "w-full h-7 bg-transparent text-right font-bold text-xs rounded px-1 transition-colors focus:ring-0 focus:outline-none font-mono tracking-tight placeholder:text-yellow-200/50",
                                                                focusedRowIndex === i ? "text-yellow-300" : "text-yellow-700 hover:bg-slate-50"
                                                            )}
                                                        />
                                                    </td>
                                                    <td className={cn("px-3 py-2 text-right font-black text-xs font-mono tracking-tight border-r-2 border-[#1E293B]", focusedRowIndex === i ? "text-yellow-300" : "text-yellow-600")}>
                                                        {parseFloat(row.glovo || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>

                                                    {/* DECLARED ROW CELLS - Removed in Compta */}
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-orange-300" : "text-orange-600")}>{row.declaredTTC}</td>
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-orange-300" : "text-orange-600")}>
                                                        {((parseFloat(row.declaredEsp) || 0) - (parseFloat(salesData[row.isoKey]?.real?.glovo?.cash || "0") || 0)).toFixed(2)}
                                                    </td>
                                                    <td className={cn("px-3 py-2 text-right font-bold text-xs font-mono tracking-tight", focusedRowIndex === i ? "text-orange-300" : "text-orange-600")}>{row.declaredEsp}</td>

                                                    <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="relative flex items-center justify-center w-full group/input gap-1">
                                                            {/* Decrement Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const val = parseFloat(row.coeffImp) || 0;
                                                                    handleCoeffUpdate(row.isoKey, (val - 0.01).toFixed(2));
                                                                }}
                                                                className={cn(
                                                                    "p-1 rounded-md transition-colors hover:bg-orange-100/50 focus:outline-none",
                                                                    focusedRowIndex === i ? "text-orange-600 opacity-100" : "text-orange-300 opacity-0 group-hover/input:opacity-100"
                                                                )}
                                                                tabIndex={-1}
                                                            >
                                                                <ChevronLeft className="w-4 h-4" />
                                                            </button>

                                                            <div className="relative flex items-center h-8 px-1 min-w-[50px] justify-center">
                                                                <input
                                                                    type="text"
                                                                    value={row.coeffImp}
                                                                    onChange={(e) => handleCoeffUpdate(row.isoKey, e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            const val = parseFloat(row.coeffImp) || 0;
                                                                            const step = 0.01;
                                                                            const newVal = val + (e.key === 'ArrowUp' ? step : -step);
                                                                            handleCoeffUpdate(row.isoKey, newVal.toFixed(2));
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "w-full text-center bg-transparent border-none text-xs font-black py-0 pl-1 pr-0 focus:ring-0 focus:outline-none font-mono tracking-tight",
                                                                        focusedRowIndex === i ? "text-orange-300" : "text-orange-500"
                                                                    )}
                                                                />
                                                            </div>

                                                            {/* Increment Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const val = parseFloat(row.coeffImp) || 0;
                                                                    handleCoeffUpdate(row.isoKey, (val + 0.01).toFixed(2));
                                                                }}
                                                                className={cn(
                                                                    "p-1 rounded-md transition-colors hover:bg-orange-100/50 focus:outline-none",
                                                                    focusedRowIndex === i ? "text-orange-600 opacity-100" : "text-orange-300 opacity-0 group-hover/input:opacity-100"
                                                                )}
                                                                tabIndex={-1}
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                                {/* FOOTER ROW - Sticky Bottom matches Payroll Journal footer style */}
                                <tfoot className={cn(
                                    "sticky bottom-0 z-20 text-slate-300 text-xs font-black uppercase tracking-wider shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)] transition-colors duration-300 border-t border-b-2 border-white",
                                    viewMode === "Compta" ? "bg-[#451a03] border-amber-900" : "bg-[#1E293B] border-[#334155]"
                                )}>
                                    <tr>
                                        <td className="px-3 py-4 text-left text-white">Total Période</td>

                                        {/* REORDERED COMPTA FOOTER (12 fields) vs SAISIE FOOTER */}
                                        {viewMode === "Compta" ? (
                                            <>
                                                {/* 1: Exo */}
                                                <td className="px-3 py-4 text-right font-mono min-w-[90px]">{periodTotals.exo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 2: Dont Glovo (Exo) */}
                                                <td className="px-3 py-4 text-right font-bold text-yellow-400 font-mono min-w-[100px]">{periodTotals.glovoExo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 3: Imp. HT */}
                                                <td className="px-3 py-4 text-right font-mono min-w-[90px]">{periodTotals.impHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 4: Dont Glovo (Imp) */}
                                                <td className="px-3 py-4 text-right font-bold text-yellow-400 font-mono min-w-[100px]">{periodTotals.glovoImp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 5: Total HT */}
                                                <td className="px-3 py-4 text-right font-mono text-white min-w-[100px]">{periodTotals.totHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 6: Total TTC */}
                                                {/* 6: Total TTC */}
                                                <td className="px-3 py-4 text-right font-black text-white font-mono min-w-[100px] border-r-2 border-[#451a03]">{periodTotals.ttc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 7: CMI */}
                                                <td className="px-3 py-4 text-right text-emerald-400 font-mono min-w-[80px]">{periodTotals.cmi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 8: Chèques */}
                                                <td className="px-3 py-4 text-right text-emerald-400 font-mono min-w-[80px]">{periodTotals.chq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 8b: Espèces (D) */}
                                                <td className="px-3 py-4 text-right text-orange-400 font-bold font-mono min-w-[90px]">{periodTotals.declaredEsp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                {/* 9: Glovo Brut */}
                                                <td className="px-3 py-4 text-right font-black text-yellow-400 font-mono min-w-[80px]">
                                                    {(periodTotals as any).glovo?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                {/* 10, 11, 12 Labels Detail */}
                                                <td className="px-2 py-4 text-right text-yellow-500/80 border-r-2 border-[#451a03]" colSpan={3}>Détails Glovo Net</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-3 py-4 text-right font-mono">{periodTotals.exo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right font-mono">{periodTotals.impHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right font-mono text-white">{periodTotals.totHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right font-black text-white font-mono border-r-2 border-[#1E293B]">{periodTotals.ttc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right text-emerald-400 font-mono">{periodTotals.cmi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right font-mono text-emerald-400">{periodTotals.chq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right text-emerald-400 font-mono">{periodTotals.esp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                                                {/* Glovo Breakdowns */}
                                                <td className="px-2 py-4 text-right text-yellow-500 font-mono w-20">{(periodTotals as any).glovoBrut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-2 py-4 text-right text-yellow-500 font-mono w-20">{(periodTotals as any).glovoIncid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-2 py-4 text-right text-yellow-500 font-mono w-20">{(periodTotals as any).glovoCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>

                                                <td className="px-3 py-4 text-right text-yellow-400 font-mono border-r-2 border-[#1E293B]">{periodTotals.glovo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right text-orange-400 font-mono">{periodTotals.declaredTTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right text-orange-400 font-mono">{(periodTotals.declaredEsp - (periodTotals as any).glovoCash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-3 py-4 text-right text-orange-400 font-mono">{periodTotals.declaredEsp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td></td>
                                            </>
                                        )}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <SalesInputModal
                    isOpen={!!modalType}
                    onClose={() => setModalType(null)}
                    onSave={handleSave}
                    date={selectedDate}
                    isDeclared={modalType === "Declared"}
                    initialData={modalType === "Real" ? salesData[selectedDate]?.real : salesData[selectedDate]?.declared}
                    realData={salesData[selectedDate]?.real}
                />
            </main>
        </div>
    );
}

