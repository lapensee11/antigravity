import { Suspense } from "react";
import { VentesContent } from "@/components/ventes/VentesContent";
import { getSalesData } from "@/lib/actions/ventes";

export default async function VentesPage() {
    const salesData = await getSalesData();

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <VentesContent initialSalesData={salesData} />
        </Suspense>
    );
}
