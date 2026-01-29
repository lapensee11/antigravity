import React, { useState, useMemo } from "react";
import { X, Check, CloudUpload, RefreshCw, Search } from "lucide-react";
import { Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InvoiceSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    invoices: Invoice[];
    onSync: (id: string) => void;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
    isOpen,
    onClose,
    invoices,
    onSync
}) => {
    // 1. All Hooks must be at the top
    const [statusFilter, setStatusFilter] = useState<"TOUS" | "FACTURES" | "BROUILLONS">("TOUS");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"TOUT" | "MOIS" | "TRIMESTRE">("TOUT");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    // Period Handler
    const setPeriod = (period: "TOUT" | "MOIS" | "TRIMESTRE") => {
        setPeriodFilter(period);
        const now = new Date();
        const end = now.toISOString().split('T')[0];

        if (period === "TOUT") {
            setDateRange({ start: "", end: "" });
        } else if (period === "MOIS") {
            const start = new Date(new Date().setDate(now.getDate() - 30)).toISOString().split('T')[0];
            setDateRange({ start, end });
        } else if (period === "TRIMESTRE") {
            const start = new Date(new Date().setDate(now.getDate() - 90)).toISOString().split('T')[0];
            setDateRange({ start, end });
        }
    };

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            // 1. Status
            if (statusFilter === "FACTURES" && inv.status === "Draft") return false;
            if (statusFilter === "BROUILLONS" && inv.status !== "Draft") return false;

            // 2. Supplier Search
            if (supplierSearch) {
                if (!inv.supplierId.toLowerCase().includes(supplierSearch.toLowerCase())) return false;
            }

            // 3. Date Filter
            const invDateStr = inv.date;
            if (dateRange.start && invDateStr < dateRange.start) return false;
            if (dateRange.end && invDateStr > dateRange.end) return false;

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, statusFilter, supplierSearch, dateRange]);

    // 2. Early return AFTER all hooks
    if (!isOpen) return null;

    // Helper for date diff
    const getDelay = (date1: string, date2: string) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 xl:p-10">
            <div className="w-full h-full bg-[#F6F8FC] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10">

                {/* Intelligent Header (Midnight Blue Control Center) */}
                <div className="bg-[#1E293B] shrink-0 border-b border-white/10 shadow-2xl relative z-20">
                    <div className="h-24 px-6 lg:px-10 flex items-center justify-between gap-6">

                        {/* 1. Brand & Stats Block */}
                        <div className="flex flex-col min-w-[200px] shrink-0">
                            <h2 className="text-2xl font-black text-white font-outfit tracking-tighter leading-none">
                                RÉSUMÉ <span className="text-blue-500 text-sm font-bold ml-1 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">DOCS</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {filteredInvoices.length} FACTURES FILTRÉES
                                </span>
                            </div>
                        </div>

                        {/* 2. Central Search & Filter Bar (The Intelligent Part) */}
                        <div className="flex-1 max-w-4xl flex items-center gap-3 bg-[#0F172A]/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">

                            {/* Search Input */}
                            <div className="relative group flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    placeholder="Nom du fournisseur..."
                                    value={supplierSearch}
                                    onChange={(e) => setSupplierSearch(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl pl-11 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>

                            {/* Status Pills */}
                            <div className="flex bg-[#0F172A] p-1 rounded-xl border border-white/5">
                                {["TOUS", "FACTURES", "BROUILLONS"].map((label) => {
                                    const isActive = statusFilter === label;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => setStatusFilter(label as any)}
                                            className={cn(
                                                "py-1.5 px-3 rounded-lg text-[9px] font-black tracking-widest transition-all",
                                                isActive
                                                    ? "bg-[#1E293B] text-blue-400 shadow-md ring-1 ring-white/10"
                                                    : "text-slate-500 hover:text-slate-300"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Date Group */}
                            <div className="flex items-center gap-1.5">
                                <div className="flex bg-[#0F172A] p-1 rounded-xl border border-white/5">
                                    {["T", "TRIM", "MOIS"].map((l, i) => {
                                        const original = ["TOUT", "TRIMESTRE", "MOIS"][i];
                                        const isActive = periodFilter === original;
                                        return (
                                            <button
                                                key={original}
                                                onClick={() => setPeriod(original as any)}
                                                className={cn(
                                                    "py-1.5 px-2.5 rounded-lg text-[9px] font-black tracking-widest transition-all",
                                                    isActive
                                                        ? "bg-[#1E293B] text-blue-400 shadow-md ring-1 ring-white/10"
                                                        : "text-slate-500 hover:text-slate-300"
                                                )}
                                            >
                                                {l}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-2 bg-[#0F172A] px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => {
                                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                                        }}
                                        className="bg-transparent text-[10px] font-black text-slate-300 focus:outline-none"
                                    />
                                    <div className="w-1 h-3 bg-white/5 rounded-full" />
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => {
                                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                                        }}
                                        className="bg-transparent text-[10px] font-black text-slate-300 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Close & Reset Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            {(supplierSearch || statusFilter !== "TOUS" || dateRange.start) && (
                                <button
                                    onClick={() => {
                                        setSupplierSearch("");
                                        setStatusFilter("TOUS");
                                        setPeriod("TOUT");
                                    }}
                                    className="text-[10px] font-black text-slate-500 hover:text-orange-400 uppercase tracking-widest transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 group shadow-lg"
                            >
                                <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto p-4 xl:p-8 custom-scrollbar">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b-2 border-slate-100">
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fournisseur</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">N° Facture</th>
                                    <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">État</th>
                                    <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Encais.</th>
                                    <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Délai</th>
                                    <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total TTC</th>
                                    <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payé</th>
                                    <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reste</th>
                                    <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((inv) => {
                                    const isValidated = inv.status === "Validated";
                                    const payments = inv.payments || [];
                                    const lastPayment = payments.length > 0
                                        ? [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
                                        : null;

                                    const encaissDate = lastPayment ? lastPayment.date : null;
                                    const delay = encaissDate ? getDelay(inv.date, encaissDate) : (inv.date ? getDelay(inv.date, new Date().toISOString().split('T')[0]) : 0);

                                    // Balance Calculation
                                    const totalPaid = inv.totalTTC - inv.balanceDue;

                                    return (
                                        <tr key={inv.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="py-4 px-6 text-sm font-black text-slate-800 uppercase tracking-tight">
                                                {inv.supplierId || "Inconnu"}
                                            </td>
                                            <td className="py-4 px-6 text-[13px] font-bold text-slate-400 font-mono">
                                                {inv.number}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex justify-center">
                                                    {isValidated ? (
                                                        <div className="w-7 h-7 bg-[#4CAF50] text-white rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
                                                            <Check className="w-4 h-4 stroke-[4px]" />
                                                        </div>
                                                    ) : (
                                                        <div className="px-2 py-1 rounded bg-slate-100 text-slate-400 text-[10px] font-black uppercase">Draft</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right text-[13px] font-bold text-slate-600">
                                                {new Date(inv.date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="py-4 px-6 text-right text-[13px] font-bold text-slate-400">
                                                {encaissDate ? new Date(encaissDate).toLocaleDateString('fr-FR') : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-[11px] font-black",
                                                    delay > 30 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {delay} j.
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right text-[14px] font-black text-slate-900 whitespace-nowrap">
                                                {inv.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-40">Dh</span>
                                            </td>
                                            <td className="py-4 px-6 text-right text-[14px] font-bold text-emerald-600 whitespace-nowrap">
                                                {totalPaid > 0 ? totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-right text-[14px] font-black text-red-500 whitespace-nowrap">
                                                {inv.balanceDue > 0.05 ? inv.balanceDue.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSync(inv.id); }}
                                                    className={cn(
                                                        "w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all mx-auto active:scale-90",
                                                        (inv.status === "Synced" || (inv as any).syncTime)
                                                            ? "bg-green-50 border-green-100 text-green-500 shadow-sm"
                                                            : "bg-orange-50 border-orange-200 text-orange-400 shadow-sm animate-pulse"
                                                    )}
                                                >
                                                    {(inv.status === "Synced" || (inv as any).syncTime) ? (
                                                        <CloudUpload className="w-5 h-5" />
                                                    ) : (
                                                        <RefreshCw className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-20 text-center">
                                            <div className="flex flex-col items-center opacity-20">
                                                <Search className="w-12 h-12 mb-4" />
                                                <p className="text-xl font-black uppercase tracking-widest">Aucune donnée correspondante</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
