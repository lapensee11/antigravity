import { getLocalDB } from "@/lib/db";
import { dailySales } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { safeRevalidate } from "./revalidate";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getSalesData() {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const res = await tauriDb.select("SELECT * FROM daily_sales") as any[];
            const data: Record<string, { real?: any; declared?: any }> = {};
            res.forEach((item: any) => {
                data[item.date] = {
                    real: item.real_data ? JSON.parse(item.real_data) : undefined,
                    declared: item.declared_data ? JSON.parse(item.declared_data) : undefined
                };
            });
            return data;
        } catch (error) {
            console.error("Tauri Fetch Sales Error:", error);
            return {};
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return {};
        const res = await db.query.dailySales.findMany();
        const data: Record<string, { real?: any; declared?: any }> = {};

        res.forEach((item: any) => {
            data[item.date] = {
                real: item.realData ? JSON.parse(item.realData) : undefined,
                declared: item.declaredData ? JSON.parse(item.declaredData) : undefined
            };
        });

        return data;
    } catch (error) {
        console.error("Fetch Sales Data Error:", error);
        return {};
    }
}

export async function saveDayData(date: string, type: "real" | "declared", dayData: any) {
    if (isTauri()) {
        try {
            const tauriDb = await getDesktopDB();
            const jsonField = type === "real" ? "real_data" : "declared_data";
            const jsonData = JSON.stringify(dayData);

            await tauriDb.execute(`
                INSERT INTO daily_sales (date, ${jsonField})
                VALUES (?, ?)
                ON CONFLICT(date) DO UPDATE SET ${jsonField} = excluded.${jsonField}
            `, [date, jsonData]);

            return { success: true };
        } catch (error) {
            console.error("Tauri Save Sales Error:", error);
            return { success: false, error: String(error) };
        }
    }

    try {
        const db = await getLocalDB();
        if (!db) return { success: false };
        const existing = await db.query.dailySales.findFirst({
            where: eq(dailySales.date, date)
        });

        if (existing) {
            const updateObj: any = {};
            if (type === "real") updateObj.realData = JSON.stringify(dayData);
            if (type === "declared") updateObj.declaredData = JSON.stringify(dayData);

            await db.update(dailySales).set(updateObj).where(eq(dailySales.date, date));
        } else {
            const insertObj: any = { date };
            if (type === "real") insertObj.realData = JSON.stringify(dayData);
            if (type === "declared") insertObj.declaredData = JSON.stringify(dayData);

            await db.insert(dailySales).values(insertObj);
        }

        if (!isTauri()) {
            await safeRevalidate("/ventes");
        }
        return { success: true };
    } catch (error) {
        console.error("Save Day Data Error:", error);
        return { success: false, error: String(error) };
    }
}
