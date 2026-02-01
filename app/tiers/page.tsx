"use client";

import { Suspense, useEffect, useState } from "react";
import { TiersContent } from "@/components/tiers/TiersContent";
import { getTiers } from "@/lib/data-service";
import { Tier } from "@/lib/types";

export default function TiersPage() {
    const [tiers, setTiers] = useState<Tier[] | null>(null);

    useEffect(() => {
        async function fetchData() {
            setTiers(await getTiers());
        }
        fetchData();
    }, []);

    if (!tiers) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement de l'annuaire...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <TiersContent initialTiers={tiers} />
        </Suspense>
    );
}
