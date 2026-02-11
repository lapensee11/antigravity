import React, { useState, useMemo } from "react";
import { X, Check, CloudUpload, RefreshCw, Search, Download } from "lucide-react";
import { Invoice, Tier } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx-js-style';

interface InvoiceSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    invoices: Invoice[];
    tiers: Tier[];
    onSync: (id: string) => void;
}

export const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
    isOpen,
    onClose,
    invoices,
    tiers,
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
                const supplier = tiers.find(t => t.id === inv.supplierId || t.code === inv.supplierId);
                const supplierName = supplier ? supplier.name : inv.supplierId || "";
                if (!supplierName.toLowerCase().includes(supplierSearch.toLowerCase())) return false;
            }

            // 3. Date Filter
            const invDateStr = inv.date;
            if (dateRange.start && invDateStr < dateRange.start) return false;
            if (dateRange.end && invDateStr > dateRange.end) return false;

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, statusFilter, supplierSearch, dateRange, tiers]);

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
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl pl-11 pr-10 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                                />
                                {supplierSearch && (
                                    <button
                                        onClick={() => setSupplierSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
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

                        {/* 3. Export & Close Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            {/* Export Excel Button */}
                            <button
                                onClick={() => {
                                    // Prepare data for export
                                    const dataToExport = filteredInvoices.map(inv => {
                                        const supplier = tiers.find(t => t.id === inv.supplierId || t.code === inv.supplierId);
                                        const supplierName = supplier ? supplier.name : inv.supplierId || "Inconnu";
                                        const isValidated = inv.status === "Validated";
                                        const totalPaid = inv.totalTTC - inv.balanceDue;
                                        
                                        return {
                                            "Date": new Date(inv.date).toLocaleDateString('fr-FR'),
                                            "Nom du fournisseur": supplierName,
                                            "N° facture": inv.number,
                                            "État": isValidated ? "Validée" : "Brouillon",
                                            "Total TTC": inv.totalTTC,
                                            "Payé": totalPaid > 0 ? totalPaid : 0,
                                            "Reste": inv.balanceDue > 0.05 ? inv.balanceDue : 0,
                                            "Synchro": (inv.status === "Synced" || (inv as any).syncTime) ? "Oui" : "Non"
                                        };
                                    });

                                    // Add totals row
                                    const totalsRow: any = { "Date": "TOTAL", "Nom du fournisseur": "", "N° facture": "", "État": "", "Synchro": "" };
                                    if (dataToExport.length > 0) {
                                        const keys = Object.keys(dataToExport[0]);
                                        keys.forEach(key => {
                                            if (key !== "Date" && key !== "Nom du fournisseur" && key !== "N° facture" && key !== "État" && key !== "Synchro") {
                                                totalsRow[key] = dataToExport.reduce((sum, row: any) => sum + (row[key] || 0), 0);
                                            }
                                        });
                                    }
                                    const finalData = [...dataToExport, totalsRow];

                                    // Create worksheet
                                    const ws = XLSX.utils.json_to_sheet(finalData);

                                    // Style header row
                                    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
                                    for (let C = range.s.c; C <= range.e.c; ++C) {
                                        const headerCell = ws[XLSX.utils.encode_col(C) + 1];
                                        if (headerCell) {
                                            headerCell.s = {
                                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                                fill: { fgColor: { rgb: "1E293B" } },
                                                alignment: { horizontal: "center", vertical: "center" }
                                            };
                                        }
                                    }

                                    // Style totals row
                                    const lastRow = range.e.r + 1;
                                    for (let C = range.s.c; C <= range.e.c; ++C) {
                                        const totalCell = ws[XLSX.utils.encode_col(C) + lastRow];
                                        if (totalCell) {
                                            totalCell.s = {
                                                font: { bold: true },
                                                fill: { fgColor: { rgb: "F1F5F9" } }
                                            };
                                        }
                                    }

                                    // Set column widths
                                    const colWidths = [
                                        { wch: 12 }, // Date
                                        { wch: 30 }, // Nom du fournisseur
                                        { wch: 15 }, // N° facture
                                        { wch: 12 }, // État
                                        { wch: 15 }, // Total TTC
                                        { wch: 15 }, // Payé
                                        { wch: 15 }, // Reste
                                        { wch: 10 }  // Synchro
                                    ];
                                    ws['!cols'] = colWidths;

                                    // Create workbook and export
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Factures");
                                    
                                    const dateStr = new Date().toISOString().split('T')[0];
                                    XLSX.writeFile(wb, `Factures_Achat_${dateStr}.xlsx`);
                                }}
                                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 transition-all active:scale-95 group shadow-lg"
                                title="Exporter en Excel"
                            >
                                <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>

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
                                    <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nom du fournisseur</th>
                                    <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">N° facture</th>
                                    <th className="py-2 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">État</th>
                                    <th className="py-2 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total TTC</th>
                                    <th className="py-2 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payé</th>
                                    <th className="py-2 px-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reste</th>
                                    <th className="py-2 px-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.map((inv) => {
                                    const isValidated = inv.status === "Validated";
                                    
                                    // Balance Calculation
                                    const totalPaid = inv.totalTTC - inv.balanceDue;

                                    // Get supplier name from tiers
                                    const supplier = tiers.find(t => t.id === inv.supplierId || t.code === inv.supplierId);
                                    const supplierName = supplier ? supplier.name : inv.supplierId || "Inconnu";

                                    return (
                                        <tr key={inv.id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="py-2 px-4 text-[12px] font-bold text-slate-600">
                                                {new Date(inv.date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="py-2 px-4 text-[12px] font-black text-slate-800 uppercase tracking-tight">
                                                {supplierName}
                                            </td>
                                            <td className="py-2 px-4 text-[12px] font-bold text-slate-400 font-mono">
                                                {inv.number}
                                            </td>
                                            <td className="py-2 px-4">
                                                <div className="flex justify-center">
                                                    {isValidated ? (
                                                        <div className="w-5 h-5 bg-[#4CAF50] text-white rounded flex items-center justify-center shadow-sm shadow-green-500/20">
                                                            <Check className="w-3 h-3 stroke-[3px]" />
                                                        </div>
                                                    ) : (
                                                        <div className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[9px] font-black uppercase">Draft</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 text-right text-[13px] font-black text-slate-900 whitespace-nowrap">
                                                {inv.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-40">Dh</span>
                                            </td>
                                            <td className="py-2 px-4 text-right text-[13px] font-bold text-emerald-600 whitespace-nowrap">
                                                {totalPaid > 0 ? totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td className="py-2 px-4 text-right text-[13px] font-black text-red-500 whitespace-nowrap">
                                                {inv.balanceDue > 0.05 ? inv.balanceDue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                                            </td>
                                            <td className="py-2 px-4 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSync(inv.id); }}
                                                    className={cn(
                                                        "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all mx-auto active:scale-90",
                                                        (inv.status === "Synced" || (inv as any).syncTime)
                                                            ? "bg-green-50 border-green-100 text-green-500 shadow-sm"
                                                            : "bg-orange-50 border-orange-200 text-orange-400 shadow-sm animate-pulse"
                                                    )}
                                                >
                                                    {(inv.status === "Synced" || (inv as any).syncTime) ? (
                                                        <CloudUpload className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
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
