import { GlassCard } from "@/components/ui/GlassCard";
import { StructureType, Family, SubFamily } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, ChevronRight, ChevronDown, PenLine, Trash2 } from "lucide-react";
import { useState } from "react";

interface PastelTheme {
    headerBg: string;
    headerText: string;
    codeBg: string; // The little pill color for the code
    codeText: string;
    columnBorder?: string; // Optional, maybe for the container
}

interface TypeColumnProps {
    structureType: StructureType;
    families: Family[];
    subFamilies: SubFamily[];
    pastelTheme: PastelTheme;
    focusedFamilyId?: string | null;
    setFocusedFamilyId?: (id: string) => void;
    onAddFamily: (typeId: string) => void;
    onAddSubFamily: (familyId: string) => void;
    onEditFamily: (family: Family) => void;
    onEditSubFamily: (subFamily: SubFamily) => void;
    customTitle?: string;
    icon?: React.ReactNode;
}

export function TypeColumn({
    structureType,
    families,
    subFamilies,
    pastelTheme,
    focusedFamilyId,
    setFocusedFamilyId,
    onAddFamily,
    onAddSubFamily,
    onEditFamily,
    onEditSubFamily,
    customTitle,
    icon
}: TypeColumnProps) {
    const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());

    const toggleFamily = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedFamilies);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedFamilies(newSet);

        // Also set focus
        setFocusedFamilyId?.(id);
    };

    const myFamilies = families.filter(f => f.typeId === structureType.id);

    return (
        <div className="flex flex-col h-[700px] bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {/* Minimal Pastel Header */}
            <div className={cn("px-4 py-4 flex justify-between items-center", pastelTheme.headerBg)}>
                <div className="flex items-center gap-2">
                    {icon && <div className="bg-white p-1.5 rounded-lg shadow-sm">{icon}</div>}
                    <h3 className={cn("font-bold text-sm font-outfit uppercase tracking-wide truncate max-w-[140px]", pastelTheme.headerText)}>
                        {customTitle || structureType.name}
                    </h3>
                </div>
                <button
                    onClick={() => onAddFamily(structureType.id)}
                    className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-white shadow-sm hover:shadow-md hover:scale-105 transition-all",
                        structureType.name === "Achat" && "bg-blue-500 hover:bg-blue-600",
                        structureType.name === "Fonctionnement" && "bg-slate-500 hover:bg-slate-600",
                        structureType.name === "Production" && "bg-green-500 hover:bg-green-600",
                        structureType.name === "Vente" && "bg-orange-500 hover:bg-orange-600"
                    )}
                >
                    <Plus className="w-4 h-4 stroke-[3px]" />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#FAFAFA]">
                {myFamilies.map(family => {
                    const isExpanded = expandedFamilies.has(family.id);
                    const isFocused = family.id === focusedFamilyId;
                    const mySubs = subFamilies.filter(s => s.familyId === family.id);

                    return (
                        <div
                            key={family.id}
                            className={cn(
                                "bg-white rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden transition-all group duration-200",
                                isFocused ? "border-blue-500 ring-4 ring-blue-500/10 z-10 scale-[1.02]" : "border-slate-100"
                            )}
                        >
                            {/* Family Row - Compact */}
                            <div
                                className={cn(
                                    "flex items-center justify-between p-2.5 cursor-pointer transition-colors",
                                    isFocused ? "bg-blue-50/30" : "hover:bg-slate-50"
                                )}
                                onClick={(e) => toggleFamily(family.id, e)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {/* Code Pill on Left */}
                                    <span className={cn(
                                        "px-2 py-1 rounded text-[11px] font-bold font-mono tracking-wider min-w-[50px] text-center",
                                        pastelTheme.codeBg,
                                        pastelTheme.codeText
                                    )}>
                                        {family.code}
                                    </span>

                                    {/* Name - Truncated */}
                                    <span className={cn(
                                        "font-bold text-xs sm:text-[13px] truncate",
                                        isFocused ? "text-blue-700" : "text-slate-700"
                                    )}>
                                        {family.name}
                                    </span>
                                </div>

                                {/* Actions Right */}
                                <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditFamily(family);
                                            }}
                                            className="p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                                        >
                                            <PenLine className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <button className="p-1 text-slate-300">
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Sub-Families Expansion */}
                            {isExpanded && (
                                <div className="bg-slate-50/50 p-3 space-y-2 border-t border-slate-100 animate-in slide-in-from-top-1">
                                    {mySubs.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-100 shadow-sm group/sub hover:border-indigo-100 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {/* Code Pill */}
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider min-w-[40px] text-center scale-75 origin-left hover:scale-100 transition-all cursor-default",
                                                    pastelTheme.codeBg,
                                                    pastelTheme.codeText
                                                )}>
                                                    {sub.code}
                                                </span>
                                                {/* Name */}
                                                <span className="font-bold text-slate-600 text-xs truncate">{sub.name}</span>
                                            </div>

                                            <button
                                                onClick={() => onEditSubFamily(sub)}
                                                className="opacity-0 group-hover/sub:opacity-100 p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all"
                                            >
                                                <PenLine className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddSubFamily(family.id);
                                        }}
                                        className="w-full py-3 mt-2 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-indigo-500 hover:border-indigo-300 transition-all flex items-center justify-center gap-2"
                                    >
                                        + Ajouter Sous-famille
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {myFamilies.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <p className="text-sm text-slate-400 font-medium italic">Aucune famille</p>
                    </div>
                )}
            </div>
        </div>
    );
}
