import { db } from './db';
import { Invoice, Tier, Article, InvoiceLine, Payment } from './types';
import { saveInvoice, saveArticle } from './data-service';

export interface ImportTier {
    code: string;
    name: string;
    type: "Fournisseur" | "Client";
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    // ... autres champs optionnels
}

export interface ImportArticle {
    code: string;
    name: string;
    subFamilyId: string; // UUID de la sous-famille
    unitPivot: string;
    unitAchat: string;
    unitProduction: string;
    contenace: number;
    coeffProd: number;
    vatRate: number;
    lastPivotPrice?: number;
    // ... autres champs optionnels
}

export interface ImportInvoiceLine {
    articleCode: string;
    articleName: string; // Backup si article non trouvé
    quantity: number;
    unit: string;
    priceHT: number;
    discount: number; // %
    vatRate: number; // %
    totalTTC: number;
    details?: string;
}

export interface ImportPayment {
    date: string;
    amount: number;
    mode: "Virement" | "Espèces" | "Chèques" | "Prélèvement";
    account: "Banque" | "Caisse" | "Coffre";
    reference?: string;
    checkAmount?: number;
    note?: string;
}

export interface ImportInvoice {
    number: string;
    supplierCode: string;
    date: string;
    status: "Draft" | "Validated" | "Synced" | "Modified";
    totalHT: number;
    totalTTC: number;
    totalVAT?: number;
    totalRemise?: number;
    rounding?: number;
    deposit?: number;
    balanceDue?: number;
    dateEncaissement?: string;
    paymentDelay?: number;
    comment?: string;
    lines: ImportInvoiceLine[];
    payments?: ImportPayment[];
}

export interface ImportResult {
    tiers: {
        created: number;
        updated: number;
        errors: string[];
    };
    articles: {
        created: number;
        updated: number;
        errors: string[];
    };
    invoices: {
        created: number;
        updated: number;
        skipped: number;
        errors: string[];
    };
}

/**
 * Import tiers (fournisseurs) from external database
 * Uses code as the matching key
 */
async function importTiers(tiers: ImportTier[]): Promise<{
    codeToIdMap: Map<string, string>;
    result: ImportResult['tiers'];
}> {
    const codeToIdMap = new Map<string, string>();
    const result: ImportResult['tiers'] = {
        created: 0,
        updated: 0,
        errors: []
    };

    for (const tierData of tiers) {
        try {
            // Find existing tier by code
            const existing = await db.tiers.where('code').equals(tierData.code).first();

            if (existing) {
                // Update existing tier
                await db.tiers.update(existing.id, {
                    name: tierData.name,
                    type: tierData.type,
                    phone: tierData.phone,
                    email: tierData.email,
                    address: tierData.address,
                    city: tierData.city
                });
                codeToIdMap.set(tierData.code, existing.id);
                result.updated++;
            } else {
                // Create new tier
                const newId = `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newTier: Tier = {
                    id: newId,
                    code: tierData.code,
                    name: tierData.name,
                    type: tierData.type,
                    phone: tierData.phone,
                    email: tierData.email,
                    address: tierData.address,
                    city: tierData.city
                };
                await db.tiers.add(newTier);
                codeToIdMap.set(tierData.code, newId);
                result.created++;
            }
        } catch (error) {
            result.errors.push(`Tier ${tierData.code}: ${error}`);
        }
    }

    return { codeToIdMap, result };
}

/**
 * Import articles from external database
 * Uses code as the matching key
 */
async function importArticles(articles: ImportArticle[]): Promise<{
    codeToIdMap: Map<string, string>;
    result: ImportResult['articles'];
}> {
    const codeToIdMap = new Map<string, string>();
    const result: ImportResult['articles'] = {
        created: 0,
        updated: 0,
        errors: []
    };

    for (const articleData of articles) {
        try {
            // Find existing article by code
            const existing = await db.articles.where('code').equals(articleData.code).first();

            if (existing) {
                // Don't update articles linked to recipes (sub-recipes)
                if (existing.linkedRecipeId || existing.isSubRecipe) {
                    codeToIdMap.set(articleData.code, existing.id);
                    continue; // Skip update for recipe-linked articles
                }

                // Update existing article
                const updated: Partial<Article> = {
                    name: articleData.name,
                    subFamilyId: articleData.subFamilyId,
                    unitPivot: articleData.unitPivot,
                    unitAchat: articleData.unitAchat,
                    unitProduction: articleData.unitProduction,
                    contenace: articleData.contenace,
                    coeffProd: articleData.coeffProd,
                    vatRate: articleData.vatRate,
                    lastPivotPrice: articleData.lastPivotPrice
                };
                await db.articles.update(existing.id, updated);
                codeToIdMap.set(articleData.code, existing.id);
                result.updated++;
            } else {
                // Create new article
                const newId = `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newArticle: Article = {
                    id: newId,
                    code: articleData.code,
                    name: articleData.name,
                    subFamilyId: articleData.subFamilyId,
                    unitPivot: articleData.unitPivot,
                    unitAchat: articleData.unitAchat,
                    unitProduction: articleData.unitProduction,
                    contenace: articleData.contenace,
                    coeffProd: articleData.coeffProd,
                    vatRate: articleData.vatRate,
                    lastPivotPrice: articleData.lastPivotPrice || 0
                };
                await saveArticle(newArticle);
                codeToIdMap.set(articleData.code, newId);
                result.created++;
            }
        } catch (error) {
            result.errors.push(`Article ${articleData.code}: ${error}`);
        }
    }

    return { codeToIdMap, result };
}

/**
 * Main import function for invoices from external database
 * 
 * @param data Import data with tiers, articles, and invoices
 * @param options Import options
 * @returns Import result with statistics
 */
export async function importInvoicesFromExternalDB(
    data: {
        tiers?: ImportTier[];
        articles?: ImportArticle[];
        invoices: ImportInvoice[];
    },
    options: {
        skipDuplicates?: boolean; // Skip invoices with existing number
        createMissingArticles?: boolean; // Create articles if not found
        batchSize?: number; // Process invoices in batches
    } = {}
): Promise<ImportResult> {
    const {
        skipDuplicates = true,
        createMissingArticles = false,
        batchSize = 100
    } = options;

    const result: ImportResult = {
        tiers: { created: 0, updated: 0, errors: [] },
        articles: { created: 0, updated: 0, errors: [] },
        invoices: { created: 0, updated: 0, skipped: 0, errors: [] }
    };

    // Step 1: Import tiers first
    let tierCodeToIdMap = new Map<string, string>();
    if (data.tiers && data.tiers.length > 0) {
        const tierResult = await importTiers(data.tiers);
        tierCodeToIdMap = tierResult.codeToIdMap;
        result.tiers = tierResult.result;
    }

    // Step 2: Import articles
    let articleCodeToIdMap = new Map<string, string>();
    if (data.articles && data.articles.length > 0) {
        const articleResult = await importArticles(data.articles);
        articleCodeToIdMap = articleResult.codeToIdMap;
        result.articles = articleResult.result;
    }

    // Step 3: Import invoices in batches
    const invoiceBatches: ImportInvoice[][] = [];
    for (let i = 0; i < data.invoices.length; i += batchSize) {
        invoiceBatches.push(data.invoices.slice(i, i + batchSize));
    }

    for (const batch of invoiceBatches) {
        for (const invoiceData of batch) {
            try {
                // Check for duplicate by number
                if (skipDuplicates) {
                    const existing = await db.invoices.where('number').equals(invoiceData.number).first();
                    if (existing) {
                        result.invoices.skipped++;
                        continue;
                    }
                }

                // Resolve supplier ID from code
                const supplierId = tierCodeToIdMap.get(invoiceData.supplierCode);
                if (!supplierId) {
                    result.invoices.errors.push(`Invoice ${invoiceData.number}: Supplier code "${invoiceData.supplierCode}" not found`);
                    continue;
                }

                // Process invoice lines
                const lines: InvoiceLine[] = [];
                for (const lineData of invoiceData.lines) {
                    let articleId = articleCodeToIdMap.get(lineData.articleCode);

                    // If article not found and createMissingArticles is true
                    if (!articleId && createMissingArticles) {
                        // Create minimal article (requires subFamilyId - you may need to provide a default)
                        result.invoices.errors.push(`Invoice ${invoiceData.number}: Cannot auto-create article "${lineData.articleCode}" - subFamilyId required`);
                        continue;
                    }

                    if (!articleId) {
                        result.invoices.errors.push(`Invoice ${invoiceData.number}: Article code "${lineData.articleCode}" not found`);
                        continue;
                    }

                    lines.push({
                        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        articleId: articleId,
                        articleName: lineData.articleName,
                        quantity: lineData.quantity,
                        unit: lineData.unit,
                        priceHT: lineData.priceHT,
                        discount: lineData.discount,
                        vatRate: lineData.vatRate,
                        totalTTC: lineData.totalTTC,
                        details: lineData.details
                    });
                }

                // Process payments
                const payments: Payment[] = (invoiceData.payments || []).map(paymentData => ({
                    id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    date: paymentData.date,
                    amount: paymentData.amount,
                    mode: paymentData.mode,
                    account: paymentData.account,
                    reference: paymentData.reference,
                    checkAmount: paymentData.checkAmount,
                    note: paymentData.note
                }));

                // Create invoice
                const newInvoice: Invoice = {
                    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    supplierId: supplierId,
                    number: invoiceData.number,
                    date: invoiceData.date,
                    status: invoiceData.status,
                    lines: lines,
                    payments: payments,
                    totalHT: invoiceData.totalHT,
                    totalTTC: invoiceData.totalTTC,
                    totalVAT: invoiceData.totalVAT,
                    totalRemise: invoiceData.totalRemise,
                    rounding: invoiceData.rounding || 0,
                    deposit: invoiceData.deposit || 0,
                    balanceDue: invoiceData.balanceDue ?? (invoiceData.totalTTC - (payments.reduce((sum, p) => sum + p.amount, 0))),
                    dateEncaissement: invoiceData.dateEncaissement,
                    paymentDelay: invoiceData.paymentDelay,
                    comment: invoiceData.comment
                };

                await saveInvoice(newInvoice);
                result.invoices.created++;
            } catch (error) {
                result.invoices.errors.push(`Invoice ${invoiceData.number}: ${error}`);
            }
        }
    }

    return result;
}

/**
 * Helper function to get subFamilyId from code
 * Useful when importing articles and you only have sub-family codes
 */
export async function getSubFamilyIdByCode(subFamilyCode: string): Promise<string | null> {
    const subFamily = await db.subFamilies.where('code').equals(subFamilyCode).first();
    return subFamily?.id || null;
}

/**
 * Helper function to validate import data before importing
 */
export async function validateImportData(data: {
    tiers?: ImportTier[];
    articles?: ImportArticle[];
    invoices: ImportInvoice[];
}): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
}> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate tiers
    if (data.tiers) {
        const codes = new Set<string>();
        for (const tier of data.tiers) {
            if (!tier.code) {
                errors.push(`Tier missing code: ${tier.name}`);
            }
            if (codes.has(tier.code)) {
                warnings.push(`Duplicate tier code: ${tier.code}`);
            }
            codes.add(tier.code);
        }
    }

    // Validate articles
    if (data.articles) {
        const codes = new Set<string>();
        for (const article of data.articles) {
            if (!article.code) {
                errors.push(`Article missing code: ${article.name}`);
            }
            if (codes.has(article.code)) {
                warnings.push(`Duplicate article code: ${article.code}`);
            }
            codes.add(article.code);

            // Validate subFamilyId exists
            if (article.subFamilyId) {
                const subFamily = await db.subFamilies.get(article.subFamilyId);
                if (!subFamily) {
                    errors.push(`Article ${article.code}: Invalid subFamilyId ${article.subFamilyId}`);
                }
            }
        }
    }

    // Validate invoices
    const supplierCodes = new Set<string>();
    const articleCodes = new Set<string>();

    for (const invoice of data.invoices) {
        if (!invoice.number) {
            errors.push(`Invoice missing number`);
        }
        if (!invoice.supplierCode) {
            errors.push(`Invoice ${invoice.number}: Missing supplierCode`);
        } else {
            supplierCodes.add(invoice.supplierCode);
        }

        for (const line of invoice.lines) {
            if (!line.articleCode) {
                errors.push(`Invoice ${invoice.number}: Line missing articleCode`);
            } else {
                articleCodes.add(line.articleCode);
            }
        }
    }

    // Check if all supplier codes will be resolved
    if (data.tiers) {
        const tierCodes = new Set(data.tiers.map(t => t.code));
        for (const code of supplierCodes) {
            if (!tierCodes.has(code)) {
                warnings.push(`Invoice references supplier code "${code}" that is not in import data`);
            }
        }
    }

    // Check if all article codes will be resolved
    if (data.articles) {
        const articleCodesSet = new Set(data.articles.map(a => a.code));
        for (const code of articleCodes) {
            if (!articleCodesSet.has(code)) {
                warnings.push(`Invoice references article code "${code}" that is not in import data`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
