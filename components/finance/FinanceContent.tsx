"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { FinanceJournal } from "@/components/finance/FinanceJournal";
import { Transaction } from "@/lib/types";
import { useState, useMemo } from "react";
import { Wallet, Landmark, Archive, Search, Calendar, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTransaction, deleteTransaction } from "@/lib/data-service";
import { useInvoices } from "@/lib/hooks/use-data";

export function FinanceContent({ initialTransactions }: { initialTransactions: Transaction[] }) {
    const { data: invoices = [] } = useInvoices();
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [activeAccount, setActiveAccount] = useState<"Banque" | "Caisse" | "Coffre">("Banque");
    const [isAddingNew, setIsAddingNew] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"Toutes" | "Quinzaine" | "Mois" | "Période">("Toutes");
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    // Derive balances from all transactions
    const balances = useMemo(() => {
        const stats = { Banque: 0, Caisse: 0, Coffre: 0 };
        transactions.forEach(t => {
            const amount = t.type === "Recette" ? t.amount : -t.amount;
            if (stats[t.account] !== undefined) {
                stats[t.account] += amount;
            }
        });
        return stats;
    }, [transactions]);

    const filteredTransactions = transactions.filter(t => {
        if (t.account !== activeAccount) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesLabel = t.label.toLowerCase().includes(query);
            const matchesAmount = t.amount.toString().includes(query);
            const matchesCategory = t.category.toLowerCase().includes(query);
            const matchesTier = t.tier?.toLowerCase().includes(query);

            if (!matchesLabel && !matchesAmount && !matchesCategory && !matchesTier) return false;
        }

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
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCredit = filteredTransactions.filter(t => t.type === "Recette").reduce((acc, t) => acc + t.amount, 0);
    const totalDebit = filteredTransactions.filter(t => t.type === "Depense").reduce((acc, t) => acc + t.amount, 0);

    const handleToggleReconcile = async (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        const updatedTx = {
            ...tx,
            isReconciled: !tx.isReconciled,
            reconciledDate: !tx.isReconciled ? new Date().toISOString() : undefined
        };

        setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
        await saveTransaction(updatedTx);
    };

    const handleDuplicate = async (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            const newTx: Transaction = {
                ...tx,
                id: `t${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                isReconciled: false,
                reconciledDate: undefined
            };
            setTransactions([newTx, ...transactions]);
            await saveTransaction(newTx);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Voulez-vous vraiment supprimer cette opération ?")) {
            setTransactions(prev => prev.filter(t => t.id !== id));
            await deleteTransaction(id);
        }
    };

    const handleSaveNewTransaction = async (newTx: Partial<Transaction>) => {
        const transaction: Transaction = {
            id: `t${Date.now()}`,
            date: newTx.date || new Date().toISOString().split('T')[0],
            label: newTx.label || "Opération Diverses",
            amount: newTx.amount || 0,
            type: newTx.type || "Depense" as any,
            category: newTx.category || "Achat",
            account: newTx.account || activeAccount,
            tier: newTx.tier,
            pieceNumber: newTx.pieceNumber,
            isReconciled: false
        };

        setTransactions([transaction, ...transactions]);
        setIsAddingNew(false);
        await saveTransaction(transaction);
    };

    const handleUpdateTransaction = async (updatedTx: Transaction) => {
        setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
        await saveTransaction(updatedTx);
    };

    const uniqueTiers = Array.from(new Set([...transactions.map(t => t.tier || ""), "Client Divers", "Fournisseur X"])).filter(Boolean).sort();

    return (
        <div className="flex bg-[#F6F9FD] min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                <div className="px-6 pt-6 pb-4 flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-800 font-outfit tracking-tight">Finance</h2>
                </div>

                <div className="px-6 pb-8 flex-1 flex flex-col gap-6 overflow-hidden">
                    <div className="grid grid-cols-3 gap-6">
                        {/* Banque */}
                        <button
                            onClick={() => setActiveAccount("Banque")}
                            className={cn(
                                "relative overflow-hidden p-5 rounded-3xl flex flex-col items-start justify-between transition-all duration-300 group h-[105px]",
                                activeAccount === "Banque"
                                    ? "bg-gradient-to-br from-[#F2DAC3] to-[#C8A890] text-white shadow-[0_10px_30px_rgba(242,218,195,0.6)] scale-[1.02] ring-2 ring-[#F2DAC3]/50"
                                    : "bg-white border border-[#F2DAC3]/20 hover:border-[#F2DAC3]/50 hover:bg-[#F2DAC3]/5 hover:shadow-lg hover:-translate-y-1"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-10 transition-opacity", activeAccount === "Banque" ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "opacity-0")} />
                            <div className="flex justify-between w-full relative z-10">
                                <span className={cn("text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm min-w-[80px] flex items-center justify-center", activeAccount === "Banque" ? "text-white" : "text-[#C8A890]")}>
                                    Banque
                                </span>
                                <div className={cn("p-2 rounded-full transition-colors", activeAccount === "Banque" ? "bg-white/20 text-white" : "bg-[#F2DAC3]/20 text-[#C8A890]")}>
                                    <Landmark className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className={cn("text-3xl font-black font-outfit tracking-tight", activeAccount === "Banque" ? "text-white" : "text-[#B6967E]")}>
                                    {balances.Banque.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    <span className={cn("text-lg font-bold ml-1 align-top", activeAccount === "Banque" ? "opacity-80" : "text-[#B6967E]/60")}>Dh</span>
                                </div>
                            </div>
                        </button>

                        {/* Caisse */}
                        <button
                            onClick={() => setActiveAccount("Caisse")}
                            className={cn(
                                "relative overflow-hidden p-5 rounded-3xl flex flex-col items-start justify-between transition-all duration-300 group h-[105px]",
                                activeAccount === "Caisse"
                                    ? "bg-gradient-to-br from-[#C4E4CF] to-[#93BFA2] text-white shadow-[0_10px_30px_rgba(196,228,207,0.6)] scale-[1.02] ring-2 ring-[#C4E4CF]/50"
                                    : "bg-white border border-[#C4E4CF]/20 hover:border-[#C4E4CF]/50 hover:bg-[#C4E4CF]/5 hover:shadow-lg hover:-translate-y-1"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-10 transition-opacity", activeAccount === "Caisse" ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "opacity-0")} />
                            <div className="flex justify-between w-full relative z-10">
                                <span className={cn("text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm min-w-[80px] flex items-center justify-center", activeAccount === "Caisse" ? "text-white" : "text-[#93BFA2]")}>
                                    Caisse
                                </span>
                                <div className={cn("p-2 rounded-full transition-colors", activeAccount === "Caisse" ? "bg-white/20 text-white" : "bg-[#C4E4CF]/20 text-[#93BFA2]")}>
                                    <Wallet className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className={cn("text-3xl font-black font-outfit tracking-tight", activeAccount === "Caisse" ? "text-white" : "text-[#82AA90]")}>
                                    {balances.Caisse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    <span className={cn("text-lg font-bold ml-1 align-top", activeAccount === "Caisse" ? "opacity-80" : "text-[#82AA90]/60")}>Dh</span>
                                </div>
                            </div>
                        </button>

                        {/* Coffre */}
                        <button
                            onClick={() => setActiveAccount("Coffre")}
                            className={cn(
                                "relative overflow-hidden p-5 rounded-3xl flex flex-col items-start justify-between transition-all duration-300 group h-[105px]",
                                activeAccount === "Coffre"
                                    ? "bg-gradient-to-br from-[#D6E4EB] to-[#98B2C2] text-white shadow-[0_10px_30px_rgba(214,228,235,0.6)] scale-[1.02] ring-2 ring-[#D6E4EB]/50"
                                    : "bg-white border border-[#D6E4EB]/20 hover:border-[#D6E4EB]/50 hover:bg-[#D6E4EB]/5 hover:shadow-lg hover:-translate-y-1"
                            )}
                        >
                            <div className={cn("absolute inset-0 opacity-10 transition-opacity", activeAccount === "Coffre" ? "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" : "opacity-0")} />
                            <div className="flex justify-between w-full relative z-10">
                                <span className={cn("text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm min-w-[80px] flex items-center justify-center", activeAccount === "Coffre" ? "text-white" : "text-[#98B2C2]")}>
                                    Coffre
                                </span>
                                <div className={cn("p-2 rounded-full transition-colors", activeAccount === "Coffre" ? "bg-white/20 text-white" : "bg-[#D6E4EB]/20 text-[#98B2C2]")}>
                                    <Archive className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className={cn("text-3xl font-black font-outfit tracking-tight", activeAccount === "Coffre" ? "text-white" : "text-[#8FA1AF]")}>
                                    {balances.Coffre.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                    <span className={cn("text-lg font-bold ml-1 align-top", activeAccount === "Coffre" ? "opacity-80" : "text-[#8FA1AF]/60")}>Dh</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-full h-[54px] items-center">
                                {["Toutes", "Quinzaine", "Mois", "Période"].map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriodFilter(p as any)}
                                        className={cn(
                                            "flex-1 h-full rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center",
                                            periodFilter === p
                                                ? cn(
                                                    "text-white shadow-sm",
                                                    activeAccount === "Banque" && "bg-[#C8A890]",
                                                    activeAccount === "Caisse" && "bg-[#93BFA2]",
                                                    activeAccount === "Coffre" && "bg-[#98B2C2]"
                                                )
                                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
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

                        <div className="flex items-center gap-3 w-full">
                            <div className="relative flex-1 h-[54px] group">
                                <div className="absolute inset-0 bg-white rounded-2xl border border-slate-200 shadow-sm group-focus-within:border-indigo-300 group-focus-within:ring-4 group-focus-within:ring-indigo-100 transition-all pointer-events-none" />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10" />
                                <input
                                    placeholder="Rechercher une opération..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-full pl-12 pr-12 bg-transparent border-none rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-0 relative z-20"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-all z-30"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className={cn(
                                    "h-[54px] w-[54px] rounded-2xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0",
                                    activeAccount === "Banque" ? "bg-gradient-to-br from-[#E5D1BD] to-[#5D4037]" :
                                        activeAccount === "Caisse" ? "bg-gradient-to-br from-[#A8D5BA] to-[#4D7C5D]" :
                                            "bg-gradient-to-br from-[#BCCCDC] to-[#556879]"
                                )}
                            >
                                <Plus className="w-8 h-8 stroke-[3]" />
                            </button>
                        </div>

                        <div className={cn(
                            "flex items-center justify-between text-white px-6 h-[54px] rounded-2xl shadow-lg w-full",
                            activeAccount === "Banque" ? "bg-gradient-to-r from-[#F2DAC3] to-[#C8A890]" :
                                activeAccount === "Caisse" ? "bg-gradient-to-r from-[#C4E4CF] to-[#93BFA2]" :
                                    "bg-gradient-to-r from-[#D6E4EB] to-[#98B2C2]"
                        )}>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none mb-1">Entrées</span>
                                <span className="text-sm font-black text-white/95 leading-none">+{totalCredit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none mb-1">Sorties</span>
                                <span className="text-sm font-black text-white/95 leading-none">-{totalDebit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-8 w-px bg-white/20" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none mb-1">Solde Net</span>
                                <span className="text-lg font-black leading-none text-white">
                                    {(totalCredit - totalDebit) > 0 ? "+" : ""}{(totalCredit - totalDebit).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <FinanceJournal
                            transactions={filteredTransactions}
                            invoices={invoices}
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
