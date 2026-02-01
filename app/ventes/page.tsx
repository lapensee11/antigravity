"use client";

import { Suspense, useEffect, useState } from "react";
import { VentesContent } from "@/components/ventes/VentesContent";
import { getSalesData } from "@/lib/data-service";

export default function VentesPage() {
    const [salesData, setSalesData] = useState<Record<string, { real?: any; declared?: any }> | null>(null);

    useEffect(() => {
        async function fetchData() {
            setSalesData(await getSalesData());
        }
        fetchData();
    }, []);

    if (!salesData) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement des ventes...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <VentesContent initialSalesData={salesData} />
        </Suspense>
    );
}
