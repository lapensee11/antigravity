import { Transaction } from "@/lib/types";
import { Check, Edit2, Copy, Trash2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FinanceJournalProps {
    transactions: Transaction[];
    accountType: "Banque" | "Caisse" | "All" | "Coffre";
    onToggleReconcile: (id: string) => void;
    onEdit: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate?: (transaction: Transaction) => void; // New prop for updating
    tiers?: string[]; // New prop for tiers list
    isAddingNew?: boolean;
    onSaveNew?: (transaction: Partial<Transaction>) => void;
    onCancelNew?: () => void;
}

export function FinanceJournal({
    transactions,
    accountType,
    onToggleReconcile,
    onEdit, // Currently unused in favor of internal edit state, but kept for signature
    onDuplicate,
    onDelete,
    onUpdate,
    tiers = [],
    isAddingNew = false,
    onSaveNew,
    onCancelNew
}: FinanceJournalProps) {
    // New Transaction State
    const [newTx, setNewTx] = useState<Partial<Transaction>>({
        date: new Date().toISOString().split('T')[0],
        tier: "",
        label: "",
        category: "Achat",
        pieceNumber: "",
        amount: 0,
        type: "Depense"
    });

    // Edit Row State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Transaction | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Helpers for inputs (used for both New and Edit)
    const [debitInput, setDebitInput] = useState<string>("");
    const [creditInput, setCreditInput] = useState<string>("");

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't navigate if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === "Escape") (e.target as HTMLElement).blur();
                return;
            }

            if (transactions.length === 0) return;

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const currentIndex = transactions.findIndex(t => t.id === selectedId);
                let nextIndex = 0;

                if (currentIndex === -1) {
                    nextIndex = e.key === "ArrowDown" ? 0 : transactions.length - 1;
                } else if (e.key === "ArrowDown") {
                    nextIndex = (currentIndex + 1) % transactions.length;
                } else {
                    nextIndex = (currentIndex - 1 + transactions.length) % transactions.length;
                }

                const nextId = transactions[nextIndex]?.id;
                if (nextId) {
                    setSelectedId(nextId);
                    // Scroll into view logic could be added here if needed
                }
            }

            if (e.key === "Escape") {
                setSelectedId(null);
            }

            if (e.key === "Enter" && selectedId && !editingId) {
                const tx = transactions.find(t => t.id === selectedId);
                if (tx) startEdit(tx);
            }

            if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !editingId) {
                onDelete(selectedId);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [transactions, selectedId, editingId, onDelete]);

    const startEdit = (tx: Transaction) => {
        setEditingId(tx.id);
        setEditForm(tx);
        // Pre-fill deb/cred inputs
        if (tx.type === "Recette") {
            setCreditInput(tx.amount.toString());
            setDebitInput("");
        } else {
            setDebitInput(tx.amount.toString());
            setCreditInput("");
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(null);
        setDebitInput("");
        setCreditInput("");
    };

    const saveEdit = () => {
        if (onUpdate && editForm) {
            const debit = parseFloat(debitInput) || 0;
            const credit = parseFloat(creditInput) || 0;

            const finalAmount = credit > 0 ? credit : debit;
            const finalType = credit > 0 ? "Recette" : "Depense";

            onUpdate({
                ...editForm,
                amount: finalAmount,
                type: finalType
            });
            cancelEdit();
        }
    };

    const handleSaveNew = () => {
        if (onSaveNew) {
            const debit = parseFloat(debitInput) || 0;
            const credit = parseFloat(creditInput) || 0;

            const finalAmount = credit > 0 ? credit : debit;
            const finalType = credit > 0 ? "Recette" : "Depense";

            onSaveNew({
                ...newTx,
                amount: finalAmount,
                type: finalType,
                account: accountType === "All" ? "Banque" : accountType
            });

            // Reset
            setNewTx({
                date: new Date().toISOString().split('T')[0],
                tier: "",
                label: "",
                category: "Achat",
                pieceNumber: "",
                amount: 0,
                type: "Depense"
            });
            setDebitInput("");
            setCreditInput("");
        }
    };

    // Helper to format date
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="w-full pb-20 px-8">
            <datalist id="tiers-list">
                {tiers.map((t, i) => <option key={i} value={t} />)}
            </datalist>

            <div className={cn(
                "overflow-hidden rounded-2xl border-2 transition-colors duration-500 bg-white shadow-sm",
                accountType === "Banque" ? "border-[#C8A890]/30" :
                    accountType === "Caisse" ? "border-[#93BFA2]/30" :
                        accountType === "Coffre" ? "border-[#98B2C2]/30" : "border-slate-200"
            )}>
                <table className="w-full text-sm border-collapse">
                    <thead className={cn(
                        "text-xs uppercase font-semibold transition-colors duration-500",
                        accountType === "Banque" ? "bg-[#F2DAC3]/10 text-[#C8A890]" :
                            accountType === "Caisse" ? "bg-[#C4E4CF]/10 text-[#93BFA2]" :
                                accountType === "Coffre" ? "bg-[#D6E4EB]/10 text-[#98B2C2]" : "bg-slate-50 text-slate-500"
                    )}>
                        <tr className={cn(
                            "border-b transition-colors duration-500",
                            accountType === "Banque" ? "border-[#C8A890]/20" :
                                accountType === "Caisse" ? "border-[#93BFA2]/20" :
                                    accountType === "Coffre" ? "border-[#98B2C2]/20" : "border-slate-200"
                        )}>
                            <th className="px-2 py-3 text-center w-10 border-r border-slate-200/50">P.</th>
                            <th className="px-2 py-3 text-left w-32 border-r border-slate-200/50">Date</th>
                            <th className="px-2 py-3 text-left w-48 border-r border-slate-200/50">Tiers</th>
                            <th className="px-2 py-3 text-left border-r border-slate-200/50">Libellé</th>
                            <th className="px-2 py-3 text-left w-40 border-r border-slate-200/50">N° Pièce</th>
                            <th className="px-2 py-3 text-right text-red-600 w-28 border-r border-slate-200/50">Débit</th>
                            <th className="px-2 py-3 text-right text-green-600 w-28 border-r border-slate-200/50">Crédit</th>
                            <th className="px-2 py-3 text-right w-36 pl-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* New Transaction Row */}
                        {isAddingNew && (
                            <tr className="bg-indigo-50/30 animate-in slide-in-from-top-2 duration-200 border-b border-indigo-100">
                                <td className="px-1 py-1.5 text-center border-r border-slate-100">
                                    <div className="w-4 h-4 rounded-full border border-slate-300 bg-white mx-auto" />
                                </td>
                                <td className="px-1 py-1 border-r border-slate-100">
                                    <input
                                        type="date"
                                        value={newTx.date}
                                        onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-slate-100">
                                    <input
                                        list="tiers-list"
                                        type="text"
                                        placeholder="Tiers"
                                        value={newTx.tier}
                                        onChange={(e) => setNewTx({ ...newTx, tier: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        autoFocus
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-slate-100">
                                    <input
                                        type="text"
                                        placeholder="Libellé"
                                        value={newTx.label}
                                        onChange={(e) => setNewTx({ ...newTx, label: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-slate-100">
                                    <input
                                        type="text"
                                        placeholder="N°"
                                        value={newTx.pieceNumber}
                                        onChange={(e) => setNewTx({ ...newTx, pieceNumber: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-slate-100">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={debitInput}
                                        onChange={(e) => {
                                            setDebitInput(e.target.value);
                                            if (e.target.value) setCreditInput("");
                                        }}
                                        className="w-full bg-white border border-red-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none text-right font-mono"
                                    />
                                </td>
                                <td className="px-1 py-1 border-r border-slate-100">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={creditInput}
                                        onChange={(e) => {
                                            setCreditInput(e.target.value);
                                            if (e.target.value) setDebitInput("");
                                        }}
                                        className="w-full bg-white border border-green-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none text-right font-mono"
                                    />
                                </td>
                                <td className="px-2 py-1 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={handleSaveNew}
                                            className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                            title="Enregistrer"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={onCancelNew}
                                            className="p-1 bg-white text-slate-500 border border-slate-200 rounded hover:bg-slate-50 hover:text-red-500 transition-colors"
                                            title="Annuler"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {transactions.map(tx => {
                            const isCredit = tx.type === "Recette";
                            const isReconciled = tx.isReconciled;
                            const isEditing = editingId === tx.id;
                            const isSelected = selectedId === tx.id;

                            // Dynamic colors for selection highlight based on accountType
                            const selectionBg = accountType === "Banque" ? "bg-[#F2DAC3]/60" :
                                accountType === "Caisse" ? "bg-[#C4E4CF]/60" :
                                    accountType === "Coffre" ? "bg-[#D6E4EB]/60" : "bg-slate-100/60";

                            const selectionBorder = accountType === "Banque" ? "border-l-[#C8A890]" :
                                accountType === "Caisse" ? "border-l-[#93BFA2]" :
                                    accountType === "Coffre" ? "border-l-[#98B2C2]" : "border-l-slate-400";

                            if (isEditing && editForm) {
                                return (
                                    <tr key={tx.id} className="bg-amber-50/50 border-b border-amber-100">
                                        <td className="px-1 py-1.5 text-center border-r border-amber-200/50">
                                            <div className="w-4 h-4 rounded-full border border-amber-300 bg-white mx-auto" />
                                        </td>
                                        <td className="px-1 py-1 border-r border-amber-200/50">
                                            <input
                                                type="date"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-amber-200/50">
                                            <input
                                                list="tiers-list"
                                                type="text"
                                                value={editForm.tier || ""}
                                                onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-amber-200/50">
                                            <input
                                                type="text"
                                                value={editForm.label}
                                                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-amber-200/50">
                                            <input
                                                type="text"
                                                value={editForm.pieceNumber || ""}
                                                onChange={(e) => setEditForm({ ...editForm, pieceNumber: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-amber-200/50">
                                            <input
                                                type="number"
                                                value={debitInput}
                                                onChange={(e) => {
                                                    setDebitInput(e.target.value);
                                                    if (e.target.value) setCreditInput("");
                                                }}
                                                className="w-full bg-white border border-red-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-1 py-1 border-r border-amber-200/50">
                                            <input
                                                type="number"
                                                value={creditInput}
                                                onChange={(e) => {
                                                    setCreditInput(e.target.value);
                                                    if (e.target.value) setDebitInput("");
                                                }}
                                                className="w-full bg-white border border-green-200 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={saveEdit}
                                                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                                                    title="Enregistrer"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1 bg-white text-slate-500 border border-slate-200 rounded hover:bg-slate-50 hover:text-red-500 transition-colors"
                                                    title="Annuler"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }

                            return (
                                <tr
                                    key={tx.id}
                                    onClick={() => setSelectedId(tx.id)}
                                    className={cn(
                                        "group transition-all duration-200 cursor-pointer border-l-4",
                                        isSelected ? cn(selectionBg, selectionBorder) : "hover:bg-slate-50/80 border-l-transparent",
                                        isReconciled && !isSelected ? "bg-green-50/40" : ""
                                    )}
                                >
                                    {/* Pointer Column */}
                                    <td className="px-2 py-1.5 text-center border-r border-slate-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleReconcile(tx.id);
                                            }}
                                            className={cn(
                                                "w-4 h-4 rounded-full flex items-center justify-center transition-all border",
                                                isReconciled
                                                    ? "bg-green-500 border-green-500 text-white shadow-sm"
                                                    : "bg-white border-slate-300 text-transparent hover:border-slate-400"
                                            )}
                                            title="Pointer"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </td>

                                    {/* Date */}
                                    <td className="px-2 py-1.5 font-mono text-[13px] text-slate-600 border-r border-slate-100">
                                        {formatDate(tx.date)}
                                    </td>

                                    {/* Tiers */}
                                    <td className="px-2 py-1.5 text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] text-[13px] border-r border-slate-100">
                                        {tx.tier || "-"}
                                    </td>

                                    {/* Libellé */}
                                    <td className="px-2 py-1.5 text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px] text-[13px] border-r border-slate-100">
                                        {tx.label}
                                    </td>

                                    {/* N° Pièce */}
                                    <td className="px-2 py-1.5 font-mono text-[11px] text-slate-400 border-r border-slate-100">
                                        {tx.pieceNumber || "-"}
                                    </td>

                                    {/* Débit */}
                                    <td className="px-2 py-1.5 text-right font-bold text-red-600/90 font-mono text-[13px] border-r border-slate-100">
                                        {!isCredit ? tx.amount.toFixed(2) : "-"}
                                    </td>

                                    {/* Crédit */}
                                    <td className="px-2 py-1.5 text-right font-bold text-green-600/90 font-mono text-[13px] border-r border-slate-100">
                                        {isCredit ? tx.amount.toFixed(2) : "-"}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-2 py-1.5 text-right pl-4">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDuplicate(tx.id); }}
                                                className="p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors"
                                                title="Dupliquer"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEdit(tx); }}
                                                className="p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }}
                                                className="p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
