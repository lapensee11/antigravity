"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TypeColumn } from "@/components/structure/TypeColumn";
import { StructureType, Family, SubFamily } from "@/lib/types";
import { useState, useEffect } from "react";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

import { initialTypes, initialFamilies, initialSubFamilies } from "@/lib/data";

import {
    Wheat,
    Croissant,
    Cake,
    Utensils,
    Coffee,
    Zap,
    Droplet,
    Truck,
    Package,
    Briefcase,
    Wrench,
    Shield,
    Printer,
    Megaphone,
    Hammer,
    Plug,
    Thermometer,
    Palette
} from "lucide-react";

const ICONS = [
    { id: "wheat", icon: Wheat },
    { id: "croissant", icon: Croissant },
    { id: "cake", icon: Cake },
    { id: "utensils", icon: Utensils },
    { id: "coffee", icon: Coffee },
    { id: "zap", icon: Zap },
    { id: "droplet", icon: Droplet },
    { id: "truck", icon: Truck },
    { id: "package", icon: Package },
    { id: "briefcase", icon: Briefcase },
    { id: "wrench", icon: Wrench },
    { id: "shield", icon: Shield },
    { id: "printer", icon: Printer },
    { id: "megaphone", icon: Megaphone },
    { id: "hammer", Hammer },
    { id: "plug", icon: Plug },
    { id: "thermometer", icon: Thermometer },
    { id: "palette", icon: Palette },
];

export default function StructurePage() {
    const [types] = useState<StructureType[]>(initialTypes);
    const [families, setFamilies] = usePersistedState<Family[]>("bakery_families", initialFamilies);
    const [subFamilies, setSubFamilies] = usePersistedState<SubFamily[]>("bakery_subfamilies", initialSubFamilies);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"family" | "subFamily">("family");
    const [editMode, setEditMode] = useState(false);

    // IDs for context
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Family | SubFamily | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: "", code: "", icon: "" });

    // Focus State for Keyboard Navigation
    const [focusedFamilyId, setFocusedFamilyId] = useState<string | null>(null);

    const getTypePrefix = (typeName: string) => {
        switch (typeName) {
            case "Achat": return "FA";
            case "Fonctionnement": return "FF";
            case "Production": return "FP";
            case "Vente": return "FV";
            default: return "XX";
        }
    };

    const handleAddFamily = (typeId: string) => {
        setSelectedTypeId(typeId);
        setModalMode("family");
        setEditMode(false);
        setFormData({ name: "", code: "", icon: "" });
        setIsModalOpen(true);
    };

    const handleAddSubFamily = (familyId: string) => {
        setSelectedFamilyId(familyId);
        setModalMode("subFamily");
        setEditMode(false);
        setFormData({ name: "", code: "", icon: "" });
        setIsModalOpen(true);
    };

    const handleEditFamily = (family: Family) => {
        setEditingItem(family);
        setModalMode("family");
        setEditMode(true);
        setFormData({ name: family.name, code: family.code, icon: family.icon || "" });
        setIsModalOpen(true);
    };

    const handleEditSubFamily = (subFamily: SubFamily) => {
        setEditingItem(subFamily);
        setModalMode("subFamily");
        setEditMode(true);
        setFormData({ name: subFamily.name, code: subFamily.code, icon: subFamily.icon || "" });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.code) return;

        if (modalMode === "family") {
            if (editMode && editingItem) {
                // Edit
                setFamilies(prev => prev.map(f => f.id === editingItem.id ? { ...f, ...formData } : f));
            } else if (selectedTypeId) {
                // Create
                const newFamily: Family = {
                    id: `f${Date.now()}`,
                    name: formData.name,
                    code: formData.code,
                    typeId: selectedTypeId,
                    icon: formData.icon
                };
                setFamilies([...families, newFamily]);
            }
        } else {
            if (editMode && editingItem) {
                // Edit
                setSubFamilies(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...formData } : s));
            } else if (selectedFamilyId) {
                // Create
                const newSub: SubFamily = {
                    id: `s${Date.now()}`,
                    name: formData.name,
                    code: formData.code,
                    familyId: selectedFamilyId,
                    icon: formData.icon
                };
                setSubFamilies([...subFamilies, newSub]);
            }
        }
        setIsModalOpen(false);
    };

    const getParentLabel = () => {
        if (modalMode === "family") {
            if (editMode) {
                const type = types.find(t => t.id === (editingItem as Family).typeId);
                return type ? `${getTypePrefix(type.name)} - ${type.name}` : "";
            }
            const type = types.find(t => t.id === selectedTypeId);
            return type ? `${getTypePrefix(type.name)} - ${type.name}` : "";
        } else {
            if (editMode) {
                const parent = families.find(f => f.id === (editingItem as SubFamily).familyId);
                return parent ? `${parent.name} (${parent.code})` : "";
            }
            const parent = families.find(f => f.id === selectedFamilyId);
            return parent ? `${parent.name} (${parent.code})` : "";
        }
    };

    const getTypeTheme = (name: string) => {
        switch (name) {
            case "Achat": return {
                headerBg: "bg-blue-50/80",
                headerText: "text-blue-600",
                codeBg: "bg-blue-50",
                codeText: "text-blue-600"
            };
            case "Fonctionnement": return {
                headerBg: "bg-slate-100/80",
                headerText: "text-slate-600",
                codeBg: "bg-slate-100",
                codeText: "text-slate-600"
            };
            case "Production": return {
                headerBg: "bg-green-50/80",
                headerText: "text-green-600",
                codeBg: "bg-green-50",
                codeText: "text-green-600"
            };
            case "Vente": return {
                headerBg: "bg-orange-50/80",
                headerText: "text-orange-600",
                codeBg: "bg-orange-50",
                codeText: "text-orange-600"
            };
            default: return {
                headerBg: "bg-slate-50",
                headerText: "text-slate-600",
                codeBg: "bg-slate-50",
                codeText: "text-slate-600"
            };
        }
    };

    const getTypeIcon = (name: string) => {
        switch (name) {
            case "Achat": return <Package className="w-5 h-5 text-blue-500" />;
            case "Fonctionnement": return <Briefcase className="w-5 h-5 text-slate-500" />;
            case "Production": return <Wrench className="w-5 h-5 text-green-500" />;
            case "Vente": return <Zap className="w-5 h-5 text-orange-500" />;
            default: return null;
        }
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default scrolling for arrows
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            } else {
                return;
            }

            const groupedFamilies: Record<string, Family[]> = {};
            types.forEach(t => {
                groupedFamilies[t.id] = families.filter(f => f.typeId === t.id);
            });

            if (!focusedFamilyId) {
                // Default: Select first family of first type
                const firstType = types[0];
                if (firstType && groupedFamilies[firstType.id].length > 0) {
                    setFocusedFamilyId(groupedFamilies[firstType.id][0].id);
                }
                return;
            }

            // Find current position
            const currentFamily = families.find(f => f.id === focusedFamilyId);
            if (!currentFamily) return;

            const currentTypeId = currentFamily.typeId;
            const currentTypeIndex = types.findIndex(t => t.id === currentTypeId);
            const currentList = groupedFamilies[currentTypeId];
            const currentIndex = currentList.findIndex(f => f.id === focusedFamilyId);

            if (e.key === "ArrowDown") {
                if (currentIndex < currentList.length - 1) {
                    setFocusedFamilyId(currentList[currentIndex + 1].id);
                }
            } else if (e.key === "ArrowUp") {
                if (currentIndex > 0) {
                    setFocusedFamilyId(currentList[currentIndex - 1].id);
                }
            } else if (e.key === "ArrowRight") {
                if (currentTypeIndex < types.length - 1) {
                    const nextType = types[currentTypeIndex + 1];
                    const nextList = groupedFamilies[nextType.id];
                    if (nextList.length > 0) {
                        // Try to maintain index, or clamp
                        const nextIndex = Math.min(currentIndex, nextList.length - 1);
                        setFocusedFamilyId(nextList[nextIndex].id);
                    }
                }
            } else if (e.key === "ArrowLeft") {
                if (currentTypeIndex > 0) {
                    const prevType = types[currentTypeIndex - 1];
                    const prevList = groupedFamilies[prevType.id];
                    if (prevList.length > 0) {
                        const prevIndex = Math.min(currentIndex, prevList.length - 1);
                        setFocusedFamilyId(prevList[prevIndex].id);
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedFamilyId, families, types]);

    return (
        <div className="flex min-h-screen bg-[#F6F8FC]">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col p-6">

                {/* Simplified Header - Removed TopBar Search */}
                <div className="flex justify-between items-end mb-8 pl-2">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-800 font-outfit tracking-tight">Structure</h2>
                        <p className="text-slate-500 mt-2 text-lg font-light">Gestion de l'architecture de votre boulangerie.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full pb-4">
                    {types.map(type => (
                        <TypeColumn
                            key={type.id}
                            structureType={type}
                            customTitle={`${getTypePrefix(type.name)} - ${type.name}`}
                            pastelTheme={getTypeTheme(type.name)}
                            icon={getTypeIcon(type.name)}
                            families={families}
                            subFamilies={subFamilies}
                            focusedFamilyId={focusedFamilyId}
                            setFocusedFamilyId={setFocusedFamilyId}
                            onAddFamily={handleAddFamily}
                            onAddSubFamily={handleAddSubFamily}
                            onEditFamily={handleEditFamily}
                            onEditSubFamily={handleEditSubFamily}
                        />
                    ))}
                </div>

                {/* Custom Styled Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="bg-[#2D3748] px-8 py-6 flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white font-serif italic">
                                    {editMode ? 'Modifier' : 'Ajouter'} {modalMode === 'family' ? 'Famille' : 'Sous-Famille'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl">×</button>
                            </div>

                            {/* Body */}
                            <div className="p-8 space-y-6">
                                {/* Parent Info */}
                                <div className="bg-slate-50 p-4 rounded-xl flex gap-3 text-sm">
                                    <span className="font-bold text-slate-400 uppercase tracking-wide">PARENT :</span>
                                    <span className="font-bold text-slate-800">{getParentLabel()}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Code</label>
                                        <input
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-[#D69E2E] transition-colors"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nom</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-[#D69E2E] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Icon Picker */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Icône</label>
                                    <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded-xl">
                                        {ICONS.map(({ id, icon: Icon }) => (
                                            <button
                                                key={id}
                                                onClick={() => setFormData({ ...formData, icon: id })}
                                                className={`aspect-square flex items-center justify-center rounded-lg transition-all ${formData.icon === id
                                                    ? "bg-[#D69E2E] text-white shadow-lg scale-110"
                                                    : "text-slate-400 hover:bg-white hover:text-slate-600"
                                                    }`}
                                            >
                                                {Icon && <Icon className="w-5 h-5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-[#D69E2E] hover:bg-[#B7791F] text-white font-bold py-4 rounded-xl text-lg tracking-wide shadow-xl shadow-orange-100 transition-all transform active:scale-95"
                                >
                                    ENREGISTRER
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
