import { getLocalDB } from "@/lib/db";
import { recipes, ingredients, productionSteps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { Recipe, Ingredient, ProductionStep } from "@/lib/types";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getRecipes() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const allRecipes = await tauriDb.select("SELECT * FROM recipes ORDER BY name ASC") as any[];
            const allIngredients = await tauriDb.select("SELECT * FROM ingredients") as any[];
            const allSteps = await tauriDb.select("SELECT * FROM production_steps ORDER BY \"order\" ASC") as any[];

            return allRecipes.map(recipe => ({
                ...recipe,
                familyId: recipe.family_id,
                subFamilyId: recipe.sub_family_id,
                yieldUnit: recipe.yield_unit,
                nutrition: recipe.nutrition ? JSON.parse(recipe.nutrition) : { calories: 0, protein: 0, carbs: 0, fat: 0, glycemicIndex: 0, glycemicLoad: 0 },
                costing: recipe.costing ? JSON.parse(recipe.costing) : { materialCost: 0, lossRate: 0, laborCost: 0, storageCost: 0, totalCost: 0, costPerUnit: 0 },
                ingredients: allIngredients.filter((ing: any) => ing.recipe_id === recipe.id).map((i: any) => ({
                    ...i,
                    articleId: i.article_id
                })),
                steps: allSteps.filter((step: any) => step.recipe_id === recipe.id),
            })) as Recipe[];
        } catch (error) {
            console.error("Tauri Fetch Recipes Error:", error);
            return [];
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return [];
        const res = await db.query.recipes.findMany({
            with: { ingredients: true, steps: true, },
            orderBy: (recipes: any, { asc }: any) => [asc(recipes.name)],
        });

        return res.map(recipe => ({
            ...recipe,
            nutrition: recipe.nutrition ? JSON.parse(recipe.nutrition) : { calories: 0, protein: 0, carbs: 0, fat: 0, glycemicIndex: 0, glycemicLoad: 0 },
            costing: recipe.costing ? JSON.parse(recipe.costing) : { materialCost: 0, lossRate: 0, laborCost: 0, storageCost: 0, totalCost: 0, costPerUnit: 0 },
            ingredients: (recipe.ingredients || []).map((ing: any) => ({ ...ing, articleId: ing.articleId })),
            steps: (recipe.steps || []).sort((a: any, b: any) => a.order - b.order),
        })) as Recipe[];
    } catch (error) {
        console.error("Fetch Recipes Error:", error);
        return [];
    }
}

export async function saveRecipe(recipeData: Recipe) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const { ingredients: ings, steps, nutrition, costing } = recipeData;

            await tauriDb.execute(`
                INSERT INTO recipes (id, name, family_id, sub_family_id, yield, yield_unit, nutrition, costing, image, reference)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT(id) DO UPDATE SET 
                    name=excluded.name, 
                    family_id=excluded.family_id,
                    sub_family_id=excluded.sub_family_id,
                    yield=excluded.yield,
                    yield_unit=excluded.yield_unit,
                    nutrition=excluded.nutrition, 
                    costing=excluded.costing,
                    image=excluded.image,
                    reference=excluded.reference
            `, [
                recipeData.id,
                recipeData.name,
                recipeData.familyId,
                recipeData.subFamilyId,
                recipeData.yield,
                recipeData.yieldUnit,
                JSON.stringify(nutrition),
                JSON.stringify(costing),
                recipeData.image || null,
                recipeData.reference || null
            ]);

            await tauriDb.execute("DELETE FROM ingredients WHERE recipe_id = $1", [recipeData.id]);
            for (const ing of ings) {
                await tauriDb.execute(`
                    INSERT INTO ingredients (id, recipe_id, article_id, name, quantity, unit, cost)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [ing.id || `${recipeData.id}-ing-${Date.now()}`, recipeData.id, ing.articleId, ing.name, ing.quantity, ing.unit, ing.cost]);
            }

            await tauriDb.execute("DELETE FROM production_steps WHERE recipe_id = $1", [recipeData.id]);
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                await tauriDb.execute(`
                    INSERT INTO production_steps (id, recipe_id, \"order\", description, duration)
                    VALUES ($1, $2, $3, $4, $5)
                `, [`${recipeData.id}-step-${i}`, recipeData.id, step.order || i + 1, step.description, step.duration || null]);
            }
            return { success: true };
        } catch (error) {
            console.error("Tauri Save Recipe Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const { ingredients: ings, steps, nutrition, costing, ...flatData } = recipeData;

        const dataToSave = {
            ...flatData,
            nutrition: JSON.stringify(nutrition),
            costing: JSON.stringify(costing),
        };

        const existing = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeData.id) });
        if (existing) {
            await db.update(recipes).set(dataToSave).where(eq(recipes.id, recipeData.id));
        } else {
            await db.insert(recipes).values(dataToSave);
        }

        await db.delete(ingredients).where(eq(ingredients.recipeId, recipeData.id));
        if (ings.length > 0) {
            await db.insert(ingredients).values(ings.map(ing => ({ ...ing, recipeId: recipeData.id, })));
        }

        await db.delete(productionSteps).where(eq(productionSteps.recipeId, recipeData.id));
        if (steps.length > 0) {
            await db.insert(productionSteps).values(steps.map((step, idx) => ({
                id: `${recipeData.id}-step-${idx}`,
                recipeId: recipeData.id,
                order: step.order || idx + 1,
                description: step.description,
                duration: step.duration || null,
            })));
        }

        if (!isTauri()) {
            await safeRevalidate("/production");
        }
        return { success: true };
    } catch (error) {
        console.error("Save Recipe Error:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteRecipe(id: string) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute("DELETE FROM ingredients WHERE recipe_id = $1", [id]);
        await tauriDb.execute("DELETE FROM production_steps WHERE recipe_id = $1", [id]);
        await tauriDb.execute("DELETE FROM recipes WHERE id = $1", [id]);
        return { success: true };
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(ingredients).where(eq(ingredients.recipeId, id));
        await db.delete(productionSteps).where(eq(productionSteps.recipeId, id));
        await db.delete(recipes).where(eq(recipes.id, id));
        if (!isTauri()) {
            await safeRevalidate("/production");
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
