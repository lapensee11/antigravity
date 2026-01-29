"use client";

import { useEffect } from "react";

export function DataRestorer() {
    useEffect(() => {
        const RESET_KEY = "bakery_full_reset_2024_v1";
        const hasReset = localStorage.getItem(RESET_KEY);

        if (!hasReset) {
            console.log("System Reset: Purging old mock data...");

            const keysToPurge = [
                "bakery_articles",
                "bakery_tiers",
                "bakery_invoices",
                "bakery_recipes",
                "finance_transactions"
            ];

            keysToPurge.forEach(key => {
                localStorage.removeItem(key);
            });

            localStorage.setItem(RESET_KEY, "true");

            // Force reload to ensure all states are re-initialized from empty initialData
            window.location.reload();
        }
    }, []);

    return null;
}
