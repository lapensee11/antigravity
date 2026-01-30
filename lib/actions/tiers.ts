import { getLocalDB } from "@/lib/db";
import { tiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { Tier } from "@/lib/types";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getTiers() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const res = await tauriDb.select("SELECT * FROM tiers") as any[];
            return res.map(t => ({
                ...t,
                firstName: t.first_name,
                lastName: t.last_name,
                photoManager: t.photo_manager,
                bankName: t.bank_name
            })) as Tier[];
        } catch (error) {
            console.error("Tauri Fetch Tiers Error:", error);
            return [];
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return [];
        return await db.select().from(tiers) as Tier[];
    } catch (error) {
        console.error("Fetch Tiers Error:", error);
        return [];
    }
}

export async function saveTier(tierData: Tier) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            await tauriDb.execute(`
                INSERT INTO tiers (id, code, type, name, phone, phone2, email, website, first_name, last_name, address, city, ice, "if", rc, cnss, rib, bank_name, note, note2, note3)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                ON CONFLICT(id) DO UPDATE SET 
                    name=excluded.name, 
                    code=excluded.code, 
                    type=excluded.type,
                    phone=excluded.phone,
                    email=excluded.email,
                    address=excluded.address,
                    ice=excluded.ice,
                    "if"=excluded."if",
                    rc=excluded.rc
            `, [
                tierData.id,
                tierData.code,
                tierData.type,
                tierData.name,
                tierData.phone || null,
                tierData.phone2 || null,
                tierData.email || null,
                tierData.website || null,
                tierData.firstName || null,
                tierData.lastName || null,
                tierData.address || null,
                tierData.city || null,
                tierData.ice || null,
                tierData.if || null,
                tierData.rc || null,
                tierData.cnss || null,
                tierData.rib || null,
                tierData.bankName || null,
                tierData.note || null,
                tierData.note2 || null,
                tierData.note3 || null
            ]);
            return { success: true };
        } catch (error) {
            console.error("Tauri Save Tier Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const existing = await db.select().from(tiers).where(eq(tiers.id, tierData.id));
        if (existing.length > 0) {
            await db.update(tiers).set(tierData).where(eq(tiers.id, tierData.id));
        } else {
            await db.insert(tiers).values(tierData);
        }
        if (!isTauri()) {
            await safeRevalidate("/tiers");
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function deleteTier(id: string) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute("DELETE FROM tiers WHERE id = $1", [id]);
        return { success: true };
    }
    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(tiers).where(eq(tiers.id, id));
        if (!isTauri()) {
            await safeRevalidate("/tiers");
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
