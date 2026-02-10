import Dexie, { type EntityTable } from 'dexie';
import { Article, Invoice, Tier, StaffMember, Recipe, Family, SubFamily, StructureType, Transaction, AppSetting, AccountingAccount, Partner, CMIEntry } from './types';

export class BakoDB extends Dexie {
    invoices!: EntityTable<Invoice, 'id'>;
    employees!: EntityTable<StaffMember, 'id'>;
    articles!: EntityTable<Article, 'id'>;
    tiers!: EntityTable<Tier, 'id'>;
    recipes!: EntityTable<Recipe, 'id'>;
    families!: EntityTable<Family, 'id'>;
    subFamilies!: EntityTable<SubFamily, 'id'>;
    structureTypes!: EntityTable<StructureType, 'id'>;
    transactions!: EntityTable<Transaction, 'id'>;
    salesData!: EntityTable<any, 'id'>; // Flexible for now
    accountingNatures!: EntityTable<{ id: string, name: string }, 'id'>;
    accounting_accounts!: EntityTable<AccountingAccount, 'id'>;
    settings!: EntityTable<AppSetting, 'key'>;
    partners!: EntityTable<Partner, 'id'>;
    cmi_entries!: EntityTable<CMIEntry, 'id'>;

    constructor() {
        super('BakoDB');
        this.version(8).stores({
            invoices: 'id, supplierId, date, status, totalTTC',
            employees: 'id, lastName, role',
            articles: 'id, name, subFamilyId',
            tiers: 'id, name, type',
            recipes: 'id, name, subFamilyId',
            families: 'id, name, typeId',
            subFamilies: 'id, name, familyId',
            structureTypes: 'id, name',
            transactions: 'id, date, type, account, invoiceId',
            salesData: 'id, date',
            accountingNatures: 'id, name',
            accounting_accounts: '++id, code, label, class, type',
            settings: 'key',
            partners: 'id',
            cmi_entries: 'id, date'
        });
    }
}

export const db = new BakoDB();

import { initialTypes, initialFamilies, initialSubFamilies } from './data';


// Initial data population
export async function populate() {
    if (typeof window === "undefined") return;

    try {
        const familyCount = await db.families.count();
        if (familyCount === 0) {
            console.log("Database empty, populating initial structure...");
            await db.structureTypes.bulkPut(initialTypes);
            await db.families.bulkPut(initialFamilies);
            await db.subFamilies.bulkPut(initialSubFamilies);

            await db.tiers.bulkPut([
                { id: "t1", code: "FRS-001", name: "Grands Moulins de Paris", type: "Fournisseur", phone: "0522001122", email: "contact@gmp.fr", ice: "001564789" },
                { id: "t2", code: "FRS-002", name: "Centrale Danone", type: "Fournisseur", phone: "0522334455", ice: "002456781" },
                { id: "c1", code: "CLI-001", name: "Hôtel Mamounia", type: "Client", phone: "0524445566" }
            ]);

            await db.articles.bulkPut([
                { id: "a1", name: "Farine T45", code: "FAR-T45", subFamilyId: "FA011", unitPivot: "Kg", unitAchat: "Sac", unitProduction: "g", contenace: 25, coeffProd: 1000, vatRate: 20, lastPivotPrice: 5.50, accountingNature: "Achat de matières premières", accountingCode: "6121" },
                { id: "a2", name: "Beurre Doux", code: "BEU-DX", subFamilyId: "FA033", unitPivot: "Kg", unitAchat: "Carton", unitProduction: "g", contenace: 10, coeffProd: 1000, vatRate: 14, lastPivotPrice: 92.00, accountingNature: "Achat de matières premières", accountingCode: "6121" },
                // HYGIENE & ENTRETIEN (FA101, FA102, FA103)
                // SubFamily FA101
                { id: "PA101-01", name: "Lessive Mains", code: "PA101-01", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-02", name: "Javel", code: "PA101-02", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-03", name: "Nettoyant Sol", code: "PA101-03", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-04", name: "ONI", code: "PA101-04", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-05", name: "Nettoyage Vitres", code: "PA101-05", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-11", name: "Balai", code: "PA101-11", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-12", name: "Raclette", code: "PA101-12", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-13", name: "Manche à balai", code: "PA101-13", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-14", name: "Serpillère", code: "PA101-14", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA101-15", name: "Torchons", code: "PA101-15", subFamilyId: "FA101", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },

                // SubFamily FA102
                { id: "PA102-01", name: "Entretien Egoûts", code: "PA102-01", subFamilyId: "FA102", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Achats Non Stockés de matières et fournitures", accountingCode: "6125" },
                { id: "PA102-02", name: "Laveur Vitres", code: "PA102-02", subFamilyId: "FA102", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Achats Non Stockés de matières et fournitures", accountingCode: "6125" },

                // SubFamily FA103
                { id: "PA103-01", name: "Chemises vendeuses", code: "PA103-01", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-02", name: "Devant Vendeuses", code: "PA103-02", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-03", name: "Coiffe Vendeuses", code: "PA103-03", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-04", name: "Pantalon Vendeuses", code: "PA103-04", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-11", name: "Tenue labo", code: "PA103-11", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-12", name: "Tablier labo", code: "PA103-12", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-13", name: "Tocque Labo", code: "PA103-13", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
                { id: "PA103-14", name: "Tenue Ménage", code: "PA103-14", subFamilyId: "FA103", unitAchat: "Unité", unitPivot: "Unité", unitProduction: "Unité", contenace: 1, coeffProd: 1, vatRate: 20, accountingNature: "Fournitures consommables", accountingCode: "6122" },
            ]);

            await db.accountingNatures.bulkAdd([
                { id: "an1", name: "Achat de matières premières" },
                { id: "an2", name: "Achat de marchandises" },
                { id: "an3", name: "Achat d'emballages" },
                { id: "an4", name: "Fournitures consommables" },
                { id: "an5", name: "Petit outillage" },
                { id: "an6", name: "Services extérieurs" }
            ]);

            await db.employees.bulkAdd([
                {
                    id: 1, initials: "HB", name: "BAKIRI Hassan", firstName: "Hassan", lastName: "BAKIRI", role: "Chef Boulanger", gender: "Homme",
                    birthDate: "1985-05-12", matricule: "M001", situationFamiliale: "Marié", childrenCount: 2, credit: 12000,
                    personalInfo: { cin: "BH123456", cnss: "123456789", phone: "0661123456", city: "Casablanca", address: "12 Rue des Farines" },
                    contract: { post: "Chef Boulanger", hireDate: "2022-03-01", exitDate: "-", seniority: "3 ans, 11 mois", seniorityPercentage: 5, leaveBalance: "18 Jours", baseSalary: 6500, fixedBonus: 0 },
                    creditInfo: { loanAmount: 20000, payments: 8000, remaining: 12000 },
                    history: [
                        { year: "22", type: "EMBAUCHE", amount: 5000, bonus: 0, date: "2022-03-01" },
                        { year: "23", type: "AUGMENTATION", amount: 5500, bonus: 0, date: "2023-01-01" },
                        { year: "24", type: "AUGMENTATION", amount: 6000, bonus: 0, date: "2024-06-01" },
                        { year: "25", type: "AUGMENTATION", amount: 6500, bonus: 0, date: "2025-01-01" }
                    ],
                    monthlyData: { "JANVIER": { jours: 26, hSup: 0, pRegul: 0, pOccas: 0, virement: 0, avances: 0, monthlyDeduction: 0 } }
                }
            ]);
        }

        const accCount = await db.accounting_accounts.count();
        if (accCount === 0) {
            console.log("Accounting accounts empty, populating initial accounts...");
            await db.accounting_accounts.bulkAdd([
                { code: "6111", label: "Achats revendus de marchandises", class: "6", type: "Charge", id: "6111" },
                { code: "6121", label: "Achats de matières premières", class: "6", type: "Charge", id: "6121" },
                { code: "6122", label: "Achats de matières et fournitures consommables", class: "6", type: "Charge", id: "6122" },
                { code: "6123", label: "Achats d'emballages", class: "6", type: "Charge", id: "6123" },
                { code: "6125", label: "Achats non stockés de matières et fournitures", class: "6", type: "Charge", id: "6125" },
                { code: "6131", label: "Locations et charges locatives", class: "6", type: "Charge", id: "6131" },
                { code: "6133", label: "Entretien et réparations", class: "6", type: "Charge", id: "6133" },
                { code: "6134", label: "Primes d'assurances", class: "6", type: "Charge", id: "6134" },
                { code: "6142", label: "Transport de personnel", class: "6", type: "Charge", id: "6142" },
                { code: "6144", label: "Publicité, publications et relations publiques", class: "6", type: "Charge", id: "6144" },
                { code: "6145", label: "Frais postaux et frais de télécommunications", class: "6", type: "Charge", id: "6145" },
                { code: "6147", label: "Services bancaires", class: "6", type: "Charge", id: "6147" },
                { code: "6161", label: "Impôts et taxes directs", class: "6", type: "Charge", id: "6161" },
                { code: "6171", label: "Rémunération du personnel", class: "6", type: "Charge", id: "6171" },
                { code: "6174", label: "Charges sociales", class: "6", type: "Charge", id: "6174" },
                { code: "5141", label: "Banque (Solde)", class: "5", type: "Trésorerie", id: "5141" },
                { code: "5161", label: "Caisse Centrale", class: "5", type: "Trésorerie", id: "5161" }
            ] as AccountingAccount[]);
        }
    } catch (err) {
        console.error("Critical error during database population:", err);
    }
}

// Maintenance function to fix structure IDs
async function forceStructureSync() {
    try {
        console.log("DB: Starting structure sync to reference...");

        // 1. Get current articles and recipes to update their links
        const articles = await db.articles.toArray();
        const recipes = await db.recipes.toArray();
        const oldSubFamilies = await db.subFamilies.toArray();

        // 2. Clear and Reset Structure to Reference
        await db.families.clear();
        await db.subFamilies.clear();
        await db.families.bulkPut(initialFamilies);
        await db.subFamilies.bulkPut(initialSubFamilies);

        // 3. Update Articles if their subFamilyId changed
        const updatedArticles = articles.map(art => {
            const oldSub = oldSubFamilies.find(s => s.id === art.subFamilyId);
            if (oldSub) {
                const refSub = initialSubFamilies.find(rs => rs.code === oldSub.code || rs.name === oldSub.name);
                if (refSub && refSub.id !== art.subFamilyId) {
                    return { ...art, subFamilyId: refSub.id };
                }
            }
            return art;
        });
        await db.articles.bulkPut(updatedArticles);

        // 4. Update Recipes
        const updatedRecipes = recipes.map(rec => {
            const oldSub = oldSubFamilies.find(s => s.id === rec.subFamilyId);
            if (oldSub) {
                const refSub = initialSubFamilies.find(rs => rs.code === oldSub.code || rs.name === oldSub.name);
                if (refSub && refSub.id !== rec.subFamilyId) {
                    return { ...rec, subFamilyId: refSub.id };
                }
            }
            return rec;
        });
        await db.recipes.bulkPut(updatedRecipes);

        console.log("DB: Structure sync complete.");
    } catch (error) {
        console.error("DB: Structure sync failed:", error);
    }
}

if (typeof window !== "undefined") {
    // Standard initialization
    db.open().then(async () => {
        console.log("Database opened successfully");
        // await forceStructureSync(); // DISABLED: Structure is now user-controlled (The Boss)
        await populate();
    }).catch(err => {
        console.error("Failed to open database:", err);
    });
}
