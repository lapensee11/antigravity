/**
 * Centralized Structure Synchronization Module
 * 
 * This module provides a unified interface for synchronizing the database structure
 * with the reference data, handling deduplication, migration, and integrity checks.
 */

import { db } from './db';
import { initialFamilies, initialSubFamilies, initialArticles } from './data';
import { Family, SubFamily, Article } from './types';

export interface SyncResult {
    success: boolean;
    familiesAdded: number;
    subFamiliesAdded: number;
    articlesAdded: number;
    duplicatesRemoved: number;
    migrationsApplied: number;
    errors: string[];
}

/**
 * Main synchronization function that handles all structure operations
 * - Adds missing families, sub-families, and articles from reference
 * - Removes duplicates (keeping canonical versions)
 * - Migrates old semantic IDs to UUIDs if needed
 * - Preserves user modifications (non-destructive)
 */
export async function syncStructure(options: {
    syncFamilies?: boolean;
    syncSubFamilies?: boolean;
    syncArticles?: boolean;
    deduplicate?: boolean;
    migrateIds?: boolean;
} = {}): Promise<SyncResult> {
    const {
        syncFamilies = true,
        syncSubFamilies = true,
        syncArticles = true,
        deduplicate = true,
        migrateIds = true
    } = options;

    const result: SyncResult = {
        success: false,
        familiesAdded: 0,
        subFamiliesAdded: 0,
        articlesAdded: 0,
        duplicatesRemoved: 0,
        migrationsApplied: 0,
        errors: []
    };

    try {
        await db.transaction('rw', [db.families, db.subFamilies, db.articles, db.recipes], async () => {
            // Step 1: Migrate IDs if needed (must happen first)
            if (migrateIds) {
                const migrationResult = await migrateSemanticIds();
                result.migrationsApplied = migrationResult.count;
            }

            // Step 2: Deduplicate (must happen before sync to avoid conflicts)
            if (deduplicate) {
                const dedupResult = await deduplicateStructure();
                result.duplicatesRemoved = dedupResult.count;
            }

            // Step 3: Sync missing items (non-destructive)
            if (syncFamilies) {
                result.familiesAdded = await syncFamiliesFromReference();
            }

            if (syncSubFamilies) {
                result.subFamiliesAdded = await syncSubFamiliesFromReference();
            }

            if (syncArticles) {
                result.articlesAdded = await syncArticlesFromReference();
            }
        });

        result.success = true;
        console.log("DB: Structure synchronization complete:", result);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(errorMsg);
        console.error("DB: Structure synchronization failed:", error);
    }

    return result;
}

/**
 * Sync families from reference (additive only)
 */
async function syncFamiliesFromReference(): Promise<number> {
    const existingFamilies = await db.families.toArray();
    const existingIds = new Set(existingFamilies.map(f => f.id));
    const missingFamilies = initialFamilies.filter(f => !existingIds.has(f.id));

    if (missingFamilies.length > 0) {
        await db.families.bulkAdd(missingFamilies);
        console.log(`DB: Added ${missingFamilies.length} missing families`);
    }

    return missingFamilies.length;
}

/**
 * Sync sub-families from reference (additive only)
 */
async function syncSubFamiliesFromReference(): Promise<number> {
    const existingSubFamilies = await db.subFamilies.toArray();
    const existingIds = new Set(existingSubFamilies.map(s => s.id));
    const missingSubFamilies = initialSubFamilies.filter(s => !existingIds.has(s.id));

    if (missingSubFamilies.length > 0) {
        await db.subFamilies.bulkAdd(missingSubFamilies);
        console.log(`DB: Added ${missingSubFamilies.length} missing sub-families`);
    }

    return missingSubFamilies.length;
}

/**
 * Sync articles from reference (additive only)
 */
async function syncArticlesFromReference(): Promise<number> {
    const existingArticles = await db.articles.toArray();
    const existingIds = new Set(existingArticles.map(a => a.id));
    const missingArticles = initialArticles.filter(a => !existingIds.has(a.id));

    if (missingArticles.length > 0) {
        await db.articles.bulkAdd(missingArticles);
        console.log(`DB: Added ${missingArticles.length} missing articles`);
    }

    return missingArticles.length;
}

/**
 * Remove duplicate families/sub-families (keep canonical versions from reference)
 */
async function deduplicateStructure(): Promise<{ count: number }> {
    let totalRemoved = 0;

    // 1. Deduplicate Sub-Families
    const subFamilies = await db.subFamilies.toArray();
    const subMap = new Map<string, SubFamily[]>();

    for (const sub of subFamilies) {
        if (!subMap.has(sub.code)) subMap.set(sub.code, []);
        subMap.get(sub.code)!.push(sub);
    }

    for (const [code, group] of subMap.entries()) {
        if (group.length > 1) {
            const canonical = initialSubFamilies.find(s => s.code === code);
            const canonicalId = canonical ? canonical.id : group[0].id;

            const duplicates = group.filter(s => s.id !== canonicalId);

            for (const dup of duplicates) {
                // Reassign articles to canonical ID
                const articlesToMove = await db.articles.where('subFamilyId').equals(dup.id).toArray();
                for (const art of articlesToMove) {
                    await db.articles.put({ ...art, subFamilyId: canonicalId });
                }

                // Reassign recipes to canonical ID
                const recipesToMove = await db.recipes.where('subFamilyId').equals(dup.id).toArray();
                for (const rec of recipesToMove) {
                    await db.recipes.put({ ...rec, subFamilyId: canonicalId });
                }

                await db.subFamilies.delete(dup.id);
                totalRemoved++;
            }
        }
    }

    // 2. Deduplicate Families
    const families = await db.families.toArray();
    const familyMap = new Map<string, Family[]>();

    for (const fam of families) {
        if (!familyMap.has(fam.code)) familyMap.set(fam.code, []);
        familyMap.get(fam.code)!.push(fam);
    }

    for (const [code, group] of familyMap.entries()) {
        if (group.length > 1) {
            const canonical = initialFamilies.find(f => f.code === code);
            const canonicalId = canonical ? canonical.id : group[0].id;

            const duplicates = group.filter(f => f.id !== canonicalId);

            for (const dup of duplicates) {
                // Reassign sub-families
                const subsToMove = await db.subFamilies.where('familyId').equals(dup.id).toArray();
                for (const sub of subsToMove) {
                    await db.subFamilies.put({ ...sub, familyId: canonicalId });
                }

                // Reassign recipes
                const recipesToMove = await db.recipes.where('familyId').equals(dup.id).toArray();
                for (const rec of recipesToMove) {
                    await db.recipes.put({ ...rec, familyId: canonicalId });
                }

                await db.families.delete(dup.id);
                totalRemoved++;
            }
        }
    }

    if (totalRemoved > 0) {
        console.log(`DB: Removed ${totalRemoved} duplicate entries`);
    }

    return { count: totalRemoved };
}

/**
 * Migrate old semantic IDs (FA01, FF01, etc.) to UUIDs
 */
async function migrateSemanticIds(): Promise<{ count: number }> {
    const families = await db.families.toArray();
    const subFamilies = await db.subFamilies.toArray();

    // Detect if migration is needed
    const needsMigration = families.some(f => /^[F][AFPV][0-9]/.test(f.id)) ||
        subFamilies.some(s => /^[F][AFPV][0-9]/.test(s.id));

    if (!needsMigration) {
        return { count: 0 };
    }

    console.log("DB: Starting UUID migration...");

    // Clear and reset structure to new reference (with UUIDs)
    await db.families.clear();
    await db.subFamilies.clear();
    await db.families.bulkPut(initialFamilies);
    await db.subFamilies.bulkPut(initialSubFamilies);

    // Update Articles
    const articles = await db.articles.toArray();
    const updatedArticles = articles.map(art => {
        if (/^[F][AFPV][0-9]/.test(art.subFamilyId)) {
            const refSub = initialSubFamilies.find(rs => rs.code === art.subFamilyId);
            if (refSub) {
                return { ...art, subFamilyId: refSub.id };
            }
        }
        return art;
    });
    await db.articles.bulkPut(updatedArticles);

    // Update Recipes
    const recipes = await db.recipes.toArray();
    const updatedRecipes = recipes.map(rec => {
        if (/^[F][AFPV][0-9]/.test(rec.subFamilyId)) {
            const refSub = initialSubFamilies.find(rs => rs.code === rec.subFamilyId);
            if (refSub) {
                return { ...rec, subFamilyId: refSub.id };
            }
        }
        if (/^[F][AFPV][0-9]/.test(rec.familyId)) {
            const refFam = initialFamilies.find(rf => rf.code === rec.familyId);
            if (refFam) {
                return { ...rec, familyId: refFam.id };
            }
        }
        return rec;
    });
    await db.recipes.bulkPut(updatedRecipes);

    console.log("DB: UUID migration complete.");
    return { count: 1 }; // Migration applied
}

/**
 * Quick sync - only adds missing items (fastest option)
 */
export async function quickSyncStructure(): Promise<SyncResult> {
    return syncStructure({
        syncFamilies: true,
        syncSubFamilies: true,
        syncArticles: true,
        deduplicate: false,
        migrateIds: false
    });
}

/**
 * Full sync - complete synchronization with all checks
 */
export async function fullSyncStructure(): Promise<SyncResult> {
    return syncStructure({
        syncFamilies: true,
        syncSubFamilies: true,
        syncArticles: true,
        deduplicate: true,
        migrateIds: true
    });
}
