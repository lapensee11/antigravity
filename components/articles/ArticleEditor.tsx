import { Article, Invoice, Family, SubFamily, Tier } from "@/lib/types";
import { Save, Trash2, Pencil, Check, X, Plus, Tag, Layers, Hash, Shield } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { cn } from "@/lib/utils";
import { getFamilies, getSubFamilies, getAccountingNatures, getTiers } from "@/lib/data-service";
import { useRef } from "react";
import { GlassCard, GlassInput, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import { UnitSelector } from "@/components/ui/UnitSelector";
import { AccountingAccount } from "@/lib/types";
import { getAccountingAccounts } from "@/lib/data-service";

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

    const [families, setFamilies] = useState<Family[]>([]);
    const [subFamilies, setSubFamilies] = useState<SubFamily[]>([]);
    const [accountingNatures, setAccountingNatures] = useState<{ id: string, name: string }[]>([]);
    const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [availableVatRates, setAvailableVatRates] = usePersistedState<number[]>("article_vat_rates", [0, 7, 10, 14, 20]);
    const [isAddingVat, setIsAddingVat] = useState(false);
    const [newVatInput, setNewVatInput] = useState("");

    // Derived state for the "Compte Général" selector
    const selectedGeneralAccount = formData.accountingCode ? formData.accountingCode.substring(0, 4) : "";
    const matchingAccount = useMemo(() =>
        accountingAccounts.find(acc => acc.code === selectedGeneralAccount),
        [accountingAccounts, selectedGeneralAccount]);

    // Focus Refs
    const nameRef = useRef<HTMLInputElement>(null);
    const codeRef = useRef<HTMLInputElement>(null);
    const familyRef = useRef<HTMLSelectElement>(null);
    const subFamilyRef = useRef<HTMLSelectElement>(null);
    const unitAchatRef = useRef<HTMLSelectElement>(null);
    const contenanceRef = useRef<HTMLInputElement>(null);
    const unitPivotRef = useRef<HTMLSelectElement>(null);
    const coeffRef = useRef<HTMLInputElement>(null);
    const unitProdRef = useRef<HTMLSelectElement>(null);
    const vatRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const natureRef = useRef<HTMLSelectElement>(null);
    const accountRef = useRef<HTMLInputElement>(null);
    const saveRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const load = async () => {
            const [f, s, n, a, t] = await Promise.all([
                getFamilies(),
                getSubFamilies(),
                getAccountingNatures(),
                getAccountingAccounts(),
                getTiers()
            ]);
            setFamilies(f);
            setSubFamilies(s);
            setAccountingNatures(n);
            setAccountingAccounts(a);
            setTiers(t);
        };
        load();
    }, []);

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
        const sub = subFamilies.find(s => s.id === subId);
        if (!sub) return "NEW-00";

        // Base Prefix: Replace 'F' with 'P' in FA011 -> PA011
        const baseCode = sub.code.replace('F', 'P');

        // Count existing articles in this SubFamily
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
            // Start in edit mode only for brand new temporary articles
            const isNew = article.id.startsWith("temp_") || article.id.startsWith("new_");
            setIsEditing(isNew);

            // Sync family selector
            if (article.subFamilyId) {
                const sub = subFamilies.find(s => s.id === article.subFamilyId);
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

    // Auto-fill accounting code from SubFamily default if missing
    // This handles initial load (when subFamilies are fetched) and when opening an article without a code.
    useEffect(() => {
        if (formData.subFamilyId && !formData.accountingCode && subFamilies.length > 0) {
            const sub = subFamilies.find(s => s.id === formData.subFamilyId);
            if (sub?.accountingCode) {
                setFormData(prev => ({ ...prev, accountingCode: sub.accountingCode }));
            }
        }
    }, [formData.subFamilyId, formData.accountingCode, subFamilies]);

    const handleChange = (field: keyof Article, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (field === "subFamilyId") {
                // If SubFamily changes AND it's a new article, re-generate code
                if (prev.id?.startsWith("temp_") || prev.id === undefined) {
                    newData.code = generateNextCode(value as string);
                }

                // Auto-fill accounting code
                const sub = subFamilies.find(s => s.id === value);
                if (sub?.accountingCode) {
                    newData.accountingCode = sub.accountingCode;
                }
            }

            return newData;
        });
    };

    const handleDelete = () => {
        if (!article?.id) return;
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.name}" ? Cette action est irréversible.`)) {
            onDelete(article.id);
        }
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
            setIsAddingVat(false);
            if (article) {
                setFormData(article);
                const sub = subFamilies.find(s => s.id === article.subFamilyId);
                if (sub) setSelectedFamilyId(sub.familyId);
            }
        } else {
            setIsEditing(true);
        }
    };

    const handleAddVatRate = () => {
        const value = parseFloat(newVatInput);
        if (!isNaN(value) && !availableVatRates.includes(value)) {
            const newRates = [...availableVatRates, value].sort((a, b) => a - b);
            setAvailableVatRates(newRates);
            handleChange("vatRate", value);
        }
        setNewVatInput("");
        setIsAddingVat(false);
    };

    const handleDeleteVatRate = (rateToDelete: number) => {
        if (availableVatRates.length <= 1) return;
        const newRates = availableVatRates.filter(r => r !== rateToDelete);
        setAvailableVatRates(newRates);
        if ((formData.vatRate || 0) === rateToDelete) {
            handleChange("vatRate", newRates[0]);
        }
    };

    // Derived display values
    const family = families.find(f => f.id === (selectedFamilyId || (formData.subFamilyId ? subFamilies.find(s => s.id === formData.subFamilyId)?.familyId : "")));
    const subFamily = subFamilies.find(s => s.id === formData.subFamilyId);

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
    const typeName = family ? families.find(f => f.id === family.id)?.typeId === "1" ? "ACHAT" : "FONCT." : "";

    // Filtered SubFamilies based on selected Family
    const filteredSubFamilies = useMemo(() => {
        if (!selectedFamilyId) return [];
        return subFamilies.filter(s => s.familyId === selectedFamilyId);
    }, [selectedFamilyId, subFamilies]);

    // Computed History from Invoices
    const historyList = useMemo(() => {
        if (!article) return [];
        const lines: any[] = [];
        invoices.forEach(inv => {
            inv.lines.forEach(line => {
                if (line.articleId === article.id || (line.articleName === article.name && !line.articleId)) {
                    const supplier = tiers.find(t => t.id === inv.supplierId || t.code === inv.supplierId);

                    // Prix Pivot Calculation
                    let prixPivot = line.priceHT;
                    if (line.unit === article.unitAchat && article.contenace > 0) {
                        prixPivot = line.priceHT / article.contenace;
                    }

                    lines.push({
                        date: inv.date,
                        supplier: supplier ? supplier.name : (inv.supplierId || "Inconnu"),
                        quantity: line.quantity,
                        unit: line.unit,
                        price: line.priceHT,
                        prixPivot: prixPivot,
                        total: line.totalTTC,
                        status: inv.status
                    });
                }
            });
        });
        return lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [article, invoices, tiers]);

    const isNewArticle = formData.id?.startsWith("temp_") || formData.id?.startsWith("new_");

    const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
        // Stop global navigation (Sidebar) when typing/selecting in fields
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            switch (field) {
                case "code": nameRef.current?.focus(); break;
                case "name": familyRef.current?.focus(); break;
                case "family": subFamilyRef.current?.focus(); break;
                case "subFamily": unitAchatRef.current?.focus(); break;
                case "unitAchat": contenanceRef.current?.focus(); break;
                case "contenance": unitPivotRef.current?.focus(); break;
                case "unitPivot": coeffRef.current?.focus(); break;
                case "coeffProd": unitProdRef.current?.focus(); break;
                case "unitProduction":
                    // Focus first VAT button
                    vatRefs.current[0]?.focus();
                    break;
                case "vat": natureRef.current?.focus(); break;
                case "nature": accountRef.current?.focus(); break;
                case "account": saveRef.current?.focus(); break;
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-white/30 backdrop-blur-md overflow-hidden">

            {/* CONTENT CONTAINER - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* HEADER */}
                <div className="px-10 pt-10 pb-8 mb-4 flex justify-between items-start gap-6">

                    {/* LEFT SIDE WRAPPER */}
                    <div className="flex-1 min-w-0">
                        {/* Tags Row */}
                        <div className="flex items-center gap-3 mb-4">
                            {isEditing ? (
                                <GlassInput
                                    ref={codeRef}
                                    value={formData.code || ""}
                                    onChange={(e) => handleChange("code", e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, "code")}
                                    className="text-sm font-bold text-[#C19A6B] w-24 uppercase h-8"
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
                            <div className="w-16 h-16 bg-[#F8FAFC] rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-sm border border-slate-200 mt-1 relative overflow-hidden group/icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D69E2E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 16 8" /><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" /><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" /><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" /></svg>
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[4rem]">
                                {/* Title */}
                                {isEditing ? (
                                    <GlassInput
                                        ref={nameRef}
                                        value={formData.name || ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, "name")}
                                        className="text-2xl font-bold text-slate-900 border-none bg-white/50"
                                        placeholder="Nom de l'article"
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-serif font-bold text-slate-900 leading-tight truncate py-1 flex items-center gap-3">
                                        {displayName}
                                    </h1>
                                )}

                                {/* Sub Info */}
                                {isEditing ? (
                                    <div className="flex gap-2 mt-2">
                                        <select
                                            ref={familyRef}
                                            value={selectedFamilyId}
                                            onChange={(e) => {
                                                setSelectedFamilyId(e.target.value);
                                                handleChange("subFamilyId", ""); // Reset sub on family change
                                            }}
                                            onKeyDown={(e) => handleKeyDown(e, "family")}
                                            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="">Sélectionner Famille</option>
                                            {families.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>

                                        <select
                                            ref={subFamilyRef}
                                            value={formData.subFamilyId || ""}
                                            onChange={(e) => handleChange("subFamilyId", e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, "subFamily")}
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
                    <div className="flex flex-col items-end gap-3 min-w-[220px] shrink-0">
                        {/* Price Card */}
                        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl p-4 w-full text-center">
                            <div className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mb-1">Dernier Cours</div>
                            <div className="text-2xl font-bold text-slate-800">
                                {displayPrice.toFixed(2).replace('.', ',')} <span className="text-sm font-normal text-slate-400">Dh / {formData.unitPivot}</span>
                            </div>
                        </div>

                        {/* Buttons Control */}
                        <div className="flex gap-2 w-full mt-2">
                            {isEditing ? (
                                <GlassButton
                                    ref={saveRef}
                                    variant="secondary"
                                    onClick={handleSave}
                                    className="flex-1 bg-white border border-green-200 text-green-600 hover:bg-green-50 shadow-sm font-bold uppercase tracking-wider text-[10px]"
                                >
                                    <Save className="w-4 h-4 mr-2" /> Enregistrer
                                </GlassButton>
                            ) : (
                                <GlassButton
                                    variant="secondary"
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 shadow-sm font-bold uppercase tracking-wider text-[10px]"
                                >
                                    <Pencil className="w-4 h-4 mr-2" /> Modifier
                                </GlassButton>
                            )}

                            <button
                                onClick={handleDelete}
                                className="w-10 h-10 bg-white border border-red-200 text-red-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/5 hover:bg-red-50 hover:shadow-red-500/10 active:scale-95 transition-all"
                                title="Supprimer"
                            >
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Units & Conversion Section */}
                <section className="px-10 mb-12">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full bg-[#1E293B] transition-colors" />
                        Unités & Conversions
                    </h3>

                    {/* 5-Column Flex Layout - Unified Rounded Container */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
                        <div className="flex items-center gap-4">

                            {/* 1. Unité Achat */}
                            <UnitSelector
                                ref={unitAchatRef}
                                label="Unité Achat"
                                type="achat"
                                variant="article"
                                value={formData.unitAchat || ""}
                                onChange={(val) => handleChange("unitAchat", val)}
                                onKeyDown={(e) => handleKeyDown(e, "unitAchat")}
                                className="flex-1 min-w-[140px]"
                            />

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 2. Contenance */}
                            <div className="w-32 flex flex-col">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Contenance</label>
                                <input
                                    ref={contenanceRef}
                                    type="number"
                                    value={formData.contenace || ""}
                                    onChange={(e) => handleChange("contenace", parseFloat(e.target.value))}
                                    onKeyDown={(e) => handleKeyDown(e, "contenance")}
                                    className="w-full text-sm font-bold text-slate-800 text-center outline-none bg-transparent border-none focus:ring-0 transition-all p-1"
                                />
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 3. Unité Pivot */}
                            <UnitSelector
                                ref={unitPivotRef}
                                label="Unité Pivot (Stock)"
                                type="pivot"
                                variant="article"
                                value={formData.unitPivot || ""}
                                onChange={(val) => handleChange("unitPivot", val)}
                                onKeyDown={(e) => handleKeyDown(e, "unitPivot")}
                                className="flex-1 min-w-[120px]"
                                isBlue
                            />

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 4. Coeff */}
                            <div className="w-32 flex flex-col">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-center">Coeff</label>
                                <input
                                    ref={coeffRef}
                                    type="number"
                                    value={formData.coeffProd || ""}
                                    onChange={(e) => handleChange("coeffProd", parseFloat(e.target.value))}
                                    onKeyDown={(e) => handleKeyDown(e, "coeffProd")}
                                    className="w-full text-sm font-bold text-green-600 text-center outline-none bg-transparent border-none focus:ring-0 transition-all p-1"
                                />
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-slate-100" />

                            {/* 5. Unité Production */}
                            <UnitSelector
                                ref={unitProdRef}
                                label="Unité Production"
                                type="production"
                                variant="article"
                                value={formData.unitProduction || ""}
                                onChange={(val) => handleChange("unitProduction", val)}
                                onKeyDown={(e) => handleKeyDown(e, "unitProduction")}
                                className="flex-1 min-w-[120px]"
                            />

                        </div>
                    </div>
                </section>

                {/* Additional Info Blocks (Side by Side) */}
                <div className="grid grid-cols-2 gap-12 px-10 mb-12">
                    {/* Block 1: Comptabilité */}
                    <section className="flex flex-col h-full">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-[#1E293B] transition-colors" />
                            Comptabilité
                        </h3>
                        <div className="bg-[#F8FAFC] rounded-2xl px-8 py-5 border border-blue-500/20 shadow-2xl shadow-blue-500/5 transition-all duration-300 flex-1 space-y-5">
                            {/* VAT Rate - Radio Buttons */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taux de TVA (%)</label>
                                <div className="flex flex-wrap gap-2.5 w-full">
                                    {availableVatRates.map((rate, idx) => (
                                        <div key={rate} className="relative group/vat flex-1 min-w-[70px]">
                                            <button
                                                ref={el => { vatRefs.current[idx] = el; }}
                                                onClick={() => handleChange("vatRate", rate)}
                                                onKeyDown={(e) => handleKeyDown(e, "vat")}
                                                className={cn(
                                                    "w-full px-2 py-2.5 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                                    (formData.vatRate || 0) === rate
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                                )}
                                            >
                                                {rate}%
                                            </button>
                                            {isEditing && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteVatRate(rate); }}
                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/vat:opacity-100 transition-opacity hover:bg-red-600 shadow-sm border border-white z-10"
                                                    title="Supprimer ce taux"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Discrete ADD VAT UI */}
                                    {isEditing && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            {isAddingVat ? (
                                                <div className="flex items-center bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <input
                                                        autoFocus
                                                        type="number"
                                                        value={newVatInput}
                                                        onChange={(e) => setNewVatInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleAddVatRate();
                                                            if (e.key === "Escape") setIsAddingVat(false);
                                                        }}
                                                        placeholder="%"
                                                        className="w-12 px-2 py-2 text-xs font-bold text-blue-600 outline-none placeholder:text-blue-200 placeholder:font-normal"
                                                    />
                                                    <button
                                                        onClick={handleAddVatRate}
                                                        className="px-2 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border-l border-blue-100"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsAddingVat(true)}
                                                    className="w-10 h-10 rounded-lg border border-dashed border-slate-200 text-slate-300 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center"
                                                    title="Ajouter un taux"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px w-full bg-blue-200" />

                            {/* Accounting Info Row */}
                            <div className="grid grid-cols-1 gap-5">
                                {/* Compte Général (Selector) */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-serif italic text-slate-500">Compte Général</label>
                                    <select
                                        value={selectedGeneralAccount}
                                        onChange={(e) => {
                                            const code = e.target.value;
                                            // Auto-fill 6-digit code: "6121" -> "612100"
                                            if (code) {
                                                handleChange("accountingCode", code + "00");
                                            } else {
                                                handleChange("accountingCode", "");
                                            }
                                        }}
                                        className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {accountingAccounts.map(acc => (
                                            <option key={acc.id} value={acc.code}>
                                                {acc.code} - {acc.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Accounting Grid: Type - Classe - Code - Analytique */}
                                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-blue-200">
                                    {/* Type */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Tag className="w-3 h-3 text-blue-400" /> Type
                                        </label>
                                        <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-black text-slate-700 shadow-sm min-h-[36px] flex items-center">
                                            {matchingAccount?.type || "—"}
                                        </div>
                                    </div>

                                    {/* Classe */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Layers className="w-3 h-3 text-blue-400" /> Classe
                                        </label>
                                        <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-black text-slate-700 shadow-sm min-h-[36px] flex items-center">
                                            {matchingAccount?.class ? `Classe ${matchingAccount.class}` : "—"}
                                        </div>
                                    </div>

                                    {/* Code Comptable */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Hash className="w-3 h-3 text-blue-400" /> Code Comptable
                                        </label>
                                        <div className="bg-white border border-slate-100 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-700 shadow-sm min-h-[36px] flex items-center tracking-tighter">
                                            {selectedGeneralAccount || "—"}
                                        </div>
                                    </div>

                                    {/* Code Analytique */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Shield className="w-3 h-3 text-blue-600" /> Analytiques
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.accountingCode || ""}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                                handleChange("accountingCode", val);
                                            }}
                                            ref={accountRef}
                                            onKeyDown={(e) => handleKeyDown(e, "account")}
                                            placeholder="ex: 612100"
                                            className="w-full bg-white border border-slate-200 text-xs font-mono font-black text-blue-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm tracking-tighter"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col h-full">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-[#1E293B] transition-colors" />
                            {formData.accountingCode?.startsWith("6121") ? "Valeurs Nutritionnelles pour 100g" : "Logistique & Stockage"}
                        </h3>
                        <div className="bg-[#F8FAFC] rounded-2xl px-6 py-4 border border-blue-500/20 shadow-2xl shadow-blue-500/5 transition-all duration-300 flex-1 flex flex-col min-h-[300px]">
                            {formData.accountingCode?.startsWith("6121") ? (
                                <div className="space-y-3">
                                    {/* Row 1: Energy & Water */}
                                    <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <div className="flex-1 flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase truncate mr-2">Énergie (Kcal)</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.calories || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...(prev.nutritionalInfo || {}), calories: parseFloat(e.target.value) } }))}
                                                className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div className="w-px h-6 bg-slate-100" />
                                        <div className="flex-1 flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase truncate mr-2">Eau (%)</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.water || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...(prev.nutritionalInfo || {}), water: parseFloat(e.target.value) } }))}
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
                                                    onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...(prev.nutritionalInfo || {}), carbs: parseFloat(e.target.value) } }))}
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
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...(prev.nutritionalInfo || {}), ig: parseFloat(e.target.value) } }))}
                                                className="w-16 text-center bg-slate-50 border border-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between bg-orange-50/50 border border-orange-200 rounded px-3 py-2 shadow-sm">
                                            <label className="text-[10px] font-bold text-orange-500 uppercase">CG</label>
                                            <input
                                                type="number"
                                                value={(formData.nutritionalInfo as any)?.cg || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: { ...(prev.nutritionalInfo || {}), cg: parseFloat(e.target.value) } }))}
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
                        <div className="w-1.5 h-6 rounded-full bg-[#1E293B] transition-colors" />
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
                                        <th className="px-4 py-5 text-center">PU HT</th>
                                        <th className="px-4 py-5 text-center">Prix Pivot</th>
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
                                                    {item.supplier}
                                                </td>
                                                <td className="px-4 py-5 text-center">
                                                    <span className="font-black text-slate-700">{item.quantity}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-5 font-black text-slate-600 text-center">
                                                    {item.price.toFixed(2).replace('.', ',')} Dh
                                                </td>
                                                <td className="px-4 py-5 font-black text-blue-600 text-center">
                                                    {item.prixPivot.toFixed(2).replace('.', ',')} <span className="text-[10px]">/{article?.unitPivot || ""}</span>
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
