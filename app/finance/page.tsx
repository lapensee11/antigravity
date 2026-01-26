"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { FinanceJournal } from "@/components/finance/FinanceJournal";
import { Transaction } from "@/lib/types";
import { useState } from "react";
import { AlertCircle, Wallet, Landmark, ArrowUpRight, ArrowDownLeft, Archive, Search, Scale, Calendar, Plus } from "lucide-react";
import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { cn } from "@/lib/utils";

// Mock Data
const initialTransactions: Transaction[] = [
    { id: "t1", date: "2024-01-24", label: "Vente Comptoir", amount: 1540, type: "Recette", category: "Vente", account: "Caisse", tier: "Client Divers", pieceNumber: "TK-001" },
    { id: "t2", date: "2024-01-24", label: "Paiement Fournisseur A", amount: 500, type: "Depense", category: "Achat", invoiceId: "inv1", account: "Banque", tier: "Farine Sud", pieceNumber: "FAC-2024-089" },
    { id: "t3", date: "2024-01-23", label: "Frais Entretien", amount: 150, type: "Depense", category: "Charges", account: "Caisse", tier: "Société Nettoyage", pieceNumber: "F-123" },
] as Transaction[];

export default function FinancePage() {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [activeAccount, setActiveAccount] = useState<"Banque" | "Caisse" | "Coffre">("Banque");
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // Kept for other modals if needed, though unused for add now

    const [searchQuery, setSearchQuery] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"Toutes" | "Quinzaine" | "Mois" | "Période">("Toutes");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    // Stats
    const banqueBalance = 12450.00;
    const caisseBalance = 850.50; // Low balance alert?
    const coffreBalance = 45000.00;

    const filteredTransactions = transactions.filter(t => {
        // 1. Account Filter
        if (t.account !== activeAccount) return false;

        // 2. Search Filter (Multi-criteria)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesLabel = t.label.toLowerCase().includes(query);
            const matchesAmount = t.amount.toString().includes(query);
            // Simulate Tier search via label/category or hypothetical tier field
            const matchesCategory = t.category.toLowerCase().includes(query);

            if (!matchesLabel && !matchesAmount && !matchesCategory) return false;
        }

        // 3. Period Filter
        const tDate = new Date(t.date);
        const now = new Date();

        if (periodFilter === "Mois") {
            if (tDate.getMonth() !== now.getMonth() || tDate.getFullYear() !== now.getFullYear()) return false;
        } else if (periodFilter === "Quinzaine") {
            const diffTime = Math.abs(now.getTime() - tDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 15) return false;
        } else if (periodFilter === "Période") {
            if (dateRange.start && tDate < new Date(dateRange.start)) return false;
            if (dateRange.end && tDate > new Date(dateRange.end)) return false;
        }

        return true;
    });

    const totalCredit = filteredTransactions.filter(t => t.type === "Recette").reduce((acc, t) => acc + t.amount, 0);
    const totalDebit = filteredTransactions.filter(t => t.type === "Depense").reduce((acc, t) => acc + t.amount, 0);

    const handleToggleReconcile = (id: string) => {
        setTransactions(prev => prev.map(t =>
            t.id === id ? { ...t, isReconciled: !t.isReconciled, reconciledDate: !t.isReconciled ? new Date().toISOString() : undefined } : t
        ));
    };

    const handleDuplicate = (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            const newTx = { ...tx, id: `t${Date.now()}`, date: new Date().toISOString().split('T')[0], isReconciled: false };
            setTransactions([newTx, ...transactions]);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this transaction?")) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleSaveNewTransaction = (newTx: Partial<Transaction>) => {
        const transaction: Transaction = {
            id: `t${Date.now()}`,
            date: newTx.date || new Date().toISOString().split('T')[0],
            label: newTx.label || "Opération Diverses",
            amount: newTx.amount || 0,
            type: newTx.type || "Depense",
            category: newTx.category || "Achat",
            account: newTx.account || activeAccount,
            tier: newTx.tier,
            pieceNumber: newTx.pieceNumber,
            isReconciled: false
        };

        setTransactions([transaction, ...transactions]);
        setIsAddingNew(false);
    };

    const handleUpdateTransaction = (updatedTx: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    };

    // Derived list of unique tiers for autocomplete
    const uniqueTiers = Array.from(new Set([...transactions.map(t => t.tier || ""), "Client Divers", "Fournisseur X", "STE Nettoyage", "Boulangerie Centrale"])).filter(Boolean).sort();

    return (
        <div className="flex bg-[#F6F9FD] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                {/* Header Section - Aligned with Logo */}
                <div className="px-6 pt-6 pb-4 flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-800 font-outfit tracking-tight">Finance</h2>
                </div>

                <div className="px-6 pb-8 flex-1 flex flex-col gap-6 overflow-hidden">
                    {/* Account Selectors (3 Buttons: Banque, Caisse, Coffre) */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Banque (Modern Gold/Bronze) */}
                        <button
                            onClick={() => setActiveAccount("Banque")}
                            className={cn(
                                "relative overflow-hidden p-5 rounded-3xl flex flex-col items-start justify-between transition-all duration-300 group h-[105px]",
                                activeAccount === "Banque"
                                    ? "bg-gradient-to-br from-[#d4af37] to-[#8B4513] text-white shadow-[0_10px_30px_rgba(212,175,55,0.4)] scale-[1.02] ring-2 ring-[#d4af37]/50"
                                    : "bg-white border border-[#d4af37]/20 hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 hover:shadow-lg hover:-translate-y-1"
                            )}
                        >
                            {/* Decorative Background Pattern */}
                            <div className={cn("absolute inset-0 opacity-10 transition-opacity", activeAccount === "Banque" ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "opacity-0")} />

                            <div className="flex justify-between w-full relative z-10">
                                <span className={cn("text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm min-w-[80px] flex items-center justify-center", activeAccount === "Banque" ? "text-white" : "text-[#8B4513]")}>
                                    Banque
                                </span>
                                <div className={cn("p-2 rounded-full transition-colors", activeAccount === "Banque" ? "bg-white/20 text-white" : "bg-[#d4af37]/10 text-[#8B4513]")}>
                                    <Landmark className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className={cn("text-3xl font-black font-outfit tracking-tight", activeAccount === "Banque" ? "text-white" : "text-[#5D4037]")}>
                                    {banqueBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    <span className={cn("text-lg font-bold ml-1 align-top", activeAccount === "Banque" ? "opacity-80" : "text-[#8B4513]/60")}>Dh</span>
                                </div>
                            </div>
                        </button>

                        {/* Caisse (Modern Emerald) */}
                        <button
                            onClick={() => setActiveAccount("Caisse")}
                            className={cn(
                                "relative overflow-hidden p-5 rounded-3xl flex flex-col items-start justify-between transition-all duration-300 group h-[105px]",
                                activeAccount === "Caisse"
                                    ? "bg-gradient-to-br from-[#00C853] to-[#1B5E20] text-white shadow-[0_10px_30px_rgba(0,200,83,0.4)] scale-[1.02] ring-2 ring-[#00C853]/50"
                                    : "bg-white border border-[#00C853]/20 hover:border-[#00C853]/50 hover:bg-[#00C853]/5 hover:shadow-lg hover:-translate-y-1"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-10 transition-opacity", activeAccount === "Caisse" ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "opacity-0")} />

                            <div className="flex justify-between w-full relative z-10">
                                <span className={cn("text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm min-w-[80px] flex items-center justify-center", activeAccount === "Caisse" ? "text-white" : "text-[#1B5E20]")}>
                                    Caisse
                                </span>
                                <div className={cn("p-2 rounded-full transition-colors", activeAccount === "Caisse" ? "bg-white/20 text-white" : "bg-[#00C853]/10 text-[#00C853]")}>
                                    <Wallet className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className={cn("text-3xl font-black font-outfit tracking-tight", activeAccount === "Caisse" ? "text-white" : "text-[#1B5E20]")}>
                                    {caisseBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    <span className={cn("text-lg font-bold ml-1 align-top", activeAccount === "Caisse" ? "opacity-80" : "text-[#1B5E20]/60")}>Dh</span>
                                </div>
                            </div>
                        </button>

                        {/* Coffre (Modern Slate/Metal) */}
                        <button
                            onClick={() => setActiveAccount("Coffre")}
                            className={cn(
                                "relative overflow-hidden p-5 rounded-3xl flex flex-col items-start justify-between transition-all duration-300 group h-[105px]",
                                activeAccount === "Coffre"
                                    ? "bg-gradient-to-br from-[#607D8B] to-[#263238] text-white shadow-[0_10px_30px_rgba(96,125,139,0.4)] scale-[1.02] ring-2 ring-[#607D8B]/50"
                                    : "bg-white border border-[#607D8B]/20 hover:border-[#607D8B]/50 hover:bg-[#607D8B]/5 hover:shadow-lg hover:-translate-y-1"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-10 transition-opacity", activeAccount === "Coffre" ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "opacity-0")} />

                            <div className="flex justify-between w-full relative z-10">
                                <span className={cn("text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm min-w-[80px] flex items-center justify-center", activeAccount === "Coffre" ? "text-white" : "text-[#263238]")}>
                                    Coffre
                                </span>
                                <div className={cn("p-2 rounded-full transition-colors", activeAccount === "Coffre" ? "bg-white/20 text-white" : "bg-[#607D8B]/10 text-[#607D8B]")}>
                                    <Archive className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className={cn("text-3xl font-black font-outfit tracking-tight", activeAccount === "Coffre" ? "text-white" : "text-[#263238]")}>
                                    {coffreBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    <span className={cn("text-lg font-bold ml-1 align-top", activeAccount === "Coffre" ? "opacity-80" : "text-[#263238]/60")}>Dh</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Unified Toolbar (3 Columns: Date/Period - Search - Stats) */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                        {/* Col 1: Period Selector (Under Banque) */}
                        <div className="flex flex-col gap-3 w-full">
                            {/* Tabs - Fixed Height 54px */}
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-full h-[54px] items-center">
                                {["Toutes", "Quinzaine", "Mois", "Période"].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriodFilter(p as any)}
                                        className={cn(
                                            "flex-1 h-full rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center",
                                            periodFilter === p
                                                ? "bg-slate-800 text-white shadow-sm"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            {/* Date Inputs (Only when Période is active) */}
                            {periodFilter === "Période" && (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 px-3 py-2 pl-9 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 px-3 py-2 pl-9 focus:ring-2 focus:ring-indigo-100 shadow-sm"
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Col 2: Search + Add Button (Under Caisse) */}
                        <div className="flex items-center gap-3 w-full">
                            {/* Search Frame - Refined */}
                            <div className="relative flex-1 h-[54px] group">
                                <div className="absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-sm group-focus-within:border-indigo-300 group-focus-within:ring-4 group-focus-within:ring-indigo-100 transition-all pointer-events-none" />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                                <input
                                    placeholder="Rechercher une opération..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-full pl-12 pr-4 bg-transparent border-none rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-0 relative z-20"
                                />
                            </div>

                            {/* Add Button (Square 54px, Active Account Color) */}
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className={cn(
                                    "h-[54px] w-[54px] rounded-2xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0",
                                    activeAccount === "Banque" ? "bg-gradient-to-br from-[#d4af37] to-[#8B4513]" :
                                        activeAccount === "Caisse" ? "bg-gradient-to-br from-[#00C853] to-[#1B5E20]" :
                                            "bg-gradient-to-br from-[#607D8B] to-[#263238]"
                                )}
                            >
                                <Plus className="w-8 h-8 stroke-[3]" />
                            </button>
                        </div>

                        {/* Col 3: Stats Pill (Under Coffre) */}
                        <div className={cn(
                            "flex items-center justify-between text-white px-6 h-[54px] rounded-2xl shadow-lg w-full",
                            activeAccount === "Banque" ? "bg-gradient-to-r from-[#d4af37] to-[#8B4513]" :
                                activeAccount === "Caisse" ? "bg-gradient-to-r from-[#00C853] to-[#1B5E20]" :
                                    "bg-gradient-to-r from-[#607D8B] to-[#263238]"
                        )}
                        >
                            {/* Entrées */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none mb-1">Entrées</span>
                                <span className="text-sm font-black text-white/95 leading-none">+{totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-white/20" />

                            {/* Sorties */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none mb-1">Sorties</span>
                                <span className="text-sm font-black text-white/95 leading-none">-{totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-white/20" />

                            {/* Solde Net */}
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none mb-1">Solde Net</span>
                                <span className="text-lg font-black leading-none text-white">
                                    {(totalCredit - totalDebit) > 0 ? "+" : ""}{(totalCredit - totalDebit).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                    </div>


                    {/* Journal Table */}
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <FinanceJournal
                            transactions={filteredTransactions}
                            accountType={activeAccount}
                            onToggleReconcile={handleToggleReconcile}
                            onEdit={() => { }}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onUpdate={handleUpdateTransaction}
                            tiers={uniqueTiers}
                            isAddingNew={isAddingNew}
                            onSaveNew={handleSaveNewTransaction}
                            onCancelNew={() => setIsAddingNew(false)}
                        />
                    </div>
                </div>

            </main>
        </div>
    );
}
