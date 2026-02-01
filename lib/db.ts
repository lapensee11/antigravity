import Dexie, { type EntityTable } from 'dexie';
import { Article, Invoice, Tier, StaffMember, Recipe, Family, SubFamily, StructureType, Transaction } from './types';

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

    constructor() {
        super('BakoDB');
        this.version(4).stores({
            invoices: 'id, supplierId, date, status, totalTTC',
            employees: 'id, lastName, role',
            articles: 'id, name, subFamilyId',
            tiers: 'id, name, type',
            recipes: 'id, name, subFamilyId',
            families: 'id, name, typeId',
            subFamilies: 'id, name, familyId',
            structureTypes: 'id, name',
            transactions: 'id, date, type, accountId',
            salesData: 'id, date',
            accountingNatures: 'id, name',
            accounting_accounts: '++id, code, label, class, type'
        });
    }
}

export const db = new BakoDB();

import { initialTypes, initialFamilies, initialSubFamilies } from './data';
import { AccountingAccount } from './types';

// Initial data population
export async function populate() {
    if (typeof window === "undefined") return; // Safety check

    const familyCount = await db.families.count();
    if (familyCount === 0) {
        await db.structureTypes.bulkAdd(initialTypes);
        await db.families.bulkAdd(initialFamilies);
        await db.subFamilies.bulkAdd(initialSubFamilies);

        await db.tiers.bulkAdd([
            { id: "t1", code: "FRS-001", name: "Grands Moulins de Paris", type: "Fournisseur", phone: "0522001122", email: "contact@gmp.fr", ice: "001564789" },
            { id: "t2", code: "FRS-002", name: "Centrale Danone", type: "Fournisseur", phone: "0522334455", ice: "002456781" },
            { id: "c1", code: "CLI-001", name: "Hôtel Mamounia", type: "Client", phone: "0524445566" }
        ]);

        await db.articles.bulkAdd([
            { id: "a1", name: "Farine T45", code: "FAR-T45", subFamilyId: "FA011", unitPivot: "Kg", unitAchat: "Sac", unitProduction: "g", contenace: 25, coeffProd: 1000, vatRate: 20, lastPivotPrice: 5.50, accountingNature: "Achat de matières premières", accountingCode: "6121" },
            { id: "a2", name: "Beurre Doux", code: "BEU-DX", subFamilyId: "FA033", unitPivot: "Kg", unitAchat: "Carton", unitProduction: "g", contenace: 10, coeffProd: 1000, vatRate: 14, lastPivotPrice: 92.00, accountingNature: "Achat de matières premières", accountingCode: "6121" }
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
                    { year: "22", type: "EMBAUCHE", amount: 5000, bonus: 500, date: "2022-03-01" },
                    { year: "23", type: "AUGMENTATION", amount: 5500, bonus: 500, date: "2023-01-01" },
                    { year: "24", type: "AUGMENTATION", amount: 6000, bonus: 500, date: "2024-06-01" },
                    { year: "25", type: "AUGMENTATION", amount: 6500, bonus: 500, date: "2025-01-01" }
                ],
                monthlyData: { "JANVIER": { jours: 26, hSup: 0, pRegul: 0, pOccas: 0, virement: 0, avances: 0, monthlyDeduction: 0 } }
            }
        ]);
    }

    // Populate Accounting Accounts if empty (Schema v4)
    const accCount = await db.accounting_accounts.count();
    if (accCount === 0) {
        await db.accounting_accounts.bulkAdd([
            // Classe 6 : Charges
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
            // Classe 5 : Trésorerie
            { code: "5141", label: "Banque (Solde)", class: "5", type: "Trésorerie", id: "5141" },
            { code: "5161", label: "Caisse Centrale", class: "5", type: "Trésorerie", id: "5161" }
        ] as AccountingAccount[]);
    }
}

// Ensure populate is called only in the browser
if (typeof window !== "undefined") {
    populate().catch(err => console.error("Could not populate database", err));
}
