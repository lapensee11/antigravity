"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import {
    Search,
    Plus,
    X,
    Trash2,
    Scale,
    Timer,
    Utensils,
    PieChart,
    ChevronRight,
    Pencil,
    Minus,
    ChefHat,
    Clock,
    DollarSign,
    Activity,
    Save,
    MoreHorizontal,
    Leaf
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Recipe, Family, SubFamily, Ingredient, Article } from "@/lib/types";
import { saveRecipe, deleteRecipe } from "@/lib/actions/production";

export function ProductionContent({
    initialRecipes,
    initialArticles,
    initialFamilies,
    initialSubFamilies
}: {
    initialRecipes: Recipe[],
    initialArticles: Article[],
    initialFamilies: Family[],
    initialSubFamilies: SubFamily[]
}) {
    const [articles] = useState<Article[]>(initialArticles);
    const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(recipes.length > 0 ? recipes[0].id : null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterFamily, setFilterFamily] = useState<string>("Tous");
    const [activeTab, setActiveTab] = useState<"ingredients" | "steps" | "nutrition" | "costing">("ingredients");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Recipe | null>(null);
    const [multiplier, setMultiplier] = useState(1);
    const [ingredientSearch, setIngredientSearch] = useState("");
    const [showIngredientInput, setShowIngredientInput] = useState(false);
    const [activeRowSearch, setActiveRowSearch] = useState<number | null>(null);
    const [searchFocusIndex, setSearchFocusIndex] = useState<number>(0);
    const nameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const quantityInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const productionFamilies = initialFamilies.filter(f => f.typeId === "3");
    const families = ["Tous", ...productionFamilies.map(f => f.name)];

    const getFilteredArticles = (search: string) => {
        const rawMaterialFamilies = ["FA01", "FA02", "FA03", "FA04", "FA05", "FA06"];
        return articles.filter(a =>
            a.name.toLowerCase().includes(search.toLowerCase()) &&
            rawMaterialFamilies.includes(a.subFamilyId.substring(0, 4))
        );
    };

    const calculateRecipeTotals = (recipe: Recipe) => {
        const materialCost = recipe.ingredients.reduce((sum, ing) => {
            const article = articles.find(a => a.id === ing.articleId);
            const prodPrice = article ? (article.lastPivotPrice || 0) / (article.coeffProd || 1) : 0;
            return sum + (ing.quantity * prodPrice);
        }, 0);

        const totalCost = materialCost + (recipe.costing.laborCost || 0) + (recipe.costing.storageCost || 0);
        const totalWithLoss = totalCost * (1 + (recipe.costing.lossRate || 0) / 100);
        const costPerUnit = recipe.yield > 0 ? totalWithLoss / recipe.yield : 0;

        return { materialCost, totalCost: totalWithLoss, costPerUnit };
    };

    const addNewIngredientRow = () => {
        if (!editData) return;
        const newIng = {
            id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            articleId: "",
            name: "",
            quantity: 0,
            unit: "",
            cost: 0
        };
        const newIngs = [...editData.ingredients, newIng];
        updateEditData('ingredients', newIngs);

        setTimeout(() => {
            const index = newIngs.length - 1;
            nameInputRefs.current[index]?.focus();
            setActiveRowSearch(index);
            setSearchFocusIndex(0);
        }, 50);
    };

    const handleUpdateIngredientFromSearch = (index: number, article: Article) => {
        if (!editData) return;
        const currentIng = editData.ingredients[index];
        const newIngs = [...editData.ingredients];
        newIngs[index] = {
            ...currentIng,
            articleId: article.id,
            name: article.name,
            unit: article.unitProduction || article.unitPivot,
            cost: currentIng.quantity * ((article.lastPivotPrice || 0) / (article.coeffProd || 1))
        };
        updateEditData('ingredients', newIngs);
        setActiveRowSearch(null);

        setTimeout(() => {
            quantityInputRefs.current[index]?.focus();
            quantityInputRefs.current[index]?.select();
        }, 50);
    };

    useEffect(() => {
        setMultiplier(1);
    }, [selectedRecipeId]);

    useEffect(() => {
        setSearchFocusIndex(0);
    }, [activeRowSearch]);

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFamily = filterFamily === "Tous" || recipe.familyId === filterFamily;
        return matchesSearch && matchesFamily;
    });

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0] || null;

    const getAvailableSubFamilies = () => {
        if (!editData) return [];
        const selectedFam = productionFamilies.find(f => f.name === editData.familyId);
        if (!selectedFam) return [];
        return initialSubFamilies.filter(sf => sf.familyId === selectedFam.id);
    };

    const handleSave = async () => {
        if (!editData) return;
        const result = await saveRecipe(editData);
        if (result.success) {
            setRecipes(prev => {
                const existingIndex = prev.findIndex(r => r.id === editData.id);
                if (existingIndex >= 0) {
                    const newRecipes = [...prev];
                    newRecipes[existingIndex] = editData;
                    return newRecipes;
                } else {
                    return [...prev, editData];
                }
            });
            setIsEditing(false);
            setEditData(null);
        } else {
            alert("Erreur lors de l'enregistrement : " + result.error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleDeleteRecipe = async () => {
        if (!selectedRecipeId) return;
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.")) {
            const result = await deleteRecipe(selectedRecipeId);
            if (result.success) {
                setRecipes(prev => {
                    const newRecipes = prev.filter(r => r.id !== selectedRecipeId);
                    if (newRecipes.length > 0) {
                        setSelectedRecipeId(newRecipes[0].id);
                    } else {
                        setSelectedRecipeId(null);
                    }
                    return newRecipes;
                });
            } else {
                alert("Erreur lors de la suppression : " + result.error);
            }
        }
    };

    const updateEditData = (field: keyof Recipe, value: any) => {
        setEditData(prev => prev ? { ...prev, [field]: value } : null);
    };

    return (
        <div className="flex min-h-screen bg-[#F6F8FC] font-outfit">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col">
                <div className="flex w-full h-full">
                    {/* LEFT SIDEBAR: LIST */}
                    <aside className="w-[380px] h-screen sticky top-0 border-r border-slate-200 bg-[#F6F8FC] flex flex-col z-10">
                        <div className="p-6 pb-4 flex flex-col gap-5">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                    <ChefHat className="w-8 h-8 text-emerald-600" />
                                    Production
                                </h2>
                                <p className="text-slate-400 text-sm font-light mt-1">Recettes & Engineering</p>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                                {families.map((fam) => {
                                    const isActive = filterFamily === fam;
                                    return (
                                        <button
                                            key={fam}
                                            onClick={() => setFilterFamily(fam)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all whitespace-nowrap border",
                                                isActive
                                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                    : "bg-white text-slate-500 border-slate-200 hover:border-emerald-200 hover:text-emerald-600"
                                            )}
                                        >
                                            {fam.toUpperCase()}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Rechercher une recette..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm placeholder:text-slate-300"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        const newRecipe: Recipe = {
                                            id: `rec_${Date.now()}`,
                                            reference: "NOUV",
                                            name: "Nouvelle Recette",
                                            familyId: productionFamilies[0]?.name || "",
                                            subFamilyId: "",
                                            yield: 1,
                                            yieldUnit: "Pieces",
                                            ingredients: [],
                                            steps: [],
                                            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, glycemicIndex: 0, glycemicLoad: 0 },
                                            costing: { materialCost: 0, lossRate: 0, laborCost: 0, storageCost: 0, totalCost: 0, costPerUnit: 0 }
                                        };
                                        setRecipes(prev => [...prev, newRecipe]);
                                        setSelectedRecipeId(newRecipe.id);
                                        setEditData(newRecipe);
                                        setIsEditing(true);
                                    }}
                                    className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all shrink-0"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200">
                            {filteredRecipes.map((recipe) => {
                                const isSelected = selectedRecipeId === recipe.id;
                                return (
                                    <div
                                        key={recipe.id}
                                        onClick={() => setSelectedRecipeId(recipe.id)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 border-b border-slate-100 transition-all cursor-pointer group relative hover:bg-white",
                                            isSelected ? "bg-emerald-50/60" : "bg-[#F6F8FC]"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500 rounded-r-full" />
                                        )}

                                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                                            {recipe.image ? (
                                                <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                    <ChefHat className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h3 className={cn(
                                                    "text-sm font-bold truncate transition-colors",
                                                    isSelected ? "text-emerald-900" : "text-slate-700"
                                                )}>
                                                    {recipe.name}
                                                </h3>
                                                <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                                    {calculateRecipeTotals(recipe).costPerUnit.toFixed(2)} Dh
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                <span>{recipe.subFamilyId}</span>
                                                <span>•</span>
                                                <span>{recipe.yield} {recipe.yieldUnit}</span>
                                            </div>
                                        </div>

                                        <ChevronRight className={cn(
                                            "w-4 h-4 transition-all",
                                            isSelected ? "text-emerald-500 opacity-100" : "text-slate-300 opacity-0 group-hover:opacity-100"
                                        )} />
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    {/* MAIN CONTENT: DETAILS */}
                    <div className="flex-1 bg-white min-h-screen flex flex-col overflow-hidden">
                        {!selectedRecipe ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                                <div className="w-24 h-24 bg-white rounded-full mb-6 flex items-center justify-center shadow-sm">
                                    <ChefHat className="w-10 h-10 opacity-20" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-300">Sélectionnez ou créez une recette</h3>
                            </div>
                        ) : (
                            <>
                                <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-white shrink-0">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4">
                                            {isEditing && editData ? (
                                                <div className="flex flex-col gap-3 max-w-md">
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={editData.familyId}
                                                            onChange={(e) => updateEditData('familyId', e.target.value)}
                                                            className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        >
                                                            <option value="" disabled>Famille</option>
                                                            {productionFamilies.map(f => (
                                                                <option key={f.id} value={f.name}>{f.name}</option>
                                                            ))}
                                                        </select>

                                                        <select
                                                            value={editData.subFamilyId}
                                                            onChange={(e) => updateEditData('subFamilyId', e.target.value)}
                                                            className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none min-w-[120px]"
                                                        >
                                                            <option value="" disabled>Sous-famille</option>
                                                            {getAvailableSubFamilies().map(sf => (
                                                                <option key={sf.id} value={sf.name}>{sf.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="mt-1">
                                                        <input
                                                            type="text"
                                                            value={editData.name}
                                                            onChange={(e) => updateEditData('name', e.target.value)}
                                                            className="text-4xl font-black tracking-tight text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                                                        />
                                                    </div>
                                                    <div className="flex justify-end mt-1">
                                                        <input
                                                            type="text"
                                                            value={editData.reference || ""}
                                                            onChange={(e) => updateEditData('reference', e.target.value)}
                                                            placeholder="Référence"
                                                            className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none text-right w-32"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                                                        <span className="bg-emerald-50 px-2 py-1 rounded-md">{selectedRecipe.familyId}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-slate-500">{selectedRecipe.subFamilyId}</span>
                                                    </div>
                                                    <h1 className="text-4xl font-black tracking-tight text-slate-800 mt-1">{selectedRecipe.name}</h1>
                                                    {selectedRecipe.reference && (
                                                        <div className="text-right w-full mt-1">
                                                            <span className="text-xs font-black text-slate-400 tracking-wider">REF: {selectedRecipe.reference}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <div className="flex gap-4 items-center">
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleCancel}
                                                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Annuler
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-200"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        Enregistrer
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditData({ ...selectedRecipe });
                                                            setIsEditing(true);
                                                        }}
                                                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteRecipe}
                                                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Supprimer
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 border-b border-slate-100 flex gap-8 items-center bg-white sticky top-0 z-30 shadow-sm h-14 shrink-0">
                                    {[
                                        { id: "ingredients", label: "Ingrédients", icon: Utensils },
                                        { id: "steps", label: "Préparation", icon: Timer },
                                        { id: "nutrition", label: "Nutrition", icon: Leaf },
                                        { id: "costing", label: "Rentabilité", icon: PieChart },
                                    ].map((tab) => {
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={cn(
                                                    "flex items-center gap-2 h-full text-xs font-bold uppercase tracking-widest transition-all relative px-1",
                                                    isActive ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                <tab.icon className={cn("w-4 h-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                                                {tab.label}
                                                {isActive && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-600" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                                    <div className="max-w-5xl mx-auto space-y-6">
                                        {activeTab === "ingredients" && (
                                            <div className="col-span-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                        <Scale className="w-5 h-5 text-emerald-500" />
                                                        Liste des Ingrédients
                                                    </h3>
                                                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                                        <button
                                                            onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
                                                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"
                                                            disabled={multiplier <= 1}
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                        <span className="text-sm font-black text-slate-700 w-16 text-center">
                                                            Coeff: {multiplier}
                                                        </span>
                                                        <button
                                                            onClick={() => setMultiplier(multiplier + 1)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <table className="w-full border-collapse">
                                                    <thead className="bg-[#F0FDF4] border-t-2 border-[#16A34A]/20">
                                                        <tr className="text-[10px] font-black uppercase text-[#16A34A] tracking-wider">
                                                            <th className="text-left px-6 py-4">Ingrédient</th>
                                                            <th className="text-right px-4 py-4">Quantité</th>
                                                            <th className="text-center px-4 py-4">Unité</th>
                                                            <th className="text-right px-4 py-4">PU (Pivot)</th>
                                                            <th className="text-right px-4 py-4">Poids (g)</th>
                                                            <th className="text-right px-4 py-4 w-[80px]">% Poids</th>
                                                            <th className="text-right px-4 py-4">Coût</th>
                                                            <th className="text-right px-6 py-4 w-[80px]">% Coût</th>
                                                            {isEditing && <th className="w-10"></th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(() => {
                                                            const currentIngs = isEditing && editData ? editData.ingredients : selectedRecipe.ingredients;
                                                            const ingsWithCalculations = currentIngs.map(ing => {
                                                                const article = articles.find(a => a.id === ing.articleId);
                                                                const prodPrice = article ? (article.lastPivotPrice || 0) / (article.coeffProd || 1) : 0;
                                                                const cost = ing.quantity * prodPrice * multiplier;
                                                                const weight = ing.quantity * multiplier;
                                                                return { ...ing, weight, calculatedCost: cost };
                                                            });

                                                            const totalWeight = ingsWithCalculations.reduce((acc, curr) => acc + curr.weight, 0);
                                                            const totalCost = ingsWithCalculations.reduce((acc, curr) => acc + curr.calculatedCost, 0);

                                                            return ingsWithCalculations.map((ing, idx) => {
                                                                const weight = ing.weight;
                                                                const cost = ing.calculatedCost;
                                                                const weightPct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
                                                                const costPct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                                                                const article = articles.find(a => a.id === ing.articleId);
                                                                const pu = article?.lastPivotPrice || 0;

                                                                return (
                                                                    <tr key={ing.id} className="hover:bg-[#F0FDF4]/50 transition-colors group">
                                                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                                                            {isEditing && editData ? (
                                                                                <div className="relative">
                                                                                    <input
                                                                                        ref={el => { nameInputRefs.current[idx] = el; }}
                                                                                        value={ing.name}
                                                                                        onFocus={() => setActiveRowSearch(idx)}
                                                                                        placeholder="Matière première..."
                                                                                        onKeyDown={(e) => {
                                                                                            const results = getFilteredArticles(ing.name);
                                                                                            if (e.key === "ArrowDown") {
                                                                                                e.preventDefault();
                                                                                                setSearchFocusIndex(prev => Math.min(prev + 1, results.length - 1));
                                                                                            } else if (e.key === "ArrowUp") {
                                                                                                e.preventDefault();
                                                                                                setSearchFocusIndex(prev => Math.max(prev - 1, 0));
                                                                                            } else if (e.key === "Enter") {
                                                                                                e.preventDefault();
                                                                                                if (results[searchFocusIndex]) {
                                                                                                    handleUpdateIngredientFromSearch(idx, results[searchFocusIndex]);
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        onChange={(e) => {
                                                                                            const newIngs = [...editData.ingredients];
                                                                                            newIngs[idx] = { ...ing, name: e.target.value };
                                                                                            updateEditData('ingredients', newIngs);
                                                                                            setActiveRowSearch(idx);
                                                                                        }}
                                                                                        onBlur={() => {
                                                                                            setTimeout(() => setActiveRowSearch(null), 200);
                                                                                        }}
                                                                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                                                                                    />
                                                                                    {activeRowSearch === idx && getFilteredArticles(ing.name).length > 0 && (
                                                                                        <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                                                                            {getFilteredArticles(ing.name).map((article, sIdx) => (
                                                                                                <div
                                                                                                    key={article.id}
                                                                                                    onClick={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        handleUpdateIngredientFromSearch(idx, article);
                                                                                                    }}
                                                                                                    className={cn(
                                                                                                        "px-3 py-2 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group",
                                                                                                        searchFocusIndex === sIdx ? "bg-emerald-100" : "hover:bg-emerald-50"
                                                                                                    )}
                                                                                                >
                                                                                                    <span className={cn(
                                                                                                        "font-bold text-xs truncate mr-2",
                                                                                                        searchFocusIndex === sIdx ? "text-emerald-800" : "text-slate-700 group-hover:text-emerald-700"
                                                                                                    )}>{article.name}</span>
                                                                                                    <span className={cn(
                                                                                                        "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                                                                                                        searchFocusIndex === sIdx ? "bg-emerald-200 text-emerald-700" : "text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                                                                                    )}>{article.unitProduction || article.unitPivot}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : ing.name}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm font-medium text-slate-600 text-right">
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    ref={el => { quantityInputRefs.current[idx] = el; }}
                                                                                    type="number"
                                                                                    value={ing.quantity}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === "Tab" && idx === (editData?.ingredients.length || 0) - 1 && !e.shiftKey) {
                                                                                            e.preventDefault();
                                                                                            addNewIngredientRow();
                                                                                        }
                                                                                    }}
                                                                                    onChange={(e) => {
                                                                                        const qty = Number(e.target.value);
                                                                                        const article = articles.find(a => a.id === ing.articleId);
                                                                                        const prodPrice = article ? (article.lastPivotPrice || 0) / (article.coeffProd || 1) : 0;
                                                                                        const newCost = qty * prodPrice * multiplier;
                                                                                        const newIngs = [...(editData?.ingredients || [])];
                                                                                        newIngs[idx] = { ...ing, quantity: qty, cost: newCost };
                                                                                        updateEditData('ingredients', newIngs);
                                                                                    }}
                                                                                    className="w-full text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                                                                                />
                                                                            ) : (ing.quantity * multiplier).toLocaleString()}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-xs font-bold text-slate-400 text-center uppercase">
                                                                            {ing.unit}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm font-medium text-slate-500 text-right font-mono">
                                                                            {pu.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm font-bold text-slate-700 text-right">
                                                                            {weight.toLocaleString()}
                                                                        </td>
                                                                        <td className="px-4 py-4 text-[11px] font-black text-[#16A34A] text-right bg-[#F0FDF4]/30">
                                                                            {weightPct.toFixed(1)}%
                                                                        </td>
                                                                        <td className="px-4 py-4 text-sm font-black text-slate-800 text-right">
                                                                            {cost.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-6 py-4 text-[11px] font-black text-emerald-700 text-right bg-emerald-50/50">
                                                                            {costPct.toFixed(1)}%
                                                                        </td>
                                                                        {isEditing && (
                                                                            <td className="px-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newIngs = editData!.ingredients.filter((_, i) => i !== idx);
                                                                                        updateEditData('ingredients', newIngs);
                                                                                    }}
                                                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </td>
                                                                        )}
                                                                    </tr>
                                                                );
                                                            });
                                                        })()}

                                                        {isEditing && editData && (
                                                            <tr>
                                                                <td colSpan={9} className="px-6 py-4">
                                                                    <button
                                                                        onClick={addNewIngredientRow}
                                                                        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-bold hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Plus className="w-4 h-4" /> Ajouter un ingrédient
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                    <tfoot className="bg-emerald-50/50 border-t-2 border-white">
                                                        {(() => {
                                                            const currentIngs = isEditing && editData ? editData.ingredients : (selectedRecipe?.ingredients || []);
                                                            const ingsCalculated = currentIngs.map(ing => {
                                                                const article = articles.find(a => a.id === ing.articleId);
                                                                const prodPrice = article ? (article.lastPivotPrice || 0) / (article.coeffProd || 1) : 0;
                                                                return {
                                                                    weight: ing.quantity * multiplier,
                                                                    cost: ing.quantity * prodPrice * multiplier
                                                                };
                                                            });
                                                            const totalWeight = ingsCalculated.reduce((acc, curr) => acc + curr.weight, 0);
                                                            const totalCost = ingsCalculated.reduce((acc, curr) => acc + curr.cost, 0);

                                                            return (
                                                                <tr className="text-slate-800 font-black">
                                                                    <td className="px-6 py-4 text-right text-[10px] uppercase text-slate-400">Totaux Engineering</td>
                                                                    <td colSpan={3}></td>
                                                                    <td className="px-4 py-4 text-right text-base">{totalWeight.toLocaleString()} <span className="text-[10px] text-slate-400">g</span></td>
                                                                    <td className="px-4 py-4 text-right text-xs text-[#16A34A] bg-[#F0FDF4]/50 border-x border-[#F0FDF4]">100%</td>
                                                                    <td className="px-4 py-4 text-right text-base">{totalCost.toLocaleString()} <span className="text-[10px] text-slate-400">Dh</span></td>
                                                                    <td className="px-6 py-4 text-right text-xs text-emerald-700 bg-emerald-100/30">100%</td>
                                                                    {isEditing && <td></td>}
                                                                </tr>
                                                            );
                                                        })()}
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}

                                        {activeTab === "steps" && (
                                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                                                <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <ChefHat className="w-5 h-5" />
                                                    </div>
                                                    Processus de Fabrication
                                                </h3>
                                                <div className="space-y-8 relative">
                                                    <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-100" />
                                                    {(isEditing && editData ? editData.steps : (selectedRecipe?.steps || [])).map((step, idx) => (
                                                        <div key={idx} className="relative pl-16 group">
                                                            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-4 border-slate-100 text-emerald-600 font-black flex items-center justify-center z-10 group-hover:border-emerald-200 transition-colors">
                                                                {step.order || idx + 1}
                                                            </div>
                                                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 group-hover:border-emerald-200 group-hover:bg-emerald-50/30 transition-all relative">
                                                                {isEditing && editData ? (
                                                                    <div className="flex flex-col gap-3">
                                                                        <textarea
                                                                            value={step.description}
                                                                            onChange={(e) => {
                                                                                const newSteps = [...editData.steps];
                                                                                newSteps[idx] = { ...step, description: e.target.value };
                                                                                updateEditData('steps', newSteps);
                                                                            }}
                                                                            className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 min-h-[60px]"
                                                                            placeholder="Description de l'étape..."
                                                                        />
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-2">
                                                                                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                                                                <input
                                                                                    type="number"
                                                                                    value={step.duration}
                                                                                    onChange={(e) => {
                                                                                        const newSteps = [...editData.steps];
                                                                                        newSteps[idx] = { ...step, duration: Number(e.target.value) };
                                                                                        updateEditData('steps', newSteps);
                                                                                    }}
                                                                                    className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-600 focus:outline-none focus:border-emerald-500"
                                                                                />
                                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">min</span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newSteps = editData.steps.filter((_, i) => i !== idx);
                                                                                    updateEditData('steps', newSteps);
                                                                                }}
                                                                                className="text-red-400 hover:text-red-600 p-1"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-slate-700 font-medium text-lg mb-2">{step.description}</p>
                                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide">
                                                                            <Clock className="w-3.5 h-3.5" />
                                                                            {step.duration} minutes
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {isEditing && editData && (
                                                        <div className="relative pl-16">
                                                            <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-emerald-50 border-4 border-dashed border-emerald-200 text-emerald-300 font-black flex items-center justify-center z-10">
                                                                <Plus className="w-5 h-5" />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newStep = { order: editData.steps.length + 1, description: "", duration: 0 };
                                                                    updateEditData('steps', [...editData.steps, newStep]);
                                                                }}
                                                                className="w-full h-10 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-bold hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                            >
                                                                Ajouter une étape
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "costing" && (
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                                                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                                                        <DollarSign className="w-5 h-5 text-emerald-600" />
                                                        Structure des Coûts
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {(() => {
                                                            const totals = calculateRecipeTotals(selectedRecipe);
                                                            return (
                                                                <>
                                                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                                                            <span className="text-slate-600 font-medium">Matières Premières</span>
                                                                        </div>
                                                                        <span className="font-bold text-slate-800">{totals.materialCost.toFixed(2)} Dh</span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-8 bg-amber-500 rounded-full" />
                                                                            <span className="text-slate-600 font-medium">Main d'œuvre</span>
                                                                        </div>
                                                                        {isEditing && editData ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editData.costing.laborCost}
                                                                                onChange={(e) => updateEditData('costing', { ...editData.costing, laborCost: Number(e.target.value) })}
                                                                                className="w-24 text-right bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-bold text-slate-800">{(selectedRecipe.costing.laborCost || 0).toFixed(2)} Dh</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-8 bg-purple-500 rounded-full" />
                                                                            <span className="text-slate-600 font-medium">Frais Généraux</span>
                                                                        </div>
                                                                        {isEditing && editData ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editData.costing.storageCost}
                                                                                onChange={(e) => updateEditData('costing', { ...editData.costing, storageCost: Number(e.target.value) })}
                                                                                className="w-24 text-right bg-white border border-slate-200 rounded px-2 py-1 font-bold text-slate-800"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-bold text-slate-800">{(selectedRecipe.costing.storageCost || 0).toFixed(2)} Dh</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-2 h-8 bg-red-500 rounded-full" />
                                                                            <span className="text-red-700 font-medium">Pertes (%)</span>
                                                                        </div>
                                                                        {isEditing && editData ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editData.costing.lossRate}
                                                                                onChange={(e) => updateEditData('costing', { ...editData.costing, lossRate: Number(e.target.value) })}
                                                                                className="w-24 text-right bg-white border border-slate-200 rounded px-2 py-1 font-bold text-red-700"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-bold text-red-700">
                                                                                {selectedRecipe.costing.lossRate}% (+{(totals.totalCost * (selectedRecipe.costing.lossRate || 0) / 100).toFixed(2)} Dh)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const totals = calculateRecipeTotals(isEditing && editData ? editData : selectedRecipe);
                                                    return (
                                                        <div className="bg-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-center items-center text-center shadow-xl">
                                                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                                                            <h4 className="text-emerald-200 font-bold uppercase tracking-widest text-sm mb-4">Coût de Revient Total</h4>
                                                            <div className="text-6xl font-black mb-2">{totals.totalCost.toFixed(2)}</div>
                                                            <div className="text-emerald-200 text-xl font-medium mb-8">Dirhams</div>

                                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full max-w-xs border border-white/10">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-emerald-100 font-medium">Coût par {selectedRecipe.yieldUnit || "pièce"}</span>
                                                                    <span className="text-2xl font-bold text-white">{totals.costPerUnit.toFixed(2)} Dh</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {activeTab === "nutrition" && (
                                            <div className="grid grid-cols-4 gap-4">
                                                {[
                                                    { id: 'calories', label: "Calories", val: selectedRecipe.nutrition.calories, unit: "kcal", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
                                                    { id: 'protein', label: "Protéines", val: selectedRecipe.nutrition.protein, unit: "g", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                                                    { id: 'carbs', label: "Glucides", val: selectedRecipe.nutrition.carbs, unit: "g", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
                                                    { id: 'fat', label: "Lipides", val: selectedRecipe.nutrition.fat, unit: "g", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
                                                ].map((nut, i) => (
                                                    <div key={i} className={cn("p-6 rounded-2xl border text-center", nut.bg, nut.border)}>
                                                        <div className={cn("text-xs font-black uppercase tracking-widest mb-2", nut.color)}>{nut.label}</div>
                                                        {isEditing && editData ? (
                                                            <input
                                                                type="number"
                                                                value={(editData.nutrition as any)[nut.id]}
                                                                onChange={(e) => {
                                                                    const newNut = { ...editData.nutrition, [nut.id]: Number(e.target.value) };
                                                                    updateEditData('nutrition', newNut);
                                                                }}
                                                                className="w-full text-center bg-white/50 border border-slate-200/50 rounded p-1 text-2xl font-black text-slate-800 mb-1 focus:outline-none focus:border-emerald-500"
                                                            />
                                                        ) : (
                                                            <div className="text-3xl font-black text-slate-800 mb-1">{nut.val}</div>
                                                        )}
                                                        <div className="text-xs font-bold text-slate-400">{nut.unit}</div>
                                                    </div>
                                                ))}

                                                <div className="col-span-4 bg-white rounded-2xl border border-slate-100 p-8 flex items-center gap-8 mt-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                                            <Activity className="w-5 h-5 text-emerald-500" />
                                                            Indice Glycémique
                                                        </h4>
                                                        <p className="text-sm text-slate-500 leading-relaxed">
                                                            Cet aliment a un index glycémique de <strong className="text-slate-800">{selectedRecipe.nutrition.glycemicIndex}</strong>, ce qui est considéré comme
                                                            {selectedRecipe.nutrition.glycemicIndex > 70 ? " élevé" : selectedRecipe.nutrition.glycemicIndex > 55 ? " moyen" : " faible"}.
                                                        </p>
                                                    </div>
                                                    <div className="w-px h-16 bg-slate-100" />
                                                    <div className="text-center min-w-[120px]">
                                                        {isEditing && editData ? (
                                                            <input
                                                                type="number"
                                                                value={editData.nutrition.glycemicLoad}
                                                                onChange={(e) => updateEditData('nutrition', { ...editData.nutrition, glycemicLoad: Number(e.target.value) })}
                                                                className="w-20 text-center bg-slate-50 border border-slate-200 rounded p-1 text-3xl font-black text-slate-800 mb-1"
                                                            />
                                                        ) : (
                                                            <div className="text-3xl font-black text-slate-800">{selectedRecipe.nutrition.glycemicLoad}</div>
                                                        )}
                                                        <div className="text-xs font-bold text-slate-400 uppercase">Charge Glycémique</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
