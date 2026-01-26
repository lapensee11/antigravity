import { Article } from "@/lib/types";
import { initialFamilies, initialSubFamilies } from "@/lib/data";
import { Save, Trash2, Pencil, Check, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface ArticleEditorProps {
    article?: Article | null;
    existingArticles?: Article[];
    onSave: (article: Article) => void;
    onDelete: (id: string) => void;
    forceEditTrigger?: number; // New prop to trigger edit from parent
}

export function ArticleEditor({ article, existingArticles = [], onSave, onDelete, forceEditTrigger }: ArticleEditorProps) {
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

    const handleChange = (field: keyof Article, value: string | number | boolean) => {
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
                                    <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight truncate py-1">
                                        {displayName}
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
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md border border-blue-100"
                                    >
                                        <Check className="w-4 h-4" /> Enregistrer
                                    </button>
                                    <button
                                        onClick={toggleEdit}
                                        className="w-10 h-10 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors shadow-md"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={toggleEdit}
                                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-blue-100 shadow-md"
                                    >
                                        <Pencil className="w-3.5 h-3.5" /> Modifier
                                    </button>
                                    <button
                                        onClick={() => article?.id && onDelete(article.id)}
                                        className="w-10 h-10 bg-pink-50 hover:bg-pink-100 text-pink-500 rounded-xl flex items-center justify-center transition-colors shadow-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                </div>

                {/* Units & Conversion (Full Bleed) */}
                <section className="mb-8">
                    <h3 className="px-10 text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Unités</h3>

                    <div className="bg-[#F8FAFC] border-y border-slate-100">
                        {/* 5-Column Flex Layout for linear flow */}
                        <div className="flex items-stretch divide-x divide-slate-200">

                            {/* 1. Unité Achat */}
                            <div className="flex-1 p-4 min-w-[140px] flex flex-col items-center justify-center">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-center">Unité Achat</label>
                                <select
                                    disabled={!isEditing}
                                    value={formData.unitAchat || ""}
                                    onChange={(e) => handleChange("unitAchat", e.target.value)}
                                    style={{ textAlignLast: 'center' }}
                                    className={cn(
                                        "w-full p-2 text-sm font-bold text-slate-800 outline-none rounded-lg transition-all appearance-none cursor-pointer text-center",
                                        isEditing ? "bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : "bg-transparent border-transparent"
                                    )}
                                >
                                    <option value="">Sélectionner...</option>
                                    {["Kg", "Litre", "Unité", "Quintal", "Sac", "Carton", "Bidon"].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Contenance */}
                            <div className="w-28 p-4 bg-white/50 flex flex-col items-center justify-center">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-center">Contenance</label>
                                <input
                                    type="number"
                                    disabled={!isEditing}
                                    value={formData.contenace}
                                    onChange={(e) => handleChange("contenace", parseFloat(e.target.value))}
                                    className={cn(
                                        "w-full p-2 text-sm font-bold text-slate-800 text-center outline-none rounded-lg transition-all",
                                        isEditing ? "bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : "bg-transparent border-transparent"
                                    )}
                                />
                            </div>

                            {/* 3. Unité Pivot */}
                            <div className="flex-1 p-4 bg-blue-50/20 min-w-[120px] flex flex-col items-center justify-center">
                                <label className="block text-[10px] font-bold text-blue-400 uppercase mb-1.5 text-center">Unité Pivot (Stock)</label>
                                <select
                                    disabled={!isEditing}
                                    value={formData.unitPivot || ""}
                                    onChange={(e) => handleChange("unitPivot", e.target.value)}
                                    style={{ textAlignLast: 'center' }}
                                    className={cn(
                                        "w-full p-2 text-sm font-bold text-blue-700 text-center outline-none rounded-lg transition-all appearance-none cursor-pointer",
                                        isEditing ? "bg-white border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : "bg-transparent border-transparent"
                                    )}
                                >
                                    <option value="">Sélectionner...</option>
                                    {["Kg", "Litre", "Unité"].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 4. Coeff */}
                            <div className="w-28 p-4 bg-white/50 flex flex-col items-center justify-center">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-center">Coeff</label>
                                <input
                                    type="number"
                                    disabled={!isEditing}
                                    value={formData.coeffProd}
                                    onChange={(e) => handleChange("coeffProd", parseFloat(e.target.value))}
                                    className={cn(
                                        "w-full p-2 text-sm font-bold text-green-600 text-center outline-none rounded-lg transition-all",
                                        isEditing ? "bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : "bg-transparent border-transparent"
                                    )}
                                />
                            </div>

                            {/* 5. Unité Production */}
                            <div className="flex-1 p-4 min-w-[120px] flex flex-col items-center justify-center">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 text-center">Unité Production</label>
                                <select
                                    disabled={!isEditing}
                                    value={formData.unitProduction || ""}
                                    onChange={(e) => handleChange("unitProduction", e.target.value)}
                                    style={{ textAlignLast: 'center' }}
                                    className={cn(
                                        "w-full p-2 text-sm font-bold text-slate-800 text-center outline-none rounded-lg transition-all appearance-none cursor-pointer",
                                        isEditing ? "bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" : "bg-transparent border-transparent"
                                    )}
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

                {/* History Table (Full Bleed) */}
                <section className="mb-12 mt-12">
                    <div className="px-10 mb-6 border-b border-white pb-0">
                        <h3 className="text-xl font-serif font-bold text-[#1e293b]">Historique</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-2">
                            {formData.priceHistory?.length || 0} Opérations
                        </p>
                    </div>

                    <div className="border-y border-slate-100 shadow-sm">
                        <table className="w-full text-sm text-center">
                            <thead className="bg-[#F8FAFC]/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-5 text-center">Date</th>
                                    <th className="px-4 py-5 text-center">Fournisseur</th>
                                    <th className="px-4 py-5 text-center">Quantité</th>
                                    <th className="px-4 py-5 text-center">PU HT (Pivot)</th>
                                    <th className="px-8 py-5 text-center">Total TTC</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {(!formData.priceHistory || formData.priceHistory.length === 0) ? (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-12 text-center text-slate-400 italic">
                                            Aucune transaction enregistrée
                                        </td>
                                    </tr>
                                ) : (
                                    formData.priceHistory.map((item, idx) => (
                                        <tr key={idx} className="group transition-colors even:bg-slate-50/50 hover:bg-blue-50/30">
                                            <td className="px-8 py-5 text-slate-500 font-medium text-center">
                                                {new Date(item.date).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-4 py-5 font-bold text-slate-800 text-center">
                                                {/* Mock Supplier */}
                                                Grands Moulins du Maghreb
                                            </td>
                                            <td className="px-4 py-5 text-center">
                                                <span className="font-bold text-slate-700">40</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{formData.unitAchat || "UNIT"}</span>
                                            </td>
                                            <td className="px-4 py-5 font-bold text-slate-600 text-center">
                                                {item.price.toFixed(2).replace('.', ',')} Dh
                                            </td>
                                            <td className="px-8 py-5 font-bold text-[#D69E2E] text-center">
                                                {/* Mock Total calculation */}
                                                {(item.price * 1000 * 1.2).toFixed(2).replace('.', ',')} Dh
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
