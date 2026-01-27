"use client";

import { Sidebar } from "@/components/layout/Sidebar";
// TopBar removed to align title with logo as requested
import { GlassCard } from "@/components/ui/GlassCard";
import { SalesInputModal } from "@/components/ventes/SalesInputModal";
import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, TrendingUp, ShieldCheck, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

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

function VentesContent() {
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalType, setModalType] = useState<"Real" | "Declared" | null>(null);

    // PERSISTENCE STATE: Split into Real and Declared (Persisted)
    const [salesData, setSalesData] = usePersistedState<Record<string, { real?: DayData; declared?: DayData }>>("ventes_daily_data", {});

    // Filters State
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedPeriod, setSelectedPeriod] = useState<"FULL" | "Q1" | "Q2">("FULL");

    // Keyboard Navigation State
    const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
    const tableRef = useRef<HTMLTableElement>(null);

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
    const handleSave = (data: DayData, isDraft: boolean, targetDate?: string) => {
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
                // Use dateKey
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

        // We need to fetch the existing Declared state correctly or use defaults
        const existingDeclared = salesData[dateKey]?.declared || {} as DayData;
        let newDeclaredData = { ...existingDeclared };

        // 5b. Force Sync if Real Data Changed (using Master Logic)
        if (modalType === "Real") {
            const currentReal = updatedData;
            // We need to fetch the existing Declared state correctly or use defaults
            const existingDeclared = salesData[dateKey]?.declared || {} as DayData;
            newDeclaredData = calculateDeclaredFromReal(currentReal, existingDeclared);
        } else {
            newDeclaredData = updatedData; // If editing Declared directly (rare/coeffs)
        }

        setSalesData(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                real: modalType === "Real" ? updatedData : prev[dateKey]?.real,
                declared: newDeclaredData
            }
        }));
    };

    // INLINE COEFF UPDATE (Re-Calc Declared)
    const handleCoeffUpdate = (dateKey: string, newCoeffImp: string) => {
        const dayReal = salesData[dateKey]?.real || {} as DayData;

        // If no real data, we can't really calc declared, but we can set the coeff.
        const currentDeclared = salesData[dateKey]?.declared || {} as DayData;

        // Update coeff in declared data
        const updatedDeclaredBase = {
            ...currentDeclared,
            coeffImp: newCoeffImp
        };

        // Recalculate everything using Master Logic based on Real Data
        const updatedDeclared = calculateDeclaredFromReal(dayReal, updatedDeclaredBase);

        setSalesData(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                declared: updatedDeclared
            }
        }));
    };

    // INLINE GLOVO UPDATE (Real Data + Trigger Declared Recalc)
    const handleGlovoUpdate = (dateKey: string, field: 'brut' | 'incid' | 'cash', value: string) => {
        const dayReal = salesData[dateKey]?.real || {} as DayData;
        const currentDeclared = salesData[dateKey]?.declared || {} as DayData;

        // 1. Update Real Data
        const updatedGlovo = { ...dayReal.glovo, [field]: value };
        // Default structure if missing
        if (!updatedGlovo.brut) updatedGlovo.brut = "0";
        if (!updatedGlovo.incid) updatedGlovo.incid = "0";
        if (!updatedGlovo.cash) updatedGlovo.cash = "0";

        // 1b. Recalc Glovo Net for REAL Display
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

        // 2. Force Master Sync for Declared Data
        const updatedDeclared = calculateDeclaredFromReal(updatedReal, currentDeclared);

        setSalesData(prev => ({
            ...prev,
            [dateKey]: {
                ...prev[dateKey],
                real: updatedReal,
                declared: updatedDeclared
            }
        }));
    };

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
            });
        }
        return rows;
    }, [selectedYear, selectedMonth, startDay, endDay, salesData]);

    const periodTotals = useMemo(() => {
        const totals = {
            exo: 0, impHt: 0, totHt: 0, ttc: 0, cmi: 0, chq: 0, glovo: 0, esp: 0,
            declaredTTC: 0, declaredEsp: 0
        };

        tableRows.forEach(row => {
            totals.exo += parseFloat(row.exo) || 0;
            totals.impHt += parseFloat(row.impHt) || 0;
            totals.totHt += parseFloat(row.totHt) || 0;
            totals.ttc += parseFloat(row.ttc) || 0;
            totals.cmi += parseFloat(row.cmi) || 0;
            totals.chq += parseFloat(row.chq) || 0;
            totals.glovo += parseFloat(row.glovo) || 0;
            totals.esp += parseFloat(row.esp) || 0;

            // Declared
            totals.declaredTTC += parseFloat(row.declaredTTC) || 0;
            totals.declaredEsp += parseFloat(row.declaredEsp) || 0;
        });

        return totals;
    }, [tableRows]);


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
                    <div className="flex items-center justify-between bg-white/50 p-2.5 rounded-2xl border border-white/40 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleToday}
                                className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-sm font-bold transition-colors border border-indigo-200/50 flex items-center gap-2 mr-2"
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
                                        className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none cursor-pointer hover:border-indigo-200 transition-colors"
                                    >
                                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Mois</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none min-w-[120px] cursor-pointer hover:border-indigo-200 transition-colors"
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
                                        className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 outline-none min-w-[130px] cursor-pointer hover:border-indigo-200 transition-colors"
                                    >
                                        <option value="FULL">Mois Complet</option>
                                        <option value="Q1">1ère Quinzaine</option>
                                        <option value="Q2">2ème Quinzaine</option>
                                    </select>
                                </div>
                            </div>

                            <div className="h-8 w-px bg-slate-200/60 mx-2"></div>

                            <div className="flex flex-col">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Affichage</label>
                                <span className="text-sm font-mono font-medium text-slate-600">
                                    Du <span className="font-bold text-slate-800">{periodStart}</span> au <span className="font-bold text-slate-800">{periodEnd}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 px-0"> {/* Removed px-8 here since table is full width */}
                    {/* DETAILED JOURNAL TABLE (Full Width, Square) */}
                    {/* Added mb-6 for bottom margin as requested */}
                    <GlassCard className="flex-1 p-0 overflow-hidden flex flex-col shadow-none border-t border-[#C07070] border-x-0 border-b-0 rounded-none bg-white mb-6">
                        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white relative">
                            <table className="w-full text-sm text-left border-collapse" ref={tableRef}>
                                <thead className="bg-[#C07070] text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-20 shadow-none border-b border-[#C07070]">
                                    <tr>
                                        <th className="px-2 py-1.5 border-r-[4px] border-r-[#C07070]">Date</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20">Exonéré</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20">Imp. HT</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20 bg-[#C07070]/5">Total HT</th>
                                        <th className="px-2 py-1.5 text-right border-r-[4px] border-r-[#C07070] bg-[#C07070]/10">Total TTC</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20 text-blue-100">CMI</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20 text-emerald-100">Chèques</th>
                                        <th className="px-2 py-1.5 text-right font-bold h-full">Espèces</th>
                                        <th className="px-1 py-1.5 bg-[#C07070] w-[4px]"></th>
                                        {/* GLOVO BREAKDOWN */}
                                        <th className="px-1 py-1.5 text-right border-r border-[#C07070]/20 text-yellow-200 text-[10px] font-bold w-20">Glv Brut</th>
                                        <th className="px-1 py-1.5 text-right border-r border-[#C07070]/20 text-yellow-200 text-[10px] font-bold w-20">Incid</th>
                                        <th className="px-1 py-1.5 text-right border-r border-[#C07070]/20 text-yellow-200 text-[10px] font-bold w-20">Cash</th>
                                        <th className="px-2 py-1.5 text-right border-r-[4px] border-r-[#C07070] text-yellow-200 font-bold w-24">Glovo Net</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20 text-orange-200">Total TTC (D)</th>
                                        <th className="px-2 py-1.5 text-right border-r border-[#C07070]/20 text-orange-200">Espèces (D)</th>
                                        <th className="px-2 py-1.5 text-center text-purple-200 w-24">Coeff Imp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tableRows.map((row, i) => (
                                        <tr
                                            key={i}
                                            data-index={i}
                                            onClick={() => {
                                                setFocusedRowIndex(i);
                                                setSelectedDate(row.isoKey);
                                            }}
                                            className={cn(
                                                "transition-all duration-100 group cursor-pointer scroll-mt-10 border-b border-slate-50",
                                                focusedRowIndex === i
                                                    ? "bg-[#C07070]/90 text-white"
                                                    : "hover:bg-slate-50"
                                            )}
                                        >
                                            {/* Divider applied to Date cells - Unconditional */}

                                            <td className={cn("px-2 py-1 font-medium text-xs border-r-[4px] border-r-[#C07070] transition-colors relative",
                                                focusedRowIndex === i ? "text-white" : "text-slate-700 group-hover:text-[#C07070]"
                                            )}>
                                                {/* Status Dot */}
                                                {row.status === 'synced' && (
                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" title="Synchronisé" />
                                                )}
                                                {row.status === 'draft' && (
                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-400" title="Brouillon" />
                                                )}
                                                {row.dateStr}
                                            </td>
                                            <td className={cn("px-2 py-1 text-right font-medium text-sm border-r border-slate-100/50", focusedRowIndex === i ? "text-white/90" : "text-slate-600 group-hover:text-[#C07070]")}>{row.exo}</td>
                                            <td className={cn("px-2 py-1 text-right font-medium text-sm border-r border-slate-100/50", focusedRowIndex === i ? "text-white/90" : "text-slate-600 group-hover:text-[#C07070]")}>{row.impHt}</td>
                                            <td className={cn("px-2 py-1 text-right font-medium text-sm border-r border-slate-100/50 bg-slate-50/30", focusedRowIndex === i ? "text-white" : "text-slate-700 group-hover:text-[#C07070]")}>{row.totHt}</td>
                                            {/* Divider applied to Total TTC cells - Unconditional */}
                                            <td className={cn(
                                                "px-2 py-1 text-right font-bold text-sm bg-slate-100/30 border-r-[4px] border-r-[#C07070] transition-colors",
                                                focusedRowIndex === i ? "text-white" : "text-slate-800 group-hover:text-[#C07070]"
                                            )}>{row.ttc}</td>
                                            <td className={cn("px-2 py-1 text-right font-medium text-sm border-r border-slate-100/50", focusedRowIndex === i ? "text-blue-200" : "text-slate-600 group-hover:text-[#C07070]")}>{row.cmi}</td>
                                            <td className={cn("px-2 py-1 text-right font-medium text-sm border-r border-slate-100/50", focusedRowIndex === i ? "text-emerald-200" : "text-slate-600 group-hover:text-[#C07070]")}>{row.chq}</td>
                                            <td className={cn("px-2 py-1 text-right font-bold text-sm", focusedRowIndex === i ? "text-white" : "text-slate-800 group-hover:text-[#C07070]")}>{row.esp}</td>
                                            <td className="px-1 py-1 border-l-[4px] border-l-[#C07070] bg-slate-50/50"></td>

                                            {/* GLOVO BREAKDOWN VALUES (Editable) */}
                                            <td className={cn("px-1 py-0.5 text-right border-r border-slate-100/50 relative group/cell w-20", focusedRowIndex === i ? "bg-yellow-500/10" : "")}>
                                                <input
                                                    type="text"
                                                    value={salesData[row.isoKey]?.real?.glovo?.brut || ""}
                                                    placeholder="0.00"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleGlovoUpdate(row.isoKey, 'brut', e.target.value)}
                                                    className={cn(
                                                        "w-full h-full bg-transparent text-right font-medium text-sm focus:ring-0 focus:outline-none placeholder-slate-300/50 px-1",
                                                        focusedRowIndex === i ? "text-yellow-200 placeholder-yellow-200/50" : "text-yellow-600 group-hover/cell:text-yellow-700"
                                                    )}
                                                />
                                            </td>
                                            <td className={cn("px-1 py-0.5 text-right border-r border-slate-100/50 relative group/cell w-20", focusedRowIndex === i ? "bg-yellow-500/10" : "")}>
                                                <input
                                                    type="text"
                                                    value={salesData[row.isoKey]?.real?.glovo?.incid || ""}
                                                    placeholder="0.00"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleGlovoUpdate(row.isoKey, 'incid', e.target.value)}
                                                    className={cn(
                                                        "w-full h-full bg-transparent text-right font-medium text-sm focus:ring-0 focus:outline-none placeholder-slate-300/50 px-1",
                                                        focusedRowIndex === i ? "text-yellow-200 placeholder-yellow-200/50" : "text-yellow-600 group-hover/cell:text-yellow-700"
                                                    )}
                                                />
                                            </td>
                                            <td className={cn("px-1 py-0.5 text-right border-r border-slate-100/50 relative group/cell w-20", focusedRowIndex === i ? "bg-yellow-500/10" : "")}>
                                                <input
                                                    type="text"
                                                    value={salesData[row.isoKey]?.real?.glovo?.cash || ""}
                                                    placeholder="0.00"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleGlovoUpdate(row.isoKey, 'cash', e.target.value)}
                                                    className={cn(
                                                        "w-full h-full bg-transparent text-right font-medium text-sm focus:ring-0 focus:outline-none placeholder-slate-300/50 px-1",
                                                        focusedRowIndex === i ? "text-yellow-200 placeholder-yellow-200/50" : "text-yellow-600 group-hover/cell:text-yellow-700"
                                                    )}
                                                />
                                            </td>

                                            <td className={cn("px-2 py-1 text-right font-bold text-sm border-r-[4px] border-r-[#C07070] w-24", focusedRowIndex === i ? "text-yellow-300" : "text-yellow-700 group-hover:text-yellow-800")}>{row.glovo}</td>

                                            {/* NEW: DECLARED CELLS */}

                                            <td className={cn("px-2 py-1 text-right font-bold text-sm text-orange-600/80", focusedRowIndex === i && "text-orange-200")}>{row.declaredTTC}</td>
                                            <td className={cn("px-2 py-1 text-right font-bold text-sm text-orange-600/80", focusedRowIndex === i && "text-orange-200")}>{row.declaredEsp}</td>
                                            <td className="px-2 py-1 text-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative flex items-center justify-center w-full max-w-[80px] mx-auto group/input">
                                                    <div className="relative flex items-center bg-white/50 rounded-lg border border-purple-200">
                                                        <input
                                                            type="text"
                                                            value={row.coeffImp}
                                                            onChange={(e) => handleCoeffUpdate(row.isoKey, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                    e.preventDefault();
                                                                    e.stopPropagation(); // Stop table navigation
                                                                    const val = parseFloat(row.coeffImp) || 0;
                                                                    const step = 0.01;
                                                                    const newVal = val + (e.key === 'ArrowUp' ? step : -step);
                                                                    handleCoeffUpdate(row.isoKey, newVal.toFixed(2));
                                                                }
                                                            }}
                                                            className="w-12 text-center bg-transparent border-none text-xs font-bold text-purple-700 py-1 pl-1 pr-0 focus:ring-0 focus:outline-none font-mono"
                                                        />
                                                        <div className="flex flex-col border-l border-purple-200 pl-0.5 pr-0.5 gap-px">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const val = parseFloat(row.coeffImp) || 0;
                                                                    handleCoeffUpdate(row.isoKey, (val + 0.01).toFixed(2));
                                                                }}
                                                                className="hover:bg-purple-100 rounded text-purple-600 p-px"
                                                                tabIndex={-1}
                                                            >
                                                                <ChevronUp className="w-2.5 h-2.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const val = parseFloat(row.coeffImp) || 0;
                                                                    handleCoeffUpdate(row.isoKey, (val - 0.01).toFixed(2));
                                                                }}
                                                                className="hover:bg-purple-100 rounded text-purple-600 p-px"
                                                                tabIndex={-1}
                                                            >
                                                                <ChevronDown className="w-2.5 h-2.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* FOOTER ROW - Sticky Bottom */}
                                <tfoot className="sticky bottom-0 z-20 bg-[#C07070] text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 border-[#C07070]">
                                    <tr>
                                        {/* Divider applied to Footer Date cell - Unconditional */}
                                        <td className="px-4 py-3 text-right border-r-[4px] border-r-[#C07070]">Total</td>
                                        <td className="px-4 py-3 text-right border-r border-white/20">{periodTotals.exo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right border-r border-white/20">{periodTotals.impHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right bg-white/5 border-r border-white/20">{periodTotals.totHt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        {/* Divider applied to Footer TTC cell - Unconditional */}
                                        <td className="px-4 py-3 text-right bg-white/10 border-r-[4px] border-r-[#C07070] font-bold text-white">{periodTotals.ttc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right text-blue-100 border-r border-white/20">{periodTotals.cmi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right text-emerald-100 border-r border-white/20">{periodTotals.chq.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right text-white font-bold">{periodTotals.esp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-1 py-3 bg-[#C07070] w-[4px]"></td>

                                        {/* GLOVO FOOTER -- Merged or empty? Or Sums? Let's leave empty for breakdown for now to avoid clutter, or add sums if needed. User didn't specify. I'll add filler cells. */}
                                        <td className="px-1 py-3 border-r border-slate-700/50 w-20"></td>
                                        <td className="px-1 py-3 border-r border-slate-700/50 w-20"></td>
                                        <td className="px-1 py-3 border-r border-slate-700/50 w-20"></td>

                                        <td className="px-2 py-3 text-right text-yellow-500 font-bold border-r-[4px] border-r-[#1E293B] w-24">{periodTotals.glovo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right text-orange-200 font-bold">{periodTotals.declaredTTC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-right text-orange-200 font-bold">{periodTotals.declaredEsp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-center text-purple-300 font-bold">AVG</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </GlassCard>

                    <SalesInputModal
                        isOpen={!!modalType}
                        onClose={() => setModalType(null)}
                        onSave={handleSave}
                        date={selectedDate}
                        isDeclared={modalType === "Declared"}
                        initialData={modalType === "Real" ? salesData[selectedDate]?.real : salesData[selectedDate]?.declared}
                        realData={salesData[selectedDate]?.real}
                    />
                </div>
            </main>
        </div>
    );
}

export default function VentesPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <VentesContent />
        </Suspense>
    );
}
