"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import {
    Search,
    Plus,
    X,
    FolderOpen,
    Trash2,
    Check,
    CloudUpload,
    RefreshCw,
    Scale,
    Timer,
    Utensils,
    PieChart,
    ChevronRight,
    Flame,
    Pencil,
    Minus,
    ChefHat,
    Clock,
    DollarSign,
    Activity,
    Save,
    MoreHorizontal,
    Filter,
    ArrowRight,
    Leaf
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Recipe, Family, SubFamily } from "@/lib/types";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { initialFamilies, initialSubFamilies } from "@/lib/data";

// Mock Data
const initialRecipes: Recipe[] = [
    {
        id: "r1",
        reference: "REC-001",
        name: "Croissant au Beurre",
        familyId: "Boulangerie",
        subFamilyId: "Viennoiserie",
        yield: 24,
        yieldUnit: "Pieces",
        image: "https://images.unsplash.com/photo-1555507036-ab1f40388085?auto=format&fit=crop&q=80&w=800",
        ingredients: [
            { id: "i1", articleId: "a1", name: "Farine T45", quantity: 1000, unit: "g", cost: 5 },
            { id: "i2", articleId: "a2", name: "Beurre Tourage", quantity: 500, unit: "g", cost: 45 },
        ],
        steps: [
            { order: 1, description: "Pétrissage de la détrempe", duration: 15 },
            { order: 2, description: "Repos au froid", duration: 60 },
            { order: 3, description: "Tourage (3 tours simples)", duration: 30 },
        ],
        nutrition: {
            calories: 280,
            protein: 5,
            carbs: 30,
            fat: 16,
            glycemicIndex: 65,
            glycemicLoad: 18
        },
        costing: {
            materialCost: 55,
            lossRate: 5,
            laborCost: 20,
            storageCost: 2,
            totalCost: 80,
            costPerUnit: 3.33
        }
    },
    {
        id: "r2",
        reference: "REC-002",
        name: "Baguette Tradition",
        familyId: "Boulangerie",
        subFamilyId: "Pains",
        yield: 50,
        yieldUnit: "Pieces",
        image: "https://images.unsplash.com/photo-1597079910443-60c43fc4f752?auto=format&fit=crop&q=80&w=800",
        ingredients: [],
        steps: [],
        nutrition: {
            calories: 220,
            protein: 8,
            carbs: 45,
            fat: 1,
            glycemicIndex: 85,
            glycemicLoad: 35
        },
        costing: {
            materialCost: 30,
            lossRate: 2,
            laborCost: 15,
            storageCost: 1,
            totalCost: 48,
            costPerUnit: 0.96
        }
    }
];

// Mock Articles Data (Normally fetched from Article module)
const mockArticles = [
    { id: "a1", name: "Farine T55", unit: "Kg", cost: 5.5, familyId: "FA01" },
    { id: "a2", name: "Sucre Semoule", unit: "Kg", cost: 12, familyId: "FA01" },
    { id: "a3", name: "Beurre Doux", unit: "Kg", cost: 85, familyId: "FA03" },
    { id: "a4", name: "Oeufs Calibre A", unit: "Plateau", cost: 45, familyId: "FA04" },
    { id: "a5", name: "Levure Boulangère", unit: "Kg", cost: 35, familyId: "FA01" },
    { id: "a6", name: "Lait Entier", unit: "L", cost: 9, familyId: "FA03" },
    { id: "a7", name: "Crème 35%", unit: "L", cost: 45, familyId: "FA03" },
    { id: "a8", name: "Chocolat Noir", unit: "Kg", cost: 120, familyId: "FA06" },
    { id: "a9", name: "Sel Fin", unit: "Kg", cost: 2, familyId: "FA02" },
    { id: "a10", name: "Amandes Poudre", unit: "Kg", cost: 95, familyId: "FA02" },
];

export default function ProductionPage() {
    const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>(initialRecipes[0].id);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterFamily, setFilterFamily] = useState<string>("Tous");
    const [activeTab, setActiveTab] = useState<"ingredients" | "steps" | "nutrition" | "costing">("ingredients");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Recipe | null>(null);
    const [multiplier, setMultiplier] = useState(1);
    const [ingredientSearch, setIngredientSearch] = useState("");
    const [showIngredientInput, setShowIngredientInput] = useState(false);
    const [activeRowSearch, setActiveRowSearch] = useState<number | null>(null); // Index of row being searched

    // Helper: Filter articles by name AND ensure they are Raw Materials (FA01-FA06)
    const getFilteredArticles = (search: string) => {
        const rawMaterialFamilies = ["FA01", "FA02", "FA03", "FA04", "FA05", "FA06"];
        return mockArticles.filter(a =>
            a.name.toLowerCase().includes(search.toLowerCase()) &&
            rawMaterialFamilies.includes(a.familyId)
        );
    };

    // Global Footer Search Results
    const filteredFooterArticles = getFilteredArticles(ingredientSearch);

    const handleAddIngredient = (article: typeof mockArticles[0]) => {
        if (!editData) return;
        const newIng = {
            id: Math.random().toString(),
            articleId: article.id,
            name: article.name,
            quantity: 0,
            unit: article.unit,
            cost: 0 // Will need calculation logic based on qty * unit cost
        };
        updateEditData('ingredients', [...editData.ingredients, newIng]);
        setIngredientSearch("");
        setShowIngredientInput(false);
    };

    const handleUpdateIngredientFromSearch = (index: number, article: typeof mockArticles[0]) => {
        if (!editData) return;
        const currentIng = editData.ingredients[index];
        const newIngs = [...editData.ingredients];
        newIngs[index] = {
            ...currentIng,
            articleId: article.id,
            name: article.name,
            unit: article.unit,
            // Recalculate cost if quantity exists (simple linear, assuming quantity is in same unit base)
            cost: currentIng.quantity * article.cost
        };
        updateEditData('ingredients', newIngs);
        setActiveRowSearch(null);
    };

    // Reset multiplier when recipe changes
    useEffect(() => {
        setMultiplier(1);
    }, [selectedRecipeId]);

    // Derived state
    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFamily = filterFamily === "Tous" || recipe.familyId === filterFamily;
        return matchesSearch && matchesFamily;
    });

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0];

    const [familiesData] = usePersistedState<Family[]>("bakery_families", initialFamilies);
    const [subFamiliesData] = usePersistedState<SubFamily[]>("bakery_subfamilies", initialSubFamilies);

    const productionFamilies = familiesData.filter(f => f.typeId === "3"); // Type 3 is Production
    const families = ["Tous", ...productionFamilies.map(f => f.name)];

    // Helper to get subfamilies for current edit selection
    const getAvailableSubFamilies = () => {
        if (!editData) return [];
        const selectedFam = productionFamilies.find(f => f.name === editData.familyId);
        if (!selectedFam) return [];
        return subFamiliesData.filter(sf => sf.familyId === selectedFam.id);
    };

    const handleSave = () => {
        if (!editData) return;
        setRecipes(prev => prev.map(r => r.id === editData.id ? editData : r));
        setIsEditing(false);
        setEditData(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
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
                        {/* Header */}
                        <div className="p-6 pb-4 flex flex-col gap-5">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                                    <ChefHat className="w-8 h-8 text-emerald-600" />
                                    Production
                                </h2>
                                <p className="text-slate-400 text-sm font-light mt-1">Recettes & Engineering</p>
                            </div>

                            {/* Filters */}
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

                            {/* Search & Add */}
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
                                <button className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all shrink-0">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* List */}
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
                                            <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
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
                                                    {recipe.costing.costPerUnit} Dh
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
                        {/* Header Details */}
                        <div className="px-8 pt-8 pb-6 border-b border-slate-100 bg-white shrink-0">
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    {/* Family / SubFamily Badges */}
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
                                    {/* Modify Buttons */}
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
                                            <button className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
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

                        {/* Scrolling Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                            <div className="max-w-5xl mx-auto space-y-6">

                                {activeTab === "ingredients" && (
                                    <div className="grid grid-cols-12 gap-8">
                                        <div className="col-span-12 bg-white rounded-2xl border border-slate-100 shadow-sm dark-shadow overflow-hidden">
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
                                            <table className="w-full">
                                                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                                    <tr>
                                                        <th className="text-left px-6 py-3">Ingrédient</th>
                                                        <th className="text-right px-6 py-3">Quantité</th>
                                                        <th className="text-center px-6 py-3">Unité</th>
                                                        <th className="text-right px-6 py-3">Coût (Dh)</th>
                                                        {isEditing && <th className="w-10"></th>}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(isEditing && editData ? editData.ingredients : selectedRecipe.ingredients).map((ing, idx) => (
                                                        <tr key={ing.id} className="hover:bg-emerald-50/30 transition-colors group">
                                                            <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                                                {isEditing && editData ? (
                                                                    <div className="relative">
                                                                        <input
                                                                            value={ing.name}
                                                                            onFocus={() => setActiveRowSearch(idx)}
                                                                            onChange={(e) => {
                                                                                const newIngs = [...editData.ingredients];
                                                                                newIngs[idx] = { ...ing, name: e.target.value };
                                                                                updateEditData('ingredients', newIngs);
                                                                                setActiveRowSearch(idx);
                                                                            }}
                                                                            onBlur={() => {
                                                                                // Delay hide to allow click
                                                                                setTimeout(() => setActiveRowSearch(null), 200);
                                                                            }}
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                                                                        />
                                                                        {/* Row Dropdown */}
                                                                        {activeRowSearch === idx && getFilteredArticles(ing.name).length > 0 && (
                                                                            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                                                                {getFilteredArticles(ing.name).map(article => (
                                                                                    <div
                                                                                        key={article.id}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            handleUpdateIngredientFromSearch(idx, article);
                                                                                        }}
                                                                                        className="px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                                                                    >
                                                                                        <span className="font-bold text-slate-700 text-xs group-hover:text-emerald-700 truncate mr-2">{article.name}</span>
                                                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-emerald-100 group-hover:text-emerald-600 shrink-0">{article.unit}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : ing.name}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">
                                                                {isEditing && editData ? (
                                                                    <input
                                                                        type="number"
                                                                        value={ing.quantity}
                                                                        onChange={(e) => {
                                                                            const newIngs = [...editData.ingredients];
                                                                            newIngs[idx] = { ...ing, quantity: Number(e.target.value) };
                                                                            updateEditData('ingredients', newIngs);
                                                                        }}
                                                                        className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                ) : (ing.quantity * multiplier)}
                                                            </td>
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-400 text-center">
                                                                {isEditing && editData ? (
                                                                    <input
                                                                        value={ing.unit}
                                                                        onChange={(e) => {
                                                                            const newIngs = [...editData.ingredients];
                                                                            newIngs[idx] = { ...ing, unit: e.target.value };
                                                                            updateEditData('ingredients', newIngs);
                                                                        }}
                                                                        className="w-12 text-center bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                ) : ing.unit}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-emerald-700 text-right">
                                                                {isEditing && editData ? (
                                                                    <input
                                                                        type="number"
                                                                        value={ing.cost}
                                                                        onChange={(e) => {
                                                                            const newIngs = [...editData.ingredients];
                                                                            newIngs[idx] = { ...ing, cost: Number(e.target.value) };
                                                                            updateEditData('ingredients', newIngs);
                                                                        }}
                                                                        className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                ) : (ing.cost * multiplier).toFixed(2)}
                                                            </td>
                                                            {isEditing && editData && (
                                                                <td className="px-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newIngs = editData.ingredients.filter((_, i) => i !== idx);
                                                                            updateEditData('ingredients', newIngs);
                                                                        }}
                                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                    {isEditing && editData && (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-4">
                                                                {!showIngredientInput ? (
                                                                    <button
                                                                        onClick={() => setShowIngredientInput(true)}
                                                                        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm font-bold hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <Plus className="w-4 h-4" /> Ajouter un ingrédient
                                                                    </button>
                                                                ) : (
                                                                    <div className="relative">
                                                                        <div className="flex items-center gap-2">
                                                                            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                                                                            <input
                                                                                autoFocus
                                                                                type="text"
                                                                                value={ingredientSearch}
                                                                                onChange={(e) => setIngredientSearch(e.target.value)}
                                                                                placeholder="Rechercher une matière première..."
                                                                                className="w-full bg-slate-50 border border-emerald-500 rounded-lg pl-9 py-2 text-sm focus:outline-none"
                                                                            />
                                                                            <button
                                                                                onClick={() => setShowIngredientInput(false)}
                                                                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>

                                                                        {/* Dropdown Results */}
                                                                        {ingredientSearch && (
                                                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                                                                {filteredFooterArticles.map(article => (
                                                                                    <div
                                                                                        key={article.id}
                                                                                        onClick={() => handleAddIngredient(article)}
                                                                                        className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                                                                    >
                                                                                        <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-700">{article.name}</span>
                                                                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-emerald-100 group-hover:text-emerald-600">{article.unit}</span>
                                                                                    </div>
                                                                                ))}
                                                                                {filteredFooterArticles.length === 0 && (
                                                                                    <div className="px-4 py-4 text-center text-slate-400 text-xs italic">Aucun résultat</div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {(isEditing ? editData?.ingredients.length === 0 : selectedRecipe.ingredients.length === 0) && !isEditing && (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                                                Aucun ingrédient défini.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                                <tfoot className="bg-slate-50 border-t border-slate-200">
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-4 text-right text-xs font-black uppercase text-slate-500">Total Matière Première</td>
                                                        <td className="px-6 py-4 text-right text-base font-black text-slate-800">
                                                            {isEditing && editData
                                                                ? editData.ingredients.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)
                                                                : (selectedRecipe.costing.materialCost * multiplier).toFixed(2)} Dh
                                                        </td>
                                                        {isEditing && <td></td>}
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
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
                                            {/* Vertical Line */}
                                            <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-slate-100" />

                                            {(isEditing && editData ? editData.steps : selectedRecipe.steps).map((step, idx) => (
                                                <div key={idx} className="relative pl-16 group">
                                                    <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-4 border-slate-100 text-emerald-600 font-black flex items-center justify-center z-10 group-hover:border-emerald-200 transition-colors">
                                                        {step.order}
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
                                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-8 bg-blue-500 rounded-full" />
                                                        <span className="text-slate-600 font-medium">Matières Premières</span>
                                                    </div>
                                                    <span className="font-bold text-slate-800">{selectedRecipe.costing.materialCost.toFixed(2)} Dh</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-8 bg-amber-500 rounded-full" />
                                                        <span className="text-slate-600 font-medium">Main d'œuvre</span>
                                                    </div>
                                                    <span className="font-bold text-slate-800">{selectedRecipe.costing.laborCost.toFixed(2)} Dh</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-8 bg-purple-500 rounded-full" />
                                                        <span className="text-slate-600 font-medium">Frais Généraux</span>
                                                    </div>
                                                    <span className="font-bold text-slate-800">{selectedRecipe.costing.storageCost.toFixed(2)} Dh</span>
                                                </div>
                                                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-8 bg-red-500 rounded-full" />
                                                        <span className="text-red-700 font-medium">Pertes ({selectedRecipe.costing.lossRate}%)</span>
                                                    </div>
                                                    <span className="font-bold text-red-700">
                                                        +{(selectedRecipe.costing.totalCost * selectedRecipe.costing.lossRate / 100).toFixed(2)} Dh
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-center items-center text-center shadow-xl">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                                            <h4 className="text-emerald-200 font-bold uppercase tracking-widest text-sm mb-4">Coût de Revient Total</h4>
                                            <div className="text-6xl font-black mb-2">{selectedRecipe.costing.totalCost.toFixed(2)}</div>
                                            <div className="text-emerald-200 text-xl font-medium mb-8">Dirhams</div>

                                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 w-full max-w-xs border border-white/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-emerald-100 font-medium">Coût par pièce</span>
                                                    <span className="text-2xl font-bold text-white">{selectedRecipe.costing.costPerUnit.toFixed(2)} Dh</span>
                                                </div>
                                            </div>
                                        </div>
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
                                                <div className="text-3xl font-black text-slate-800">{selectedRecipe.nutrition.glycemicLoad}</div>
                                                <div className="text-xs font-bold text-slate-400 uppercase">Charge Glycémique</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
