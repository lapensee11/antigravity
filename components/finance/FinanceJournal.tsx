import { Transaction } from "@/lib/types";
import { Check, Edit2, Copy, Trash2, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

    // Helpers for inputs (used for both New and Edit)
    const [debitInput, setDebitInput] = useState<string>("");
    const [creditInput, setCreditInput] = useState<string>("");

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
        <div className="w-full pb-20">
            <datalist id="tiers-list">
                {tiers.map((t, i) => <option key={i} value={t} />)}
            </datalist>

            <div className="overflow-x-auto">
                {/* Reduced margins by reducing cell padding from px-4 to px-2 */}
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100/50 text-xs text-slate-500 uppercase font-semibold">
                        <tr className="border-b border-slate-200">
                            <th className="px-2 py-3 text-center w-10">P.</th>
                            <th className="px-2 py-3 text-left w-28">Date</th>
                            <th className="px-2 py-3 text-left w-32">Tiers</th> {/* Reduced width */}
                            <th className="px-2 py-3 text-left">Libellé</th>
                            {/* Removed Famille */}
                            <th className="px-2 py-3 text-left w-32">N° Pièce</th> {/* Enlarged */}
                            <th className="px-2 py-3 text-right text-red-600 w-24">Débit</th>
                            <th className="px-2 py-3 text-right text-green-600 w-24">Crédit</th>
                            <th className="px-2 py-3 text-right w-28 pl-4">Actions</th> {/* Action spacing */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* New Transaction Row */}
                        {isAddingNew && (
                            <tr className="bg-indigo-50/30 animate-in slide-in-from-top-2 duration-200">
                                <td className="px-1 py-2 text-center">
                                    <div className="w-5 h-5 rounded-full border border-slate-300 bg-white mx-auto" />
                                </td>
                                <td className="px-1 py-1">
                                    <input
                                        type="date"
                                        value={newTx.date}
                                        onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </td>
                                <td className="px-1 py-1">
                                    <input
                                        list="tiers-list"
                                        type="text"
                                        placeholder="Tiers"
                                        value={newTx.tier}
                                        onChange={(e) => setNewTx({ ...newTx, tier: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        autoFocus
                                    />
                                </td>
                                <td className="px-1 py-1">
                                    <input
                                        type="text"
                                        placeholder="Libellé"
                                        value={newTx.label}
                                        onChange={(e) => setNewTx({ ...newTx, label: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </td>
                                <td className="px-1 py-1">
                                    <input
                                        type="text"
                                        placeholder="N°"
                                        value={newTx.pieceNumber}
                                        onChange={(e) => setNewTx({ ...newTx, pieceNumber: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                                    />
                                </td>
                                <td className="px-1 py-1">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={debitInput}
                                        onChange={(e) => {
                                            setDebitInput(e.target.value);
                                            if (e.target.value) setCreditInput("");
                                        }}
                                        className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none text-right font-mono"
                                    />
                                </td>
                                <td className="px-1 py-1">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={creditInput}
                                        onChange={(e) => {
                                            setCreditInput(e.target.value);
                                            if (e.target.value) setDebitInput("");
                                        }}
                                        className="w-full bg-white border border-green-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none text-right font-mono"
                                    />
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={handleSaveNew}
                                            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm"
                                            title="Enregistrer"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={onCancelNew}
                                            className="p-1.5 bg-white text-slate-500 border border-slate-200 rounded hover:bg-slate-50 hover:text-red-500 transition-colors"
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

                            if (isEditing && editForm) {
                                return (
                                    <tr key={tx.id} className="bg-amber-50/50">
                                        <td className="px-1 py-2 text-center">
                                            <div className="w-5 h-5 rounded-full border border-amber-300 bg-white mx-auto" />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="date"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                list="tiers-list"
                                                type="text"
                                                value={editForm.tier || ""}
                                                onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="text"
                                                value={editForm.label}
                                                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="text"
                                                value={editForm.pieceNumber || ""}
                                                onChange={(e) => setEditForm({ ...editForm, pieceNumber: e.target.value })}
                                                className="w-full bg-white border border-amber-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={debitInput}
                                                onChange={(e) => {
                                                    setDebitInput(e.target.value);
                                                    if (e.target.value) setCreditInput("");
                                                }}
                                                className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-1 py-1">
                                            <input
                                                type="number"
                                                value={creditInput}
                                                onChange={(e) => {
                                                    setCreditInput(e.target.value);
                                                    if (e.target.value) setDebitInput("");
                                                }}
                                                className="w-full bg-white border border-green-200 rounded px-2 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:outline-none text-right font-mono"
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={saveEdit}
                                                    className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                                                    title="Enregistrer"
                                                >
                                                    <Save className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="p-1.5 bg-white text-slate-500 border border-slate-200 rounded hover:bg-slate-50 hover:text-red-500 transition-colors"
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
                                    className={cn(
                                        "group hover:bg-slate-50/80 transition-colors",
                                        isReconciled ? "bg-green-50/40" : ""
                                    )}
                                >
                                    {/* Pointer Column */}
                                    <td className="px-2 py-3 text-center">
                                        <button
                                            onClick={() => onToggleReconcile(tx.id)}
                                            className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center transition-all border",
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
                                    <td className="px-2 py-3 font-mono text-slate-600">
                                        {formatDate(tx.date)}
                                    </td>

                                    {/* Tiers */}
                                    <td className="px-2 py-3 text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                        {tx.tier || "-"}
                                    </td>

                                    {/* Libellé */}
                                    <td className="px-2 py-3 text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                        {tx.label}
                                    </td>

                                    {/* N° Pièce */}
                                    <td className="px-2 py-3 font-mono text-xs text-slate-400">
                                        {tx.pieceNumber || "-"}
                                    </td>

                                    {/* Débit */}
                                    <td className="px-2 py-3 text-right font-bold text-red-600/90 font-mono">
                                        {!isCredit ? tx.amount.toFixed(2) : "-"}
                                    </td>

                                    {/* Crédit */}
                                    <td className="px-2 py-3 text-right font-bold text-green-600/90 font-mono">
                                        {isCredit ? tx.amount.toFixed(2) : "-"}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-2 py-3 text-right pl-4">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onDuplicate(tx.id)}
                                                className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors"
                                                title="Dupliquer"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => startEdit(tx)}
                                                className="p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(tx.id)}
                                                className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
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
