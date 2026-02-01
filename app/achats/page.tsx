"use client";

import { Suspense, useEffect, useState } from "react";
import { AchatsContent } from "@/components/achats/AchatsContent";
import { getInvoices, getArticles, getTiers } from "@/lib/data-service";
import { Invoice, Article, Tier } from "@/lib/types";

export default function AchatsPage() {
    const [data, setData] = useState<{ invoices: Invoice[], articles: Article[], tiers: Tier[] } | null>(null);

    useEffect(() => {
        async function fetchData() {
            const [invoices, articles, tiers] = await Promise.all([
                getInvoices(),
                getArticles(),
                getTiers(),
            ]);
            setData({ invoices, articles, tiers });
        }
        fetchData();
    }, []);

    if (!data) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Initialisation de la base de données...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <AchatsContent
                initialInvoices={data.invoices}
                initialArticles={data.articles}
                initialTiers={data.tiers}
            />
        </Suspense>
    );
}
