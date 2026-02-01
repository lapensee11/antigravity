"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TypeColumn } from "@/components/structure/TypeColumn";
import { StructureType, Family, SubFamily, AccountingAccount } from "@/lib/types";
import { useState, useEffect } from "react";
import {
    getFamilies, saveFamily, deleteFamily,
    getSubFamilies, saveSubFamily, deleteSubFamily,
    getAccountingNatures, saveAccountingNature, deleteAccountingNature,
    getAccountingAccounts
} from "@/lib/data-service";

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
    Palette,
    Settings2,
    Trash2,
    Plus
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
    { id: "hammer", icon: Hammer },
    { id: "plug", icon: Plug },
    { id: "thermometer", icon: Thermometer },
    { id: "palette", icon: Palette },
];

export function StructureContent({
    initialTypes,
    initialFamilies,
    initialSubFamilies
}: {
    initialTypes: StructureType[],
    initialFamilies: Family[],
    initialSubFamilies: SubFamily[]
}) {
    const [types] = useState<StructureType[]>(initialTypes);
    const [families, setFamilies] = useState<Family[]>(initialFamilies);
    const [subFamilies, setSubFamilies] = useState<SubFamily[]>(initialSubFamilies);
    const [accountingNatures, setAccountingNatures] = useState<{ id: string, name: string }[]>([]);
    const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [natures, accounts] = await Promise.all([
                getAccountingNatures(),
                getAccountingAccounts()
            ]);
            setAccountingNatures(natures);
            setAccountingAccounts(accounts);
            setLoading(false);
        };
        load();
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"family" | "subFamily">("family");
    const [editMode, setEditMode] = useState(false);

    // IDs for context
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Family | SubFamily | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: "", code: "", icon: "", accountingCode: "" });

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
        setFormData({ name: "", code: "", icon: "", accountingCode: "" });
        setIsModalOpen(true);
    };

    const handleAddSubFamily = (familyId: string) => {
        setSelectedFamilyId(familyId);
        setModalMode("subFamily");
        setEditMode(false);
        setFormData({ name: "", code: "", icon: "", accountingCode: "" });
        setIsModalOpen(true);
    };

    const handleEditFamily = (family: Family) => {
        setEditingItem(family);
        setModalMode("family");
        setEditMode(true);
        setFormData({ name: family.name, code: family.code, icon: family.icon || "", accountingCode: "" });
        setIsModalOpen(true);
    };

    const handleEditSubFamily = (subFamily: SubFamily) => {
        setEditingItem(subFamily);
        setModalMode("subFamily");
        setEditMode(true);
        setFormData({ name: subFamily.name, code: subFamily.code, icon: subFamily.icon || "", accountingCode: subFamily.accountingCode || "" });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.code) return;

        if (modalMode === "family") {
            const familyToSave: Family = {
                id: (editMode && editingItem) ? editingItem.id : `f${Date.now()}`,
                name: formData.name,
                code: formData.code,
                typeId: (editMode && editingItem) ? (editingItem as Family).typeId : selectedTypeId!,
                icon: formData.icon
            };

            const result = await saveFamily(familyToSave);
            if (result.success) {
                setFamilies(prev => {
                    if (editMode) return prev.map(f => f.id === familyToSave.id ? familyToSave : f);
                    return [...prev, familyToSave];
                });
            } else {
                alert("Erreur lors de la sauvegarde de la famille");
            }
        } else {
            const subToSave: SubFamily = {
                id: (editMode && editingItem) ? editingItem.id : `s${Date.now()}`,
                name: formData.name,
                code: formData.code,
                familyId: (editMode && editingItem) ? (editingItem as SubFamily).familyId : selectedFamilyId!,
                icon: formData.icon,
                accountingCode: formData.accountingCode
            };

            const result = await saveSubFamily(subToSave);
            if (result.success) {
                setSubFamilies(prev => {
                    if (editMode) return prev.map(s => s.id === subToSave.id ? subToSave : s);
                    return [...prev, subToSave];
                });
            } else {
                alert("Erreur lors de la sauvegarde de la sous-famille");
            }
        }
        setIsModalOpen(false);
    };

    const handleDeleteFamily = async (id: string) => {
        if (!window.confirm("Supprimer cette famille ?")) return;
        const result = await deleteFamily(id);
        if (result.success) {
            setFamilies(prev => prev.filter(f => f.id !== id));
        } else {
            alert("Erreur lors de la suppression");
        }
    };
    const handleDeleteNature = async (id: string) => {
        if (confirm("Supprimer cette nature comptable ?")) {
            await deleteAccountingNature(id);
            setAccountingNatures(prev => prev.filter(n => n.id !== id));
        }
    };

    const handleAddNature = async (name: string) => {
        if (!name.trim()) return;
        const newNature = { id: crypto.randomUUID(), name };
        await saveAccountingNature(newNature);
        setAccountingNatures(prev => [...prev, newNature]);
    };

    const [newNatureName, setNewNatureName] = useState("");
    const handleDeleteSubFamily = async (id: string) => {
        if (!window.confirm("Supprimer cette sous-famille ?")) return;
        const result = await deleteSubFamily(id);
        if (result.success) {
            setSubFamilies(prev => prev.filter(s => s.id !== id));
        } else {
            alert("Erreur lors de la suppression");
        }
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
            if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;

            // Ignorer si focus dans un input, textarea, select ou bouton
            const isInputActive = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName || "");
            if (isInputActive) return;

            e.preventDefault();

            const groupedFamilies: Record<string, Family[]> = {};
            types.forEach(t => {
                groupedFamilies[t.id] = families.filter(f => f.typeId === t.id);
            });

            if (!focusedFamilyId) {
                const firstType = types[0];
                if (firstType && groupedFamilies[firstType.id].length > 0) {
                    setFocusedFamilyId(groupedFamilies[firstType.id][0].id);
                }
                return;
            }

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
        <div className="flex min-h-screen bg-[#F6F8FC] font-outfit">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col p-6">

                <div className="flex justify-between items-end mb-8 pl-2">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Structure</h2>
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
                            onDeleteFamily={handleDeleteFamily}
                            onDeleteSubFamily={handleDeleteSubFamily}
                        />
                    ))}
                </div>

                {/* Section: Plan Comptable (Natures de Charges) */}
                <div className="mt-8 mb-12">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl overflow-hidden">
                        <div className="px-10 py-8 bg-[#2D3748] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                                    <Settings2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Plan Comptable</h2>
                                    <p className="text-blue-200/60 text-xs font-bold uppercase tracking-widest mt-0.5">Gestion des Natures de Charges</p>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
                                {accountingNatures.length} Elements
                            </div>
                        </div>

                        <div className="p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {accountingNatures.map(nature => (
                                    <div key={nature.id} className="group relative flex items-center justify-between p-5 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-blue-400/30 hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500/40" />
                                            <span className="text-sm font-bold text-slate-700">{nature.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteNature(nature.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add New Nature Card */}
                                <div className="p-2 bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-2xl flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={newNatureName}
                                        onChange={(e) => setNewNatureName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleAddNature(newNatureName);
                                                setNewNatureName("");
                                            }
                                        }}
                                        placeholder="Nouvelle nature..."
                                        className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-bold text-slate-700 placeholder:text-blue-300 outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            if (newNatureName.trim()) {
                                                handleAddNature(newNatureName);
                                                setNewNatureName("");
                                            }
                                        }}
                                        className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 shrink-0"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Styled Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="bg-[#2D3748] px-8 py-6 flex justify-between items-center">
                                <h3 className="text-2xl font-bold text-white italic">
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

                                {modalMode === 'subFamily' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Code Comptable par défaut</label>
                                        <select
                                            value={formData.accountingCode || ""}
                                            onChange={e => setFormData({ ...formData, accountingCode: e.target.value })}
                                            className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-[#D69E2E] transition-colors cursor-pointer appearance-none"
                                        >
                                            <option value="">-- Aucun --</option>
                                            {accountingAccounts.map(acc => (
                                                <option key={acc.id} value={acc.code}>
                                                    {acc.code} - {acc.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-2 italic flex items-center gap-2">
                                            <span className="w-1 h-4 bg-orange-200 rounded-full"></span>
                                            Sera appliqué aux nouveaux articles de cette sous-famille
                                        </p>
                                    </div>
                                )}

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
