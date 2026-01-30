"use client";

import { useEffect, useState } from "react";
import { migrateAllData, seedInitialStructure } from "@/lib/actions/migration";
import { initialTypes, initialFamilies, initialSubFamilies } from "@/lib/data";

export function MigrationManager() {
    const [status, setStatus] = useState<"idle" | "migrating" | "done" | "error">("idle");

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const isDone = localStorage.getItem("sqlite_migration_done");
        if (isDone) {
            setStatus("done");
            return;
        }

        const runMigration = async () => {
            setStatus("migrating");
            try {
                // 2. Extract from LocalStorage
                const data = {
                    articles: JSON.parse(localStorage.getItem("bakery_articles") || "[]"),
                    tiers: JSON.parse(localStorage.getItem("bakery_tiers") || "[]"),
                    invoices: JSON.parse(localStorage.getItem("bakery_invoices") || "[]"),
                    transactions: JSON.parse(localStorage.getItem("finance_transactions") || "[]"),
                    staff: JSON.parse(localStorage.getItem("bakery_staff") || "[]"),
                    ventes: JSON.parse(localStorage.getItem("ventes_daily_data") || "{}"),
                    families: JSON.parse(localStorage.getItem("bakery_families") || "[]"),
                    subFamilies: JSON.parse(localStorage.getItem("bakery_subfamilies") || "[]"),
                    recipes: JSON.parse(localStorage.getItem("bakery_recipes") || "[]")
                };

                // 2b. Seed Structure with merge (Initial + LocalStorage)
                const finalFamilies = data.families.length > 0 ? data.families : initialFamilies;
                const finalSubFamilies = data.subFamilies.length > 0 ? data.subFamilies : initialSubFamilies;

                const seedRes = await seedInitialStructure(initialTypes, finalFamilies, finalSubFamilies);
                if (!seedRes.success) {
                    setErrorMsg(seedRes.error || "Seeding failed");
                    throw new Error(seedRes.error);
                }

                // 3. Send to Server
                const migrateRes = await migrateAllData(data);
                if (!migrateRes.success) {
                    setErrorMsg(migrateRes.error || "Migration failed");
                    throw new Error(migrateRes.error);
                }

                // 4. Mark as done
                localStorage.setItem("sqlite_migration_done", "true");
                setStatus("done");
            } catch (e) {
                console.error("Migration failed", e);
                setStatus("error");
            }
        };

        runMigration();
    }, []);

    if (status === "idle" || status === "done") return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center animate-in zoom-in-95">
                {status === "migrating" && (
                    <>
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Migration vers SQLite</h2>
                        <p className="text-slate-500">Sécurisation de vos données dans une base de données permanente...</p>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Erreur de migration</h2>
                        <p className="text-slate-500 mb-4">Une erreur est survenue lors du transfert des données.</p>
                        {errorMsg && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-mono mb-6 break-words">
                                {errorMsg}
                            </div>
                        )}
                        <button
                            onClick={() => {
                                localStorage.removeItem("sqlite_migration_done");
                                window.location.reload();
                            }}
                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
                        >
                            Réessayer
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
