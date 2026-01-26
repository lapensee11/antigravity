import { useState, useEffect } from "react";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    isDeclared?: boolean;
}

const FAMILIES = [
    "BOULANGERIE",
    "CROIS.",
    "VIEN.",
    "PAT INDIVID.",
    "PAT ENTRE.",
    "FOURS SECS",
    "BELDI",
    "PRÉ-EMB.",
    "SALÉS",
    "CONFISERIE",
    "PAIN SG",
    "GÂTEAUX SG"
];

export function SalesInputModal({ isOpen, onClose, date, isDeclared }: SalesInputModalProps) {
    // Header Color Logic
    const headerColor = isDeclared ? "bg-[#2D2B35]" : "bg-[#1E293B]"; // Darker Purple-ish for Declared, Dark Slate for Real (Mockup looks dark slate/navy)
    const accentColor = isDeclared ? "text-purple-400" : "text-emerald-400";
    const buttonColor = isDeclared ? "bg-purple-600 hover:bg-purple-500" : "bg-emerald-500 hover:bg-emerald-400";

    // Form State (Mock)
    const [sales, setSales] = useState<Record<string, string>>({});
    const [supplements, setSupplements] = useState({ traiteurs: "", caisse: "" });
    const [payments, setPayments] = useState({ nbCmi: "", mtCmi: "", nbChq: "", mtChq: "", especes: "" });
    const [glovo, setGlovo] = useState({ brut: "", incid: "", cash: "" });
    const [hours, setHours] = useState({ start: "07:00", end: "20:00" });

    // Mock Calculations
    const totalSales = Object.values(sales).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const totalSupplements = (parseFloat(supplements.traiteurs) || 0) + (parseFloat(supplements.caisse) || 0);

    // Just a visual total for now (Subtotal)
    const subTotal = totalSales + totalSupplements;

    const glovoNet = (parseFloat(glovo.brut) || 0) - (parseFloat(glovo.incid) || 0) - (parseFloat(glovo.cash) || 0);

    // Format Date for Header
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    // Custom "Portal" Modal Content that overrides the default GlassModal style 
    // Since GlassModal has a fixed style, we might need to "hack" it or just use it as a container.
    // Given the mockup implies a very custom header that extends full width, 
    // and GlassModal has padding, we will try to fit inside GlassModal but might look slightly boxed 
    // unless we modify GlassModal. 
    // STRATEGY: We will render a custom overlay if isOpen. 
    // actually, let's use a fixed overlay here directly to match the exact pixel-perfect look if possible, 
    // or better, modify GlassModal to allow "no padding" content.
    // For now, let's build the UI *inside* the existing GlassModal but request it be wide.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative z-10 w-full max-w-5xl bg-[#FDFBF7] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* 1. Header (Dark Band) */}
                <div className={cn("px-8 py-5 flex justify-between items-center text-white", headerColor)}>
                    <h2 className="text-2xl font-bold italic font-serif tracking-wide">{capitalizedDate}</h2>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">Total Réel TTC</span>
                            <span className="text-2xl font-bold tracking-tight">0,00 Dh</span>
                        </div>

                        {/* Actions */}
                        <button className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95", buttonColor)}>
                            <Check className="w-6 h-6 text-white" strokeWidth={3} />
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* 2. Content Body (Pastel / Light) */}
                <div className="p-8 grid grid-cols-12 gap-8">

                    {/* COL 1: Families List (Left) - Span 4 */}
                    <div className="col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50">
                        <div className="space-y-4">
                            {FAMILIES.map((fam, idx) => (
                                <div key={fam} className="flex justify-between items-center group">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors w-1/2 truncate">
                                        {fam}
                                    </span>
                                    <div className="w-1/2 border-b border-slate-100 group-hover:border-slate-300 transition-colors relative">
                                        <input
                                            type="text"
                                            className="w-full text-right bg-transparent focus:outline-none text-slate-700 font-bold text-sm py-1"
                                            placeholder="-"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COL 2: Middle (Supplements & Payments) - Span 4 */}
                    <div className="col-span-4 flex flex-col gap-6">

                        {/* Supplements */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supp Traiteurs</span>
                                <input type="text" className="w-24 text-right bg-slate-50 rounded-lg border-none focus:ring-1 focus:ring-indigo-200 text-sm font-bold text-slate-700 py-1.5 px-3" placeholder="0.00" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supp Caisse</span>
                                <input type="text" className="w-24 text-right bg-slate-50 rounded-lg border-none focus:ring-1 focus:ring-indigo-200 text-sm font-bold text-slate-700 py-1.5 px-3" placeholder="0.00" />
                            </div>
                        </div>

                        {/* Payments Block (Flesh color bg in mockup) */}
                        <div className="bg-[#FFF8F0] rounded-3xl p-6 shadow-sm border border-[#F5E6D3] flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                {/* CMI */}
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nb CMI</label>
                                        <input className="w-full bg-white rounded-xl border-none h-10 px-3 font-bold text-slate-700 shadow-sm" />
                                    </div>
                                    <div className="flex-1 space-y-1 text-right">
                                        <label className="text-[9px] font-bold text-blue-500 uppercase">Mt CMI</label>
                                        <div className="w-full border-b border-blue-200 pb-2">
                                            <input className="w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>

                                {/* CHQ */}
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nb CHQ</label>
                                        <input className="w-full bg-white rounded-xl border-none h-10 px-3 font-bold text-slate-700 shadow-sm" />
                                    </div>
                                    <div className="flex-1 space-y-1 text-right">
                                        <label className="text-[9px] font-bold text-emerald-500 uppercase">Mt CHQ</label>
                                        <div className="w-full border-b border-emerald-200 pb-2">
                                            <input className="w-full text-right bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0" placeholder="0.00" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between items-end border-t border-[#E8DCC8] pt-4">
                                <span className="text-xs font-bold text-[#D4A674] uppercase tracking-wider">Espèces</span>
                                <span className="text-3xl font-bold text-slate-800 tracking-tight">0,00 Dh</span>
                            </div>
                        </div>

                    </div>

                    {/* COL 3: Right (Hours & Glovo) - Span 4 */}
                    <div className="col-span-4 flex flex-col gap-6">

                        {/* Hours (Dark Header Style) */}
                        <div className="bg-[#334155] rounded-3xl p-4 flex gap-4 text-white shadow-lg">
                            <div className="flex-1 bg-white/10 rounded-xl p-2 flex items-center justify-center gap-2 border border-white/10">
                                <Clock className="w-4 h-4 text-blue-300" />
                                <span className="font-mono font-bold text-lg">07:00</span>
                            </div>
                            <div className="flex-1 bg-white/10 rounded-xl p-2 flex items-center justify-center gap-2 border border-white/10">
                                <Clock className="w-4 h-4 text-pink-300" />
                                <span className="font-mono font-bold text-lg">20:00</span>
                            </div>
                        </div>

                        {/* Sous-Total */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex flex-col justify-center min-h-[100px]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sous-Total</span>
                            <div className="w-full border-b border-slate-100 h-8"></div>
                        </div>

                        {/* Glovo Block (Yellow) */}
                        <div className="bg-[#FFF9C4] rounded-3xl p-6 flex-1 shadow-sm border border-[#F9E79F] relative overflow-hidden">
                            {/* Glovo Logo/Title Mock */}
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-6 h-6 rounded-full bg-[#FFC107] flex items-center justify-center">
                                    <span className="text-[10px] font-bold">G</span>
                                </div>
                                <span className="font-serif font-bold text-[#5D4037]">GLOVO</span>
                            </div>

                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase">Brut</span>
                                    <input className="w-24 h-8 bg-white/60 border-none rounded-lg text-right font-bold text-[#5D4037] px-2" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Incid.</span>
                                    <input className="w-24 h-8 bg-white/60 border-none rounded-lg text-right font-bold text-red-500 px-2" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-[#8D6E63] uppercase">Cash</span>
                                    <input className="w-24 h-8 bg-white/60 border-none rounded-lg text-right font-bold text-[#5D4037] px-2" />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between items-end border-t border-[#FBC02D]/20 pt-4">
                                <span className="text-xs font-bold text-[#795548] uppercase tracking-wider">Glovo Net</span>
                                <span className="text-2xl font-bold text-[#3E2723] tracking-tight">0,00 Dh</span>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
