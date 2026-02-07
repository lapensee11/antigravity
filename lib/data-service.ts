import { db } from './db';
import { Article, StaffMember, Invoice, Tier, Family, SubFamily, Recipe, StructureType, Transaction, AccountingAccount, AppSetting, Partner } from './types';
import { initialFamilies, initialSubFamilies } from './data';

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
    const inv = await db.invoices.get(id);
    const affectedChecks = new Set<string>();
    if (inv) {
        (inv.payments || []).forEach(p => {
            if (p.mode === "Chèques" && p.reference) affectedChecks.add(p.reference);
        });
    }

    await db.invoices.delete(id);
    await db.transactions.where('invoiceId').equals(id).delete();

    // Re-evaluate affected checks
    if (affectedChecks.size > 0) {
        const allInvoices = await db.invoices.toArray();
        for (const ref of Array.from(affectedChecks)) {
            await updateAggregatedCheck(ref, allInvoices);
        }
    }

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
async function updateAggregatedCheck(ref: string, allInvoices: Invoice[]) {
    let total = 0;
    let supplier = "";
    let date = "";

    allInvoices.forEach(inv => {
        (inv.payments || []).forEach(p => {
            if (p.mode === "Chèques" && p.reference === ref) {
                total += Number(p.amount) || 0;
                if (!supplier) supplier = inv.supplierId;
                if (!date) date = p.date;
            }
        });
    });

    if (total > 0) {
        // Resolve supplier name
        let supplierName = supplier;
        if (supplier) {
            const tierObj = await db.tiers.get(supplier);
            if (tierObj) supplierName = tierObj.name;
        }

        await db.transactions.put({
            id: `check_vignette_${ref}`,
            date: date || new Date().toISOString().split('T')[0],
            label: `Reglement Chèque: ${ref}`,
            amount: total,
            type: "Depense",
            category: "Achat",
            account: "Banque",
            pieceNumber: ref,
            tier: supplierName,
            mode: "Chèques" as const,
            isReconciled: false
        } as Transaction);
    } else {
        await db.transactions.delete(`check_vignette_${ref}`);
    }
}

export const syncInvoiceTransactions = async (invoiceId: string, transactions: any[]) => {
    // 1. Delete previous individual transactions for this invoice
    await db.transactions.where('invoiceId').equals(invoiceId).delete();

    // 2. Identify check numbers to re-evaluate
    const affectedCheckNumbers = new Set<string>(
        transactions
            .filter(t => t.mode === "Chèques" && t.pieceNumber)
            .map(t => t.pieceNumber)
    );

    // 3. Handle Aggregated Checks
    if (affectedCheckNumbers.size > 0) {
        const allInvoices = await db.invoices.toArray();
        for (const ref of Array.from(affectedCheckNumbers)) {
            await updateAggregatedCheck(ref, allInvoices);
        }
    }

    // 4. Handle Non-Aggregated Transactions (Individual)
    const individualTxs = transactions.filter(t => t.mode !== "Chèques" || !t.pieceNumber);
    for (const tx of individualTxs) {
        await db.transactions.put(tx);
    }

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

export async function reconcileStructureWithMaster(): Promise<{ success: true }> {
    await db.transaction('rw', [db.families, db.subFamilies], async () => {
        // 1. Ensure all standard families exist, but DON'T overwrite their names
        for (const family of initialFamilies) {
            const existing = await db.families.get(family.id);
            if (!existing) {
                await db.families.add(family);
            }
            // Optional: if (existing && !existing.name) await db.families.update(family.id, { name: family.name });
        }
        // 2. Ensure all standard sub-families exist
        for (const sub of initialSubFamilies) {
            const existing = await db.subFamilies.get(sub.id);
            if (!existing) {
                await db.subFamilies.add(sub);
            }
        }
    });
    return { success: true };
}

export async function moveArticlesBetweenFamilies(fromId: string, toId: string): Promise<{ count: number }> {
    const articles = await db.articles.where('subFamilyId').startsWith(fromId).toArray();
    // This is naive because subFamilyId is not just familyId. 
    // We should probably check the sub-family hierarchy.
    const allSubFamilies = await db.subFamilies.toArray();
    const fromSubs = allSubFamilies.filter(s => s.familyId === fromId).map(s => s.id);
    const toSubs = allSubFamilies.filter(s => s.familyId === toId);

    let count = 0;
    const articlesToMove = await db.articles.toArray();
    for (const art of articlesToMove) {
        if (fromSubs.includes(art.subFamilyId)) {
            // Find equivalent sub in target family by code or name
            const currentSub = allSubFamilies.find(s => s.id === art.subFamilyId);
            const targetSub = toSubs.find(s => s.code === currentSub?.code || s.name === currentSub?.name);
            if (targetSub) {
                await db.articles.update(art.id, { subFamilyId: targetSub.id });
                count++;
            }
        }
    }
    return { count };
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
    const existing = await db.salesData.get({ id });

    // Merge: Use new value if provided, otherwise keep existing
    await db.salesData.put({
        id,
        real: real !== undefined ? real : existing?.real,
        declared: declared !== undefined ? declared : existing?.declared
    });
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
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // Calculate Previous Month Prefix
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // 1. Sales Calculation - Filtered by prefixes
    const currentMonthSales = await db.salesData.where('id').startsWith(currentMonthPrefix).toArray();
    const prevMonthSales = await db.salesData.where('id').startsWith(prevMonthPrefix).toArray();

    let totalSales = 0;
    let prevTotalSales = 0;

    const dailyComparisonMap: Record<number, { current: number, prev: number }> = {};
    for (let d = 1; d <= 31; d++) dailyComparisonMap[d] = { current: 0, prev: 0 };

    currentMonthSales.forEach(day => {
        const dayParts = day.id.split('-');
        const dayNum = parseInt(dayParts[2]);
        const val = parseFloat(day.real?.calculated?.ttc) || 0;
        totalSales += val;
        dailyComparisonMap[dayNum].current = val;
    });

    prevMonthSales.forEach(day => {
        const dayParts = day.id.split('-');
        const dayNum = parseInt(dayParts[2]);
        const val = parseFloat(day.real?.calculated?.ttc) || 0;
        if (dayNum <= currentDay) {
            prevTotalSales += val;
        }
        dailyComparisonMap[dayNum].prev = val;
    });

    const dailyComparison = Object.keys(dailyComparisonMap)
        .map(d => ({ day: parseInt(d), ...dailyComparisonMap[parseInt(d)] }))
        .sort((a, b) => a.day - b.day);

    // 2. Pending Invoices - Filtered by status index
    const pendingInvoices = await db.invoices
        .where('status')
        .anyOf(['Draft', 'Validated'])
        .toArray();

    const totalPendingAmount = pendingInvoices.reduce((sum, inv) => {
        return sum + (inv.totalTTC || 0); // Using cached totalTTC
    }, 0);

    // 3. Articles & Production
    const articleCount = await db.articles.count();
    const recipeCount = await db.recipes.count();

    // 4. Activity Feed - Last 5 invoices
    const recentActivityRaw = await db.invoices
        .orderBy('date')
        .reverse()
        .limit(5)
        .toArray();

    const recentActivity = recentActivityRaw.map(inv => ({
        id: inv.id,
        type: 'FACTURE',
        label: `Facture ${inv.number}`,
        date: inv.date,
        amount: inv.totalTTC || 0
    }));

    return {
        totalSales,
        prevTotalSales,
        dailyComparison,
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
