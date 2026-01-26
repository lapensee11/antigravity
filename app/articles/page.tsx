"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { Article } from "@/lib/types";
import { initialFamilies, initialSubFamilies } from "@/lib/data";
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const initialArticles: Article[] = [
    {
        id: "a1",
        name: "Farine Viennoiserie",
        code: "PA011-01",
        subFamilyId: "FA011", // Farines
        unitAchat: "Quintal",
        unitPivot: "kg",
        unitProduction: "g",
        contenace: 100,
        coeffProd: 1000,
        lastPivotPrice: 5.00,
        priceHistory: [
            { date: "2023-12-01", price: 5.20 },
            { date: "2023-11-01", price: 5.00 }
        ]
    },
    {
        id: "a2",
        name: "Sucre Semoule",
        code: "PA012-01",
        subFamilyId: "FA012", // Sucres
        unitAchat: "Sac 25kg",
        unitPivot: "kg",
        unitProduction: "g",
        contenace: 25,
        coeffProd: 1000,
        lastPivotPrice: 8.50,
        priceHistory: [
            { date: "2024-01-10", price: 8.50 },
            { date: "2023-12-05", price: 8.20 }
        ]
    },
];

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [editTrigger, setEditTrigger] = useState(0); // Trigger for editor focus

    const handleSave = (article: Article) => {
        // Check if article exists in current list
        const exists = articles.some(a => a.id === article.id);

        if (exists) {
            // Update existing
            setArticles(prev => prev.map(a => a.id === article.id ? article : a));
            // CRITICAL: Update selectedArticle to reflect changes immediately in UI
            if (selectedArticle?.id === article.id) {
                setSelectedArticle(article);
            }
        } else {
            // Create new
            const newId = `new_${Date.now()}`;
            const newArticle = { ...article, id: newId };
            setArticles(prev => [...prev, newArticle]);
            setSelectedArticle(newArticle);
        }
    };

    const handleDelete = (id: string) => {
        setArticles(prev => prev.filter(a => a.id !== id));
        setSelectedArticle(null);
    };

    const handleCreateNew = () => {
        const randomCode = `ART-${Math.floor(1000 + Math.random() * 9000)}`;
        setSelectedArticle({
            id: `temp_${Date.now()}`, // Temporary ID
            name: "",
            code: randomCode, // Auto-generated code
            subFamilyId: initialSubFamilies[0]?.id || "", // Default to first sub-family
            unitAchat: "",
            unitPivot: "",
            unitProduction: "",
            contenace: 0,
            coeffProd: 0,
            lastPivotPrice: 0
        });
    };

    // Filters
    const [selectedType, setSelectedType] = useState<"TOUS" | "1" | "2">("TOUS"); // 1=Achats, 2=Fonct
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubFamilyId, setSelectedSubFamilyId] = useState<string | null>(null);

    // Derived Data for Filters
    const availableFamilies = useMemo(() => {
        if (selectedType === "TOUS") return initialFamilies.filter(f => f.typeId === "1" || f.typeId === "2");
        return initialFamilies.filter(f => f.typeId === selectedType);
    }, [selectedType]);

    const availableSubFamilies = useMemo(() => {
        const familyIds = new Set(availableFamilies.map(f => f.id));
        return initialSubFamilies.filter(s => familyIds.has(s.familyId));
    }, [availableFamilies]);

    // Dropdown Logic
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

    // Selection Label
    const getSelectionLabel = () => {
        if (!selectedSubFamilyId) return "Toutes Familles";
        const sub = initialSubFamilies.find(s => s.id === selectedSubFamilyId);
        if (sub) return sub.name;
        return "Toutes Familles";
    }

    // Filter Logic
    const filteredArticles = useMemo(() => {
        let filtered = articles;

        // Type Filter (only if not TOUS)
        if (selectedType !== "TOUS") {
            const typeFamilies = new Set(initialFamilies.filter(f => f.typeId === selectedType).map(f => f.id));
            const typeSubs = new Set(initialSubFamilies.filter(s => typeFamilies.has(s.familyId)).map(s => s.id));
            filtered = filtered.filter(a => typeSubs.has(a.subFamilyId));
        } else {
            const validFamilies = new Set(initialFamilies.filter(f => f.typeId === "1" || f.typeId === "2").map(f => f.id));
            const validSubs = new Set(initialSubFamilies.filter(s => validFamilies.has(s.familyId)).map(s => s.id));
            filtered = filtered.filter(a => validSubs.has(a.subFamilyId));
        }

        // Search Filter
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(lower) ||
                a.code.toLowerCase().includes(lower)
            );
        }

        // SubFamily Filter
        if (selectedSubFamilyId) {
            filtered = filtered.filter(a => a.subFamilyId === selectedSubFamilyId);
        }

        // Sort by Code
        return filtered.sort((a, b) => a.code.localeCompare(b.code));
    }, [articles, selectedType, searchQuery, selectedSubFamilyId]);

    // Auto-select first article on load or filter change if nothing selected
    useEffect(() => {
        if (!selectedArticle && filteredArticles.length > 0) {
            setSelectedArticle(filteredArticles[0]);
        }
    }, [filteredArticles, selectedArticle]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if ((e.target as HTMLElement).tagName === 'INPUT') return;

            if (e.key === "Enter") {
                e.preventDefault();
                if (selectedArticle) setEditTrigger(Date.now());
                return;
            }

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            } else {
                return;
            }

            // Type Navigation Steps
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

            // Article List Navigation
            else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                if (filteredArticles.length === 0) return;

                const currentIndex = selectedArticle
                    ? filteredArticles.findIndex(a => a.id === selectedArticle.id)
                    : -1;

                let nextIndex = currentIndex;

                if (e.key === "ArrowDown") {
                    nextIndex = currentIndex < filteredArticles.length - 1 ? currentIndex + 1 : currentIndex;
                    // If none selected, selecting 0 is handled below if nextIndex is valid
                    if (currentIndex === -1) nextIndex = 0;
                } else if (e.key === "ArrowUp") {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
                }

                if (nextIndex >= 0 && nextIndex < filteredArticles.length && nextIndex !== currentIndex) {
                    setSelectedArticle(filteredArticles[nextIndex]);

                    // Optional: Try to scroll to it if we had refs, but simple selection update works for now
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedType, selectedArticle, filteredArticles]);


    return (
        <div className="flex h-screen bg-[#F6F8FC] overflow-hidden">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen flex">

                {/* LEFT COLUMN: Navigation & List */}
                <div className="w-[340px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC]">

                    {/* Sticky Header Zone */}
                    <div className="p-5 pb-2 flex flex-col gap-4">
                        {/* Title */}
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 font-outfit tracking-tight">Articles</h2>
                            <p className="text-slate-400 text-sm font-light">Catalogue & Prix</p>
                        </div>

                        {/* Type Tabs */}
                        <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                            {["TOUS", "ACHATS", "FONCT."].map((label) => {
                                const mapType = { "TOUS": "TOUS", "ACHATS": "1", "FONCT.": "2" };
                                const typeValue = mapType[label as keyof typeof mapType];
                                const isActive = selectedType === typeValue;

                                return (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setSelectedType(typeValue as any);
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

                        {/* Search & Add Row */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleCreateNew}
                                className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all shrink-0"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Family Dropdown */}
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

                    {/* Full Bleed List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200">
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
                                        "flex items-center gap-3 p-3 border-b border-slate-100 transition-all cursor-pointer group relative hover:bg-white",
                                        isSelected
                                            ? "bg-blue-100 pl-7" // Shifted & Darker Blue
                                            : "bg-[#F6F8FC] pl-5"
                                    )}
                                >
                                    {/* Selection Marker */}
                                    <div className={cn(
                                        "absolute left-0 top-0 bottom-0 w-[4px] transition-colors",
                                        isSelected ? "bg-blue-600" : "bg-transparent"
                                    )} />

                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center shadow-sm shrink-0">
                                        <span className="text-xl">🌾</span> {/* Replace with dynamic icon later */}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                {article.code}
                                            </span>
                                        </div>
                                        <span className={cn("text-xs font-bold truncate transition-colors", isSelected ? "text-blue-700" : "text-slate-700")}>
                                            {article.name}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500">
                                            {(article.lastPivotPrice || 0).toFixed(2).replace('.', ',')} <span className="text-[10px]">MAD</span>
                                        </span>
                                    </div>

                                    {/* Right Tag */}
                                    <div className="pr-1">
                                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded text-slate-400 bg-slate-100">
                                            {typePrefix}
                                        </span>
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
                </div>

                {/* RIGHT COLUMN: Editor (Full Height) */}
                <div className="flex-1 bg-white h-full relative z-10 flex flex-col">
                    {/* Square design, no added border radius */}
                    {selectedArticle ? (
                        <div className="h-full overflow-hidden">
                            <ArticleEditor
                                article={selectedArticle}
                                existingArticles={articles}
                                forceEditTrigger={editTrigger}
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
