"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { Article, Invoice } from "@/lib/types";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Plus, X, Layers, ChefHat, Database, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getArticles, saveSubFamily } from "@/lib/data-service";
import { GlassCard, GlassInput, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import { useArticles, useInvoices, useFamilies, useSubFamilies, useArticleMutation, useArticleDeletion } from "@/lib/hooks/use-data";

export function ArticlesContent() {
    // Use React Query hooks instead of useState + useEffect
    const { data: articles = [], isLoading: articlesLoading } = useArticles();
    const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
    const { data: families = [], isLoading: familiesLoading } = useFamilies();
    const { data: subFamilies = [], isLoading: subFamiliesLoading } = useSubFamilies();
    
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const articleMutation = useArticleMutation();
    const articleDeletion = useArticleDeletion();

    const handleSave = async (article: Article) => {
        let finalArticle = { ...article };

        // If it's a temporary ID, give it a real one before saving
        if (article.id.startsWith("temp_")) {
            finalArticle.id = `ART-${Date.now()}`;
        }

        await articleMutation.mutateAsync(finalArticle);
        setSelectedArticle(finalArticle);
    };

    const handleDelete = async (id: string) => {
        await articleDeletion.mutateAsync(id);
        setSelectedArticle(null);
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

    const [selectedType, setSelectedType] = useState<"TOUS" | "1" | "2" | "3" | "4">("TOUS");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
    const [selectedSubFamilyId, setSelectedSubFamilyId] = useState<string | null>(null);

    const availableFamilies = useMemo(() => {
        let filtered = families;
        if (selectedType !== "TOUS") {
            filtered = families.filter(f => f.typeId === selectedType);
        } else {
            // Inclure tous les types quand "TOUS" est sélectionné
            filtered = families.filter(f => f.typeId === "1" || f.typeId === "2" || f.typeId === "3" || f.typeId === "4");
        }
        return filtered.sort((a, b) => a.code.localeCompare(b.code));
    }, [selectedType, families]);

    const availableSubFamilies = useMemo(() => {
        const familyIds = new Set(availableFamilies.map(f => f.id));
        return subFamilies.filter(s => familyIds.has(s.familyId));
    }, [availableFamilies, subFamilies]);


    const filteredArticles = useMemo(() => {
        let filtered = articles;
        if (selectedType !== "TOUS") {
            const typeFamilies = new Set(families.filter(f => f.typeId === selectedType).map(f => f.id));
            const typeSubs = new Set(subFamilies.filter(s => typeFamilies.has(s.familyId)).map(s => s.id));
            filtered = filtered.filter(a => typeSubs.has(a.subFamilyId));
        } else {
            // Inclure tous les types quand "TOUS" est sélectionné
            const validFamilies = new Set(families.filter(f => f.typeId === "1" || f.typeId === "2" || f.typeId === "3" || f.typeId === "4").map(f => f.id));
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
        } else if (selectedFamilyId) {
            const familySubs = new Set(subFamilies.filter(s => s.familyId === selectedFamilyId).map(s => s.id));
            filtered = filtered.filter(a => familySubs.has(a.subFamilyId));
        }
        return filtered.sort((a, b) => a.code.localeCompare(b.code));
    }, [articles, selectedType, searchQuery, selectedFamilyId, selectedSubFamilyId, subFamilies]);

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
            const typeSteps: ("TOUS" | "1" | "2" | "3" | "4")[] = ["TOUS", "1", "2", "3", "4"];
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
                            {["Tout", "FA", "FF", "FP", "FV"].map((label) => {
                                const mapType = { "Tout": "TOUS", "FA": "1", "FF": "2", "FP": "3", "FV": "4" };
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
                                        const validFamilies = new Set(families.filter(f => f.typeId === "1" || f.typeId === "2" || f.typeId === "3" || f.typeId === "4").map(f => f.id));
                                        const validSubs = new Set(subFamilies.filter(s => validFamilies.has(s.familyId)).map(s => s.id));

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
                        </div>
                        <div className="flex flex-col gap-2 bg-white/50 p-3 rounded-2xl border border-white/80 shadow-inner">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation Structure</span>
                                {(selectedFamilyId || selectedSubFamilyId) && (
                                    <button
                                        onClick={() => {
                                            setSelectedFamilyId(null);
                                            setSelectedSubFamilyId(null);
                                        }}
                                        className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                        Réinitialiser
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {/* Dropdown Familles */}
                                <div className="w-full">
                                    <select
                                        value={selectedFamilyId || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedFamilyId(val === "" ? null : val);
                                            setSelectedSubFamilyId(null);
                                        }}
                                        className="w-full bg-white/40 border border-white/60 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                                    >
                                        <option value="">Toutes Familles</option>
                                        {availableFamilies.map(fam => (
                                            <option key={fam.id} value={fam.id}>[{fam.code}] - {fam.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Dropdown Sous-Familles */}
                                <div className="w-full">
                                    <select
                                        value={selectedSubFamilyId || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedSubFamilyId(val === "" ? null : val);
                                        }}
                                        disabled={!selectedFamilyId}
                                        className={cn(
                                            "w-full bg-white/40 border border-white/60 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer",
                                            !selectedFamilyId && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        <option value="">{selectedFamilyId ? "Toutes S-Familles" : "Choisir Famille..."}</option>
                                        {availableSubFamilies
                                            .filter(s => s.familyId === selectedFamilyId)
                                            .map(sub => (
                                                <option key={sub.id} value={sub.id}>[{sub.code}] - {sub.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        ref={sidebarListRef}
                        className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200"
                    >
                        {filteredArticles.map(article => {
                            const sub = subFamilies.find(s => s.id === article.subFamilyId);
                            const family = sub ? families.find(f => f.id === sub.familyId) : null;
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
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-xs font-black truncate transition-colors", isSelected ? "text-blue-700" : "text-slate-700")}>
                                                {article.name}
                                            </span>
                                            {article.isSubRecipe && (
                                                <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[8px] font-bold">
                                                    <ChefHat className="w-3 h-3" />
                                                    SR
                                                </span>
                                            )}
                                        </div>
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
