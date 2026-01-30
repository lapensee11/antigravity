import { getLocalDB } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isTauri, getDesktopDB } from "./db-desktop";

async function initializeTauriSchema(tauriDb: any) {
    console.log("Initializing Tauri SQLite Schema...");

    // Structure
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS structure_types (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL)`);
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS families (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, type_id TEXT NOT NULL, icon TEXT)`);
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS sub_families (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, family_id TEXT NOT NULL, fiscal_nature TEXT, icon TEXT)`);

    // Inventory
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, sub_family_id TEXT NOT NULL,
        unit_pivot TEXT NOT NULL, unit_achat TEXT NOT NULL, unit_production TEXT NOT NULL,
        contenace REAL DEFAULT 0, coeff_prod REAL DEFAULT 0, last_pivot_price REAL DEFAULT 0,
        vat_rate REAL DEFAULT 20, lead_time_days INTEGER DEFAULT 0, nutritional_info TEXT
    )`);

    // Tiers
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS tiers (
        id TEXT PRIMARY KEY, code TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL,
        phone TEXT, phone2 TEXT, email TEXT, website TEXT, first_name TEXT, last_name TEXT,
        address TEXT, city TEXT, note TEXT, note2 TEXT, note3 TEXT, logo TEXT, photo_manager TEXT,
        ice TEXT, rc TEXT, cnss TEXT, "if" TEXT, rib TEXT, bank_name TEXT
    )`);

    // Invoices
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, number TEXT NOT NULL, date TEXT NOT NULL,
        status TEXT NOT NULL, sync_time TEXT, total_ht REAL NOT NULL, total_ttc REAL NOT NULL,
        rounding REAL DEFAULT 0, deposit REAL DEFAULT 0, balance_due REAL NOT NULL,
        date_encaissement TEXT, payment_delay INTEGER, comment TEXT
    )`);

    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS invoice_lines (
        id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, article_id TEXT NOT NULL,
        article_name TEXT NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL,
        price_ht REAL NOT NULL, discount REAL DEFAULT 0, vat_rate REAL NOT NULL, total_ttc REAL NOT NULL
    )`);

    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY, invoice_id TEXT, date TEXT NOT NULL, amount REAL NOT NULL,
        mode TEXT NOT NULL, account TEXT NOT NULL, reference TEXT, check_amount REAL,
        note TEXT, is_reconciled INTEGER DEFAULT 0
    )`);

    // Production
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, family_id TEXT NOT NULL, sub_family_id TEXT NOT NULL,
        yield REAL NOT NULL, yield_unit TEXT NOT NULL, nutrition TEXT, costing TEXT, image TEXT, reference TEXT
    )`);

    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, article_id TEXT NOT NULL,
        name TEXT NOT NULL, quantity REAL NOT NULL, unit TEXT NOT NULL, cost REAL NOT NULL
    )`);

    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS production_steps (
        id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL, "order" INTEGER NOT NULL,
        description TEXT NOT NULL, duration INTEGER
    )`);

    // Finance
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY, date TEXT NOT NULL, label TEXT NOT NULL, amount REAL NOT NULL,
        type TEXT NOT NULL, category TEXT NOT NULL, account TEXT NOT NULL,
        invoice_id TEXT, tier TEXT, piece_number TEXT, is_reconciled INTEGER DEFAULT 0, reconciled_date TEXT
    )`);

    // Staff
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS staff_members (
        id INTEGER PRIMARY KEY, initials TEXT NOT NULL, name TEXT NOT NULL,
        first_name TEXT NOT NULL, last_name TEXT NOT NULL, role TEXT NOT NULL,
        gender TEXT NOT NULL, birth_date TEXT NOT NULL, matricule TEXT NOT NULL,
        situation_familiale TEXT, children_count INTEGER DEFAULT 0, credit REAL DEFAULT 0,
        personal_info TEXT, contract TEXT, credit_info TEXT, history TEXT, monthly_data TEXT
    )`);

    // Sales
    await tauriDb.execute(`CREATE TABLE IF NOT EXISTS daily_sales (date TEXT PRIMARY KEY, real_data TEXT, declared_data TEXT)`);

    console.log("Schema Initialization Done.");
}

export async function seedInitialStructure(types: any[], families: any[], subFamilies: any[]) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();

            // Ensure tables exist before seeding
            await initializeTauriSchema(tauriDb);

            console.log("Tauri Seeding Structure...");

            for (const t of types) {
                await tauriDb.execute(`
                    INSERT INTO structure_types (id, name, color) VALUES (?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color
                `, [t.id, t.name, t.color]);
            }

            for (const f of families) {
                await tauriDb.execute(`
                    INSERT INTO families (id, name, code, type_id, icon) VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code, type_id=excluded.type_id, icon=excluded.icon
                `, [f.id, f.name, f.code, f.typeId, f.icon || null]);
            }

            for (const s of subFamilies) {
                await tauriDb.execute(`
                    INSERT INTO sub_families (id, name, code, family_id, icon) VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code, family_id=excluded.family_id, icon=excluded.icon
                `, [s.id, s.name, s.code, s.familyId, s.icon || null]);
            }
            return { success: true };
        } catch (error) {
            console.error("Tauri Seeding Error:", error);
            return { success: false, error: "Seeding: " + String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false, error: "DB not initialized" };

        for (const t of types) {
            await db.insert(schema.structureTypes).values(t).onConflictDoUpdate({
                target: schema.structureTypes.id,
                set: { name: t.name, color: t.color }
            });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function migrateAllData(data: any) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            // initializeTauriSchema is already called in seedInitialStructure which runs first
            console.log("Tauri Full Migration Starting...");

            // 1. Tiers
            if (data.tiers && data.tiers.length > 0) {
                for (const t of data.tiers) {
                    try {
                        await tauriDb.execute(`
                            INSERT INTO tiers (id, code, type, name, phone, email, address, city, ice, "if", rc, cnss)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(id) DO NOTHING
                        `, [t.id, t.code || 'T-000', t.type || 'Fournisseur', t.name || 'Sans nom', t.phone || null, t.email || null, t.address || null, t.city || null, t.ice || null, t.if || null, t.rc || null, t.cnss || null]);
                    } catch (e) { console.error(e); }
                }
            }

            // 2. Articles
            if (data.articles && data.articles.length > 0) {
                for (const a of data.articles) {
                    try {
                        await tauriDb.execute(`
                            INSERT INTO articles (id, name, code, sub_family_id, unit_pivot, unit_achat, unit_production, last_pivot_price, vat_rate)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(id) DO NOTHING
                        `, [a.id, a.name, a.code, a.subFamilyId, a.unitPivot, a.unitAchat, a.unitProduction, a.lastPivotPrice || 0, a.vatRate || 20]);
                    } catch (e) { console.error(e); }
                }
            }

            // 3. Invoices
            if (data.invoices && data.invoices.length > 0) {
                for (const inv of data.invoices) {
                    try {
                        await tauriDb.execute(`
                            INSERT INTO invoices (id, supplier_id, number, date, status, total_ht, total_ttc, rounding, deposit, balance_due)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(id) DO NOTHING
                        `, [inv.id, inv.supplierId, inv.number, inv.date, inv.status, inv.totalHT, inv.totalTTC, inv.rounding || 0, inv.deposit || 0, inv.balanceDue]);

                        if (inv.lines) {
                            for (const l of inv.lines) {
                                await tauriDb.execute(`
                                    INSERT INTO invoice_lines (id, invoice_id, article_id, article_name, quantity, unit, price_ht, discount, vat_rate, total_ttc)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    ON CONFLICT(id) DO NOTHING
                                `, [l.id, inv.id, l.articleId, l.articleName, l.quantity, l.unit, l.priceHT, l.discount || 0, l.vatRate, l.totalTTC]);
                            }
                        }

                        if (inv.payments) {
                            for (const p of inv.payments) {
                                await tauriDb.execute(`
                                    INSERT INTO payments (id, invoice_id, date, amount, mode, account, is_reconciled)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ON CONFLICT(id) DO NOTHING
                                `, [p.id, inv.id, p.date, p.amount, p.mode, p.account, p.isReconciled ? 1 : 0]);
                            }
                        }
                    } catch (e) { console.error(e); }
                }
            }

            // 4. Staff
            if (data.staff && data.staff.length > 0) {
                for (const s of data.staff) {
                    try {
                        await tauriDb.execute(`
                            INSERT INTO staff_members (id, initials, name, first_name, last_name, role, gender, birth_date, matricule, situation_familiale, children_count, credit, personal_info, contract, credit_info, history, monthly_data)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(id) DO NOTHING
                        `, [
                            s.id, s.initials, s.name, s.firstName, s.lastName, s.role, s.gender, s.birthDate, s.matricule,
                            s.situationFamiliale, s.childrenCount || 0, s.credit || 0,
                            JSON.stringify(s.personalInfo || {}), JSON.stringify(s.contract || {}),
                            JSON.stringify(s.creditInfo || {}), JSON.stringify(s.history || []),
                            JSON.stringify(s.monthlyData || {})
                        ]);
                    } catch (e) { console.error(e); }
                }
            }

            // 5. Daily Sales
            if (data.ventes) {
                for (const [date, dayData] of Object.entries(data.ventes)) {
                    try {
                        const typedDayData = dayData as any;
                        await tauriDb.execute(`
                            INSERT INTO daily_sales (date, real_data, declared_data)
                            VALUES (?, ?, ?)
                            ON CONFLICT(date) DO UPDATE SET 
                                real_data = EXCLUDED.real_data,
                                declared_data = EXCLUDED.declared_data
                        `, [
                            date,
                            typedDayData.real ? JSON.stringify(typedDayData.real) : null,
                            typedDayData.declared ? JSON.stringify(typedDayData.declared) : null
                        ]);
                    } catch (e) { console.error(e); }
                }
            }

            // 6. Transactions
            if (data.transactions && data.transactions.length > 0) {
                for (const tx of data.transactions) {
                    try {
                        await tauriDb.execute(`
                            INSERT INTO transactions (id, date, label, amount, type, category, account, invoice_id, tier, piece_number, is_reconciled)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ON CONFLICT(id) DO NOTHING
                        `, [tx.id, tx.date, tx.label, tx.amount, tx.type, tx.category, tx.account, tx.invoiceId || null, tx.tier || null, tx.pieceNumber || null, tx.isReconciled ? 1 : 0]);
                    } catch (e) { console.error(e); }
                }
            }

            return { success: true };
        } catch (error) {
            console.error("Critical Tauri Migration Error:", error);
            return { success: false, error: "Migration: " + String(error) };
        }
    }
    return { success: true };
}
