"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { Article, Invoice } from "@/lib/types";
import { initialFamilies, initialSubFamilies } from "@/lib/data";
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Plus, X, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { getArticles, saveArticle, deleteArticle, getInvoices, getFamilies, getSubFamilies, saveSubFamily } from "@/lib/data-service";
import { GlassCard, GlassInput, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import { Database, Trash2 } from "lucide-react";

interface ArticlesContentProps {
    initialArticles: Article[];
}

export function ArticlesContent({ initialArticles }: ArticlesContentProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const [families, setFamilies] = useState(initialFamilies);
    const [subFamilies, setSubFamilies] = useState(initialSubFamilies);

    // --- RUNTIME LOAD ---
    useEffect(() => {
        const loadData = async () => {
            const [liveArticles, liveInvoices, liveFamilies, liveSubFamilies] = await Promise.all([
                getArticles(),
                getInvoices(),
                getFamilies(),
                getSubFamilies()
            ]);
            setArticles(liveArticles || []);
            setInvoices(liveInvoices || []);
            if (liveFamilies?.length) setFamilies(liveFamilies);
            if (liveSubFamilies?.length) setSubFamilies(liveSubFamilies);
        };
        loadData();
    }, []);

    const handleSave = async (article: Article) => {
        let finalArticle = { ...article };

        // If it's a temporary ID, give it a real one before saving
        if (article.id.startsWith("temp_")) {
            finalArticle.id = `ART-${Date.now()}`;
        }

        const res = await saveArticle(finalArticle);
        if (res.success) {
            const exists = articles.some(a => a.id === article.id);
            if (exists) {
                // If ID changed, we need to handle that in the state
                setArticles(prev => prev.map(a => a.id === article.id ? finalArticle : a));
            } else {
                setArticles(prev => [...prev, finalArticle]);
            }
            setSelectedArticle(finalArticle);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await deleteArticle(id);
        if (res.success) {
            setArticles(prev => prev.filter(a => a.id !== id));
            setSelectedArticle(null);
        }
    };

    const handleReconcile = async () => {
        if (!confirm("Voulez-vous synchroniser tous les articles avec la structure actuelle ?\n\nCela corrigera les familles et sous-familles en fonction des codes d'articles.")) return;

        const [liveArticles, liveSubFamilies] = await Promise.all([
            getArticles(),
            getSubFamilies()
        ]);

        let correctedCount = 0;
        for (const art of liveArticles) {
            // Re-detect sub-family from code if mismatch or missing
            const codePrefix = art.code.split('-')[0].replace('P', 'F'); // PA086 -> FA086
            const matchingSub = liveSubFamilies.find(s => s.code === codePrefix);

            if (matchingSub && art.subFamilyId !== matchingSub.id) {
                await saveArticle({ ...art, subFamilyId: matchingSub.id });
                correctedCount++;
            }
        }

        if (correctedCount > 0) {
            alert(`${correctedCount} articles ont été ré-attribués à la bonne famille.`);
            window.location.reload();
        } else {
            alert("Tous les articles sont déjà parfaitement alignés avec la structure.");
        }
    };

    const handleCreateNew = () => {
        const randomCode = `ART-${Math.floor(1000 + Math.random() * 9000)}`;
        setSelectedArticle({
            id: `temp_${Date.now()}`,
            name: "",
            code: randomCode,
            subFamilyId: subFamilies[0]?.id || "",
            unitAchat: "",
            unitPivot: "",
            unitProduction: "",
            contenace: 0,
            coeffProd: 0,
            lastPivotPrice: 0,
            vatRate: 20
        });
    };

    const [selectedType, setSelectedType] = useState<"TOUS" | "1" | "2">("TOUS");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubFamilyId, setSelectedSubFamilyId] = useState<string | null>(null);

    const availableFamilies = useMemo(() => {
        let filtered = families;
        if (selectedType !== "TOUS") {
            filtered = families.filter(f => f.typeId === selectedType);
        } else {
            filtered = families.filter(f => f.typeId === "1" || f.typeId === "2");
        }
        return filtered.sort((a, b) => a.code.localeCompare(b.code));
    }, [selectedType, families]);

    const availableSubFamilies = useMemo(() => {
        const familyIds = new Set(availableFamilies.map(f => f.id));
        return subFamilies.filter(s => familyIds.has(s.familyId));
    }, [availableFamilies, subFamilies]);

    const [isFamilyOpen, setIsFamilyOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFamilyOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getSelectionLabel = () => {
        if (!selectedSubFamilyId) return "Toutes Familles";
        const sub = subFamilies.find(s => s.id === selectedSubFamilyId);
        if (sub) return sub.name;
        return "Toutes Familles";
    }

    const filteredArticles = useMemo(() => {
        let filtered = articles;
        if (selectedType !== "TOUS") {
            const typeFamilies = new Set(families.filter(f => f.typeId === selectedType).map(f => f.id));
            const typeSubs = new Set(subFamilies.filter(s => typeFamilies.has(s.familyId)).map(s => s.id));
            filtered = filtered.filter(a => typeSubs.has(a.subFamilyId));
        } else {
            const validFamilies = new Set(families.filter(f => f.typeId === "1" || f.typeId === "2").map(f => f.id));
            const validSubs = new Set(subFamilies.filter(s => validFamilies.has(s.familyId)).map(s => s.id));
            filtered = filtered.filter(a => validSubs.has(a.subFamilyId));
        }
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(lower) ||
                a.code.toLowerCase().includes(lower)
            );
        }
        if (selectedSubFamilyId) {
            filtered = filtered.filter(a => a.subFamilyId === selectedSubFamilyId);
        }
        return filtered.sort((a, b) => a.code.localeCompare(b.code));
    }, [articles, selectedType, searchQuery, selectedSubFamilyId]);

    useEffect(() => {
        if (!selectedArticle && filteredArticles.length > 0) {
            setSelectedArticle(filteredArticles[0]);
        }
    }, [filteredArticles, selectedArticle]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if another component already handled this event
            if (e.defaultPrevented) return;

            // Ignorer si focus dans un input, textarea, select ou bouton (ou contentEditable)
            const active = document.activeElement;
            const isInputActive =
                ["INPUT", "TEXTAREA", "SELECT"].includes(active?.tagName || "") ||
                (active?.tagName === "BUTTON" && !active?.classList.contains("sidebar-item")) ||
                active?.getAttribute("contenteditable") === "true" ||
                active?.getAttribute("data-is-input") === "true";

            if (isInputActive) return;
            if (e.key === "Enter") {
                e.preventDefault();
                // We no longer trigger edit mode as it's always active
                return;
            }
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            } else {
                return;
            }
            const typeSteps: ("TOUS" | "1" | "2")[] = ["TOUS", "1", "2"];
            const currentTypeIndex = typeSteps.indexOf(selectedType);
            if (e.key === "ArrowRight") {
                const nextIndex = Math.min(currentTypeIndex + 1, typeSteps.length - 1);
                if (nextIndex !== currentTypeIndex) {
                    setSelectedType(typeSteps[nextIndex]);
                    setSelectedSubFamilyId(null);
                }
            } else if (e.key === "ArrowLeft") {
                const prevIndex = Math.max(currentTypeIndex - 1, 0);
                if (prevIndex !== currentTypeIndex) {
                    setSelectedType(typeSteps[prevIndex]);
                    setSelectedSubFamilyId(null);
                }
            }
            else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                if (filteredArticles.length === 0) return;
                const currentIndex = selectedArticle
                    ? filteredArticles.findIndex(a => a.id === selectedArticle.id)
                    : -1;
                let nextIndex = currentIndex;
                if (e.key === "ArrowDown") {
                    nextIndex = currentIndex < filteredArticles.length - 1 ? currentIndex + 1 : currentIndex;
                    if (currentIndex === -1) nextIndex = 0;
                } else if (e.key === "ArrowUp") {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                }
                if (nextIndex >= 0 && nextIndex < filteredArticles.length && nextIndex !== currentIndex) {
                    setSelectedArticle(filteredArticles[nextIndex]);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedType, selectedArticle, filteredArticles]);

    // --- AUTO-SCROLL SIDEBAR ---
    const sidebarListRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selectedArticle && sidebarListRef.current) {
            const index = filteredArticles.findIndex(a => a.id === selectedArticle.id);
            if (index >= 0) {
                const el = sidebarListRef.current.children[index] as HTMLElement;
                el?.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedArticle, filteredArticles]);

    return (
        <div className="flex h-screen bg-[#F6F8FC] overflow-hidden">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex bg-white/30 backdrop-blur-md">
                <div className="w-[340px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC]">
                    <div className="p-5 pb-2 flex flex-col gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 font-outfit tracking-tight">Articles</h2>
                            <p className="text-slate-400 text-sm font-light">Catalogue & Prix</p>
                        </div>
                        <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                            {["TOUS", "ACHATS", "FONCT."].map((label) => {
                                const mapType = { "TOUS": "TOUS", "ACHATS": "1", "FONCT.": "2" };
                                const typeValue = mapType[label as keyof typeof mapType] as any;
                                const isActive = selectedType === typeValue;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setSelectedType(typeValue);
                                            setSelectedSubFamilyId(null);
                                        }}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden mb-[1px]",
                                            isActive
                                                ? "bg-blue-100 text-blue-700"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {label}
                                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                                <GlassInput
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 py-2"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    onClick={handleReconcile}
                                    className="w-10 h-10 bg-blue-50 text-blue-500 border border-blue-100 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                    title="Réconcilier avec la Structure"
                                >
                                    <Layers className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={async () => {
                                        const validFamilies = new Set(initialFamilies.filter(f => f.typeId === "1" || f.typeId === "2").map(f => f.id));
                                        const validSubs = new Set(initialSubFamilies.filter(s => validFamilies.has(s.familyId)).map(s => s.id));

                                        const toDelete = articles.filter(a =>
                                            a.id === 'a1' ||
                                            a.id === 'a2' ||
                                            !validSubs.has(a.subFamilyId)
                                        );

                                        if (toDelete.length === 0) {
                                            alert("Aucun ancien article à purger.");
                                            return;
                                        }

                                        if (confirm(`Purger ${toDelete.length} articles anciens (Production, Vente et Démos) ?\n\nCela ne gardera que vos nouveaux imports.`)) {
                                            let count = 0;
                                            for (const art of toDelete) {
                                                await deleteArticle(art.id);
                                                count++;
                                            }
                                            alert(`${count} articles purgés avec succès.`);
                                            window.location.reload();
                                        }
                                    }}
                                    title="Purger les anciens articles"
                                    className="w-10 h-10 bg-red-50 text-red-500 border border-red-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleCreateNew}
                                    className="w-10 h-10 bg-white border border-blue-200 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                                    title="Ajouter un article"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            <button
                                onClick={async () => {
                                    const testData = [
                                        // Batch 11 (Fournitures Diverses)
                                        // FA086 - Fournitures Diverses
                                        { name: "Papier Cuisson", code: "PA086-01", unitAchat: "Boite", contenace: 100, unitPivot: "Feuilles", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Tourtière Diam 28", code: "PA086-02", unitAchat: "Carton", contenace: 100, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Tulipes MM", code: "PA086-03", unitAchat: "Carton", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Caissettes Fondant", code: "PA086-04", unitAchat: "Carton", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Caissettes N° 60*25", code: "PA086-05", unitAchat: "Carton", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Caissettes N° 3", code: "PA086-06", unitAchat: "Carton", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Feuille Polypro 15*12", code: "PA086-07", unitAchat: "Paquet", contenace: 100, unitPivot: "Feuilles", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Poches Jetables", code: "PA086-08", unitAchat: "Paquet", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Papier Aluminium", code: "PA086-11", unitAchat: "Rouleau", contenace: 1, unitPivot: "Mètres", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Ficelle Bordeaux", code: "PA086-21", unitAchat: "Bobine", contenace: 1, unitPivot: "Mètres", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Scotch", code: "PA086-22", unitAchat: "Rouleau", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Gants Jetables", code: "PA086-23", unitAchat: "Boite", contenace: 100, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Cuillères", code: "PA086-24", unitAchat: "Paquet", contenace: 100, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Rouleau caisse", code: "PA086-25", unitAchat: "Rouleau", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Bougies 1 an", code: "PA086-31", unitAchat: "Boite", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Bougies 10 ans", code: "PA086-32", unitAchat: "Boite", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Support de Bougies", code: "PA086-33", unitAchat: "Boite", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Fèves", code: "PA086-34", unitAchat: "Paquet", contenace: 100, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Couronnes", code: "PA086-35", unitAchat: "Paquet", contenace: 100, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" },
                                        { name: "Sujets Noel", code: "PA086-36", unitAchat: "Boite", contenace: 1, unitPivot: "Unités", vatRate: 20, accountingNature: "6123", subFamilyId: "FA086" }
                                    ];

                                    if (confirm(`Importer / Fusionner ${testData.length} articles ?`)) {
                                        const [existingArticles, liveSubFamilies] = await Promise.all([
                                            getArticles(),
                                            getSubFamilies()
                                        ]);

                                        for (const item of testData) {
                                            const existing = existingArticles.find(a => a.code === item.code);

                                            // Resolve real subFamilyId from Code (Smarter Import)
                                            const codePrefix = item.code.split('-')[0].replace('P', 'F');
                                            const matchingSub = liveSubFamilies.find(s => s.code === codePrefix || s.id === item.subFamilyId);

                                            const art: Article = {
                                                id: existing?.id || `ART-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                                ...item,
                                                subFamilyId: matchingSub?.id || item.subFamilyId,
                                                unitProduction: item.unitPivot,
                                                coeffProd: 1,
                                                lastPivotPrice: existing?.lastPivotPrice || 0,
                                            };
                                            await saveArticle(art);
                                        }
                                        window.location.reload();
                                    }
                                }}
                                className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center shrink-0 hover:bg-slate-50 transition-all"
                                title="Essai Test Import"
                            >
                                <Database className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative z-20" ref={dropdownRef}>
                            <button
                                onClick={() => setIsFamilyOpen(!isFamilyOpen)}
                                className={cn(
                                    "w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium transition-all shadow-sm group",
                                    isFamilyOpen ? "ring-2 ring-blue-100 border-blue-400" : "hover:border-slate-300"
                                )}
                            >
                                <span className={selectedSubFamilyId ? "text-slate-800 truncate" : "text-slate-500"}>
                                    {selectedSubFamilyId ? getSelectionLabel() : "Toutes Familles"}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            </button>
                            {isFamilyOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200 z-50">
                                    <button
                                        onClick={() => {
                                            setSelectedSubFamilyId(null);
                                            setIsFamilyOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 font-medium flex items-center justify-between transition-colors border-b border-slate-50",
                                            !selectedSubFamilyId
                                                ? "bg-blue-500 text-white"
                                                : "text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <span>Toutes Familles</span>
                                        {!selectedSubFamilyId && <Check className="w-4 h-4" />}
                                    </button>
                                    <div className="py-2">
                                        {availableFamilies.map(fam => {
                                            const subs = availableSubFamilies.filter(s => s.familyId === fam.id);
                                            if (subs.length === 0) return null;
                                            return (
                                                <div key={fam.id}>
                                                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 mt-1 first:mt-0">
                                                        {fam.code} - {fam.name}
                                                    </div>
                                                    {subs.map(sub => (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => {
                                                                setSelectedSubFamilyId(sub.id);
                                                                setIsFamilyOpen(false);
                                                            }}
                                                            className="w-full text-left pl-6 pr-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-between group"
                                                        >
                                                            <span className="font-medium truncate max-w-[180px]">{sub.name}</span>
                                                            <span className={cn(
                                                                "text-[9px] px-1 py-0.5 rounded font-mono font-bold transition-all",
                                                                selectedSubFamilyId === sub.id
                                                                    ? "bg-blue-100 text-blue-600"
                                                                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                                                            )}>
                                                                {sub.code}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        ref={sidebarListRef}
                        className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200"
                    >
                        {filteredArticles.map(article => {
                            const sub = initialSubFamilies.find(s => s.id === article.subFamilyId);
                            const family = sub ? initialFamilies.find(f => f.id === sub.familyId) : null;
                            const typePrefix = family ? family.code.substring(0, 2) : "XX";
                            const isSelected = selectedArticle?.id === article.id;
                            return (
                                <div
                                    key={article.id}
                                    onClick={() => setSelectedArticle(article)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 border-b border-slate-100/50 transition-all cursor-pointer group relative hover:bg-white/40",
                                        isSelected
                                            ? "bg-white/80 pl-7 shadow-sm z-10"
                                            : "bg-transparent pl-5"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute left-0 top-0 bottom-0 w-[4px] transition-all duration-300",
                                        isSelected ? "bg-blue-600 h-full" : "bg-transparent h-0 top-1/2"
                                    )} />
                                    <div className="w-10 h-10 rounded-lg bg-white/60 border border-white/80 flex items-center justify-center shadow-sm shrink-0">
                                        <span className="text-xl">🌾</span>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                {article.code}
                                            </span>
                                        </div>
                                        <span className={cn("text-xs font-black truncate transition-colors", isSelected ? "text-blue-700" : "text-slate-700")}>
                                            {article.name}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500">
                                            {(article.lastPivotPrice || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px]">MAD</span>
                                        </span>
                                    </div>
                                    <div className="pr-1">
                                        <GlassBadge color="blue" className="text-[8px] px-1.5 py-0.5">
                                            {typePrefix}
                                        </GlassBadge>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredArticles.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                                <Search className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">Aucun résultat</p>
                            </div>
                        )}
                    </div>

                    {/* FOOTER - TOTAL COUNT */}
                    <div className="p-4 border-t border-slate-200 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de données</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shadow-sm">
                            <span className="text-sm font-black text-blue-600 leading-none">
                                {filteredArticles.length} <span className="text-[10px] text-blue-300 font-bold mx-0.5">/</span> {articles.length}
                            </span>
                            <span className="text-[10px] font-bold text-blue-400 uppercase leading-none">Articles</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-white h-full relative z-10 flex flex-col">
                    {selectedArticle ? (
                        <div className="h-full overflow-hidden">
                            <ArticleEditor
                                article={selectedArticle}
                                existingArticles={articles}
                                invoices={invoices}
                                onSave={handleSave}
                                onDelete={handleDelete}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white">
                            <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center shadow-sm">
                                <span className="text-4xl opacity-20">🥖</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-300">Aucune sélection</h3>
                            <p className="text-sm text-slate-400 mt-2">Sélectionnez un article pour l'éditer</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
