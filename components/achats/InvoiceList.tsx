import { GlassInput } from "@/components/ui/GlassInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { Invoice } from "@/lib/types";
import { Search, Filter, FileText, File } from "lucide-react";

interface InvoiceListProps {
    invoices: Invoice[];
    selectedInvoiceId?: string;
    onSelect: (invoice: Invoice) => void;
    onFilterChange: (filters: Record<string, string>) => void;
}

export function InvoiceList({ invoices, selectedInvoiceId, onSelect, onFilterChange }: InvoiceListProps) {
    return (
        <div className="h-full flex flex-col gap-4">
            <GlassCard className="p-4 flex flex-col gap-4">
                <h3 className="font-bold text-slate-700 font-outfit">Factures</h3>

                {/* Filters */}
                <div className="flex gap-2">
                    <button className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 text-white text-xs font-medium center">Tous</button>
                    <button className="flex-1 py-1.5 px-2 rounded-lg bg-white/40 text-slate-600 text-xs font-medium hover:bg-white/60">Brouillon</button>
                    <button className="flex-1 py-1.5 px-2 rounded-lg bg-white/40 text-slate-600 text-xs font-medium hover:bg-white/60">Synchronisé</button>
                </div>

                <GlassInput
                    placeholder="Fournisseur, Numéro..."
                    icon={<Search className="w-4 h-4" />}
                    className="text-sm"
                />

                <div className="flex gap-2">
                    <select className="flex-1 bg-white/50 border border-white/40 rounded-lg p-2 text-xs text-slate-700 focus:outline-none">
                        <option>Ce mois</option>
                        <option>Mois dernier</option>
                    </select>
                </div>
            </GlassCard>

            <GlassCard className="flex-1 overflow-hidden flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {invoices.map(inv => {
                        const isSelected = selectedInvoiceId === inv.id;
                        const isDraft = inv.status === "Draft";

                        return (
                            <div
                                key={inv.id}
                                onClick={() => onSelect(inv)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${isSelected
                                    ? "bg-indigo-600/10 border-indigo-500/50"
                                    : "bg-white/30 border-transparent hover:bg-white/50"
                                    }`}
                            >
                                {/* Status Badge */}
                                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${inv.status === "Synced" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                                    inv.status === "Draft" ? "bg-slate-400" : "bg-orange-500"
                                    }`} />

                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/60" : "bg-white/40"}`}>
                                        {isDraft ? <File className="w-4 h-4 text-slate-500" /> : <FileText className="w-4 h-4 text-indigo-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{inv.supplierId}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{inv.number}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-3 border-t border-slate-200/50 pt-2">
                                    <span className="text-[10px] text-slate-400 font-medium">{inv.date}</span>
                                    <span className="font-bold text-slate-700 text-sm">
                                        {inv.totalTTC.toLocaleString()} Dh
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </GlassCard>
        </div>
    );
}
