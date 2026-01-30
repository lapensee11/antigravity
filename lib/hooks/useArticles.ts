import { useState, useEffect } from "react";
import { getArticles, saveArticle, deleteArticle } from "../actions/articles";
import { isTauri, getDesktopDB } from "../actions/db-desktop";

export function useArticles(initialData: any[]) {
    const [articles, setArticles] = useState(initialData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isTauri()) {
            loadTauriArticles();
        }
    }, []);

    const loadTauriArticles = async () => {
        setLoading(true);
        try {
            const db = await getDesktopDB();
            const res = await db.select("SELECT * FROM articles") as any[];
            setArticles(res.map((a: any) => ({
                ...a,
                nutritionalInfo: a.nutritional_info ? JSON.parse(a.nutritional_info) : null
            })));
        } catch (error) {
            console.error("Tauri Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data: any) => {
        if (isTauri()) {
            try {
                const db = await getDesktopDB();
                const nutritionalJson = data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null;

                // Simplified upsert logic for SQLite
                await db.execute(`
                    INSERT INTO articles (id, name, code, sub_family_id, unit_pivot, unit_achat, unit_production, nutritional_info)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        code = excluded.code,
                        nutritional_info = excluded.nutritional_info
                `, [data.id, data.name, data.code, data.subFamilyId, data.unitPivot, data.unitAchat, data.unitProduction, nutritionalJson]);

                await loadTauriArticles();
                return { success: true };
            } catch (error) {
                console.error("Tauri Save Error:", error);
                return { success: false, error: String(error) };
            }
        } else {
            return await saveArticle(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (isTauri()) {
            try {
                const db = await getDesktopDB();
                await db.execute("DELETE FROM articles WHERE id = $1", [id]);
                await loadTauriArticles();
                return { success: true };
            } catch (error) {
                console.error("Tauri Delete Error:", error);
                return { success: false, error: String(error) };
            }
        } else {
            return await deleteArticle(id);
        }
    };

    return { articles, loading, handleSave, handleDelete };
}
