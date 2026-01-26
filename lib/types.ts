export type StructureTypeName = "Achat" | "Fonctionnement" | "Production" | "Vente";

export interface StructureType {
    id: string;
    name: StructureTypeName;
    color: string;
}

export interface Family {
    id: string;
    name: string;
    code: string;
    typeId: string;
    icon?: string;
}

export interface SubFamily {
    id: string;
    name: string;
    code: string;
    familyId: string;
    fiscalNature?: string;
    icon?: string;
}

export interface Article {
    id: string;
    name: string;
    code: string;
    subFamilyId: string;

    unitPivot: string;
    unitAchat: string;
    unitProduction: string;

    contenace: number; // For conversion
    coeffProd: number; // For conversion

    lastPivotPrice?: number;
    priceHistory?: { date: string; price: number }[]; // History
    vatRate: number; // %
}

// Invoices
export type InvoiceStatus = "Draft" | "Validated" | "Synced" | "Modified";

export interface InvoiceLine {
    id: string;
    articleId: string;
    articleName: string;
    quantity: number;
    unit: string;
    priceHT: number;
    discount: number; // %
    vatRate: number; // %
    totalTTC: number; // Calculated
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    mode: "Especes" | "Cheque" | "Virement" | "Prelevement";
    account: "Banque" | "Caisse" | "Coffre";
    reference?: string; // N° Chèque
    checkAmount?: number; // Montant Chèque
    isReconciled?: boolean; // Pointé en banque
}

export interface Invoice {
    id: string;
    supplierId: string;
    number: string;
    date: string;
    status: InvoiceStatus;
    syncTime?: string;

    lines: InvoiceLine[];
    payments: Payment[];

    // Financials
    totalHT: number;
    totalTTC: number;
    rounding: number;
    deposit: number; // Acompte
    balanceDue: number; // Solde dû

    // Dates
    dateEncaissement?: string;
    paymentDelay?: number;
}

// Tiers
export type TierType = "Fournisseur" | "Client";

export interface Tier {
    id: string;
    code: string; // Frs-023 or Cli-145
    type: TierType;
    name: string;
    phone?: string;
    phone2?: string;
    email?: string;
    website?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    note?: string;
    note2?: string;
    note3?: string;
    logo?: string;
    photoManager?: string;

    // Legal
    ice?: string;
    rc?: string;
    cnss?: string;
    if?: string; // Identifiant Fiscal

    // Bank
    rib?: string;
    bankName?: string;
}

// Production / Recipe
export interface Ingredient {
    id: string;
    articleId: string;
    name: string;
    quantity: number;
    unit: string;
    cost: number; // Calculated from Article Pivot Price
}

export interface ProductionStep {
    order: number;
    description: string;
    duration?: number; // minutes
}

export interface Nutrition {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    glycemicIndex: number;
    glycemicLoad: number;
}

export interface Costing {
    materialCost: number;
    lossRate: number; // %
    laborCost: number;
    storageCost: number;
    totalCost: number;
    costPerUnit: number; // e.g. per portion or per kg
}

export interface Recipe {
    id: string;
    name: string;
    familyId: string;
    subFamilyId: string;
    yield: number; // e.g. 10
    yieldUnit: string; // e.g. "Portions"

    ingredients: Ingredient[];
    steps: ProductionStep[];
    nutrition: Nutrition;
    costing: Costing;

    image?: string;
}

// Finance
export type AccountType = "Banque" | "Caisse" | "Coffre";
export type TransactionType = "Depense" | "Recette";

export interface Transaction {
    id: string;
    date: string;
    label: string;
    amount: number;
    type: TransactionType; // In/Out
    category: string; // e.g. "Achat", "Vente", "Charges"
    account: AccountType;

    invoiceId?: string; // Link to Invoice

    tier?: string; // Client or Supplier Name
    pieceNumber?: string; // N° Pièce / Reference

    isReconciled?: boolean; // For Bank
    reconciledDate?: string;
}
