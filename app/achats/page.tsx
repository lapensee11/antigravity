import { Suspense } from "react";
import { AchatsContent } from "@/components/achats/AchatsContent";
import { getInvoices } from "@/lib/actions/finance";
import { getArticles } from "@/lib/actions/articles";
import { getTiers } from "@/lib/actions/tiers";

export default async function AchatsPage() {
    // Fetch initial data
    const [invoices, articles, tiers] = await Promise.all([
        getInvoices(),
        getArticles(),
        getTiers(),
    ]);

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <AchatsContent
                initialInvoices={invoices}
                initialArticles={articles}
                initialTiers={tiers}
            />
        </Suspense>
    );
}
