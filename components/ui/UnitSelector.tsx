"use client";

import { useState, useRef, useEffect, forwardRef, useId } from "react";
import { Trash2, Pencil, Plus, Settings2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { renameUnitGlobal, deleteUnitGlobal, UnitType } from "@/lib/data-service";

const INITIAL_UNITS: Record<UnitType, string[]> = {
    achat: ["Sac", "Quintal", "Carton", "Palette", "Boite", "Plateau"],
    pivot: ["Kg", "Litre", "Unité"],
    production: ["g", "cl", "unité"]
};

interface UnitSelectorProps {
    value: string;
    onChange: (value: string) => void;
    type: UnitType;
    variant?: 'article' | 'invoice' | 'production';
    label?: string;
    className?: string;
    textClassName?: string;
    isBlue?: boolean;
    disabled?: boolean;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const UnitSelector = forwardRef<HTMLSelectElement, UnitSelectorProps>(({ value, onChange, type, variant = 'article', label, className, textClassName, isBlue, disabled, onKeyDown }, ref) => {
    const uniqueId = useId();
    const [units, setUnits] = usePersistedState<string[]>(`bakery_units_${type}`, INITIAL_UNITS[type]);

    // Management Modal State
    const [isManaging, setIsManaging] = useState(false);
    const [editingUnit, setEditingUnit] = useState<{ old: string, new: string } | null>(null);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "__MANAGE__") {
            setIsManaging(true);
            // Reset select to previous value effectively (or keep current visual until managed)
            // Ideally we don't change the value prop until they pick a real unit.
            // But strict mode might complain. 
        } else {
            onChange(val);
        }
    };

    const handleRename = async (oldName: string, newName: string) => {
        if (!newName || oldName === newName) {
            setEditingUnit(null);
            return;
        }

        const success = await renameUnitGlobal(oldName, newName, type);
        if (success) {
            setUnits(prev => prev.map(u => u === oldName ? newName : u));
            if (value === oldName) onChange(newName);
            setEditingUnit(null);
        }
    };

    const handleDelete = async (name: string) => {
        if (window.confirm(`Supprimer l'unité "${name}" ?`)) {
            await deleteUnitGlobal(name, type);
            setUnits(prev => prev.filter(u => u !== name));
            if (value === name) onChange("");
        }
    };

    const handleAdd = () => {
        const newUnit = prompt("Nouvelle unité :");
        if (newUnit && !units.includes(newUnit)) {
            setUnits(prev => [...prev, newUnit]);
            onChange(newUnit);
            // Stay in managing mode to allow further edits? No, prompt is blocking.
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Stop global propagation for arrows when focused on the select
        // Native select handles arrows internally, so we just need to stop them bubbling to sidebar
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }
        if (onKeyDown) onKeyDown(e);
    };

    return (
        <div className={cn("relative flex flex-col", className)}>
            {label && <label htmlFor={uniqueId} className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center cursor-pointer">{label}</label>}

            <select
                id={uniqueId}
                ref={ref}
                value={value || ""}
                onChange={handleSelectChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                data-is-input="true"
                className={cn(
                    "w-full text-sm font-bold transition-all p-2 rounded-lg border text-center outline-none appearance-none cursor-pointer",
                    "focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 focus:border-blue-300",
                    isBlue ? "text-blue-700 border-blue-200 bg-blue-50/50" : (variant === 'invoice' ? "text-slate-700 border-transparent hover:bg-slate-50" : "text-slate-800 bg-white border-slate-200 shadow-sm"),
                    textClassName
                )}
            >
                <option value="">Sélectionner...</option>
                <optgroup label="Unités disponibles">
                    {units.map((u) => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </optgroup>
                <optgroup label="Configuration">
                    <option value="__MANAGE__">⚙️ Gérer les unités...</option>
                </optgroup>
            </select>

            {/* Management Overlay Modal */}
            {isManaging && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setIsManaging(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-blue-600" />
                                Gestion: {type.toUpperCase()}
                            </h3>
                            <button onClick={() => setIsManaging(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-4 pr-1">
                            {units.map((u) => (
                                <div key={u} className="flex items-center gap-2 group bg-slate-50 p-2 rounded-xl border border-transparent hover:border-slate-200 transition-all">
                                    {editingUnit?.old === u ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                autoFocus
                                                value={editingUnit.new}
                                                onChange={(e) => setEditingUnit({ ...editingUnit, new: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleRename(u, editingUnit.new);
                                                    if (e.key === "Escape") setEditingUnit(null);
                                                }}
                                                className="flex-1 bg-white border border-blue-400 rounded-lg px-2 py-1 text-sm font-bold outline-none shadow-sm ring-2 ring-blue-100"
                                            />
                                            <button onClick={() => handleRename(u, editingUnit.new)} className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-1 text-sm font-bold text-slate-700">{u}</span>
                                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingUnit({ old: u, new: u })}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAdd}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Ajouter une unité
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});
