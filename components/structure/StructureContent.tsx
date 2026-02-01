"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TypeColumn } from "@/components/structure/TypeColumn";
import { StructureType, Family, SubFamily, AccountingAccount } from "@/lib/types";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    getFamilies, saveFamily, deleteFamily,
    getSubFamilies, saveSubFamily, deleteSubFamily,
    getAccountingAccounts, saveAccountingAccount, deleteAccountingAccount
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
    Plus,
    Search,
    Pencil,
    Check,
    X,
    FileText
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
    const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);
    const [accountingSearch, setAccountingSearch] = useState("");
    const [activeTab, setActiveTab] = useState(1);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<AccountingAccount | null>(null);
    const [accountFormData, setAccountFormData] = useState<AccountingAccount>({
        id: "",
        code: "",
        label: "",
        class: "6",
        type: "Charge"
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const [accounts] = await Promise.all([
                getAccountingAccounts()
            ]);
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
        const parentFamily = families.find(f => f.id === familyId);
        setFormData({ name: "", code: "", icon: "", accountingCode: parentFamily?.accountingCode || "" });
        setIsModalOpen(true);
    };

    const handleEditFamily = (family: Family) => {
        setEditingItem(family);
        setModalMode("family");
        setEditMode(true);
        setFormData({ name: family.name, code: family.code, icon: family.icon || "", accountingCode: family.accountingCode || "" });
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
                icon: formData.icon,
                accountingCode: formData.accountingCode
            };

            const result = await saveFamily(familyToSave);
            if (result.success) {
                // Update local families state
                setFamilies(prev => {
                    if (editMode) return prev.map(f => f.id === familyToSave.id ? familyToSave : f);
                    return [...prev, familyToSave];
                });

                // Proactively propagate to sub-families if a code is set
                if (familyToSave.accountingCode) {
                    const affectedSubFamilies = subFamilies.filter(s => s.familyId === familyToSave.id);
                    for (const sub of affectedSubFamilies) {
                        const updatedSub = { ...sub, accountingCode: familyToSave.accountingCode };
                        await saveSubFamily(updatedSub);
                    }
                    // Update local subFamilies state
                    setSubFamilies(prev => prev.map(s =>
                        s.familyId === familyToSave.id
                            ? { ...s, accountingCode: familyToSave.accountingCode }
                            : s
                    ));
                }
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


    // --- ACCOUNTING ACCOUNT FUNCTIONS ---
    const handleOpenAccountModal = (account?: AccountingAccount) => {
        if (account) {
            setEditingAccount(account);
            setAccountFormData(account);
        } else {
            setEditingAccount(null);
            setAccountFormData({
                id: "",
                code: "",
                label: "",
                class: "6",
                type: "Charge"
            });
        }
        setIsAccountModalOpen(true);
    };

    const handleSaveAccount = async () => {
        if (!accountFormData.code || !accountFormData.label) return;
        const accountToSave = {
            ...accountFormData,
            id: accountFormData.id || accountFormData.code
        };
        if (editingAccount && editingAccount.id !== accountToSave.id) {
            await deleteAccountingAccount(editingAccount.id);
        }
        await saveAccountingAccount(accountToSave);
        const data = await getAccountingAccounts();
        setAccountingAccounts(data);
        setIsAccountModalOpen(false);
    };

    const handleDeleteAccount = async (id: string) => {
        if (confirm("Supprimer ce compte comptable ?")) {
            await deleteAccountingAccount(id);
            const data = await getAccountingAccounts();
            setAccountingAccounts(data);
        }
    };

    const filteredAccounts = accountingAccounts.filter(acc =>
        acc.code.toLowerCase().includes(accountingSearch.toLowerCase()) ||
        acc.label.toLowerCase().includes(accountingSearch.toLowerCase())
    );

    const handleDeleteFamily = async (id: string) => {
        if (!window.confirm("Supprimer cette famille ?")) return;
        const result = await deleteFamily(id);
        if (result.success) {
            setFamilies(prev => prev.filter(f => f.id !== id));
        } else {
            alert("Erreur lors de la suppression");
        }
    };


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

                {/* Tab Selector */}
                <div className="flex bg-slate-100/50 p-1.5 rounded-3xl border border-slate-200 mb-8 w-fit backdrop-blur-sm shadow-inner">
                    {[
                        { id: 1, label: "Structure", sub: "Familles - Sous-Familles" },
                        { id: 2, label: "Plan Comptable", sub: "Natures de charges" },
                        { id: 3, label: "Vide 1", sub: "Section libre" },
                        { id: 4, label: "Vide 2", sub: "Section libre" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-col items-center px-10 py-3 rounded-[1.25rem] transition-all duration-300",
                                activeTab === tab.id
                                    ? "bg-white text-blue-600 shadow-xl shadow-blue-100/50 scale-[1.02] border border-blue-50"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            )}
                        >
                            <span className="text-[13px] font-black uppercase tracking-widest leading-none mb-1">{tab.label}</span>
                            <span className={cn("text-[9px] font-bold uppercase tracking-tighter opacity-60", activeTab === tab.id ? "text-blue-400" : "text-slate-400")}>{tab.sub}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-auto">
                    {activeTab === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    )}

                    {activeTab === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-xl overflow-hidden pb-8">
                                <div className="px-10 py-8 bg-[#2D3748] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white tracking-tight">Plan Comptable Marocain</h2>
                                            <p className="text-blue-200/60 text-xs font-bold uppercase tracking-widest mt-0.5">Gestion des comptes et natures</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenAccountModal()}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all active:scale-95 border border-blue-400/30"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Nouveau Compte
                                    </button>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="relative max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={accountingSearch}
                                            onChange={(e) => setAccountingSearch(e.target.value)}
                                            placeholder="Rechercher un code ou libellé..."
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-100 placeholder:font-medium shadow-sm transition-all"
                                        />
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Code</th>
                                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Libellé</th>
                                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Type</th>
                                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredAccounts.map((acc) => (
                                                    <tr key={acc.id} className="group hover:bg-slate-50/80 transition-colors">
                                                        <td className="py-4 px-6">
                                                            <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-1 rounded text-[11px]">
                                                                {acc.code}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm font-black text-slate-700">
                                                            {acc.label}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-full text-[9px] uppercase font-black tracking-widest",
                                                                acc.type === "Charge" ? "bg-amber-100 text-amber-700" :
                                                                    acc.type === "Trésorerie" ? "bg-emerald-100 text-emerald-700" :
                                                                        "bg-blue-100 text-blue-700"
                                                            )}>
                                                                {acc.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleOpenAccountModal(acc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredAccounts.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="py-12 text-center text-slate-400 italic font-medium">
                                                            Aucun compte trouvé.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {(activeTab === 3 || activeTab === 4) && (
                        <div className="h-96 flex flex-col items-center justify-center bg-white/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-700">
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                <Palette className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-400 italic">Vide {activeTab - 2}</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Section en attente de configuration</p>
                        </div>
                    )}
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
                                        {modalMode === 'family'
                                            ? "Sera appliqué aux nouvelles sous-familles de cette famille"
                                            : "Sera appliqué aux nouveaux articles de cette sous-famille"}
                                    </p>
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

                {/* Account Modal */}
                {isAccountModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsAccountModalOpen(false)}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="bg-[#2D3748] px-10 py-8 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3 italic">
                                    <FileText className="w-7 h-7 text-blue-400" />
                                    {editingAccount ? "Modifier Compte" : "Nouveau Compte"}
                                </h3>
                                <button onClick={() => setIsAccountModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                                    <X className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="p-10 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Code Comptable</label>
                                    <input
                                        value={accountFormData.code}
                                        onChange={e => setAccountFormData({ ...accountFormData, code: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 font-mono text-lg transition-all"
                                        placeholder="Ex: 6121"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Libellé</label>
                                    <input
                                        value={accountFormData.label}
                                        onChange={e => setAccountFormData({ ...accountFormData, label: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 text-lg transition-all"
                                        placeholder="Ex: Achats de matières premières"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Classe</label>
                                        <select
                                            value={accountFormData.class}
                                            onChange={e => setAccountFormData({ ...accountFormData, class: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="1">1 - Financement</option>
                                            <option value="2">2 - Actif Immob.</option>
                                            <option value="3">3 - Actif Circ.</option>
                                            <option value="4">4 - Passif Circ.</option>
                                            <option value="5">5 - Trésorerie</option>
                                            <option value="6">6 - Charges</option>
                                            <option value="7">7 - Produits</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Type</label>
                                        <select
                                            value={accountFormData.type}
                                            onChange={e => setAccountFormData({ ...accountFormData, type: e.target.value as any })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 appearance-none cursor-pointer transition-all"
                                        >
                                            <option value="Charge">Charge</option>
                                            <option value="Produit">Produit</option>
                                            <option value="Trésorerie">Trésorerie</option>
                                            <option value="Tiers">Tiers</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        onClick={() => setIsAccountModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-95"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSaveAccount}
                                        className="flex-3 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 px-8"
                                    >
                                        <Check className="w-5 h-5" />
                                        Enregistrer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
