"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { Plus, Search, Trash2, Pencil, Check, X, FileText } from "lucide-react";
import { confirmDelete } from "@/lib/utils";
import { AccountingAccount } from "@/lib/types";
import { getAccountingAccounts, saveAccountingAccount, deleteAccountingAccount } from "@/lib/data-service";
import { cn } from "@/lib/utils";

export default function AccountingPlanPage() {
    const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);

    // Form State
    const [formData, setFormData] = useState<AccountingAccount>({
        id: "",
        code: "",
        label: "",
        class: "6",
        type: "Charge"
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const data = await getAccountingAccounts();
        setAccounts(data);
    };

    const handleOpenModal = (account?: AccountingAccount) => {
        if (account) {
            setEditingAccount(account);
            setFormData(account);
        } else {
            setEditingAccount(null);
            setFormData({
                id: "",
                code: "",
                label: "",
                class: "6",
                type: "Charge"
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.label) return;

        // ID defaults to Code if empty (primary key logic)
        const accountToSave = {
            ...formData,
            id: formData.id || formData.code // Use code as ID naturally if new
        };

        if (editingAccount && editingAccount.id !== accountToSave.id) {
            // ID changed? that's tricky in Dexie if it's primary key.
            // For now, let's assume ID = Code and we don't change IDs often.
            // Or if we do, we delete old and add new.
            await deleteAccountingAccount(editingAccount.id);
        }

        await saveAccountingAccount(accountToSave);
        await loadAccounts();
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (await confirmDelete("Supprimer ce compte comptable ?")) {
            await deleteAccountingAccount(id);
            await loadAccounts();
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.code.toLowerCase().includes(search.toLowerCase()) ||
        acc.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0 transition-all duration-300">
                <TopBar />

                <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-slate-800 font-outfit tracking-tight">Plan Comptable</h2>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau Compte
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un compte (Code ou Libellé)..."
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 placeholder:font-medium shadow-sm"
                        />
                    </div>

                    <GlassCard className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-widest w-24">Code</th>
                                        <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-widest">Libellé</th>
                                        <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-widest w-24">Classe</th>
                                        <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-widest w-32">Type</th>
                                        <th className="py-3 px-6 text-xs font-black text-slate-400 uppercase tracking-widest w-20 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredAccounts.map((acc) => (
                                        <tr key={acc.id} className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3 px-6">
                                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-xs select-all">
                                                    {acc.code}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-sm font-bold text-slate-700">
                                                {acc.label}
                                            </td>
                                            <td className="py-3 px-6 text-xs font-semibold text-slate-500">
                                                Classe {acc.class}
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide",
                                                    acc.type === "Charge" ? "bg-amber-100 text-amber-700" :
                                                        acc.type === "Trésorerie" ? "bg-emerald-100 text-emerald-700" :
                                                            "bg-slate-100 text-slate-600"
                                                )}>
                                                    {acc.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(acc)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAccounts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-slate-400 italic text-sm">
                                                Aucun compte trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-slate-900" />
                                {editingAccount ? "Modifier Compte" : "Nouveau Compte"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Code Comptable</label>
                                <input
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                                    placeholder="Ex: 6121"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Libellé</label>
                                <input
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="Ex: Achats de matières premières"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Classe</label>
                                    <select
                                        value={formData.class}
                                        onChange={e => setFormData({ ...formData, class: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                                    >
                                        <option value="1">1 - Financement Permanent</option>
                                        <option value="2">2 - Actif Immobilisé</option>
                                        <option value="3">3 - Actif Circulant</option>
                                        <option value="4">4 - Passif Circulant</option>
                                        <option value="5">5 - Trésorerie</option>
                                        <option value="6">6 - Charges</option>
                                        <option value="7">7 - Produits</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none"
                                    >
                                        <option value="Charge">Charge</option>
                                        <option value="Produit">Produit</option>
                                        <option value="Trésorerie">Trésorerie</option>
                                        <option value="Tiers">Tiers</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
