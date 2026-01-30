import { getLocalDB } from "@/lib/db";
import { articles, families, subFamilies, structureTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getArticles() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const res = await tauriDb.select("SELECT * FROM articles") as any[];
            return res.map(a => ({
                ...a,
                subFamilyId: a.sub_family_id,
                unitPivot: a.unit_pivot,
                unitAchat: a.unit_achat,
                unitProduction: a.unit_production,
                lastPivotPrice: a.last_pivot_price,
                vatRate: a.vat_rate,
                leadTimeDays: a.lead_time_days,
                nutritionalInfo: a.nutritional_info ? JSON.parse(a.nutritional_info) : null
            }));
        } catch (error) {
            console.error("Tauri Fetch Articles Error:", error);
            return [];
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return [];
        const res = await db.query.articles.findMany();
        return res.map((a: any) => ({
            ...a,
            contenace: a.contenace ?? 0,
            coeffProd: a.coeffProd ?? 0,
            lastPivotPrice: a.lastPivotPrice ?? 0,
            vatRate: a.vatRate ?? 20,
            leadTimeDays: a.leadTimeDays ?? 0,
            nutritionalInfo: a.nutritionalInfo ? JSON.parse(a.nutritionalInfo) : null
        })) as any[];
    } catch (error) {
        console.error("Fetch Articles Error:", error);
        return [];
    }
}

export async function saveArticle(data: any) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const nutritionalJson = data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null;
            await tauriDb.execute(`
                INSERT INTO articles (id, name, code, sub_family_id, unit_pivot, unit_achat, unit_production, nutritional_info, last_pivot_price, vat_rate)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    code = excluded.code,
                    sub_family_id = excluded.sub_family_id,
                    nutritional_info = excluded.nutritional_info,
                    last_pivot_price = excluded.last_pivot_price,
                    vat_rate = excluded.vat_rate
            `, [data.id, data.name, data.code, data.subFamilyId, data.unitPivot, data.unitAchat, data.unitProduction, nutritionalJson, data.lastPivotPrice, data.vatRate]);
            return { success: true };
        } catch (error) {
            console.error("Tauri Save Article Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false, error: "Database not initialized" };
        const { nutritionalInfo, ...rest } = data;
        const values = {
            ...rest,
            nutritionalInfo: nutritionalInfo ? JSON.stringify(nutritionalInfo) : null
        };
        const existing = await db.query.articles.findFirst({ where: eq(articles.id, data.id) });
        if (existing) {
            await db.update(articles).set(values).where(eq(articles.id, data.id));
        } else {
            await db.insert(articles).values(values);
        }
        if (!isTauri()) {
            await safeRevalidate("/articles");
        }
        return { success: true };
    } catch (error) {
        console.error("Save Article Error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getFamilies() {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        const res = await tauriDb.select("SELECT * FROM families ORDER BY name ASC") as any[];
        return res.map(f => ({
            ...f,
            typeId: f.type_id
        }));
    }
    const db = await getLocalDB();
    if (!db) return [];
    return await db.query.families.findMany({
        orderBy: (families: any, { asc }: any) => [asc(families.name)],
    });
}

export async function getSubFamilies() {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        const res = await tauriDb.select("SELECT * FROM sub_families ORDER BY name ASC") as any[];
        return res.map(sf => ({
            ...sf,
            familyId: sf.family_id
        }));
    }
    const db = await getLocalDB();
    if (!db) return [];
    return await db.query.subFamilies.findMany({
        orderBy: (subFamilies: any, { asc }: any) => [asc(subFamilies.name)],
    });
}

export async function deleteArticle(id: string) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            await tauriDb.execute("DELETE FROM articles WHERE id = $1", [id]);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(articles).where(eq(articles.id, id));
        if (!isTauri()) {
            await safeRevalidate("/articles");
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function getStructureTypes() {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        return await tauriDb.select("SELECT * FROM structure_types") as any[];
    }
    const db = await getLocalDB();
    if (!db) return [];
    return await db.query.structureTypes.findMany();
}

export async function saveFamily(data: any) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute(`
            INSERT INTO families (id, name, code, type_id, icon)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code, type_id=excluded.type_id, icon=excluded.icon
        `, [data.id, data.name, data.code, data.typeId, data.icon]);
        return { success: true };
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const existing = await db.query.families.findFirst({ where: eq(families.id, data.id) });
        if (existing) {
            await db.update(families).set(data).where(eq(families.id, data.id));
        } else {
            await db.insert(families).values(data);
        }
        if (!isTauri()) {
            await safeRevalidate("/structure");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function deleteFamily(id: string) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute("DELETE FROM families WHERE id = $1", [id]);
        return { success: true };
    }
    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(families).where(eq(families.id, id));
        if (!isTauri()) {
            await safeRevalidate("/structure");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function saveSubFamily(data: any) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute(`
            INSERT INTO sub_families (id, name, code, family_id, icon)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code, family_id=excluded.family_id, icon=excluded.icon
        `, [data.id, data.name, data.code, data.familyId, data.icon]);
        return { success: true };
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const existing = await db.query.subFamilies.findFirst({ where: eq(subFamilies.id, data.id) });
        if (existing) {
            await db.update(subFamilies).set(data).where(eq(subFamilies.id, data.id));
        } else {
            await db.insert(subFamilies).values(data);
        }
        if (!isTauri()) {
            await safeRevalidate("/structure");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function deleteSubFamily(id: string) {
    if (isTauri()) {
        const tauriDb = await getDesktopDB();
        await tauriDb.execute("DELETE FROM sub_families WHERE id = $1", [id]);
        return { success: true };
    }
    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        await db.delete(subFamilies).where(eq(subFamilies.id, id));
        if (!isTauri()) {
            await safeRevalidate("/structure");
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
