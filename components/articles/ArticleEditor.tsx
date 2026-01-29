import { Article, Invoice } from "@/lib/types";
import { initialFamilies, initialSubFamilies, initialUnits } from "@/lib/data";
import { Save, Trash2, Pencil, Check, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { cn } from "@/lib/utils";

interface ArticleEditorProps {
    article?: Article | null;
    existingArticles?: Article[];
    invoices?: Invoice[];
    onSave: (article: Article) => void;
    onDelete: (id: string) => void;
    forceEditTrigger?: number; // New prop to trigger edit from parent
}

export function ArticleEditor({ article, existingArticles = [], invoices = [], onSave, onDelete, forceEditTrigger }: ArticleEditorProps) {
    const [formData, setFormData] = useState<Partial<Article>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Watch for external edit trigger
    useEffect(() => {
        if (forceEditTrigger) {
            setIsEditing(true);
        }
    }, [forceEditTrigger]);

    // Local state for Family selection (allows changing family before sub-family)
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

    // Units
    const [units] = usePersistedState<string[]>("bakery_units", initialUnits);

    // Helper to generate code
    const generateNextCode = (subId: string) => {
        const sub = initialSubFamilies.find(s => s.id === subId);
        if (!sub) return "NEW-00";

        // Base Prefix: Replace 'F' with 'P' in FA011 -> PA011
        // If sub.code is "FA011", we want "PA011-##"
        const baseCode = sub.code.replace('F', 'P'); // Simple replacement policy

        // Count existing articles in this SubFamily
        // We filter using the passed existingArticles
        const count = existingArticles.filter(a => a.subFamilyId === subId).length;
        const nextNum = count + 1;

        return `${baseCode}-${nextNum.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (article) {
            setFormData(prev => {
                // If it's a new article and has no valid code yet (or generic temp code), generate one
                // But we must be careful not to overwrite if user manually edited it? 
                // For "New" articles, we want to auto-gen.
                const isNew = article.id.startsWith("temp_");
                if (isNew && (!article.code || article.code === "" || article.code.startsWith("ART-"))) {
                    // Generate initial code based on current subFamily
                    const nextCode = generateNextCode(article.subFamilyId || "");
                    return { ...article, code: nextCode };
                }
                return article;
            });

            // Check if it's a temporary "new" article
            const isNew = article.id.startsWith("temp_");
            setIsEditing(isNew);

            // Sync family selector
            if (article.subFamilyId) {
                const sub = initialSubFamilies.find(s => s.id === article.subFamilyId);
                if (sub) setSelectedFamilyId(sub.familyId);
            } else {
                setSelectedFamilyId("");
            }

        } else {
            // Should not happen
            setFormData({});
            setIsEditing(false);
        }
    }, [article, existingArticles]); // Add existingArticles dependency if needed, but mainly on article change

    const handleChange = (field: keyof Article, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // If SubFamily changes AND it's a new article, re-generate code
            if (field === "subFamilyId" && (prev.id?.startsWith("temp_") || prev.id === undefined)) {
                newData.code = generateNextCode(value as string);
            }

            return newData;
        });
    };

    const handleSave = () => {
        // Validation: Name and SubFamily are required. Code is auto-generated.
        if (formData.name && formData.subFamilyId) {
            onSave(formData as Article);
            setIsEditing(false);
        } else {
            // Basic feedback
            alert("Veuillez renseigner le nom et la catégorie de l'article.");
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            setIsEditing(false);
            if (article) {
                setFormData(article);
                const sub = initialSubFamilies.find(s => s.id === article.subFamilyId);
                if (sub) setSelectedFamilyId(sub.familyId);
            }
        } else {
            setIsEditing(true);
        }
    };

    // Derived display values
    const family = initialFamilies.find(f => f.id === (selectedFamilyId || (formData.subFamilyId ? initialSubFamilies.find(s => s.id === formData.subFamilyId)?.familyId : "")));
    const subFamily = initialSubFamilies.find(s => s.id === formData.subFamilyId);

    const displayCode = formData.code || "NO-CODE";
    const displayName = formData.name || "Nouvel Article";

    // Dynamic Last Price from History
    const displayPrice = useMemo(() => {
        if (formData.priceHistory && formData.priceHistory.length > 0) {
            const sorted = [...formData.priceHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return sorted[0].price;
        }
        return formData.lastPivotPrice || 0;
    }, [formData.priceHistory, formData.lastPivotPrice]);

    // Icon (Placeholder logic based on family?)
    const typeName = family ? initialFamilies.find(f => f.id === family.id)?.typeId === "1" ? "ACHAT" : "FONCT." : "";

    // Filtered SubFamilies based on selected Family
    const filteredSubFamilies = useMemo(() => {
        if (!selectedFamilyId) return [];
        return initialSubFamilies.filter(s => s.familyId === selectedFamilyId);
    }, [selectedFamilyId]);

    // Computed History from Invoices
    const historyList = useMemo(() => {
        if (!article) return [];
        const lines: any[] = [];
        invoices.forEach(inv => {
            inv.lines.forEach(line => {
                if (line.articleId === article.id || (line.articleName === article.name && !line.articleId)) {
                    lines.push({
                        date: inv.date,
                        supplier: inv.supplierId,
                        quantity: line.quantity,
                        unit: line.unit,
                        price: line.priceHT,
                        total: line.totalTTC, // Or approximation if not stored perfectly on line
                        status: inv.status
                    });
                }
            });
        });
        return lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [article, invoices]);

    // Helper to check if new
    const isNewArticle = formData.id?.startsWith("temp_") || formData.id?.startsWith("new_");

    return (
        <div className="h-full flex flex-col bg-white">

            {/* CONTENT CONTAINER - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* HEADER */}
                <div className="px-10 pt-10 pb-8 mb-4 flex justify-between items-start gap-6">

                    {/* LEFT SIDE WRAPPER */}
                    <div className="flex-1 min-w-0">
                        {/* Tags Row */}
                        <div className="flex items-center gap-3 mb-4">
                            {isEditing ? (
                                <input
                                    value={formData.code || ""}
                                    onChange={(e) => handleChange("code", e.target.value)}
                                    className="text-sm font-bold text-[#C19A6B] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded focus:outline-none focus:border-blue-500 w-24 tracking-wide uppercase"
                                    placeholder="CODE"
                                />
                            ) : (
                                <span className="text-sm font-bold text-[#C19A6B] tracking-wide">{displayCode}</span>
                            )}

                            {typeName && (
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                                    {typeName}
                                </span>
                            )}
                        </div>

                        {/* Icon & Title Row */}
                        <div className="flex gap-5 items-start">
                            {/* Icon (Reduced Size) */}
                            <div className="w-16 h-16 bg-[#FFF9F0] rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm border border-slate-50 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D69E2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 16 8" /><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" /><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /></svg>
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[4rem]">
                                {/* Title */}
                                {isEditing ? (
                                    <input
                                        value={formData.name || ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="text-3xl font-serif font-bold text-slate-900 leading-tight bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none w-full placeholder:text-slate-300"
                                        placeholder="Nom de l'article"
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight truncate py-1 flex items-center gap-3 group">
                                        {displayName}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleEdit(); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1.5 bg-slate-100 rounded-lg hover:bg-blue-100 hover:text-blue-600"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </div>
                                    </h1>
                                )}

                                {/* Sub Info */}
                                {isEditing ? (
                                    <div className="flex gap-2 mt-2">
                                        <select
                                            value={selectedFamilyId}
                                            onChange={(e) => {
                                                setSelectedFamilyId(e.target.value);
                                                handleChange("subFamilyId", ""); // Reset sub on family change
                                            }}
                                            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">Sélectionner Famille</option>
                                            {initialFamilies.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={formData.subFamilyId || ""}
                                            onChange={(e) => handleChange("subFamilyId", e.target.value)}
                                            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                            disabled={!selectedFamilyId}
                                        >
                                            <option value="">Sélectionner Sous-Famille</option>
                                            {filteredSubFamilies.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 font-medium text-sm mt-0.5">
                                        {family?.name || "Famille"} <span className="mx-1 text-slate-300">›</span> {subFamily?.name || "Sous-famille"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Actions - Moved Top Level */}
                    <div className="flex flex-col items-end gap-3 min-w-[200px] shrink-0">
                        {/* Price Card - Blue Square (Matches selection bg-blue-100) */}
                        <div className="bg-blue-100 text-blue-900 p-4 w-full text-center shadow-md">
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Dernier Cours</div>
                            <div className="text-2xl font-bold">
                                {displayPrice.toFixed(2).replace('.', ',')} <span className="text-sm font-normal text-blue-400">Dh / {formData.unitPivot}</span>
                            </div>
                        </div>

                        {/* Buttons Control */}
                        <div className="flex gap-2 w-full">
                            {/* Always Show Save Button */}
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md border border-blue-100"
                            >
                                <Check className="w-4 h-4" /> Enregistrer
                            </button>

                            {isEditing ? (
                                <button
                                    onClick={toggleEdit}
                                    className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors shadow-md"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => article?.id && onDelete(article.id)}
                                    className="w-10 h-10 bg-pink-50 hover:bg-pink-100 text-pink-500 rounded-xl flex items-center justify-center transition-colors shadow-md"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                </div>

                {/* Units & Conversion Section */}
                <section className="px-10 mb-12">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full bg-blue-600 transition-colors" />
                        Unités & Conversions
                    </h3>

                    {/* 5-Column Flex Layout - Unified Rounded Container */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center gap-4">

                            {/* 1. Unité Achat */}
                            <div className="flex-1 min-w-[140px] flex flex-col">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Unité Achat</label>
                                <select
                                    value={formData.unitAchat || ""}
                                    onChange={(e) => handleChange("unitAchat", e.target.value)}
                                    style={{ textAlignLast: 'center' }}
                                    className="w-full text-sm font-bold text-slate-800 outline-none bg-transparent border-none focus:ring-0 transition-all appearance-none cursor-pointer text-center p-1"
                                >
                                    <option value="">Sélectionner...</option>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 2. Contenance */}
                            <div className="w-32 flex flex-col">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Contenance</label>
                                <input
                                    type="number"
                                    value={formData.contenace}
                                    onChange={(e) => handleChange("contenace", parseFloat(e.target.value))}
                                    className="w-full text-sm font-bold text-slate-800 text-center outline-none bg-transparent border-none focus:ring-0 transition-all p-1"
                                />
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 3. Unité Pivot */}
                            <div className="flex-1 min-w-[120px] flex flex-col">
                                <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1 text-center">Unité Pivot (Stock)</label>
                                <select
                                    value={formData.unitPivot || ""}
                                    onChange={(e) => handleChange("unitPivot", e.target.value)}
                                    style={{ textAlignLast: 'center' }}
                                    className="w-full text-sm font-bold text-blue-700 text-center outline-none bg-transparent border-none focus:ring-0 transition-all appearance-none cursor-pointer p-1"
                                >
                                    <option value="">Sélectionner...</option>
                                    {["Kg", "Litre", "Unité"].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 4. Coeff */}
                            <div className="w-32 flex flex-col">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Coeff</label>
                                <input
                                    type="number"
                                    value={formData.coeffProd}
                                    onChange={(e) => handleChange("coeffProd", parseFloat(e.target.value))}
                                    className="w-full text-sm font-bold text-green-600 text-center outline-none bg-transparent border-none focus:ring-0 transition-all p-1"
                                />
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 5. Unité Production */}
                            <div className="flex-1 min-w-[120px] flex flex-col">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Unité Production</label>
                                <select
                                    value={formData.unitProduction || ""}
                                    onChange={(e) => handleChange("unitProduction", e.target.value)}
                                    style={{ textAlignLast: 'center' }}
                                    className="w-full text-sm font-bold text-slate-800 text-center outline-none bg-transparent border-none focus:ring-0 transition-all appearance-none cursor-pointer p-1"
                                >
                                    <option value="">Sélectionner...</option>
                                    {["g", "cl", "unité"].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Additional Info Blocks (Side by Side) */}
                <div className="grid grid-cols-2 gap-12 px-10 mb-12">
                    {/* Block 1: Comptabilité */}
                    <section className="flex flex-col h-full">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-blue-600 transition-colors" />
                            Comptabilité
                        </h3>
                        <div className="bg-[#F8FAFC] rounded-2xl px-8 py-5 border border-blue-500/20 shadow-2xl shadow-blue-500/5 transition-all duration-300 flex-1 space-y-5">
                            {/* VAT Rate - Radio Buttons */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taux de TVA (%)</label>
                                <div className="flex flex-wrap gap-2.5">
                                    {[0, 7, 10, 14, 20].map((rate) => (
                                        <button
                                            key={rate}
                                            onClick={() => handleChange("vatRate", rate)}
                                            className={cn(
                                                "px-5 py-2.5 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                                (formData.vatRate || 0) === rate
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                            )}
                                        >
                                            {rate}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px w-full bg-blue-200" />

                            {/* Accounting Info Row */}
                            <div className="grid grid-cols-1 gap-5">
                                {/* Nature Comptable */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-serif italic text-slate-500">Nature Comptable</label>
                                    <select
                                        value={formData.accountingNature || ""}
                                        onChange={(e) => handleChange("accountingNature", e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="Achat de matières premières">Achat de matières premières</option>
                                        <option value="Achat de marchandises">Achat de marchandises</option>
                                        <option value="Achat d'emballages">Achat d'emballages</option>
                                        <option value="Fournitures consommables">Fournitures consommables</option>
                                        <option value="Petit outillage">Petit outillage</option>
                                        <option value="Services extérieurs">Services extérieurs</option>
                                    </select>
                                </div>

                                {/* Compte Comptable */}
                                <div className="space-y-2 pt-4 border-t border-blue-200">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-serif italic text-slate-500">Compte Comptable</label>
                                    <input
                                        type="text"
                                        value={formData.accountingAccount || ""}
                                        onChange={(e) => handleChange("accountingAccount", e.target.value)}
                                        placeholder="ex: 6111"
                                        className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Block 2: Logistique & Stockage (Conditional Nutrition) */}
                    <section className="flex flex-col h-full">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-blue-600 transition-colors" />
                            {formData.accountingNature === "Achat de matières premières" ? "Valeurs Nutritionnelles pour 100g" : "Logistique & Stockage"}
                        </h3>
                        <div className="bg-[#F8FAFC] rounded-2xl px-6 py-4 border border-blue-500/20 shadow-2xl shadow-blue-500/5 transition-all duration-300 flex-1 flex flex-col min-h-[300px]">
                            {formData.accountingNature === "Achat de matières premières" ? (
                                <div className="space-y-3">
                                    {/* Row 1: Energy & Water */}
                                    <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="flex-1 flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase truncate mr-2">Énergie (Kcal)</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.calories || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...prev.nutritionalInfo, calories: parseFloat(e.target.value) } }))}
                                                className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div className="w-px h-6 bg-slate-100" />
                                        <div className="flex-1 flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase truncate mr-2">Eau (%)</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.water || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...prev.nutritionalInfo, water: parseFloat(e.target.value) } }))}
                                                className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Row 2: Macros (Horizontal) */}
                                    <div className="grid grid-cols-3 gap-3 bg-white rounded-lg border border-slate-100 p-2 shadow-sm">
                                        {[
                                            { label: "Protéines", key: "protein" },
                                            { label: "Lipides", key: "fat" },
                                            { label: "Minéraux", key: "minerals" }
                                        ].map(field => (
                                            <div key={field.key} className="flex flex-col items-center justify-center gap-1">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase truncate w-full text-center">{field.label}</label>
                                                <input
                                                    type="number"
                                                    value={(formData.nutritionalInfo as any)?.[field.key] || ""}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        nutritionalInfo: {
                                                            ...(prev.nutritionalInfo || {}),
                                                            [field.key]: parseFloat(e.target.value)
                                                        }
                                                    }))}
                                                    className="w-full text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Row 3: Glucides Group (Orange Theme) */}
                                    <div className="bg-orange-50/50 rounded border border-orange-200 p-2 shadow-sm space-y-2">
                                        {/* Total Row (Grid Aligned) */}
                                        <div className="grid grid-cols-3 gap-2 items-center">
                                            <div className="col-span-2 flex justify-start pl-1">
                                                <label className="text-[10px] font-bold text-orange-600 uppercase">Glucides</label>
                                            </div>
                                            <div className="col-span-1">
                                                <input
                                                    type="number"
                                                    value={(formData.nutritionalInfo as any)?.carbs || ""}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...prev.nutritionalInfo, carbs: parseFloat(e.target.value) } }))}
                                                    className="w-full text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Sub-fields Horizontal */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: "Sucres", key: "sugars" },
                                                { label: "Amidons", key: "starch" },
                                                { label: "Fibres", key: "fiber" }
                                            ].map(field => (
                                                <div key={field.key} className="flex flex-col items-center justify-center gap-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={(formData.nutritionalInfo as any)?.[field.key] || ""}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            nutritionalInfo: {
                                                                ...(prev.nutritionalInfo || {}),
                                                                [field.key]: parseFloat(e.target.value)
                                                            }
                                                        }))}
                                                        className="w-full text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-800 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Row 4: IG & CG (No Arrows) */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 flex items-center justify-between bg-orange-50/50 border border-orange-200 rounded px-3 py-2 shadow-sm">
                                            <label className="text-[10px] font-bold text-orange-500 uppercase">IG</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.ig || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...prev.nutritionalInfo, ig: parseFloat(e.target.value) } }))}
                                                className="w-16 text-center bg-slate-50 border border-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between bg-orange-50/50 border border-orange-200 rounded px-3 py-2 shadow-sm">
                                            <label className="text-[10px] font-bold text-orange-500 uppercase">CG</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.cg || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...prev.nutritionalInfo, cg: parseFloat(e.target.value) } }))}
                                                className="w-16 text-center bg-slate-50 border border-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic text-sm">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                        <span className="text-2xl opacity-50">∅</span>
                                    </div>
                                    Zone Logistique & Stockage vide
                                </div>
                            )}
                        </div>
                    </section>
                </div>


                {/* History Section */}
                <section className="px-10 mb-12">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full bg-blue-600 transition-colors" />
                        3- Historique des Prix
                    </h3>

                    <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-blue-500/20 shadow-2xl shadow-blue-500/5 transition-all duration-300">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F8FAFC]/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-5 text-center">Date</th>
                                        <th className="px-4 py-5 text-center">Fournisseur</th>
                                        <th className="px-4 py-5 text-center">Quantité</th>
                                        <th className="px-4 py-5 text-center">PU HT (Pivot)</th>
                                        <th className="px-8 py-5 text-center">Total TTC</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(historyList.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-16 text-center text-slate-400 italic font-medium">
                                                Aucun mouvement de prix enregistré
                                            </td>
                                        </tr>
                                    ) : (
                                        historyList.map((item, idx) => (
                                            <tr key={idx} className={cn("group transition-colors hover:bg-blue-50/30", item.status === "Draft" && "opacity-60 grayscale")}>
                                                <td className="px-8 py-5 text-slate-500 font-bold text-center">
                                                    {new Date(item.date).toLocaleDateString('fr-FR')}
                                                    {item.status === "Draft" && <span className="ml-2 text-[9px] bg-slate-100 px-1 rounded">Brouillon</span>}
                                                </td>
                                                <td className="px-4 py-5 font-bold text-slate-800 text-center">
                                                    {item.supplier || "Inconnu"}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="font-black text-slate-700">{item.quantity}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-5 font-black text-blue-600 text-center">
                                                    {item.price.toFixed(2).replace('.', ',')} Dh
                                                </td>
                                                <td className="px-8 py-5 font-black text-[#D69E2E] text-center">
                                                    {(item.total || (item.price * item.quantity)).toFixed(2).replace('.', ',')} Dh
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

            </div >
        </div >
    );
}
