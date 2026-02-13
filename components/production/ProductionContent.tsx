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
    Leaf,
    Printer
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Recipe, Family, SubFamily, Ingredient, Article, Invoice } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRecipes, useArticles, useInvoices, useFamilies, useSubFamilies, useRecipeMutation, useRecipeDeletion } from "@/lib/hooks/use-data";
import { calculateRecipeNutrition } from "@/lib/data-service";

export function ProductionContent() {
    const queryClient = useQueryClient();
    // Use React Query hooks instead of useState + useEffect
    const { data: recipes = [], isLoading: recipesLoading } = useRecipes();
    const { data: articles = [], isLoading: articlesLoading } = useArticles();
    const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
    const { data: families = [], isLoading: familiesLoading } = useFamilies();
    const { data: subFamilies = [], isLoading: subFamiliesLoading } = useSubFamilies();
    
    const recipeMutation = useRecipeMutation();
    const recipeDeletion = useRecipeDeletion();
    
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterFamily, setFilterFamily] = useState<string>("Tous");
    const [familySearch, setFamilySearch] = useState("");
    const [subFamilySearch, setSubFamilySearch] = useState("");
    const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
    const [showSubFamilyDropdown, setShowSubFamilyDropdown] = useState(false);
    const [familySearchFocusIndex, setFamilySearchFocusIndex] = useState(0);
    const [subFamilySearchFocusIndex, setSubFamilySearchFocusIndex] = useState(0);
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

    // Set initial selected recipe when recipes are loaded
    useEffect(() => {
        if (recipes.length > 0 && !selectedRecipeId) {
            setSelectedRecipeId(recipes[0].id);
        }
    }, [recipes, selectedRecipeId]);

    // Function to get pivot price from latest transaction (same logic as ArticleEditor)
    const getPivotPriceFromLatestTransaction = (article: Article | undefined): number => {
        if (!article || invoices.length === 0) {
            return article?.lastPivotPrice || 0;
        }

        const articleLines: { date: string; prixPivot: number }[] = [];
        invoices.forEach(inv => {
            inv.lines.forEach(line => {
                if (line.articleId === article.id || (line.articleName === article.name && !line.articleId)) {
                    // Prix Pivot Calculation (same logic as ArticleEditor)
                    let prixPivot = line.priceHT;
                    if (line.unit === article.unitAchat && article.contenace > 0) {
                        prixPivot = line.priceHT / article.contenace;
                    }
                    articleLines.push({
                        date: inv.date,
                        prixPivot: prixPivot
                    });
                }
            });
        });

        if (articleLines.length > 0) {
            // Sort by date descending and get the latest
            articleLines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return articleLines[0].prixPivot;
        }

        // Fallback to lastPivotPrice
        return article.lastPivotPrice || 0;
    };

    // Function to convert quantity from any unit to production unit (in grams)
    // This calculates the total weight in grams for the ingredient
    const convertToProductionWeight = (article: Article | undefined, quantity: number, unit: string): number => {
        if (!article || quantity <= 0) return 0;

        // Normalize unit strings for comparison
        const normalizeUnit = (u: string) => u.trim().toUpperCase();
        const normalizedUnit = normalizeUnit(unit);
        const unitAchat = normalizeUnit(article.unitAchat);
        const unitPivot = normalizeUnit(article.unitPivot);
        const unitProduction = normalizeUnit(article.unitProduction);

        // If unit is already production unit, extract weight value
        if (normalizedUnit === unitProduction) {
            // Extract numeric value from unit (e.g., "50g" -> 50, "100ml" -> 100)
            const match = article.unitProduction.match(/(\d+(?:\.\d+)?)/);
            if (match) {
                const unitValue = parseFloat(match[1]);
                return quantity * unitValue;
            }
            // If no number found, assume it's already in grams
            return quantity;
        }

        // Convert to pivot first
        let quantityInPivot = quantity;
        if (normalizedUnit === unitAchat && article.contenace > 0) {
            quantityInPivot = quantity / article.contenace;
        }
        // If unit is already pivot, quantityInPivot stays as is

        // Convert from pivot to production (weight in grams)
        if (article.coeffProd > 0) {
            // Extract numeric value from production unit if it contains a number
            const prodUnitMatch = article.unitProduction.match(/(\d+(?:\.\d+)?)/);
            if (prodUnitMatch) {
                const prodUnitValue = parseFloat(prodUnitMatch[1]);
                return quantityInPivot * prodUnitValue;
            }
            // If no number in production unit, use coeffProd directly
            return quantityInPivot * article.coeffProd;
        }

        return 0;
    };

    // Function to calculate cost based on unit
    // Logic: Convert quantity to pivot unit, then calculate production cost
    // The cost represents the total cost for the quantity in the selected unit
    const calculateCostFromUnit = (article: Article | undefined, quantity: number, unit: string): number => {
        if (!article || quantity <= 0) return 0;
        
        // If unit is empty or undefined, try to use default unit
        if (!unit || unit.trim() === "") {
            unit = article.unitProduction || article.unitPivot || article.unitAchat || "";
            if (!unit) {
                console.warn("No unit found for article", article.name);
                return 0;
            }
        }

        const pivotPrice = getPivotPriceFromLatestTransaction(article);
        if (pivotPrice <= 0) {
            // If no pivot price, return 0
            console.warn("No pivot price for article", article.name, "pivotPrice:", pivotPrice, "lastPivotPrice:", article.lastPivotPrice);
            return 0;
        }
        
        // Normalize unit strings for comparison (trim and case-insensitive)
        const normalizeUnit = (u: string) => u?.trim().toUpperCase() || "";
        const normalizedUnit = normalizeUnit(unit);
        const unitAchat = normalizeUnit(article.unitAchat);
        const unitPivot = normalizeUnit(article.unitPivot);
        const unitProduction = normalizeUnit(article.unitProduction);
        
        // Step 1: Convert quantity to pivot unit
        let quantityInPivot = quantity;
        
        if (normalizedUnit === unitAchat) {
            // Convert from achat to pivot using contenace
            // Example: if contenace = 1, 1 unité achat = 1 unité pivot
            if (article.contenace > 0) {
                quantityInPivot = quantity / article.contenace;
            }
        } else if (normalizedUnit === unitProduction) {
            // Convert from production to pivot
            // Example: if unitProduction = "50g" and coeffProd = 50, then 50g = 1 unité pivot
            if (article.coeffProd > 0) {
                // Extract numeric value from production unit (e.g., "50g" -> 50)
                const prodUnitMatch = article.unitProduction.match(/(\d+(?:\.\d+)?)/);
                if (prodUnitMatch) {
                    const prodUnitValue = parseFloat(prodUnitMatch[1]);
                    if (prodUnitValue > 0) {
                        // quantity in production unit / value per pivot = quantity in pivot
                        quantityInPivot = quantity / prodUnitValue;
                    }
                } else {
                    // If no number in unit, use coeffProd directly
                    quantityInPivot = quantity / article.coeffProd;
                }
            }
        }
        // If unit is already pivot, quantityInPivot stays as is

        // Step 2: Calculate total cost
        // Formula: cost = quantity in pivot * pivot price
        // The pivot price is the price per pivot unit, so we just multiply
        // Example for eggs: 10 unités pivot * 1.30 Dh = 13.00 Dh
        // Example for eggs in grams: 100g = 2 unités pivot * 1.30 Dh = 2.60 Dh
        return quantityInPivot * pivotPrice;
    };

    // Get available units for an article
    const getAvailableUnits = (article: Article | undefined): string[] => {
        if (!article) return [];
        
        // Pour les sous-recettes, utiliser Kg et g
        if (article.isSubRecipe === true) {
            return [article.unitPivot || "Kg", article.unitProduction || "g"]; // Kg et g pour les sous-recettes
        }
        
        const units = [article.unitAchat, article.unitPivot, article.unitProduction];
        // Remove duplicates
        return [...new Set(units)];
    };

    const productionFamilies = families.filter(f => f.typeId === "3");
    const familyNames = ["Tous", ...productionFamilies.map(f => f.name)];

    // Filter families by search query, sorted by code
    const filteredFamilies = useMemo(() => {
        if (!familySearch.trim()) {
            return productionFamilies.sort((a, b) => a.code.localeCompare(b.code));
        }
        return productionFamilies
            .filter(f => 
                f.name.toLowerCase().includes(familySearch.toLowerCase()) ||
                f.code.toLowerCase().includes(familySearch.toLowerCase())
            )
            .sort((a, b) => a.code.localeCompare(b.code));
    }, [familySearch, productionFamilies]);

    // Filter sub-families by search query and selected family, sorted by code
    const filteredSubFamilies = useMemo(() => {
        const selectedFamily = productionFamilies.find(f => f.name === filterFamily && filterFamily !== "Tous");
        if (!selectedFamily) {
        return subFamilies
            .filter(sf => {
                const fam = productionFamilies.find(f => f.id === sf.familyId);
                return fam !== undefined;
            })
            .filter(sf => 
                !subFamilySearch.trim() ||
                sf.name.toLowerCase().includes(subFamilySearch.toLowerCase()) ||
                sf.code.toLowerCase().includes(subFamilySearch.toLowerCase())
            )
            .sort((a, b) => a.code.localeCompare(b.code));
        }
        return subFamilies
            .filter(sf => sf.familyId === selectedFamily.id)
            .filter(sf => 
                !subFamilySearch.trim() ||
                sf.name.toLowerCase().includes(subFamilySearch.toLowerCase()) ||
                sf.code.toLowerCase().includes(subFamilySearch.toLowerCase())
            )
            .sort((a, b) => a.code.localeCompare(b.code));
    }, [subFamilySearch, filterFamily, productionFamilies, subFamilies]);

    const getFilteredArticles = (search: string) => {
        const rawMaterialCodes = ["FA01", "FA02", "FA03", "FA04", "FA05", "FA06"];
        
        return articles.filter(a => {
            const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
            if (!matchesSearch) return false;

            // Si c'est une sous-recette, l'inclure directement (peu importe sa famille)
            if (a.isSubRecipe === true) {
                return true;
            }

            // Sinon, vérifier si c'est une matière première
            const subFam = subFamilies.find(sf => sf.id === a.subFamilyId);
            if (!subFam) return false;

            const fam = families.find(f => f.id === subFam.familyId);
            if (!fam) return false;
            
            // Inclure les matières premières (codes FA01-FA06)
            return rawMaterialCodes.includes(fam.code);
        });
    };

    // Convert time string (H:MM) to hours
    const convertTimeToHours = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + (minutes || 0) / 60;
    };

    const calculateRecipeTotals = (recipe: Recipe, multiplierValue: number = 1) => {
        // Material cost is multiplied by the recipe coefficient
        const materialCost = (recipe.ingredients || []).reduce((sum, ing) => {
            const article = articles.find(a => a.id === ing.articleId);
            return sum + calculateCostFromUnit(article, ing.quantity, ing.unit) * multiplierValue;
        }, 0);

        // Recalculate labor, machine, and storage costs dynamically
        // These costs are also multiplied by the coefficient since they represent time/cost for the entire batch
        const laborTime = (recipe.costing as any).laborTime || "0:20";
        const laborHours = convertTimeToHours(laborTime);
        const laborCostPerHour = (recipe.costing as any).laborCostPerHour || 0;
        const laborCost = laborHours * laborCostPerHour * multiplierValue;

        const machineTime = (recipe.costing as any).machineTime || "0:00";
        const machineHours = convertTimeToHours(machineTime);
        const machineCostPerHour = (recipe.costing as any).machineCostPerHour || 0;
        const machineCost = machineHours * machineCostPerHour * multiplierValue;

        const storageTime = (recipe.costing as any).storageTime || "00:0";
        const storageHours = convertTimeToHours(storageTime);
        const storageCostPerHour = (recipe.costing as any).storageCostPerHour || 0;
        const storageCost = storageHours * storageCostPerHour * multiplierValue;

        const totalCost = materialCost + laborCost + machineCost + storageCost;
        const totalWithLoss = totalCost * (1 + (recipe.costing.lossRate || 0) / 100);
        const costPerUnit = recipe.yield > 0 ? totalWithLoss / (recipe.yield * multiplierValue) : 0;

        return { materialCost, laborCost, machineCost, storageCost, totalCost: totalWithLoss, costPerUnit };
    };

    const updateEditData = (field: keyof Recipe, value: any) => {
        setEditData(prev => prev ? { ...prev, [field]: value } : null);
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
        
        // Pour les sous-recettes, utiliser l'unité pivot (Kg) ou l'unité de production (g)
        let defaultUnit: string;
        if (article.isSubRecipe === true) {
            // Utiliser l'unité pivot (Kg) par défaut pour les sous-recettes
            defaultUnit = article.unitPivot || "Kg";
        } else {
            defaultUnit = article.unitProduction || article.unitPivot || article.unitAchat || "";
        }
        
        const newIngs = [...editData.ingredients];
        const calculatedCost = calculateCostFromUnit(article, currentIng.quantity || 0, defaultUnit);
        newIngs[index] = {
            ...currentIng,
            articleId: article.id,
            name: article.name,
            unit: defaultUnit,
            cost: calculatedCost
        };
        updateEditData('ingredients', newIngs);
        setActiveRowSearch(null);

        setTimeout(() => {
            quantityInputRefs.current[index]?.focus();
            quantityInputRefs.current[index]?.select();
        }, 50);
    };

    const handleSave = async () => {
        if (!editData) return;
        
        // Créer une copie profonde pour éviter toute mutation
        const recipeToSave: Recipe = {
            ...editData,
            ingredients: editData.ingredients.map(ing => ({ ...ing })),
            steps: editData.steps.map(step => ({ ...step })),
            nutrition: { ...editData.nutrition },
            costing: { ...editData.costing }
        };
        
        try {
            await recipeMutation.mutateAsync(recipeToSave);
            // Invalider le cache des comptages d'articles pour mettre à jour la structure
            queryClient.invalidateQueries({ queryKey: ["articleCounts"] });
            // React Query will automatically invalidate and refetch recipes and articles
            setIsEditing(false);
            setEditData(null);
        } catch (error) {
            alert("Erreur lors de l'enregistrement");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditData(null);
    };

    const handleDeleteRecipe = async () => {
        if (!selectedRecipeId) return;
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.")) {
            try {
                await recipeDeletion.mutateAsync(selectedRecipeId);
                // Invalider le cache des comptages d'articles pour mettre à jour la structure
                queryClient.invalidateQueries({ queryKey: ["articleCounts"] });
                // React Query will automatically refetch recipes
                // Update selected recipe after deletion
                const remainingRecipes = recipes.filter(r => r.id !== selectedRecipeId);
                if (remainingRecipes.length > 0) {
                    setSelectedRecipeId(remainingRecipes[0].id);
                    } else {
                        setSelectedRecipeId(null);
                    }
            } catch (error) {
                alert("Erreur lors de la suppression");
            }
        }
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;

            // Ignorer si focus dans un input, textarea, select ou bouton
            const isInputActive = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName || "");
            if (isInputActive) return;

            if (filteredRecipes.length === 0) return;

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const currentIndex = filteredRecipes.findIndex(r => r.id === selectedRecipeId);

                if (currentIndex === -1) {
                    if (filteredRecipes.length > 0) setSelectedRecipeId(filteredRecipes[0].id);
                    return;
                }

                let newIndex = currentIndex;
                if (e.key === "ArrowUp") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(filteredRecipes.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    setSelectedRecipeId(filteredRecipes[newIndex].id);
                }
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const currentIndex = familyNames.indexOf(filterFamily);
                let newIndex = currentIndex;

                if (e.key === "ArrowLeft") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(familyNames.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    e.preventDefault();
                    setFilterFamily(familyNames[newIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredRecipes, selectedRecipeId]);

    const sidebarListRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selectedRecipeId && sidebarListRef.current) {
            const index = filteredRecipes.findIndex(r => r.id === selectedRecipeId);
            if (index >= 0) {
                const el = sidebarListRef.current.children[index] as HTMLElement;
                el?.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedRecipeId, filteredRecipes]);

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0] || null;

    const getAvailableSubFamilies = () => {
        if (!editData) return [];
        const selectedFam = productionFamilies.find(f => f.name === editData.familyId);
        if (!selectedFam) return [];
        return subFamilies.filter(sf => sf.familyId === selectedFam.id);
    };

    const exportPdfAndPrint = async (format: "A4" | "A5") => {
        if (!selectedRecipe) return;
        const { pdf } = await import("@react-pdf/renderer");
        const { RecipePdfA4 } = await import("./RecipePdfA4");
        const { RecipePdfA5 } = await import("./RecipePdfA5");

        const recipe = isEditing && editData ? editData : selectedRecipe;
        const totals = calculateRecipeTotals(recipe, multiplier);
        const currentIngs = recipe.ingredients || [];
        const totalWeight = currentIngs.reduce((sum, ing) => {
            const article = articles.find(a => a.id === ing.articleId);
            const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
            return sum + convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
        }, 0);
        const lossRate = recipe.costing.lossRate || 0;
        const weightAfterLoss = totalWeight * (1 - lossRate / 100);
        const costPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;
        const subFamily = subFamilies.find(sf => sf.id === recipe.subFamilyId);

        if (format === "A4") {
            const data = {
                name: recipe.name,
                subFamilyName: subFamily?.name || "",
                yieldUnit: recipe.yieldUnit || "portion(s)",
                yieldQty: recipe.yield || 1,
                ingredients: currentIngs.map(ing => {
                    const article = articles.find(a => a.id === ing.articleId);
                    const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                    const quantity = (ing.quantity || 0) * multiplier;
                    return { name: ing.name, quantity, unit };
                }),
                image1: recipe.image,
                steps: recipe.steps || [],
                nutrition: recipe.nutrition || {},
                costing: {
                    materialCost: totals.materialCost,
                    totalCost: totals.totalCost,
                    totalWeight,
                    weightAfterLoss,
                    costPerKg,
                    lossRate,
                },
            };
            const blob = await pdf(<RecipePdfA4 data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            const data = {
                name: recipe.name,
                subFamilyName: subFamily?.name || "",
                yieldUnit: recipe.yieldUnit || "portion(s)",
                yieldQty: recipe.yield || 1,
                ingredients: currentIngs.map(ing => {
                    const article = articles.find(a => a.id === ing.articleId);
                    const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                    const quantity = (ing.quantity || 0) * multiplier;
                    return { name: ing.name, quantity, unit };
                }),
                steps: recipe.steps || [],
            };
            const blob = await pdf(<RecipePdfA5 data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
        }
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

                            {/* Family Search */}
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={familySearch}
                                        onChange={(e) => {
                                            setFamilySearch(e.target.value);
                                            setShowFamilyDropdown(true);
                                            setFamilySearchFocusIndex(0);
                                        }}
                                        onFocus={() => setShowFamilyDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowFamilyDropdown(false), 200)}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setFamilySearchFocusIndex(prev => Math.min(prev + 1, filteredFamilies.length - 1));
                                            } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setFamilySearchFocusIndex(prev => Math.max(prev - 1, 0));
                                            } else if (e.key === "Enter") {
                                                e.preventDefault();
                                                if (filteredFamilies[familySearchFocusIndex]) {
                                                    setFilterFamily(filteredFamilies[familySearchFocusIndex].name);
                                                    setFamilySearch(filteredFamilies[familySearchFocusIndex].name);
                                                    setShowFamilyDropdown(false);
                                                }
                                            } else if (e.key === "Escape") {
                                                setShowFamilyDropdown(false);
                                            }
                                        }}
                                        placeholder="Rechercher par famille..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm placeholder:text-slate-300"
                                    />
                                    {familySearch && (
                                        <button
                                            onClick={() => {
                                                setFamilySearch("");
                                                setFilterFamily("Tous");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {showFamilyDropdown && filteredFamilies.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {filteredFamilies.map((fam, idx) => (
                                            <div
                                                key={fam.id}
                                                onClick={() => {
                                                    setFilterFamily(fam.name);
                                                    setFamilySearch(fam.name);
                                                    setShowFamilyDropdown(false);
                                                }}
                                            className={cn(
                                                    "px-4 py-2 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group",
                                                    idx === familySearchFocusIndex ? "bg-emerald-100" : "hover:bg-emerald-50",
                                                    filterFamily === fam.name && "bg-emerald-50"
                                                )}
                                            >
                                                <span className={cn(
                                                    "font-medium text-sm",
                                                    idx === familySearchFocusIndex ? "text-emerald-800" : "text-slate-700 group-hover:text-emerald-700"
                                                )}>{fam.name}</span>
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded",
                                                    idx === familySearchFocusIndex ? "bg-emerald-200 text-emerald-700" : "text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                                )}>{fam.code}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sub-Family Search */}
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={subFamilySearch}
                                        onChange={(e) => {
                                            setSubFamilySearch(e.target.value);
                                            setShowSubFamilyDropdown(true);
                                            setSubFamilySearchFocusIndex(0);
                                        }}
                                        onFocus={() => setShowSubFamilyDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowSubFamilyDropdown(false), 200)}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setSubFamilySearchFocusIndex(prev => Math.min(prev + 1, filteredSubFamilies.length - 1));
                                            } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setSubFamilySearchFocusIndex(prev => Math.max(prev - 1, 0));
                                            } else if (e.key === "Enter") {
                                                e.preventDefault();
                                                if (filteredSubFamilies[subFamilySearchFocusIndex]) {
                                                    const selectedSubFam = filteredSubFamilies[subFamilySearchFocusIndex];
                                                    setSubFamilySearch(selectedSubFam.name);
                                                    setShowSubFamilyDropdown(false);
                                                    // Filter recipes by sub-family
                                                    const filtered = recipes.filter(r => r.subFamilyId === selectedSubFam.name);
                                                    if (filtered.length > 0) {
                                                        setSelectedRecipeId(filtered[0].id);
                                                    }
                                                }
                                            } else if (e.key === "Escape") {
                                                setShowSubFamilyDropdown(false);
                                            }
                                        }}
                                        placeholder="Rechercher par sous-famille..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-sm placeholder:text-slate-300"
                                    />
                                    {subFamilySearch && (
                                        <button
                                            onClick={() => {
                                                setSubFamilySearch("");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                {showSubFamilyDropdown && filteredSubFamilies.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {filteredSubFamilies.map((subFam, idx) => {
                                            const parentFamily = productionFamilies.find(f => f.id === subFam.familyId);
                                            return (
                                                <div
                                                    key={subFam.id}
                                                    onClick={() => {
                                                        setSubFamilySearch(subFam.name);
                                                        setShowSubFamilyDropdown(false);
                                                        // Filter recipes by sub-family
                                                        const filtered = recipes.filter(r => r.subFamilyId === subFam.name);
                                                        if (filtered.length > 0) {
                                                            setSelectedRecipeId(filtered[0].id);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group",
                                                        idx === subFamilySearchFocusIndex ? "bg-emerald-100" : "hover:bg-emerald-50"
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "font-medium text-sm",
                                                            idx === subFamilySearchFocusIndex ? "text-emerald-800" : "text-slate-700 group-hover:text-emerald-700"
                                                        )}>{subFam.name}</span>
                                                        {parentFamily && (
                                                            <span className="text-xs text-slate-400">{parentFamily.name}</span>
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-bold px-2 py-0.5 rounded",
                                                        idx === subFamilySearchFocusIndex ? "bg-emerald-200 text-emerald-700" : "text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                                    )}>{subFam.code}</span>
                                                </div>
                                    );
                                })}
                                    </div>
                                )}
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
                                            costing: { materialCost: 0, lossRate: 0, laborCost: 0, storageCost: 0, totalCost: 0, costPerUnit: 0 },
                                            isSubRecipe: false
                                        };
                                        // Optimistically add to cache
                                        queryClient.setQueryData<Recipe[]>(["recipes"], (old = []) => [...old, newRecipe]);
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

                        <div
                            ref={sidebarListRef}
                            className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200"
                        >
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
                                                <div className="flex-1 min-w-0">
                                                <h3 className={cn(
                                                    "text-sm font-bold truncate transition-colors",
                                                    isSelected ? "text-emerald-900" : "text-slate-700"
                                                )}>
                                                    {recipe.name}
                                                </h3>
                                                    {recipe.code && (
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {recipe.code}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                                    {(() => {
                                                        const totals = calculateRecipeTotals(recipe, 1);
                                                        const totalWeight = (recipe.ingredients || []).reduce((sum, ing) => {
                                                            const article = articles.find(a => a.id === ing.articleId);
                                                            const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                            return sum + convertToProductionWeight(article, ing.quantity || 0, unit);
                                                        }, 0);
                                                        const lossRate = recipe.costing.lossRate || 0;
                                                        const weightAfterLoss = totalWeight * (1 - lossRate / 100);
                                                        const costPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;
                                                        return `${costPerKg.toFixed(2)} Dh / kg`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                <span>{subFamilies.find(sf => sf.id === recipe.subFamilyId)?.name || recipe.subFamilyId}</span>
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
                                            {isEditing && isEditing && editData ? (
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
                                                    <div className="flex justify-between items-center mt-1">
                                                        <label className="flex items-center gap-2 cursor-pointer group">
                                                            <input
                                                                type="checkbox"
                                                                checked={editData.isSubRecipe || false}
                                                                onChange={(e) => updateEditData('isSubRecipe', e.target.checked)}
                                                                className="w-4 h-4 text-emerald-600 bg-slate-50 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                                            />
                                                            <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700 flex items-center gap-1">
                                                                <ChefHat className="w-3 h-3" />
                                                                Utiliser comme sous-recette
                                                            </span>
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            {editData.code && (
                                                                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-2 py-1">
                                                                    {editData.code}
                                                                </span>
                                                            )}
                                                        <input
                                                            type="text"
                                                            value={editData.reference || ""}
                                                            onChange={(e) => updateEditData('reference', e.target.value)}
                                                            placeholder="Référence"
                                                            className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none text-right w-32"
                                                        />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                                                        <span className="bg-emerald-50 px-2 py-1 rounded-md">{selectedRecipe.familyId}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="text-slate-500">{subFamilies.find(sf => sf.id === selectedRecipe.subFamilyId)?.name || selectedRecipe.subFamilyId}</span>
                                                        {selectedRecipe.isSubRecipe && (
                                                            <>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1">
                                                                    <ChefHat className="w-3 h-3" />
                                                                    Sous-Recette
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h1 className="text-4xl font-black tracking-tight text-slate-800 mt-1">{selectedRecipe.name}</h1>
                                                        <button
                                                            onClick={() => {
                                                                setEditData({ ...selectedRecipe });
                                                                setIsEditing(true);
                                                            }}
                                                            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm mt-1"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={handleDeleteRecipe}
                                                            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-sm mt-1"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                    {selectedRecipe.code && (
                                                        <span className="text-sm font-mono font-bold text-slate-500 mt-1 block">
                                                            {selectedRecipe.code}
                                                        </span>
                                                    )}
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
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 border-b border-slate-100 flex gap-8 items-center bg-white sticky top-0 z-30 shadow-sm h-14 shrink-0">
                                    {[
                                        { id: "ingredients", label: "Ingrédients", icon: Utensils },
                                        { id: "steps", label: "Préparation", icon: Timer },
                                        { id: "nutrition", label: "A4", icon: Printer },
                                        { id: "costing", label: "A5", icon: Printer },
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
                                            <div className="col-span-12 space-y-8">
                                                {/* Table des Ingrédients */}
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                        <Scale className="w-5 h-5 text-emerald-500" />
                                                        Liste des Ingrédients
                                                    </h3>
                                                        <div className="flex items-center gap-3 bg-emerald-900 rounded-lg p-1 border border-emerald-700">
                                                        <button
                                                            onClick={() => setMultiplier(Math.max(1, multiplier - 1))}
                                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-200 border border-emerald-300 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100 shadow-sm transition-all disabled:cursor-not-allowed"
                                                            disabled={multiplier <= 1}
                                                        >
                                                            <Minus className="w-3.5 h-3.5" />
                                                        </button>
                                                            <span className="text-sm font-black text-white w-16 text-center">
                                                            Coeff: {multiplier}
                                                        </span>
                                                        <button
                                                            onClick={() => setMultiplier(multiplier + 1)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-200 border border-emerald-300 text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100 shadow-sm transition-all"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <table className="w-full border-collapse">
                                                    <thead className="bg-emerald-100 border-t-2 border-emerald-300">
                                                        <tr className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                                                            <th className="text-left px-4 py-3 w-[25%] bg-transparent">Ingrédient</th>
                                                            <th className="text-right px-2 py-3 w-[8%] bg-transparent">Quantité</th>
                                                            <th className="text-center px-2 py-3 w-[8%] border-l border-emerald-200">Unité</th>
                                                            <th className="text-right px-3 py-3 w-[10%] border-l border-emerald-200">PU (Pivot)</th>
                                                            <th className="text-right px-3 py-3 w-[12%] border-l border-emerald-200">Poids (g)</th>
                                                            <th className="text-right px-2 py-3 w-[8%] border-l border-emerald-200">% Poids</th>
                                                            <th className="text-right px-3 py-3 w-[12%] border-l border-emerald-200">Coût</th>
                                                            <th className="text-right px-3 py-3 w-[8%] border-l border-emerald-200">% Coût</th>
                                                            {editData && <th className="w-[7%]"></th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(() => {
                                                            const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                            const ingsWithCalculations = currentIngs.map(ing => {
                                                                const article = articles.find(a => a.id === ing.articleId);
                                                                const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                const cost = calculateCostFromUnit(article, ing.quantity || 0, unit) * multiplier;
                                                                const weight = convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
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
                                                                const pu = getPivotPriceFromLatestTransaction(article);

                                                                return (
                                                                    <tr key={ing.id} className="hover:bg-[#F0FDF4]/50 transition-colors group">
                                                                        <td className="px-4 py-3 text-sm font-bold text-slate-700 bg-transparent">
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
                                                                                            {getFilteredArticles(ing.name).map((article, sIdx) => {
                                                                                                const isSubRecipe = article.isSubRecipe === true;
                                                                                                return (
                                                                                                <div
                                                                                                    key={article.id}
                                                                                                    onClick={(e) => {
                                                                                                        e.preventDefault();
                                                                                                        e.stopPropagation();
                                                                                                        handleUpdateIngredientFromSearch(idx, article);
                                                                                                    }}
                                                                                                    className={cn(
                                                                                                        "px-3 py-2 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group",
                                                                                                            searchFocusIndex === sIdx ? "bg-emerald-100" : "hover:bg-emerald-50",
                                                                                                            isSubRecipe && "bg-blue-50 border-l-2 border-l-blue-400"
                                                                                                    )}
                                                                                                >
                                                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                                            {isSubRecipe && <ChefHat className="w-3 h-3 text-blue-600 shrink-0" />}
                                                                                                    <span className={cn(
                                                                                                                "font-bold text-xs truncate",
                                                                                                                searchFocusIndex === sIdx ? "text-emerald-800" : "text-slate-700 group-hover:text-emerald-700",
                                                                                                                isSubRecipe && "text-blue-800"
                                                                                                            )}>
                                                                                                                {article.name}
                                                                                                                {isSubRecipe && <span className="text-[9px] text-blue-600 ml-1">(SR)</span>}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    <span className={cn(
                                                                                                        "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                                                                                                            searchFocusIndex === sIdx ? "bg-emerald-200 text-emerald-700" : "text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600",
                                                                                                            isSubRecipe && "bg-blue-100 text-blue-700"
                                                                                                    )}>{article.unitProduction || article.unitPivot}</span>
                                                                                                </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ) : ing.name}
                                                                        </td>
                                                                        <td className="px-2 py-3 text-sm font-medium text-slate-600 text-right bg-transparent">
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
                                                                                        
                                                                                        // Pour les sous-recettes, utiliser l'unité pivot (Kg) ou production (g)
                                                                                        let unit: string;
                                                                                        if (article?.isSubRecipe === true) {
                                                                                            // Conserver l'unité actuelle si c'est Kg ou g, sinon utiliser Kg par défaut
                                                                                            unit = (ing.unit === "Kg" || ing.unit === "g") ? ing.unit : (article.unitPivot || "Kg");
                                                                                        } else {
                                                                                            unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                                        }
                                                                                        
                                                                                        const newCost = calculateCostFromUnit(article, qty, unit) * multiplier;
                                                                                        const newIngs = [...(editData?.ingredients || [])];
                                                                                        newIngs[idx] = { ...ing, quantity: qty, unit: unit, cost: newCost };
                                                                                        updateEditData('ingredients', newIngs);
                                                                                    }}
                                                                                    className="w-full text-right bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-sm focus:outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                />
                                                                            ) : (ing.quantity * multiplier).toLocaleString()}
                                                                        </td>
                                                                        <td className="px-2 py-3 text-xs font-bold text-slate-400 text-center uppercase border-l border-slate-100">
                                                                            {isEditing && editData ? (
                                                                                <select
                                                                                    value={ing.unit}
                                                                                    onChange={(e) => {
                                                                                        const newUnit = e.target.value;
                                                                                        const article = articles.find(a => a.id === ing.articleId);
                                                                                        const newCost = calculateCostFromUnit(article, ing.quantity, newUnit) * multiplier;
                                                                                        const newIngs = [...(editData.ingredients || [])];
                                                                                        newIngs[idx] = { ...ing, unit: newUnit, cost: newCost };
                                                                                        updateEditData('ingredients', newIngs);
                                                                                    }}
                                                                                    className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-600 text-center uppercase focus:ring-0 focus:outline-none cursor-pointer hover:text-emerald-600 [appearance:none] [-webkit-appearance:none] [-moz-appearance:none]"
                                                                                >
                                                                                    {getAvailableUnits(articles.find(a => a.id === ing.articleId)).map(unit => (
                                                                                        <option key={unit} value={unit}>{unit}</option>
                                                                                    ))}
                                                                                </select>
                                                                            ) : ing.unit}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm font-medium text-slate-500 text-right font-mono border-l border-slate-100">
                                                                            {pu.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm font-bold text-slate-700 text-right border-l border-slate-100">
                                                                            {weight.toLocaleString()}
                                                                        </td>
                                                                        <td className="px-2 py-3 text-[11px] font-black text-[#16A34A] text-right bg-[#F0FDF4]/30 border-l border-slate-100">
                                                                            {weightPct.toFixed(1)}%
                                                                        </td>
                                                                        <td className="px-3 py-3 text-sm font-black text-slate-800 text-right border-l border-slate-100">
                                                                            {cost.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-3 py-3 text-[11px] font-black text-emerald-700 text-right bg-emerald-50/50 border-l border-slate-100">
                                                                            {costPct.toFixed(1)}%
                                                                        </td>
                                                                        {isEditing && editData && (
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
                                                            const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                            const ingsCalculated = currentIngs.map(ing => {
                                                                const article = articles.find(a => a.id === ing.articleId);
                                                                return {
                                                                    weight: convertToProductionWeight(article, ing.quantity, ing.unit) * multiplier,
                                                                    cost: calculateCostFromUnit(article, ing.quantity, ing.unit) * multiplier
                                                                };
                                                            });
                                                            const totalWeight = ingsCalculated.reduce((acc, curr) => acc + curr.weight, 0);
                                                            const totalCost = ingsCalculated.reduce((acc, curr) => acc + curr.cost, 0);

                                                            return (
                                                                <tr className="text-slate-800 font-black bg-emerald-100">
                                                                    <td className="px-4 py-3 text-left text-xs font-bold text-emerald-800 bg-transparent">TOTAUX</td>
                                                                    <td colSpan={2} className="px-2 py-3 bg-transparent"></td>
                                                                    <td className="px-3 py-3 text-right text-sm font-mono text-emerald-800 border-l border-emerald-200"></td>
                                                                    <td className="px-3 py-3 text-right text-sm text-emerald-800 border-l border-emerald-200">{totalWeight.toLocaleString()} <span className="text-[10px] text-emerald-600">g</span></td>
                                                                    <td className="px-2 py-3 text-right text-xs text-emerald-800 border-l border-emerald-200">100%</td>
                                                                    <td className="px-3 py-3 text-right text-sm text-emerald-800 border-l border-emerald-200">{totalCost.toFixed(2)} <span className="text-[10px] text-emerald-600">Dh</span></td>
                                                                    <td className="px-3 py-3 text-right text-xs text-emerald-800 border-l border-emerald-200">100%</td>
                                                                    {editData && <td></td>}
                                                                </tr>
                                                            );
                                                        })()}
                                                    </tfoot>
                                                </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Costing Section - Integrated into Ingredients tab */}
                                        {activeTab === "ingredients" && (
                                            <>
                                            <div className="grid grid-cols-2 gap-4 mt-6 items-stretch">
                                                {/* Left: Costing Table (50%) */}
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
                                                    {/* Header */}
                                                    <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                                                                1
                                                            </div>
                                                            <h3 className="font-black text-sm text-emerald-900">RECETTES</h3>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button className="p-1 hover:bg-emerald-100 rounded-lg transition-colors" title="Imprimer A4">
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <Printer className="w-3.5 h-3.5 text-emerald-700" />
                                                                    <span className="text-[8px] font-bold text-emerald-700">A4</span>
                                                                </div>
                                                            </button>
                                                            <button className="p-1 hover:bg-emerald-100 rounded-lg transition-colors" title="Imprimer A5">
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <Printer className="w-3.5 h-3.5 text-emerald-700" />
                                                                    <span className="text-[8px] font-bold text-emerald-700">A5</span>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="p-3">
                                                        {(() => {
                                                            const totals = calculateRecipeTotals(isEditing && editData ? editData : selectedRecipe, multiplier);
                                                            const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                            const totalWeight = currentIngs.reduce((sum, ing) => {
                                                                const article = articles.find(a => a.id === ing.articleId);
                                                                const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                return sum + convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
                                                            }, 0);
                                                            const lossRate = (isEditing && editData ? editData : selectedRecipe)?.costing?.lossRate || 0;
                                                            const weightAfterLoss = totalWeight * (1 - lossRate / 100);
                                                            const costPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;

                                                            return (
                                                                <div className="space-y-4">
                                                                    {/* Summary Row */}
                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-slate-600">Vérifié</span>
                                                                            <input
                                                                                type="checkbox"
                                                                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            <span className="text-xs font-bold text-slate-600">Poids Brut</span>
                                                                            <input
                                                                                type="text"
                                                                                value={`${totalWeight.toLocaleString('fr-FR')} g`}
                                                                                readOnly
                                                                                className="w-[89.6px] text-right bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-bold text-blue-900"
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            <span className="text-xs font-bold text-slate-600">Coût Matière</span>
                                                                            <input
                                                                                type="text"
                                                                                value={`${totals.materialCost.toFixed(2).replace('.', ',')} Dh`}
                                                                                readOnly
                                                                                className="w-[89.6px] text-right bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-bold text-blue-900"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Cost Breakdown */}
                                                                    <div className="space-y-1.5">
                                                                    {/* Taux Perte */}
                                                                    <div className="grid grid-cols-4 gap-1 items-center">
                                                                        <span className="text-xs font-bold text-slate-700">Taux Perte</span>
                                                                        {isEditing && editData ? (
                                                                            <input
                                                                                type="number"
                                                                                value={editData.costing.lossRate || 0}
                                                                                onChange={(e) => {
                                                                                    const newLossRate = Number(e.target.value);
                                                                                    updateEditData('costing', { ...editData.costing, lossRate: newLossRate });
                                                                                }}
                                                                                className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                placeholder="0"
                                                                            />
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                value={`${selectedRecipe.costing.lossRate || 0} %`}
                                                                                readOnly
                                                                                className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                            />
                                                                        )}
                                                                        <div></div>
                                                                        <input
                                                                            type="text"
                                                                            value={`${weightAfterLoss.toLocaleString('fr-FR')} g`}
                                                                            readOnly
                                                                            className="w-[89.6px] bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-bold text-blue-900 text-right ml-auto"
                                                                        />
                                                                    </div>

                                                                        {/* Personnel */}
                                                                        <div className="grid grid-cols-4 gap-1 items-center">
                                                                            <span className="text-xs font-bold text-slate-700">Personnel</span>
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={(editData.costing as any).laborTime || "0:20"}
                                                                                    onChange={(e) => {
                                                                                        const newCosting = { ...editData.costing, laborTime: e.target.value };
                                                                                        updateEditData('costing', newCosting);
                                                                                    }}
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                    placeholder="0:00"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={(selectedRecipe.costing as any).laborTime || "0:20"}
                                                                                    readOnly
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                />
                                                                            )}
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    value={(editData.costing as any).laborCostPerHour || 0}
                                                                                    onChange={(e) => {
                                                                                        const costPerHour = Number(e.target.value);
                                                                                        const timeStr = (editData.costing as any).laborTime || "0:20";
                                                                                        const [hours, minutes] = timeStr.split(':').map(Number);
                                                                                        const totalHours = hours + (minutes || 0) / 60;
                                                                                        const totalCost = totalHours * costPerHour;
                                                                                        const newCosting = { 
                                                                                            ...editData.costing, 
                                                                                            laborCostPerHour: costPerHour,
                                                                                            laborCost: totalCost
                                                                                        };
                                                                                        updateEditData('costing', newCosting);
                                                                                    }}
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                    placeholder="0"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={`${((selectedRecipe.costing as any).laborCostPerHour || 0).toFixed(2).replace('.', ',')} Dh/h`}
                                                                                    readOnly
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                />
                                                                            )}
                                                                            <input
                                                                                type="text"
                                                                                value={(() => {
                                                                                    const timeStr = ((isEditing && editData ? editData : selectedRecipe)?.costing) as any;
                                                                                    const time = timeStr.laborTime || "0:20";
                                                                                    const costPerHour = timeStr.laborCostPerHour || 0;
                                                                                    const [hours, minutes] = time.split(':').map(Number);
                                                                                    const totalHours = hours + (minutes || 0) / 60;
                                                                                    const totalCost = totalHours * costPerHour;
                                                                                    return `${totalCost.toFixed(2).replace('.', ',')} Dh`;
                                                                                })()}
                                                                                readOnly
                                                                                className="w-[89.6px] bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-bold text-blue-900 text-right ml-auto"
                                                                            />
                                                                        </div>

                                                                        {/* Machines */}
                                                                        <div className="grid grid-cols-4 gap-1 items-center">
                                                                            <span className="text-xs font-bold text-slate-700">Machines</span>
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={(editData.costing as any).machineTime || "0:00"}
                                                                                    onChange={(e) => {
                                                                                        const timeStr = e.target.value;
                                                                                        const costPerHour = (editData.costing as any).machineCostPerHour || 0;
                                                                                        const [hours, minutes] = timeStr.split(':').map(Number);
                                                                                        const totalHours = hours + (minutes || 0) / 60;
                                                                                        const totalCost = totalHours * costPerHour;
                                                                                        const newCosting = { 
                                                                                            ...editData.costing, 
                                                                                            machineTime: timeStr,
                                                                                            machineCost: totalCost
                                                                                        };
                                                                                        updateEditData('costing', newCosting);
                                                                                    }}
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                    placeholder="0:00"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={(selectedRecipe.costing as any).machineTime || "0:00"}
                                                                                    readOnly
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                />
                                                                            )}
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    value={(editData.costing as any).machineCostPerHour || 0}
                                                                                    onChange={(e) => {
                                                                                        const costPerHour = Number(e.target.value);
                                                                                        const timeStr = (editData.costing as any).machineTime || "0:00";
                                                                                        const [hours, minutes] = timeStr.split(':').map(Number);
                                                                                        const totalHours = hours + (minutes || 0) / 60;
                                                                                        const totalCost = totalHours * costPerHour;
                                                                                        const newCosting = { 
                                                                                            ...editData.costing, 
                                                                                            machineCostPerHour: costPerHour,
                                                                                            machineCost: totalCost
                                                                                        };
                                                                                        updateEditData('costing', newCosting);
                                                                                    }}
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                    placeholder="0"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={`${((selectedRecipe.costing as any).machineCostPerHour || 0).toFixed(2).replace('.', ',')} Dh/h`}
                                                                                    readOnly
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                />
                                                                            )}
                                                                            <input
                                                                                type="text"
                                                                                value={(() => {
                                                                                    const timeStr = ((isEditing && editData ? editData : selectedRecipe)?.costing) as any;
                                                                                    const time = timeStr.machineTime || "0:00";
                                                                                    const costPerHour = timeStr.machineCostPerHour || 0;
                                                                                    const [hours, minutes] = time.split(':').map(Number);
                                                                                    const totalHours = hours + (minutes || 0) / 60;
                                                                                    const totalCost = totalHours * costPerHour;
                                                                                    return `${totalCost.toFixed(2).replace('.', ',')} Dh`;
                                                                                })()}
                                                                                readOnly
                                                                                className="w-[89.6px] bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-bold text-blue-900 text-right ml-auto"
                                                                            />
                                                                        </div>

                                                                        {/* Stockage */}
                                                                        <div className="grid grid-cols-4 gap-1 items-center">
                                                                            <span className="text-xs font-bold text-slate-700">Stockage</span>
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    type="text"
                                                                                    value={(editData.costing as any).storageTime || "00:0"}
                                                                                    onChange={(e) => {
                                                                                        const timeStr = e.target.value;
                                                                                        const costPerHour = (editData.costing as any).storageCostPerHour || 0;
                                                                                        const [hours, minutes] = timeStr.split(':').map(Number);
                                                                                        const totalHours = hours + (minutes || 0) / 60;
                                                                                        const totalCost = totalHours * costPerHour;
                                                                                        const newCosting = { 
                                                                                            ...editData.costing, 
                                                                                            storageTime: timeStr,
                                                                                            storageCost: totalCost
                                                                                        };
                                                                                        updateEditData('costing', newCosting);
                                                                                    }}
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                    placeholder="00:0"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={(selectedRecipe.costing as any).storageTime || "00:0"}
                                                                                    readOnly
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                />
                                                                            )}
                                                                            {isEditing && editData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    value={(editData.costing as any).storageCostPerHour || 0}
                                                                                    onChange={(e) => {
                                                                                        const costPerHour = Number(e.target.value);
                                                                                        const timeStr = (editData.costing as any).storageTime || "00:0";
                                                                                        const [hours, minutes] = timeStr.split(':').map(Number);
                                                                                        const totalHours = hours + (minutes || 0) / 60;
                                                                                        const totalCost = totalHours * costPerHour;
                                                                                        const newCosting = { 
                                                                                            ...editData.costing, 
                                                                                            storageCostPerHour: costPerHour,
                                                                                            storageCost: totalCost
                                                                                        };
                                                                                        updateEditData('costing', newCosting);
                                                                                    }}
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                    placeholder="0"
                                                                                />
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={`${((selectedRecipe.costing as any).storageCostPerHour || 0).toFixed(2).replace('.', ',')} Dh/h`}
                                                                                    readOnly
                                                                                    className="w-[89.6px] bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 text-right ml-auto"
                                                                                />
                                                                            )}
                                                                            <input
                                                                                type="text"
                                                                                value={(() => {
                                                                                    const timeStr = ((isEditing && editData ? editData : selectedRecipe)?.costing) as any;
                                                                                    const time = timeStr.storageTime || "00:0";
                                                                                    const costPerHour = timeStr.storageCostPerHour || 0;
                                                                                    const [hours, minutes] = time.split(':').map(Number);
                                                                                    const totalHours = hours + (minutes || 0) / 60;
                                                                                    const totalCost = totalHours * costPerHour;
                                                                                    return `${totalCost.toFixed(2).replace('.', ',')} Dh`;
                                                                                })()}
                                                                                readOnly
                                                                                className="w-[89.6px] bg-blue-50 border border-blue-200 rounded px-2 py-1 text-xs font-bold text-blue-900 text-right ml-auto"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Totals */}
                                                                    <div className="pt-2 border-t border-slate-200">
                                                                        <div className="grid grid-cols-4 gap-1 items-center">
                                                                            <div></div>
                                                                            <div></div>
                                                                            <span className="text-sm font-bold text-slate-800 text-right">Coût Global</span>
                                                                            <input
                                                                                type="text"
                                                                                value={`${totals.totalCost.toFixed(2).replace('.', ',')} Dh`}
                                                                                readOnly
                                                                                className="w-[89.6px] bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-sm font-black text-emerald-900 text-right ml-auto"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Right: Summary Card (50%) */}
                                                <div className="bg-emerald-900 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col h-full">
                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                                                    <div className="relative mb-6">
                                                        <h3 className="text-emerald-300 font-bold text-xs uppercase tracking-[0.2em] mb-4">Prix / kg</h3>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-5xl font-black text-white tracking-tighter">
                                                                {(() => {
                                                                    const totals = calculateRecipeTotals(isEditing && editData ? editData : selectedRecipe, multiplier);
                                                                    const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                                    const totalWeight = currentIngs.reduce((sum, ing) => {
                                                                        const article = articles.find(a => a.id === ing.articleId);
                                                                        const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                        return sum + convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
                                                                    }, 0);
                                                                    const lossRate = (isEditing && editData ? editData : selectedRecipe)?.costing?.lossRate || 0;
                                                                    const weightAfterLoss = totalWeight * (1 - lossRate / 100);
                                                                    const baseCostPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;
                                                                    return baseCostPerKg.toFixed(2);
                                                                })()}
                                                            </span>
                                                            <span className="text-lg font-bold text-emerald-400">Dh</span>
                                                        </div>
                                                    </div>

                                                    <div className="relative flex-1">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-emerald-700/30">
                                                                    <th className="text-left py-2 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Nom</th>
                                                                    <th className="text-right py-2 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Poids</th>
                                                                    <th className="text-right py-2 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">Prix</th>
                                                                    {isEditing && editData && <th className="w-8"></th>}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(() => {
                                                                    const totals = calculateRecipeTotals(isEditing && editData ? editData : selectedRecipe, multiplier);
                                                                    const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                                    const totalWeight = currentIngs.reduce((sum, ing) => {
                                                                        const article = articles.find(a => a.id === ing.articleId);
                                                                        const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                        return sum + convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
                                                                    }, 0);
                                                                    const lossRate = (isEditing && editData ? editData : selectedRecipe)?.costing?.lossRate || 0;
                                                                    const weightAfterLoss = totalWeight * (1 - lossRate / 100);
                                                                    const baseCostPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;
                                                                    const recipeName = (isEditing && editData ? editData : selectedRecipe)?.name;
                                                                    
                                                                    // Get display items from costing or create default
                                                                    const displayItems = (editData?.costing as any)?.displayItems || (selectedRecipe.costing as any)?.displayItems || [
                                                                        {
                                                                            id: 'default',
                                                                            name: recipeName,
                                                                            weight: weightAfterLoss,
                                                                            price: totals.totalCost
                                                                        }
                                                                    ];

                                                                    return displayItems.map((item: any, idx: number) => {
                                                                        const calculatedPrice = baseCostPerKg > 0 ? (item.weight / 1000) * baseCostPerKg : 0;
                                                                        const itemPrice = item.price !== undefined ? item.price : calculatedPrice;
                                                                        
                                                                        return (
                                                                            <tr key={item.id || idx} className="border-b border-emerald-700/20 last:border-0">
                                                                                <td className="text-white text-sm font-bold py-2">
                                                                                    {isEditing && editData ? (
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.name || ""}
                                                                                            onChange={(e) => {
                                                                                                const newItems = [...displayItems];
                                                                                                newItems[idx] = { ...item, name: e.target.value };
                                                                                                const newCosting = { ...editData.costing, displayItems: newItems };
                                                                                                updateEditData('costing', newCosting);
                                                                                            }}
                                                                                            className="w-full bg-emerald-800/40 border border-emerald-700/50 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                                                            placeholder="Nom"
                                                                                        />
                                                                                    ) : (
                                                                                        item.name
                                                                                    )}
                                                                                </td>
                                                                                <td className="text-white text-sm font-bold text-right py-2">
                                                                                    {isEditing && editData ? (
                                                                                        <input
                                                                                            type="number"
                                                                                            step="1"
                                                                                            value={item.weight || 0}
                                                                                            onChange={(e) => {
                                                                                                const newWeight = Number(e.target.value);
                                                                                                const newPrice = baseCostPerKg > 0 ? (newWeight / 1000) * baseCostPerKg : 0;
                                                                                                const newItems = [...displayItems];
                                                                                                newItems[idx] = { ...item, weight: newWeight, price: newPrice };
                                                                                                const newCosting = { ...editData.costing, displayItems: newItems };
                                                                                                updateEditData('costing', newCosting);
                                                                                            }}
                                                                                            className="w-full bg-emerald-800/40 border border-emerald-700/50 rounded px-2 py-1 text-sm font-bold text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                                                            placeholder="0"
                                                                                        />
                                                                                    ) : (
                                                                                        `${item.weight.toLocaleString('fr-FR')} g`
                                                                                    )}
                                                                                </td>
                                                                                <td className="text-white text-sm font-bold text-right py-2">
                                                                                    {isEditing && editData ? (
                                                                                        <span className="text-emerald-300">
                                                                                            {itemPrice.toFixed(2)} Dh
                                                                                        </span>
                                                                                    ) : (
                                                                                        `${itemPrice.toFixed(2)} Dh`
                                                                                    )}
                                                                                </td>
                                                                                {isEditing && editData && (
                                                                                    <td className="py-2">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newItems = displayItems.filter((_: any, i: number) => i !== idx);
                                                                                                if (newItems.length === 0) {
                                                                                                    // If all items deleted, add default
                                                                                                    const defaultItem = {
                                                                                                        id: 'default',
                                                                                                        name: recipeName,
                                                                                                        weight: weightAfterLoss,
                                                                                                        price: totals.totalCost
                                                                                                    };
                                                                                                    newItems.push(defaultItem);
                                                                                                }
                                                                                                const newCosting = { ...editData.costing, displayItems: newItems };
                                                                                                updateEditData('costing', newCosting);
                                                                                            }}
                                                                                            className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-800/50 rounded transition-colors"
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </td>
                                                                                )}
                                                                            </tr>
                                                                        );
                                                                    });
                                                                })()}
                                                                {isEditing && editData && (
                                                                    <tr>
                                                                        <td colSpan={isEditing && editData ? 4 : 3} className="py-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    const totals = calculateRecipeTotals(editData, multiplier);
                                                                                    const currentIngs = editData.ingredients || [];
                                                                                    const totalWeight = currentIngs.reduce((sum, ing) => {
                                                                                        const article = articles.find(a => a.id === ing.articleId);
                                                                                        const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                                        return sum + convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
                                                                                    }, 0);
                                                                                    const lossRate = editData.costing.lossRate || 0;
                                                                                    const weightAfterLoss = totalWeight * (1 - lossRate / 100);
                                                                                    const baseCostPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;
                                                                                    
                                                                                    const currentItems = (editData.costing as any)?.displayItems || [];
                                                                                    const newItem = {
                                                                                        id: `item-${Date.now()}`,
                                                                                        name: "",
                                                                                        weight: 0,
                                                                                        price: 0
                                                                                    };
                                                                                    const newItems = [...currentItems, newItem];
                                                                                    const newCosting = { ...editData.costing, displayItems: newItems };
                                                                                    updateEditData('costing', newCosting);
                                                                                }}
                                                                                className="w-full py-1.5 text-xs font-bold text-emerald-300 hover:text-white hover:bg-emerald-800/50 rounded border border-dashed border-emerald-700/50 transition-colors flex items-center justify-center gap-1"
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" />
                                                                                Ajouter une ligne
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Etapes de Préparation et Valeurs Nutritionnelles - Côte à côte, en dessous de Prix / kg */}
                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                {/* Left: Etapes de Préparation */}
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                                    <div className="p-6 border-b border-slate-100">
                                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                            <ChefHat className="w-5 h-5 text-emerald-500" />
                                                            Etapes de Préparation
                                                        </h3>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-6">
                                                        <div className="space-y-4">
                                                            {((isEditing && editData ? editData : selectedRecipe)?.steps || []).map((step, idx) => (
                                                                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-200 text-emerald-600 font-black flex items-center justify-center flex-shrink-0 text-sm">
                                                                        {step.order || idx + 1}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        {isEditing && editData ? (
                                                                            <div className="space-y-2">
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
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newSteps = editData.steps.filter((_, i) => i !== idx);
                                                                                            updateEditData('steps', newSteps);
                                                                                        }}
                                                                                        className="ml-auto text-red-400 hover:text-red-600 p-1"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <p className="text-slate-700 font-medium text-sm mb-1">{step.description}</p>
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
                                                                <button
                                                                    onClick={() => {
                                                                        const newStep = { order: editData.steps.length + 1, description: "", duration: 0 };
                                                                        updateEditData('steps', [...editData.steps, newStep]);
                                                                    }}
                                                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-400 font-bold hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Ajouter une étape
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Valeurs Nutritionnelles */}
                                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                                                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                                            <Leaf className="w-5 h-5 text-emerald-500" />
                                                            Valeurs Nutritionnelles pour 100g
                                                        </h3>
                                                        {isEditing && editData && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const recipeToUse = { ...editData, ingredients: editData.ingredients || [] };
                                                                    const calc = calculateRecipeNutrition(recipeToUse, articles, recipes);
                                                                    if (calc) {
                                                                        updateEditData('nutrition', calc);
                                                                    } else {
                                                                        alert("Impossible de calculer : aucun ingrédient n'a de données nutritionnelles (ou poids non convertissable en grammes).");
                                                                    }
                                                                }}
                                                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                                                            >
                                                                Calculer depuis ingrédients
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-6">
                                                        <div className="bg-[#F8FAFC] rounded-2xl px-6 py-4 border border-blue-500/20 shadow-2xl shadow-blue-500/5 space-y-3">
                                                            {/* Row 1: Energy & Water */}
                                                            <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                                <div className="flex-1 flex items-center justify-between">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase truncate mr-2">Énergie (Kcal)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={((isEditing && editData ? editData : selectedRecipe)?.nutrition).calories || ""}
                                                                        onChange={(e) => {
                                                                            if (isEditing && editData) {
                                                                                updateEditData('nutrition', { ...editData.nutrition, calories: parseFloat(e.target.value) || 0 });
                                                                            }
                                                                        }}
                                                                        disabled={!isEditing || !editData}
                                                                        className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div className="w-px h-6 bg-slate-100" />
                                                                <div className="flex-1 flex items-center justify-between">
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase truncate mr-2">Eau (%)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={(((isEditing && editData ? editData : selectedRecipe)?.nutrition) as any).water || ""}
                                                                        onChange={(e) => {
                                                                            if (isEditing && editData) {
                                                                                updateEditData('nutrition', { ...editData.nutrition, water: parseFloat(e.target.value) || 0 } as any);
                                                                            }
                                                                        }}
                                                                        disabled={!isEditing || !editData}
                                                                        className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
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
                                                                            value={((isEditing && editData ? editData : selectedRecipe)?.nutrition)[field.key as keyof typeof selectedRecipe.nutrition] || ""}
                                                                            onChange={(e) => {
                                                                                if (isEditing && editData) {
                                                                                    updateEditData('nutrition', { ...editData.nutrition, [field.key]: parseFloat(e.target.value) || 0 });
                                                                                }
                                                                            }}
                                                                            disabled={!isEditing || !editData}
                                                                            className="w-full text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
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
                                                                            value={((isEditing && editData ? editData : selectedRecipe)?.nutrition).carbs || ""}
                                                                            onChange={(e) => {
                                                                                if (isEditing && editData) {
                                                                                    updateEditData('nutrition', { ...editData.nutrition, carbs: parseFloat(e.target.value) || 0 });
                                                                                }
                                                                            }}
                                                                            disabled={!isEditing || !editData}
                                                                            className="w-full text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs font-bold text-slate-800 focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
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
                                                                                value={((isEditing && editData ? editData : selectedRecipe)?.nutrition)[field.key as keyof typeof selectedRecipe.nutrition] || ""}
                                                                                onChange={(e) => {
                                                                                    if (isEditing && editData) {
                                                                                        updateEditData('nutrition', { ...editData.nutrition, [field.key]: parseFloat(e.target.value) || 0 });
                                                                                    }
                                                                                }}
                                                                                disabled={!isEditing || !editData}
                                                                                className="w-full text-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-800 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
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
                                                                        value={((isEditing && editData ? editData : selectedRecipe)?.nutrition).glycemicIndex || ""}
                                                                        onChange={(e) => {
                                                                            if (isEditing && editData) {
                                                                                updateEditData('nutrition', { ...editData.nutrition, glycemicIndex: parseFloat(e.target.value) || 0 });
                                                                            }
                                                                        }}
                                                                        disabled={!isEditing || !editData}
                                                                        className="w-16 text-center bg-slate-50 border border-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 flex items-center justify-between bg-orange-50/50 border border-orange-200 rounded px-3 py-2 shadow-sm">
                                                                    <label className="text-[10px] font-bold text-orange-500 uppercase">CG</label>
                                                                    <input
                                                                        type="number"
                                                                        value={((isEditing && editData ? editData : selectedRecipe)?.nutrition).glycemicLoad || ""}
                                                                        onChange={(e) => {
                                                                            if (isEditing && editData) {
                                                                                updateEditData('nutrition', { ...editData.nutrition, glycemicLoad: parseFloat(e.target.value) || 0 });
                                                                            }
                                                                        }}
                                                                        disabled={!isEditing || !editData}
                                                                        className="w-16 text-center bg-slate-50 border border-slate-200 text-slate-800 rounded px-1 py-0.5 text-xs font-bold focus:border-blue-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-500"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            </>
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
                                                    {((isEditing && editData ? editData : selectedRecipe)?.steps || []).map((step, idx) => (
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
                                            <div className="flex justify-center items-start p-8 bg-slate-50 min-h-screen relative">
                                                <button
                                                    onClick={() => exportPdfAndPrint("A5")}
                                                    className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg transition-colors z-10"
                                                >
                                                    <Printer className="w-5 h-5" />
                                                    Exporter PDF
                                                </button>
                                                {/* Format A5 - 148x210mm, ratio ~1:1.414 */}
                                                <div className="print-recipe-only bg-white shadow-2xl w-full max-w-[148mm] min-h-[210mm] p-8 flex flex-col" style={{ aspectRatio: '148/210' }}>
                                                    {/* En-tête */}
                                                    <div className="border-b-2 border-emerald-600 pb-3 mb-4">
                                                        <h1 className="text-2xl font-black text-slate-900 mb-2">
                                                            {(isEditing && editData ? editData : selectedRecipe)?.name || "Recette"}
                                                        </h1>
                                                        <div className="flex items-center gap-3 text-xs text-slate-600">
                                                            <span className="flex items-center gap-1">
                                                                <ChefHat className="w-3 h-3 text-emerald-600" />
                                                                {(() => {
                                                                    const subFamily = subFamilies.find(sf => sf.id === ((isEditing && editData ? editData : selectedRecipe)?.subFamilyId));
                                                                    return subFamily?.name || "";
                                                                })()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Scale className="w-3 h-3 text-emerald-600" />
                                                                {selectedRecipe?.yield || 1} {selectedRecipe?.yieldUnit || "portion(s)"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ingrédients */}
                                                    <div className="mb-4 flex-1">
                                                        <h2 className="text-lg font-bold text-emerald-700 mb-2 flex items-center gap-2">
                                                            <Utensils className="w-4 h-4" />
                                                            Ingrédients
                                                        </h2>
                                                        <div className="space-y-1.5">
                                                            {(() => {
                                                                const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                                return currentIngs.map((ing, idx) => {
                                                                    const article = articles.find(a => a.id === ing.articleId);
                                                                    const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                    const quantity = (ing.quantity || 0) * multiplier;
                                                                    return (
                                                                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                                                            <span className="text-sm font-medium text-slate-700">{ing.name}</span>
                                                                            <span className="text-sm font-bold text-slate-900">{quantity.toLocaleString('fr-FR')} {unit}</span>
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div>

                                                    {/* Étapes de Préparation */}
                                                    <div className="border-t-2 border-slate-200 pt-4">
                                                        <h2 className="text-lg font-bold text-emerald-700 mb-2 flex items-center gap-2">
                                                            <ChefHat className="w-4 h-4" />
                                                            Préparation
                                                        </h2>
                                                        <div className="space-y-2">
                                                            {((isEditing && editData ? editData : selectedRecipe)?.steps || []).map((step, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-700 font-black flex items-center justify-center flex-shrink-0 text-xs">
                                                                        {step.order || idx + 1}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-slate-700">{step.description}</p>
                                                                        {(step.duration || 0) > 0 && (
                                                                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                                                <Clock className="w-3 h-3" />
                                                                                {step.duration} min
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "nutrition" && (
                                            <div className="flex justify-center items-start p-8 bg-slate-50 min-h-screen relative">
                                                <button
                                                    onClick={() => exportPdfAndPrint("A4")}
                                                    className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg transition-colors z-10"
                                                >
                                                    <Printer className="w-5 h-5" />
                                                    Exporter PDF
                                                </button>
                                                {/* Format A4 - 210x297mm, ratio ~1:1.414 */}
                                                <div className="print-recipe-only bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-12 flex flex-col" style={{ aspectRatio: '210/297' }} lang="fr">
                                                    {/* En-tête */}
                                                    <div className="border-b-2 border-emerald-600 pb-4 mb-6">
                                                        <h1 className="text-3xl font-black text-slate-900 mb-2">
                                                            {(isEditing && editData ? editData : selectedRecipe)?.name || "Recette"}
                                                        </h1>
                                                        <div className="flex items-center gap-4 text-sm text-slate-600">
                                                            <span className="flex items-center gap-1">
                                                                <ChefHat className="w-4 h-4 text-emerald-600" />
                                                                {(() => {
                                                                    const subFamily = subFamilies.find(sf => sf.id === ((isEditing && editData ? editData : selectedRecipe)?.subFamilyId));
                                                                    return subFamily?.name || "";
                                                                })()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Scale className="w-4 h-4 text-emerald-600" />
                                                                Rendement: {selectedRecipe?.yield || 1} {selectedRecipe?.yieldUnit || "portion(s)"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Ingrédients (2/3) + Images (1/3) superposées */}
                                                    <div className="mb-6 flex gap-4">
                                                        <div className="w-2/3">
                                                            <h2 className="text-xl font-bold text-emerald-700 mb-3 flex items-center gap-2">
                                                                <Utensils className="w-5 h-5" />
                                                                Ingrédients
                                                            </h2>
                                                            <div className="space-y-2">
                                                                {(() => {
                                                                    const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                                    return currentIngs.map((ing, idx) => {
                                                                        const article = articles.find(a => a.id === ing.articleId);
                                                                        const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                        const quantity = (ing.quantity || 0) * multiplier;
                                                                        return (
                                                                            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100">
                                                                                <span className="font-medium text-slate-700">{ing.name}</span>
                                                                                <span className="font-bold text-slate-900">{quantity.toLocaleString('fr-FR')} {unit}</span>
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="w-1/3 flex justify-end shrink-0">
                                                            <div className="flex flex-col gap-2">
                                                                <div className="w-[130px] h-[130px] rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-slate-300 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-emerald-400 hover:ring-2 hover:ring-emerald-200">
                                                                    {((isEditing && editData ? editData : selectedRecipe) as any)?.image ? (
                                                                        <img src={((isEditing && editData ? editData : selectedRecipe) as any)?.image} alt="" className="w-full h-full object-cover rounded-2xl" />
                                                                    ) : (
                                                                        <div className="w-full h-full rounded-2xl bg-slate-200" />
                                                                    )}
                                                                </div>
                                                                <div className="w-[130px] h-[130px] rounded-2xl bg-slate-300 shrink-0 border-2 border-slate-300 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-emerald-400 hover:ring-2 hover:ring-emerald-200" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Étapes de Préparation */}
                                                    <div className="mb-6 flex-1 a4-recipe-content">
                                                        <h2 className="text-xl font-bold text-emerald-700 mb-3 flex items-center gap-2">
                                                            <ChefHat className="w-5 h-5" />
                                                            Étapes de Préparation
                                                        </h2>
                                                        <div className="space-y-3">
                                                            {((isEditing && editData ? editData : selectedRecipe)?.steps || []).map((step, idx) => (
                                                                <div key={idx} className="flex gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-700 font-black flex items-center justify-center flex-shrink-0 text-sm">
                                                                        {step.order || idx + 1}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="recipe-step-desc text-slate-700 mb-1" style={{ textAlign: 'justify' }}>{step.description}</p>
                                                                        {(step.duration || 0) > 0 && (
                                                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                                <Clock className="w-3 h-3" />
                                                                                {step.duration} minutes
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Blocs Nutrition + Coût côte à côte en bas (comme le PDF A4) */}
                                                    <div className="flex gap-4 mt-6">
                                                        {/* Valeurs Nutritionnelles — même rendu que le PDF A4 */}
                                                        <div className="flex-1 rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
                                                            <h2 className="text-base font-bold text-emerald-700 mb-3 pb-2 border-b-2 border-emerald-600 flex items-center gap-2">
                                                                <Leaf className="w-5 h-5" />
                                                                Valeurs Nutritionnelles (pour 100g)
                                                            </h2>
                                                            {(() => {
                                                                const nut = (isEditing && editData ? editData : selectedRecipe)?.nutrition;
                                                                return (
                                                                    <>
                                                                        {/* Zone 1 — Bleu ciel */}
                                                                        <div className="rounded-lg border border-sky-300 bg-sky-100 p-3 mb-2">
                                                                            <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider mb-2">Énergie & macros</div>
                                                                            <div className="flex gap-2 mb-2">
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/60 rounded text-xs">
                                                                                    <span className="text-sky-900">Énergie</span>
                                                                                    <span className="font-bold text-sky-700">{nut?.calories || 0} Kcal</span>
                                                                                </div>
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/60 rounded text-xs">
                                                                                    <span className="text-sky-900">Eau</span>
                                                                                    <span className="font-bold text-sky-700">{((nut as any)?.water || 0)} %</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/60 rounded text-xs">
                                                                                    <span className="text-sky-900">Prot.</span>
                                                                                    <span className="font-bold text-sky-700">{nut?.protein || 0} g</span>
                                                                                </div>
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/60 rounded text-xs">
                                                                                    <span className="text-sky-900">Lip</span>
                                                                                    <span className="font-bold text-sky-700">{nut?.fat || 0} g</span>
                                                                                </div>
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/60 rounded text-xs">
                                                                                    <span className="text-sky-900">Min.</span>
                                                                                    <span className="font-bold text-sky-700">{((nut as any)?.minerals || 0)} g</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        {/* Zone 2 — Saumon */}
                                                                        <div className="rounded-lg border border-orange-300 bg-orange-100 p-3">
                                                                            <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-2">Glucides & index glycémique</div>
                                                                            <div className="flex gap-2 mb-2">
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/50 rounded text-xs">
                                                                                    <span className="text-orange-900">Glu.</span>
                                                                                    <span className="font-bold text-orange-700">{nut?.carbs || 0} g</span>
                                                                                </div>
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/50 rounded text-xs">
                                                                                    <span className="text-orange-900">Suc.</span>
                                                                                    <span className="font-bold text-orange-700">{((nut as any)?.sugars || 0)} g</span>
                                                                                </div>
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/50 rounded text-xs">
                                                                                    <span className="text-orange-900">Fib.</span>
                                                                                    <span className="font-bold text-orange-700">{((nut as any)?.fiber || 0)} g</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/50 rounded text-xs">
                                                                                    <span className="text-orange-900">IG</span>
                                                                                    <span className="font-bold text-orange-700">{(nut as any)?.glycemicIndex ?? "-"}</span>
                                                                                </div>
                                                                                <div className="flex-1 flex justify-between items-center px-2 py-1.5 bg-white/50 rounded text-xs">
                                                                                    <span className="text-orange-900">CG</span>
                                                                                    <span className="font-bold text-orange-700">{(nut as any)?.glycemicLoad ?? "-"}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Informations de Coût */}
                                                        <div className="flex-1 rounded-xl border-2 border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
                                                            <h2 className="text-base font-bold text-emerald-700 mb-3 pb-2 border-b-2 border-emerald-600 flex items-center gap-2">
                                                                <DollarSign className="w-5 h-5" />
                                                                Informations de Coût
                                                            </h2>
                                                            {(() => {
                                                                const totals = calculateRecipeTotals(isEditing && editData ? editData : selectedRecipe, multiplier);
                                                                const currentIngs = (isEditing && editData ? editData : selectedRecipe)?.ingredients || [];
                                                                const totalWeight = currentIngs.reduce((sum, ing) => {
                                                                    const article = articles.find(a => a.id === ing.articleId);
                                                                    const unit = ing.unit || article?.unitProduction || article?.unitPivot || article?.unitAchat || "";
                                                                    return sum + convertToProductionWeight(article, ing.quantity || 0, unit) * multiplier;
                                                                }, 0);
                                                                const lossRate = (isEditing && editData ? editData : selectedRecipe)?.costing?.lossRate || 0;
                                                                const weightAfterLoss = totalWeight * (1 - lossRate / 100);
                                                                const costPerKg = weightAfterLoss > 0 ? totals.totalCost / (weightAfterLoss / 1000) : 0;
                                                                return (
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                                                                            <span className="text-slate-600">Coût Matière</span>
                                                                            <span className="font-bold text-slate-900">{totals.materialCost.toFixed(2)} Dh</span>
                                                                        </div>
                                                                        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                                                                            <span className="text-slate-600">Coût Total</span>
                                                                            <span className="font-bold text-slate-900">{totals.totalCost.toFixed(2)} Dh</span>
                                                                        </div>
                                                                        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                                                                            <span className="text-slate-600">Poids Brut</span>
                                                                            <span className="font-bold text-slate-900">{totalWeight.toLocaleString('fr-FR')} g</span>
                                                                        </div>
                                                                        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                                                                            <span className="text-slate-600">Poids Net</span>
                                                                            <span className="font-bold text-slate-900">{weightAfterLoss.toLocaleString('fr-FR')} g</span>
                                                                        </div>
                                                                        <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                                                                            <span className="text-slate-600">Coût / Kg</span>
                                                                            <span className="font-bold text-slate-900">{costPerKg.toFixed(2)} Dh</span>
                                                                        </div>
                                                                        <div className="flex justify-between py-1.5">
                                                                            <span className="text-slate-600">Taux de Perte</span>
                                                                            <span className="font-bold text-slate-900">{lossRate} %</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
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

