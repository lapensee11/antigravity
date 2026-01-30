import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

export async function getDesktopDB() {
    if (dbInstance) return dbInstance;

    // Load the database from the application data directory
    dbInstance = await Database.load("sqlite:bakery.db");

    // CRITICAL: Ensure tables exist at startup (Individual try/catch to avoid one failure blocking all)
    const tables = [
        `CREATE TABLE IF NOT EXISTS structure_types (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS families (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, type_id TEXT NOT NULL, icon TEXT)`,
        `CREATE TABLE IF NOT EXISTS sub_families (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, family_id TEXT NOT NULL, fiscal_nature TEXT, icon TEXT)`,
        `CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, sub_family_id TEXT NOT NULL, unit_pivot TEXT NOT NULL, unit_achat TEXT NOT NULL, unit_production TEXT NOT NULL, contenace REAL DEFAULT 0, coeff_prod REAL DEFAULT 0, last_pivot_price REAL DEFAULT 0, vat_rate REAL DEFAULT 20, nutritional_info TEXT, accounting_nature TEXT, accounting_account TEXT)`,
        `CREATE TABLE IF NOT EXISTS tiers (id TEXT PRIMARY KEY, code TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, phone2 TEXT, email TEXT, website TEXT, first_name TEXT, last_name TEXT, address TEXT, city TEXT, note TEXT, note2 TEXT, note3 TEXT, logo TEXT, photo_manager TEXT, ice TEXT, rc TEXT, cnss TEXT, "if" TEXT, rib TEXT, bank_name TEXT)`,
        `CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, number TEXT NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, sync_time TEXT, total_ht REAL NOT NULL, total_ttc REAL NOT NULL, rounding REAL DEFAULT 0, deposit REAL DEFAULT 0, balance_due REAL NOT NULL, date_encaissement TEXT, payment_delay INTEGER, comment TEXT)`,
        `CREATE TABLE IF NOT EXISTS invoice_lines (id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, article_id TEXT NOT NULL, article_name TEXT NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL, price_ht REAL NOT NULL, discount REAL DEFAULT 0, vat_rate REAL NOT NULL, total_ttc REAL NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, invoice_id TEXT, date TEXT NOT NULL, amount REAL NOT NULL, mode TEXT NOT NULL, account TEXT NOT NULL, reference TEXT, check_amount REAL, note TEXT, is_reconciled INTEGER DEFAULT 0)`,
        `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, date TEXT NOT NULL, label TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, category TEXT NOT NULL, account TEXT NOT NULL, invoice_id TEXT, tier TEXT, piece_number TEXT, is_reconciled INTEGER DEFAULT 0, reconciled_date TEXT)`,
        `CREATE TABLE IF NOT EXISTS staff_members (id INTEGER PRIMARY KEY, initials TEXT NOT NULL, name TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, role TEXT NOT NULL, gender TEXT NOT NULL, birth_date TEXT NOT NULL, matricule TEXT NOT NULL, situation_familiale TEXT, children_count INTEGER DEFAULT 0, credit REAL DEFAULT 0, personal_info TEXT, contract TEXT, credit_info TEXT, history TEXT, monthly_data TEXT)`,
        `CREATE TABLE IF NOT EXISTS recipes (id TEXT PRIMARY KEY, name TEXT NOT NULL, family_id TEXT NOT NULL, sub_family_id TEXT NOT NULL, yield REAL NOT NULL, yield_unit TEXT NOT NULL, nutrition TEXT, costing TEXT, image TEXT, reference TEXT)`,
        `CREATE TABLE IF NOT EXISTS ingredients (id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, article_id TEXT NOT NULL, name TEXT NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL, cost REAL NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS production_steps (id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, "order" INTEGER NOT NULL, description TEXT NOT NULL, duration INTEGER)`,
        `CREATE TABLE IF NOT EXISTS daily_sales (date TEXT PRIMARY KEY, real_data TEXT, declared_data TEXT)`
    ];

    for (const sql of tables) {
        try {
            await dbInstance.execute(sql);
        } catch (e) {
            console.error(`Tauri Table Init Error [${sql.substring(0, 30)}...]:`, e);
        }
    }

    console.log("Tauri: Database schema checked and initialized.");
    return dbInstance;
}

export const isTauri = () => {
    const isT = typeof window !== "undefined" && (
        (window as any).__TAURI_INTERNALS__ !== undefined ||
        (window as any).__TAURI__ !== undefined ||
        navigator.userAgent.includes("Tauri")
    );
    return isT;
};
