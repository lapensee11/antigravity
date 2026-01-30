import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// --- STRUCTURE ---

export const structureTypes = sqliteTable("structure_types", {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // Achat, Fonctionnement, Production, Vente
    color: text("color").notNull(),
});

export const families = sqliteTable("families", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    typeId: text("type_id").notNull().references(() => structureTypes.id),
    icon: text("icon"),
});

export const subFamilies = sqliteTable("sub_families", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    familyId: text("family_id").notNull().references(() => families.id),
    fiscalNature: text("fiscal_nature"),
    icon: text("icon"),
});

// --- INVENTORY ---

export const articles = sqliteTable("articles", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    subFamilyId: text("sub_family_id").notNull().references(() => subFamilies.id),
    unitPivot: text("unit_pivot").notNull(),
    unitAchat: text("unit_achat").notNull(),
    unitProduction: text("unit_production").notNull(),
    contenace: real("contenace").default(0),
    coeffProd: real("coeff_prod").default(0),
    lastPivotPrice: real("last_pivot_price").default(0),
    vatRate: real("vat_rate").default(20),
    accountingNature: text("accounting_nature"),
    accountingAccount: text("accounting_account"),
    allergens: text("allergens"), // Stored as comma-separated or JSON
    storageConditions: text("storage_conditions"),
    leadTimeDays: integer("lead_time_days").default(0),
    nutritionalInfo: text("nutritional_info"), // JSON string
});

export const tiers = sqliteTable("tiers", {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    type: text("type").notNull(), // Fournisseur, Client
    name: text("name").notNull(),
    phone: text("phone"),
    phone2: text("phone2"),
    email: text("email"),
    website: text("website"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    address: text("address"),
    city: text("city"),
    note: text("note"),
    note2: text("note2"),
    note3: text("note3"),
    logo: text("logo"),
    photoManager: text("photo_manager"),
    ice: text("ice"),
    rc: text("rc"),
    cnss: text("cnss"),
    if: text("if"),
    rib: text("rib"),
    bankName: text("bank_name"),
});

// --- INVOICES ---

export const invoices = sqliteTable("invoices", {
    id: text("id").primaryKey(),
    supplierId: text("supplier_id").notNull().references(() => tiers.id),
    number: text("number").notNull(),
    date: text("date").notNull(),
    status: text("status").notNull(), // Draft, Validated, Synced, Modified
    syncTime: text("sync_time"),
    totalHT: real("total_ht").notNull(),
    totalTTC: real("total_ttc").notNull(),
    rounding: real("rounding").default(0),
    deposit: real("deposit").default(0),
    balanceDue: real("balance_due").notNull(),
    dateEncaissement: text("date_encaissement"),
    paymentDelay: integer("payment_delay"),
    comment: text("comment"),
});

export const invoiceLines = sqliteTable("invoice_lines", {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id").notNull().references(() => invoices.id),
    articleId: text("article_id").notNull().references(() => articles.id),
    articleName: text("article_name").notNull(),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    priceHT: real("price_ht").notNull(),
    discount: real("discount").default(0),
    vatRate: real("vat_rate").notNull(),
    totalTTC: real("total_ttc").notNull(),
});

export const payments = sqliteTable("payments", {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id").references(() => invoices.id),
    date: text("date").notNull(),
    amount: real("amount").notNull(),
    mode: text("mode").notNull(), // Virement, Espèces, Chèque, etc.
    account: text("account").notNull(), // Banque, Caisse, Coffre
    reference: text("reference"),
    checkAmount: real("check_amount"),
    note: text("note"),
    isReconciled: integer("is_reconciled", { mode: "boolean" }).default(false),
});

export const invoicesRelations = relations(invoices, ({ many }) => ({
    lines: many(invoiceLines),
    payments: many(payments),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
    invoice: one(invoices, {
        fields: [invoiceLines.invoiceId],
        references: [invoices.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    invoice: one(invoices, {
        fields: [payments.invoiceId],
        references: [invoices.id],
    }),
}));

// --- PRODUCTION ---

export const recipes = sqliteTable("recipes", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    familyId: text("family_id").notNull().references(() => families.id),
    subFamilyId: text("sub_family_id").notNull().references(() => subFamilies.id),
    yield: real("yield").notNull(),
    yieldUnit: text("yield_unit").notNull(),
    nutrition: text("nutrition"), // JSON string
    costing: text("costing"), // JSON string
    image: text("image"),
    reference: text("reference"),
});

export const ingredients = sqliteTable("ingredients", {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id").notNull().references(() => recipes.id),
    articleId: text("article_id").notNull().references(() => articles.id),
    name: text("name").notNull(),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    cost: real("cost").notNull(),
});

export const productionSteps = sqliteTable("production_steps", {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id").notNull().references(() => recipes.id),
    order: integer("order").notNull(),
    description: text("description").notNull(),
    duration: integer("duration"),
});

export const recipesRelations = relations(recipes, ({ many, one }) => ({
    ingredients: many(ingredients),
    steps: many(productionSteps),
    family: one(families, { fields: [recipes.familyId], references: [families.id] }),
    subFamily: one(subFamilies, { fields: [recipes.subFamilyId], references: [subFamilies.id] }),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
    recipe: one(recipes, { fields: [ingredients.recipeId], references: [recipes.id] }),
    article: one(articles, { fields: [ingredients.articleId], references: [articles.id] }),
}));

export const productionStepsRelations = relations(productionSteps, ({ one }) => ({
    recipe: one(recipes, { fields: [productionSteps.recipeId], references: [recipes.id] }),
}));

// --- FINANCE ---

export const transactions = sqliteTable("transactions", {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    label: text("label").notNull(),
    amount: real("amount").notNull(),
    type: text("type").notNull(), // Depense, Recette
    category: text("category").notNull(),
    account: text("account").notNull(),
    invoiceId: text("invoice_id"),
    tier: text("tier"),
    pieceNumber: text("piece_number"),
    isReconciled: integer("is_reconciled", { mode: "boolean" }).default(false),
    reconciledDate: text("reconciled_date"),
});

// --- PAYROLL / STAFF ---

export const staffMembers = sqliteTable("staff_members", {
    id: integer("id").primaryKey(),
    initials: text("initials").notNull(),
    name: text("name").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    role: text("role").notNull(),
    gender: text("gender").notNull(),
    birthDate: text("birth_date").notNull(),
    matricule: text("matricule").notNull(),
    situationFamiliale: text("situation_familiale"),
    childrenCount: integer("children_count").default(0),
    credit: real("credit").default(0),
    personalInfo: text("personal_info"), // JSON
    contract: text("contract"), // JSON
    creditInfo: text("credit_info"), // JSON
    history: text("history"), // JSON array
    monthlyData: text("monthly_data"), // JSON object
});

// --- DAILY SALES (Ventes) ---

export const dailySales = sqliteTable("daily_sales", {
    date: text("date").primaryKey(), // YYYY-MM-DD
    realData: text("real_data"), // JSON - DayData shape
    declaredData: text("declared_data"), // JSON - DayData shape
});
