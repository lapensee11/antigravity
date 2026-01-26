"use client";

import { Sidebar } from "@/components/layout/Sidebar";
// TopBar removed to align title with logo as requested
import { GlassCard } from "@/components/ui/GlassCard";
import { SalesInputModal } from "@/components/ventes/SalesInputModal";
import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

function VentesContent() {
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalType, setModalType] = useState<"Real" | "Declared" | null>(null);

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

    // Generate Table Rows
    const tableRows: {
        dateObject: Date;
        dateStr: string;
        exo: string;
        impHt: string;
        totHt: string;
        ttc: string;
        cmi: string;
        chq: string;
        glovo: string;
        esp: string;
    }[] = [];
    for (let day = startDay; day <= endDay; day++) {
        const d = new Date(selectedYear, selectedMonth, day);
        // Date Formatting: e.g. "Jeu. 01/01/26"
        const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const formattedDate = `${weekdayCap} ${dayStr}`;

        tableRows.push({
            dateObject: d,
            dateStr: formattedDate,
            exo: "0.00",
            impHt: "0.00",
            totHt: "0.00",
            ttc: "0.00",
            cmi: "0.00",
            chq: "0.00",
            glovo: "0.00",
            esp: "0.00",
        });
    }

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
                    return next;
                });
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedRowIndex(prev => {
                    const next = Math.max(0, prev - 1);
                    const row = document.querySelector(`tr[data-index="${next}"]`);
                    row?.scrollIntoView({ block: "nearest" });
                    return next;
                });
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (focusedRowIndex >= 0 && focusedRowIndex < tableRows.length) {
                    const row = tableRows[focusedRowIndex];
                    const offsetDate = new Date(row.dateObject.getTime() - (row.dateObject.getTimezoneOffset() * 60000));
                    setSelectedDate(offsetDate.toISOString().split('T')[0]);
                    setModalType("Real");
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedRowIndex, tableRows, modalType]);

    // Mock Data for "Today"
    const dailyData = {
        real: { ht: 12500, ttc: 13200 },
        declared: { ht: 8400, ttc: 8900 }
    };

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
                        {/* REEL Button */}
                        <button
                            onClick={() => setModalType("Real")}
                            className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-[#1E293B] hover:bg-[#1E293B]/5 bg-white/40 backdrop-blur-sm"
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
                                            {dailyData.real.ttc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-slate-400">TTC</span>
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 font-mono">
                                            HT: {dailyData.real.ht.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* DECLARED Button */}
                        <button
                            onClick={() => setModalType("Declared")}
                            className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 border-[#CD7F32] hover:bg-[#CD7F32]/5 bg-white/40 backdrop-blur-sm"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#CD7F32]/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1.5 bg-[#CD7F32]/10 rounded-lg">
                                            <ShieldCheck className="w-4 h-4 text-[#CD7F32]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">Déclaré</h3>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 capitalize">
                                        {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-bold text-[#CD7F32] tracking-tight">
                                            {dailyData.declared.ttc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-[#CD7F32]/60">TTC</span>
                                        </span>
                                        <span className="text-xs font-medium text-slate-400 font-mono">
                                            HT: {dailyData.declared.ht.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
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
                    <GlassCard className="flex-1 p-0 overflow-hidden flex flex-col shadow-none border-t border-[#1E293B] border-x-0 border-b-0 rounded-none bg-white mb-6">
                        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white relative">
                            <table className="w-full text-sm text-left border-collapse" ref={tableRef}>
                                <thead className="bg-[#1E293B] text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-20 shadow-none border-b border-[#1E293B]">
                                    <tr>
                                        {/* Divider applied to Date column */}
                                        <th className="px-4 py-3 border-r-[4px] border-r-[#1E293B]">Date</th>
                                        <th className="px-4 py-3 text-right border-r border-[#1E293B]/20">Exonéré</th>
                                        <th className="px-4 py-3 text-right border-r border-[#1E293B]/20">Imp. HT</th>
                                        <th className="px-4 py-3 text-right border-r border-[#1E293B]/20 bg-[#1E293B]/5">Total HT</th>
                                        {/* Divider applied to Total TTC column */}
                                        <th className="px-4 py-3 text-right border-r-[4px] border-r-[#1E293B] bg-[#1E293B]/10">Total TTC</th>
                                        <th className="px-4 py-3 text-right border-r border-[#1E293B]/20 text-blue-300">CMI</th>
                                        <th className="px-4 py-3 text-right border-r border-[#1E293B]/20 text-emerald-300">Chèques</th>
                                        <th className="px-4 py-3 text-right border-r border-[#1E293B]/20 text-[#FFE0B2]">Glovo Net</th>
                                        <th className="px-4 py-3 text-right font-bold h-full">Espèces</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tableRows.map((row, i) => (
                                        <tr
                                            key={i}
                                            data-index={i}
                                            onClick={() => setFocusedRowIndex(i)}
                                            onDoubleClick={() => {
                                                setFocusedRowIndex(i);
                                                const offsetDate = new Date(row.dateObject.getTime() - (row.dateObject.getTimezoneOffset() * 60000));
                                                setSelectedDate(offsetDate.toISOString().split('T')[0]);
                                                setModalType("Real");
                                            }}
                                            className={cn(
                                                "transition-all duration-100 group cursor-pointer scroll-mt-10 border-b border-slate-50",
                                                focusedRowIndex === i
                                                    ? "bg-[#1E293B]/50 text-white"
                                                    : "hover:bg-slate-50"
                                            )}
                                        >
                                            {/* Divider applied to Date cells - Unconditional */}
                                            <td className={cn(
                                                "px-4 py-2.5 font-mono text-xs font-medium border-r-[4px] border-r-[#1E293B] transition-colors",
                                                focusedRowIndex === i ? "text-white" : "text-slate-600 group-hover:text-[#1E293B]"
                                            )}>
                                                {row.dateStr}
                                            </td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono border-r border-slate-100/50", focusedRowIndex === i ? "text-white/90" : "text-slate-400 group-hover:text-[#1E293B]")}>{row.exo}</td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono border-r border-slate-100/50", focusedRowIndex === i ? "text-white/90" : "text-slate-400 group-hover:text-[#1E293B]")}>{row.impHt}</td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono font-medium border-r border-slate-100/50 bg-slate-50/30", focusedRowIndex === i ? "text-white" : "text-slate-500 group-hover:text-[#1E293B]")}>{row.totHt}</td>
                                            {/* Divider applied to Total TTC cells - Unconditional */}
                                            <td className={cn(
                                                "px-4 py-2.5 text-right font-mono font-bold bg-slate-100/30 border-r-[4px] border-r-[#1E293B] transition-colors",
                                                focusedRowIndex === i ? "text-white" : "text-slate-600 group-hover:text-[#1E293B]"
                                            )}>{row.ttc}</td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono border-r border-slate-100/50", focusedRowIndex === i ? "text-blue-200" : "text-slate-400 group-hover:text-[#1E293B]")}>{row.cmi}</td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono border-r border-slate-100/50", focusedRowIndex === i ? "text-emerald-200" : "text-slate-400 group-hover:text-[#1E293B]")}>{row.chq}</td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono border-r border-slate-100/50", focusedRowIndex === i ? "text-orange-200" : "text-slate-400 group-hover:text-[#1E293B]")}>{row.glovo}</td>
                                            <td className={cn("px-4 py-2.5 text-right font-mono font-bold", focusedRowIndex === i ? "text-white" : "text-slate-600 group-hover:text-[#1E293B]")}>{row.esp}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* FOOTER ROW - Sticky Bottom */}
                                <tfoot className="sticky bottom-0 z-20 bg-[#1E293B] text-white text-[10px] font-bold uppercase tracking-wider shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t-2 border-[#1E293B]">
                                    <tr>
                                        {/* Divider applied to Footer Date cell - Unconditional */}
                                        <td className="px-4 py-3 text-right border-r-[4px] border-r-[#1E293B]">Total</td>
                                        <td className="px-4 py-3 text-right border-r border-slate-700/50">0.00</td>
                                        <td className="px-4 py-3 text-right border-r border-slate-700/50">0.00</td>
                                        <td className="px-4 py-3 text-right bg-white/5 border-r border-slate-700/50">0.00</td>
                                        {/* Divider applied to Footer TTC cell - Unconditional */}
                                        <td className="px-4 py-3 text-right bg-white/10 border-r-[4px] border-r-[#1E293B]">0.00</td>
                                        <td className="px-4 py-3 text-right text-blue-300 border-r border-slate-700/50">0.00</td>
                                        <td className="px-4 py-3 text-right text-emerald-300 border-r border-slate-700/50">0.00</td>
                                        <td className="px-4 py-3 text-right text-[#FFE0B2] border-r border-slate-700/50">0.00</td>
                                        <td className="px-4 py-3 text-right text-white">0.00</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </GlassCard>

                    <SalesInputModal
                        isOpen={!!modalType}
                        onClose={() => setModalType(null)}
                        date={selectedDate}
                        isDeclared={modalType === "Declared"}
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
