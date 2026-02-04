import { db } from './db';
import { Article, StaffMember, Invoice, Tier, Family, SubFamily, Recipe, StructureType, Transaction, AccountingAccount, AppSetting, Partner } from './types';

// ... (previous imports)

// ... (existing code)

// ACCOUNTING ACCOUNTS - Removed duplicates

// GLOBAL UNIT MANAGEMENT
// ... (rest of file)

// INVOICES
export async function getInvoices(): Promise<Invoice[]> {
    return await db.invoices.toArray();
}

export async function saveInvoice(invoice: Invoice): Promise<{ success: true }> {
    await db.invoices.put(invoice);
    return { success: true };
}

export async function deleteInvoice(id: string): Promise<{ success: true }> {
    await db.invoices.delete(id);
    return { success: true };
}

// EMPLOYEES
export async function getEmployees(): Promise<StaffMember[]> {
    return await db.employees.toArray();
}

export async function saveEmployee(employee: StaffMember): Promise<{ success: true }> {
    await db.employees.put(employee);
    return { success: true };
}

export async function deleteEmployee(id: number): Promise<{ success: true }> {
    await db.employees.delete(id);
    return { success: true };
}

// ARTICLES
export async function getArticles(): Promise<Article[]> {
    return await db.articles.toArray();
}

export async function saveArticle(article: Article): Promise<{ success: true }> {
    await db.articles.put(article);
    return { success: true };
}

export async function deleteArticle(id: string): Promise<{ success: true }> {
    await db.articles.delete(id);
    return { success: true };
}

// TIERS
export async function getTiers(): Promise<Tier[]> {
    return await db.tiers.toArray();
}

export async function saveTier(tier: Tier): Promise<{ success: true }> {
    await db.tiers.put(tier);
    return { success: true };
}

export async function deleteTier(id: string): Promise<{ success: true }> {
    await db.tiers.delete(id);
    return { success: true };
}

// SIMULATIONS / SYNC
export const syncInvoiceTransactions = async (invoiceId: string, transactions: any[]) => {
    console.log(`Simulating sync of ${transactions.length} transactions for invoice ${invoiceId}`);
    return { success: true };
};

export const updateArticlePivotPrices = async (updates: { id: string, lastPivotPrice: number }[]) => {
    console.log(`Updating pivot prices for ${updates.length} articles`);
    for (const update of updates) {
        const article = await db.articles.get(update.id);
        if (article) {
            await db.articles.update(update.id, { lastPivotPrice: update.lastPivotPrice });
        }
    }
    return { success: true };
};

// RECIPES
export async function getRecipes(): Promise<Recipe[]> {
    return await db.recipes.toArray();
}

export async function saveRecipe(recipe: Recipe): Promise<{ success: true }> {
    await db.recipes.put(recipe);
    return { success: true };
}

export async function deleteRecipe(id: string): Promise<{ success: true }> {
    await db.recipes.delete(id);
    return { success: true };
}

// STRUCTURE (Families, SubFamilies, Types)
export async function getStructureTypes(): Promise<StructureType[]> {
    return await db.structureTypes.toArray();
}

export async function getFamilies(): Promise<Family[]> {
    return await db.families.toArray();
}

export async function saveFamily(family: Family): Promise<{ success: true }> {
    await db.families.put(family);
    return { success: true };
}

export async function deleteFamily(id: string): Promise<{ success: true }> {
    await db.families.delete(id);
    return { success: true };
}

export async function getSubFamilies(): Promise<SubFamily[]> {
    return await db.subFamilies.toArray();
}

export async function saveSubFamily(subFamily: SubFamily): Promise<{ success: true }> {
    await db.subFamilies.put(subFamily);
    return { success: true };
}

export async function deleteSubFamily(id: string): Promise<{ success: true }> {
    await db.subFamilies.delete(id);
    return { success: true };
}
// TRANSACTIONS
export async function getTransactions(): Promise<Transaction[]> {
    return await db.transactions.toArray();
}

export async function saveTransaction(tx: Transaction): Promise<{ success: true }> {
    await db.transactions.put(tx);
    return { success: true };
}

export async function deleteTransaction(id: string): Promise<{ success: true }> {
    await db.transactions.delete(id);
    return { success: true };
}

// ACCOUNTING NATURES
export async function getAccountingNatures(): Promise<{ id: string, name: string }[]> {
    return await db.accountingNatures.toArray();
}

export async function saveAccountingNature(nature: { id: string, name: string }): Promise<{ success: true }> {
    await db.accountingNatures.put(nature);
    return { success: true };
}

export async function deleteAccountingNature(id: string): Promise<{ success: true }> {
    await db.accountingNatures.delete(id);
    return { success: true };
}

// SALES DATA
export async function getSalesData(): Promise<Record<string, { real?: any; declared?: any }>> {
    const all = await db.salesData.toArray();
    const records: Record<string, { real?: any; declared?: any }> = {};
    all.forEach(item => {
        records[item.id] = { real: item.real, declared: item.declared };
    });
    return records;
}

export async function saveSalesData(id: string, real?: any, declared?: any): Promise<{ success: true }> {
    await db.salesData.put({ id, real, declared });
    return { success: true };
}

// ACCOUNTING ACCOUNTS
export async function getAccountingAccounts(): Promise<AccountingAccount[]> {
    return await db.accounting_accounts.orderBy('code').toArray();
}

export async function saveAccountingAccount(account: AccountingAccount): Promise<{ success: true }> {
    await db.accounting_accounts.put(account);
    return { success: true };
}

export async function deleteAccountingAccount(id: string): Promise<{ success: true }> {
    await db.accounting_accounts.delete(id);
    return { success: true };
}

// APP SETTINGS
export async function getSettings(): Promise<Record<string, string>> {
    const all = await db.settings.toArray();
    return all.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
}

export async function saveSetting(key: string, value: string): Promise<{ success: true }> {
    await db.settings.put({ key, value });
    return { success: true };
}

// PARTNERS
export async function getPartners(): Promise<Partner[]> {
    return await db.partners.toArray();
}

export async function savePartner(partner: Partner): Promise<{ success: true }> {
    await db.partners.put(partner);
    return { success: true };
}

export async function deletePartner(id: string): Promise<{ success: true }> {
    await db.partners.delete(id);
    return { success: true };
}

// DASHBOARD ANALYTICS
export async function getDashboardStats() {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().substring(0, 7); // YYYY-MM

    // 1. Sales Calculation (Current Month)
    const salesTable = await db.salesData.toArray();
    let totalSales = 0;
    salesTable.forEach(day => {
        if (day.id.startsWith(currentMonthPrefix) && day.declared?.calculated?.ttc) {
            totalSales += parseFloat(day.declared.calculated.ttc) || 0;
        }
    });

    // 2. Pending Invoices (Total TTC)
    const invoices = await db.invoices.toArray();
    const pendingInvoices = invoices.filter(inv => inv.status === 'Draft' || inv.status === 'Validated');
    const totalPendingAmount = pendingInvoices.reduce((sum, inv) => {
        const linesTotal = inv.lines.reduce((lSum, l) => lSum + (l.totalTTC || 0), 0);
        return sum + linesTotal;
    }, 0);

    // 3. Articles & Production
    const articleCount = await db.articles.count();
    const recipeCount = await db.recipes.count();

    // 4. Activity Feed (Last 5 invoices)
    const recentActivity = invoices
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5)
        .map(inv => ({
            id: inv.id,
            type: 'FACTURE',
            label: `Facture ${inv.number}`,
            date: inv.date,
            amount: inv.lines.reduce((sum, l) => sum + (l.totalTTC || 0), 0)
        }));

    return {
        totalSales,
        pendingCount: pendingInvoices.length,
        pendingAmount: totalPendingAmount,
        articleCount,
        recipeCount,
        recentActivity
    };
}

export async function getDatabaseRegistry() {
    return {
        invoices: await db.invoices.count(),
        articles: await db.articles.count(),
        tiers: await db.tiers.count(),
        employees: await db.employees.count(),
        recipes: await db.recipes.count(),
        families: await db.families.count(),
        subFamilies: await db.subFamilies.count(),
        transactions: await db.transactions.count(),
        sales: await db.salesData.count(),
        types: await db.structureTypes.count(),
    };
}

// PAYROLL CLOSING
export async function closePayrollMonth(monthKey: string, nextMonthKey: string, employees: StaffMember[], totals: any): Promise<{ success: true }> {
    await db.transaction('rw', [db.employees, db.transactions], async () => {
        // 1. Update Employees (Lock Month + Update Loans + Initialize Next Month)
        for (const emp of employees) {
            const mData = emp.monthlyData?.[monthKey];
            if (!mData) continue;

            const loanDeduction = mData.monthlyDeduction || 0;
            const newRemaining = (emp.creditInfo?.remaining || 0) - loanDeduction;
            const newPayments = (emp.creditInfo?.payments || 0) + loanDeduction;

            // Prepare Next Month Data
            let nextMData = emp.monthlyData?.[nextMonthKey] || {};

            // 1. Jours = 26 (Default)
            // 2. Virement = Same as previous
            // 3. Deduction = Same as previous (capped by remaining)
            // 4. pRegul = Latest Bonus from history

            // Get Latest Bonus
            let latestBonus = 0;
            if (emp.history && emp.history.length > 0) {
                const sortedHistory = [...emp.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                latestBonus = sortedHistory[0]?.undeclaredBonus || 0;
            }

            // Calculate Deduction for next month
            let nextDeduction = loanDeduction;
            if (newRemaining < nextDeduction) {
                nextDeduction = newRemaining; // Cap at remaining
            }

            // Init Next Month
            nextMData = {
                ...nextMData,
                jours: 26,
                hSup: 0,
                pRegul: latestBonus,
                pOccas: 0,
                virement: mData.virement || 0, // Carry over virement pref
                monthlyDeduction: nextDeduction,
                avances: 0,
                isPaid: false,
                isClosed: false
            };

            const updatedEmp = {
                ...emp,
                monthlyData: {
                    ...emp.monthlyData,
                    [monthKey]: { ...mData, isClosed: true },
                    [nextMonthKey]: nextMData
                },
                creditInfo: {
                    ...emp.creditInfo,
                    remaining: newRemaining,
                    payments: newPayments
                }
            };
            await db.employees.put(updatedEmp);
        }

        // 2. Generate Transactions
        const timestamp = new Date().toISOString();
        const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // A. Banque (Virements)
        if (totals.virement > 0) {
            await db.transactions.put({
                id: generateId(),
                date: timestamp,
                label: `Virements Salaires ${monthKey}`,
                amount: totals.virement,
                type: 'Depense',
                category: 'Salaires & Charges',
                account: 'Banque',
                isReconciled: false
            });
        }

        // B. Caisse (Espèces Déclaré) -> Salaire Net Compta - Virements
        const caisseAmount = Math.max(0, totals.salaireNet - totals.virement);
        if (caisseAmount > 0) {
            await db.transactions.put({
                id: generateId(),
                date: timestamp,
                label: `Salaires Espèces (Déclaré) ${monthKey}`,
                amount: caisseAmount,
                type: 'Depense',
                category: 'Salaires & Charges',
                account: 'Caisse',
                isReconciled: false
            });
        }

        // C. Coffre (Non Déclaré) -> (Net Payer + Avances + Retenus + Virements) - Salaire Net Compta
        const realTotal = totals.netPayer + totals.avances + totals.retenuePret + totals.virement;
        const coffreAmount = Math.max(0, realTotal - totals.salaireNet);
        if (coffreAmount > 0) {
            await db.transactions.put({
                id: generateId(),
                date: timestamp,
                label: `Complément Salaires (Non Déclaré) ${monthKey}`,
                amount: coffreAmount,
                type: 'Depense',
                category: 'Salaires & Charges',
                account: 'Coffre',
                isReconciled: false
            });
        }
    });

    return { success: true };
}

export async function unclosePayrollMonth(monthKey: string): Promise<{ success: true }> {
    await db.transaction('rw', [db.employees, db.transactions], async () => {
        // 1. Revert Employees (Unlock Month + Revert Loans)
        const employees = await db.employees.toArray();
        for (const emp of employees) {
            const mData = emp.monthlyData?.[monthKey];
            if (!mData || !mData.isClosed) continue;

            const loanDeduction = mData.monthlyDeduction || 0;
            const newRemaining = (emp.creditInfo?.remaining || 0) + loanDeduction; // Add back debt
            const newPayments = (emp.creditInfo?.payments || 0) - loanDeduction; // Remove payment

            const updatedEmp = {
                ...emp,
                monthlyData: {
                    ...emp.monthlyData,
                    [monthKey]: { ...mData, isClosed: false }
                },
                creditInfo: {
                    ...emp.creditInfo,
                    remaining: newRemaining,
                    payments: newPayments
                }
            };
            await db.employees.put(updatedEmp);
        }

        // 2. Delete Transactions
        // Find transactions with specific labels for this month
        const allTx = await db.transactions.toArray();
        const txToDelete = allTx.filter(tx =>
        (tx.label === `Virements Salaires ${monthKey}` ||
            tx.label === `Salaires Espèces (Déclaré) ${monthKey}` ||
            tx.label === `Complément Salaires (Non Déclaré) ${monthKey}`)
        );

        for (const tx of txToDelete) {
            await db.transactions.delete(tx.id);
        }
    });

    return { success: true };
}

// GLOBAL UNIT MANAGEMENT
export type UnitType = 'achat' | 'pivot' | 'production';

export async function renameUnitGlobal(oldName: string, newName: string, type: UnitType): Promise<{ success: true }> {
    await db.transaction('rw', [db.articles, db.invoices, db.recipes], async () => {
        // 1. Update Articles
        const articles = await db.articles.toArray();
        for (const article of articles) {
            let updated = false;
            const updates: Partial<Article> = {};

            if (type === 'achat' && article.unitAchat === oldName) { updates.unitAchat = newName; updated = true; }
            if (type === 'pivot' && article.unitPivot === oldName) { updates.unitPivot = newName; updated = true; }
            if (type === 'production' && article.unitProduction === oldName) { updates.unitProduction = newName; updated = true; }

            if (updated) {
                await db.articles.update(article.id, updates);
            }
        }

        // 2. Update Invoices (lines) - Use 'achat' context
        if (type === 'achat') {
            const invoices = await db.invoices.toArray();
            for (const inv of invoices) {
                let updated = false;
                const newLines = inv.lines.map(l => {
                    if (l.unit === oldName) {
                        updated = true;
                        return { ...l, unit: newName };
                    }
                    return l;
                });

                if (updated) {
                    await db.invoices.update(inv.id, { lines: newLines });
                }
            }
        }

        // 3. Update Recipes (ingredients) - Use 'production' context
        if (type === 'production') {
            const recipes = await db.recipes.toArray();
            for (const recipe of recipes) {
                let updated = false;
                const newIngredients = recipe.ingredients.map(ing => {
                    if (ing.unit === oldName) {
                        updated = true;
                        return { ...ing, unit: newName };
                    }
                    return ing;
                });

                if (updated) {
                    await db.recipes.update(recipe.id, { ingredients: newIngredients });
                }
            }
        }
    });

    // 4. Update localStorage
    if (typeof window !== "undefined") {
        const key = `bakery_units_${type}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const units: string[] = JSON.parse(stored);
                const newUnits = units.map(u => u === oldName ? newName : u);
                localStorage.setItem(key, JSON.stringify(newUnits));
            } catch (e) {
                console.error(`Failed to update ${key} in localStorage`, e);
            }
        }
    }

    return { success: true };
}

export async function deleteUnitGlobal(name: string, type: UnitType): Promise<{ success: true }> {
    if (typeof window !== "undefined") {
        const key = `bakery_units_${type}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const units: string[] = JSON.parse(stored);
                const newUnits = units.filter(u => u !== name);
                localStorage.setItem(key, JSON.stringify(newUnits));
            } catch (e) {
                console.error(`Failed to delete unit from ${key} in localStorage`, e);
            }
        }
    }
    return { success: true };
}
