import Dexie, { type EntityTable } from 'dexie';
import { Article, Invoice, Tier, StaffMember, Recipe, Family, SubFamily, StructureType, Transaction, AppSetting, AccountingAccount, Partner, CMIEntry } from './types';
import { quickSyncStructure } from './structure-sync';
import { migrateTransactionLabels } from './data-service';

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
        
        // Version 9: Add linkedRecipeId index for sub-recipes
        this.version(9).stores({
            invoices: 'id, supplierId, date, status, totalTTC',
            employees: 'id, lastName, role',
            articles: 'id, name, subFamilyId, linkedRecipeId',
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
        
        // Version 10: Add missing indexes for better query performance
        this.version(10).stores({
            invoices: 'id, supplierId, date, status, totalTTC, syncTime',
            employees: 'id, lastName, role',
            articles: 'id, name, subFamilyId, linkedRecipeId, isSubRecipe',
            tiers: 'id, name, type, code',
            recipes: 'id, name, subFamilyId, familyId, isSubRecipe',
            families: 'id, name, typeId',
            subFamilies: 'id, name, familyId',
            structureTypes: 'id, name',
            transactions: 'id, date, type, account, invoiceId, isReconciled',
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

import { initialTypes, initialFamilies, initialSubFamilies, initialArticles } from './data';


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

            await db.articles.bulkPut(initialArticles);

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


if (typeof window !== "undefined") {
    // Standard initialization
    db.open().then(async () => {
        console.log("Database opened successfully");
        await populate();
        
        // Migrate transaction labels to remove (D) and (Déclaré) mentions
        await migrateTransactionLabels();
        
        // Run migrations (one-time, checked via localStorage)
        const { migrateSubFamilyIdsToUUIDs, migrateAccountingCode } = await import('./migrations');
        
        // Migration 1: Fix subFamilyId from names to UUIDs
        const subFamilyIdMigrationKey = 'subFamilyId_migration_completed';
        const subFamilyIdMigrationCompleted = localStorage.getItem(subFamilyIdMigrationKey);
        if (!subFamilyIdMigrationCompleted) {
            console.log("[DB] Running subFamilyId migration...");
            const migrationResult = await migrateSubFamilyIdsToUUIDs();
            if (migrationResult.articlesFixed > 0 || migrationResult.recipesFixed > 0) {
                localStorage.setItem(subFamilyIdMigrationKey, 'true');
                console.log(`[DB] SubFamilyId migration completed: ${migrationResult.articlesFixed} articles, ${migrationResult.recipesFixed} recipes fixed`);
            }
            if (migrationResult.errors.length > 0) {
                console.warn(`[DB] SubFamilyId migration had ${migrationResult.errors.length} errors`);
            }
        }
        
        // Migration 2: Migrate accountingNature/accountingAccount to accountingCode
        const accountingCodeMigrationKey = 'accountingCode_migration_completed';
        const accountingCodeMigrationCompleted = localStorage.getItem(accountingCodeMigrationKey);
        if (!accountingCodeMigrationCompleted) {
            console.log("[DB] Running accounting code migration...");
            const migrationResult = await migrateAccountingCode();
            if (migrationResult.articlesMigrated > 0) {
                localStorage.setItem(accountingCodeMigrationKey, 'true');
                console.log(`[DB] Accounting code migration completed: ${migrationResult.articlesMigrated} articles migrated`);
            }
            if (migrationResult.errors.length > 0) {
                console.warn(`[DB] Accounting code migration had ${migrationResult.errors.length} errors`);
            }
        }
        
        // Migration 3: Generate codes for existing recipes
        const recipeCodesMigrationKey = 'recipeCodes_migration_completed';
        const recipeCodesMigrationCompleted = localStorage.getItem(recipeCodesMigrationKey);
        if (!recipeCodesMigrationCompleted) {
            console.log("[DB] Running recipe codes migration...");
            const { migrateRecipeCodes } = await import('./migrations');
            const migrationResult = await migrateRecipeCodes();
            if (migrationResult.recipesMigrated > 0) {
                localStorage.setItem(recipeCodesMigrationKey, 'true');
                console.log(`[DB] Recipe codes migration completed: ${migrationResult.recipesMigrated} recipes migrated`);
            }
            if (migrationResult.errors.length > 0) {
                console.warn(`[DB] Recipe codes migration had ${migrationResult.errors.length} errors`);
            }
        }
        
        // NOTE: Synchronization is now manual only via "VÉRIFIER LA STRUCTURE" button
        // This prevents unwanted automatic addition of sub-families
        // await quickSyncStructure(); // Disabled - use reconcileStructureWithMaster() manually instead
    }).catch(err => {
        console.error("Failed to open database:", err);
    });
}
