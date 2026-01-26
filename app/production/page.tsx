"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Recipe } from "@/lib/types";
import { useState } from "react";
import { Search, ChefHat, Clock, Flame, Divide, DollarSign, Activity, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const initialRecipes: Recipe[] = [
    {
        id: "r1",
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

export default function ProductionPage() {
    const [recipes] = useState<Recipe[]>(initialRecipes);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe>(recipes[0]);
    const [activeTab, setActiveTab] = useState<"ingredients" | "nutrition" | "steps" | "costing">("ingredients");

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0">
                <TopBar />

                <div className="px-8 pb-8 h-[calc(100vh-140px)]">
                    {/* Header with Title and Search */}
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 font-outfit">Production</h2>
                            <p className="text-slate-500 mt-1">Laboratory & Recipe Engineering.</p>
                        </div>
                        <div className="w-64">
                            <GlassInput icon={<Search className="w-4 h-4" />} placeholder="Find recipe..." />
                        </div>
                    </div>

                    <div className="flex gap-6 h-full pb-4">
                        {/* Left Panel: Recipe List */}
                        <div className="w-1/3 min-w-[320px] flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button className="py-2 px-4 rounded-xl bg-indigo-600 text-white font-medium shadow-md">Boulangerie</button>
                                <button className="py-2 px-4 rounded-xl bg-white/40 text-slate-600 font-medium hover:bg-white/60">Pâtisserie</button>
                                <button className="py-2 px-4 rounded-xl bg-white/40 text-slate-600 font-medium hover:bg-white/60">Snacking</button>
                                <button className="py-2 px-4 rounded-xl bg-white/40 text-slate-600 font-medium hover:bg-white/60">Viennoiserie</button>
                            </div>

                            <GlassCard className="flex-1 overflow-hidden p-0 bg-white/20">
                                <div className="overflow-y-auto h-full p-3 space-y-3 custom-scrollbar">
                                    {recipes.map(recipe => (
                                        <div
                                            key={recipe.id}
                                            onClick={() => setSelectedRecipe(recipe)}
                                            className={cn(
                                                "group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300",
                                                selectedRecipe.id === recipe.id ? "ring-2 ring-indigo-500 shadow-xl" : "hover:shadow-lg"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                                            <img src={recipe.image} alt={recipe.name} className="w-full h-32 object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                                <h3 className="text-white font-bold text-lg">{recipe.name}</h3>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-slate-200 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                        {recipe.subFamilyId}
                                                    </span>
                                                    <span className="text-xs font-bold text-indigo-300">
                                                        {recipe.costing.costPerUnit} Dh/u
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>

                        {/* Right Panel: Detailed View */}
                        <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden relative">
                            {/* Hero Header */}
                            <div className="h-48 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 to-purple-900/80 z-10 backdrop-blur-sm" />
                                <img src={selectedRecipe.image} className="absolute inset-0 w-full h-full object-cover opacity-50" />

                                <div className="relative z-20 p-8 h-full flex flex-col justify-end">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h1 className="text-4xl font-bold text-white mb-2 font-outfit">{selectedRecipe.name}</h1>
                                            <div className="flex gap-4 text-indigo-100 text-sm">
                                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                                    <ChefHat className="w-4 h-4" />
                                                    <span>Yield: <strong>{selectedRecipe.yield} {selectedRecipe.yieldUnit}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                                                    <Clock className="w-4 h-4" />
                                                    <span>Prep: <strong>1h 45m</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-white">{selectedRecipe.costing.costPerUnit} Dh</div>
                                            <div className="text-indigo-200 text-sm">Cost per unit</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/20 px-6 pt-4 gap-6 bg-white/30 backdrop-blur-md">
                                {["ingredients", "steps", "nutrition", "costing"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as "ingredients" | "nutrition" | "steps" | "costing")}
                                        className={cn(
                                            "pb-3 text-sm font-semibold capitalize transition-all relative",
                                            activeTab === tab ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"
                                        )}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/40">
                                {activeTab === "ingredients" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <table className="w-full">
                                            <thead className="text-xs text-slate-500 uppercase border-b border-slate-200/50">
                                                <tr>
                                                    <th className="text-left py-2">Ingredient</th>
                                                    <th className="text-right py-2">Quantity</th>
                                                    <th className="text-center py-2">Unit</th>
                                                    <th className="text-right py-2">Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedRecipe.ingredients.map(ing => (
                                                    <tr key={ing.id} className="border-b border-slate-100/50 hover:bg-white/40">
                                                        <td className="py-3 font-medium text-slate-700">{ing.name}</td>
                                                        <td className="py-3 text-right">{ing.quantity}</td>
                                                        <td className="py-3 text-center text-slate-500 text-xs">{ing.unit}</td>
                                                        <td className="py-3 text-right text-slate-600">{ing.cost.toFixed(2)} Dh</td>
                                                    </tr>
                                                ))}
                                                {selectedRecipe.ingredients.length === 0 && (
                                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic">No ingredients defined</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === "costing" && (
                                    <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-green-600" /> Cost Breakdown
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between p-3 bg-white/50 rounded-lg">
                                                    <span className="text-slate-600">Material Cost</span>
                                                    <span className="font-bold">{selectedRecipe.costing.materialCost} Dh</span>
                                                </div>
                                                <div className="flex justify-between p-3 bg-white/50 rounded-lg">
                                                    <span className="text-slate-600">Labor Cost</span>
                                                    <span className="font-bold">{selectedRecipe.costing.laborCost} Dh</span>
                                                </div>
                                                <div className="flex justify-between p-3 bg-white/50 rounded-lg">
                                                    <span className="text-slate-600">Storage & Overhead</span>
                                                    <span className="font-bold">{selectedRecipe.costing.storageCost} Dh</span>
                                                </div>
                                                <div className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                                    <span className="text-red-600">Loss Rate ({selectedRecipe.costing.lossRate}%)</span>
                                                    <span className="font-bold text-red-700">
                                                        +{(selectedRecipe.costing.totalCost * selectedRecipe.costing.lossRate / 100).toFixed(2)} Dh
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className="w-48 h-48 rounded-full border-8 border-indigo-100 flex flex-col items-center justify-center relative">
                                                <span className="text-3xl font-bold text-slate-800">{selectedRecipe.costing.totalCost}</span>
                                                <span className="text-sm text-slate-500 uppercase font-bold">Total Cost</span>

                                                <div className="absolute -bottom-4 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                                    {selectedRecipe.costing.costPerUnit} / unit
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "nutrition" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                                                <div className="text-orange-500 font-bold text-xs uppercase mb-1">Calories</div>
                                                <div className="text-2xl font-bold text-slate-800">{selectedRecipe.nutrition.calories}</div>
                                                <div className="text-xs text-slate-400">kcal</div>
                                            </div>
                                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                                                <div className="text-blue-500 font-bold text-xs uppercase mb-1">Protein</div>
                                                <div className="text-2xl font-bold text-slate-800">{selectedRecipe.nutrition.protein}</div>
                                                <div className="text-xs text-slate-400">g</div>
                                            </div>
                                            <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-center">
                                                <div className="text-yellow-600 font-bold text-xs uppercase mb-1">Carbs</div>
                                                <div className="text-2xl font-bold text-slate-800">{selectedRecipe.nutrition.carbs}</div>
                                                <div className="text-xs text-slate-400">g</div>
                                            </div>
                                            <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                                                <div className="text-red-500 font-bold text-xs uppercase mb-1">Fat</div>
                                                <div className="text-2xl font-bold text-slate-800">{selectedRecipe.nutrition.fat}</div>
                                                <div className="text-xs text-slate-400">g</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-indigo-500" /> Glycemic Impact
                                            </h3>
                                            <div className="bg-white/50 rounded-xl p-6 border border-white/60">
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">Glycemic Index (GI)</div>
                                                        <div className="text-3xl font-bold text-slate-800">{selectedRecipe.nutrition.glycemicIndex}</div>
                                                        <div className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-2 ${selectedRecipe.nutrition.glycemicIndex > 70 ? 'bg-red-100 text-red-700' :
                                                            selectedRecipe.nutrition.glycemicIndex > 55 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {selectedRecipe.nutrition.glycemicIndex > 70 ? 'High' : selectedRecipe.nutrition.glycemicIndex > 55 ? 'Medium' : 'Low'}
                                                        </div>
                                                    </div>
                                                    <div className="h-12 w-px bg-slate-200" />
                                                    <div>
                                                        <div className="text-sm text-slate-500 mb-1">Glycemic Load (GL)</div>
                                                        <div className="text-3xl font-bold text-slate-800">{selectedRecipe.nutrition.glycemicLoad}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "steps" && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        {selectedRecipe.steps.map(step => (
                                            <div key={step.order} className="flex gap-4 p-4 bg-white/40 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg">
                                                    {step.order}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-800">{step.description}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-bold">
                                                        <Clock className="w-3 h-3" /> {step.duration} min
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {selectedRecipe.steps.length === 0 && (
                                            <div className="text-center py-8 text-slate-400 italic">No steps defined</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </main>
        </div>
    );
}
