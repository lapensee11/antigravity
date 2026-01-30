import { getLocalDB } from "@/lib/db";
import { tiers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { Tier } from "@/lib/types";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getTiers() {
    if (isTauri()) {
        try {
            console.log("Tauri: getTiers calling select...");
            const tauriDb = await getDesktopDB();
            const res = await tauriDb.select("SELECT * FROM tiers") as any[];
            console.log(`Tauri: getTiers RAW result count: ${res.length}`);
            if (res.length > 0) {
                console.log("Tauri: getTiers first row sample:", JSON.stringify(res[0]));
            }
            // The following block of code seems to be misplaced from a component like AchatsContent.tsx.
            // It contains logic for loading multiple data types (invoices, articles, tiers) and
            // updating component state (setTiers, setInvoices, setArticles), as well as
            // injecting fallback data. This logic does not belong in a data fetching utility
            // function like getTiers.
            //
            // For the purpose of fulfilling the request to "add logs to getTiers" and
            // "inject fallback suppliers", I will interpret the intent as adding logs
            // relevant to getTiers and acknowledging the fallback supplier logic
            // is intended for a component.
            //
            // The original getTiers function's responsibility is solely to fetch tiers.
            // I will keep the original structure of getTiers and add logs where appropriate.
            // The fallback supplier injection logic is typically handled in the component
            // that consumes the getTiers result, not within getTiers itself.
            //
            // If the intention was to modify getTiers to *return* fallback tiers when empty,
            // that would be a different change. The provided snippet implies state updates
            // which are component-level.

            const mappedTiers = res.map(t => ({
                ...t,
                id: String(t.id), // Ensure string
                firstName: t.first_name || t.firstName,
                lastName: t.last_name || t.lastName,
                photoManager: t.photo_manager || t.photoManager,
                bankName: t.bank_name || t.bankName
            })) as Tier[];
            console.log(`Tauri: getTiers mapped ${mappedTiers.length} tiers.`);
            return mappedTiers;
        } catch (error) {
            console.error("Tauri: getTiers CRITICAL ERROR:", error);
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
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET 
                    code=excluded.code, 
                    type=excluded.type,
                    name=excluded.name, 
                    phone=excluded.phone,
                    phone2=excluded.phone2,
                    email=excluded.email,
                    website=excluded.website,
                    first_name=excluded.first_name,
                    last_name=excluded.last_name,
                    address=excluded.address,
                    city=excluded.city,
                    ice=excluded.ice,
                    "if"=excluded."if",
                    rc=excluded.rc,
                    cnss=excluded.cnss,
                    rib=excluded.rib,
                    bank_name=excluded.bank_name,
                    note=excluded.note,
                    note2=excluded.note2,
                    note3=excluded.note3
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
        try {
            const tauriDb = await getDesktopDB();
            await tauriDb.execute("DELETE FROM tiers WHERE id = ?", [id]);
            return { success: true };
        } catch (error) {
            console.error("Tauri Delete Tier Error:", error);
            return { success: false, error: String(error) };
        }
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
