import { db } from './db';
import { Article } from './types';

/**
 * Migration: Fix subFamilyId from names to UUIDs
 * This migration should be run ONCE to correct all articles and recipes
 * that have subFamilyId as a name instead of a UUID
 */
export async function migrateSubFamilyIdsToUUIDs(): Promise<{ 
    articlesFixed: number; 
    recipesFixed: number;
    errors: string[];
}> {
    const result = {
        articlesFixed: 0,
        recipesFixed: 0,
        errors: [] as string[]
    };

    try {
        // Get all sub-families to build a lookup map
        const subFamilies = await db.subFamilies.toArray();
        const subFamilyMapByName = new Map<string, string>();
        subFamilies.forEach(sf => {
            subFamilyMapByName.set(sf.name, sf.id);
        });

        // Helper function to check if a string is a UUID
        const isUUID = (str: string): boolean => {
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        };

        // Fix articles
        const articles = await db.articles.toArray();
        for (const article of articles) {
            if (!article.subFamilyId) continue;
            
            // Skip if already a UUID
            if (isUUID(article.subFamilyId)) continue;
            
            // Try to find the UUID by name
            const uuid = subFamilyMapByName.get(article.subFamilyId);
            if (uuid) {
                try {
                    await db.articles.update(article.id, { subFamilyId: uuid });
                    result.articlesFixed++;
                    console.log(`[Migration] Fixed article "${article.name}": "${article.subFamilyId}" -> "${uuid}"`);
                } catch (error) {
                    const errorMsg = `Failed to update article ${article.id}: ${error}`;
                    result.errors.push(errorMsg);
                    console.error(`[Migration] ${errorMsg}`);
                }
            } else {
                const errorMsg = `Article "${article.name}" has invalid subFamilyId "${article.subFamilyId}" - no matching sub-family found`;
                result.errors.push(errorMsg);
                console.warn(`[Migration] ${errorMsg}`);
            }
        }

        // Fix recipes
        const recipes = await db.recipes.toArray();
        for (const recipe of recipes) {
            if (!recipe.subFamilyId) continue;
            
            // Skip if already a UUID
            if (isUUID(recipe.subFamilyId)) continue;
            
            // Try to find the UUID by name
            const uuid = subFamilyMapByName.get(recipe.subFamilyId);
            if (uuid) {
                try {
                    await db.recipes.update(recipe.id, { subFamilyId: uuid });
                    result.recipesFixed++;
                    console.log(`[Migration] Fixed recipe "${recipe.name}": "${recipe.subFamilyId}" -> "${uuid}"`);
                } catch (error) {
                    const errorMsg = `Failed to update recipe ${recipe.id}: ${error}`;
                    result.errors.push(errorMsg);
                    console.error(`[Migration] ${errorMsg}`);
                }
            } else {
                const errorMsg = `Recipe "${recipe.name}" has invalid subFamilyId "${recipe.subFamilyId}" - no matching sub-family found`;
                result.errors.push(errorMsg);
                console.warn(`[Migration] ${errorMsg}`);
            }
        }

        console.log(`[Migration] Completed: ${result.articlesFixed} articles fixed, ${result.recipesFixed} recipes fixed`);
        if (result.errors.length > 0) {
            console.warn(`[Migration] ${result.errors.length} errors occurred`);
        }

    } catch (error) {
        const errorMsg = `Migration failed: ${error}`;
        result.errors.push(errorMsg);
        console.error(`[Migration] ${errorMsg}`);
    }

    return result;
}

/**
 * Migration: Migrate accountingNature and accountingAccount to accountingCode
 * This migration converts legacy accounting fields to the new accountingCode field
 * accountingCode is the ID of an AccountingAccount (source of truth)
 */
export async function migrateAccountingCode(): Promise<{
    articlesMigrated: number;
    errors: string[];
}> {
    const result = {
        articlesMigrated: 0,
        errors: [] as string[]
    };

    try {
        // Get all accounting accounts to build lookup maps
        const accountingAccounts = await db.accounting_accounts.toArray();
        const accountMapByCode = new Map<string, string>();
        const accountMapByLabel = new Map<string, string>();
        
        accountingAccounts.forEach(acc => {
            accountMapByCode.set(acc.code, acc.id);
            accountMapByLabel.set(acc.label.toLowerCase(), acc.id);
        });

        // Get all articles
        const articles = await db.articles.toArray();

        for (const article of articles) {
            // Skip if already has accountingCode
            if (article.accountingCode) continue;

            let newAccountingCode: string | undefined = undefined;

            // Try to migrate from accountingAccount (code or label)
            if (article.accountingAccount) {
                // Try by code first
                newAccountingCode = accountMapByCode.get(article.accountingAccount);
                
                // If not found, try by label (case-insensitive)
                if (!newAccountingCode) {
                    newAccountingCode = accountMapByLabel.get(article.accountingAccount.toLowerCase());
                }
            }

            // If still not found, try accountingNature (legacy field)
            if (!newAccountingCode && article.accountingNature) {
                // Try to find by matching nature name to account label
                newAccountingCode = accountMapByLabel.get(article.accountingNature.toLowerCase());
            }

            // If we found a match, update the article
            if (newAccountingCode) {
                try {
                    // Update article with accountingCode, keep legacy fields for now (will be removed later)
                    await db.articles.update(article.id, { 
                        accountingCode: newAccountingCode 
                    } as Partial<Article>);
                    result.articlesMigrated++;
                    console.log(`[Migration] Migrated accounting code for article "${article.name}": "${article.accountingAccount || article.accountingNature}" -> "${newAccountingCode}"`);
                } catch (error) {
                    const errorMsg = `Failed to update article ${article.id}: ${error}`;
                    result.errors.push(errorMsg);
                    console.error(`[Migration] ${errorMsg}`);
                }
            } else if (article.accountingAccount || article.accountingNature) {
                // Log warning if we couldn't migrate
                const legacyValue = article.accountingAccount || article.accountingNature;
                console.warn(`[Migration] Could not migrate accounting code for article "${article.name}": "${legacyValue}" - no matching account found`);
            }
        }

        console.log(`[Migration] Accounting code migration completed: ${result.articlesMigrated} articles migrated`);
        if (result.errors.length > 0) {
            console.warn(`[Migration] ${result.errors.length} errors occurred`);
        }

    } catch (error) {
        const errorMsg = `Accounting code migration failed: ${error}`;
        result.errors.push(errorMsg);
        console.error(`[Migration] ${errorMsg}`);
    }

    return result;
}

/**
 * Migration: Generate codes for existing recipes
 * This migration generates codes for all recipes that don't have one yet
 */
export async function migrateRecipeCodes(): Promise<{
    recipesMigrated: number;
    errors: string[];
}> {
    const result = {
        recipesMigrated: 0,
        errors: [] as string[]
    };

    try {
        const { generateRecipeCode } = await import('./data-service');
        const recipes = await db.recipes.toArray();

        for (const recipe of recipes) {
            // Skip if recipe already has a valid code
            if (recipe.code && recipe.code.match(/^[A-Z0-9]+-(R|SR)-\d{2}$/)) {
                continue;
            }

            try {
                // Generate code using the same function as saveRecipe
                const generatedCode = await generateRecipeCode(recipe);
                if (generatedCode) {
                    await db.recipes.update(recipe.id, { code: generatedCode });
                    result.recipesMigrated++;
                    console.log(`[Migration] Generated code for recipe "${recipe.name}": "${generatedCode}"`);
                } else {
                    console.warn(`[Migration] Could not generate code for recipe "${recipe.name}" - missing subFamilyId or sub-family code`);
                }
            } catch (error) {
                const errorMsg = `Failed to generate code for recipe ${recipe.id}: ${error}`;
                result.errors.push(errorMsg);
                console.error(`[Migration] ${errorMsg}`);
            }
        }

        console.log(`[Migration] Recipe codes migration completed: ${result.recipesMigrated} recipes migrated`);
        if (result.errors.length > 0) {
            console.warn(`[Migration] ${result.errors.length} errors occurred`);
        }

    } catch (error) {
        const errorMsg = `Recipe codes migration failed: ${error}`;
        result.errors.push(errorMsg);
        console.error(`[Migration] ${errorMsg}`);
    }

    return result;
}
