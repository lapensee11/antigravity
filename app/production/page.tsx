"use client";

import { Suspense } from "react";
import { ProductionContent } from "@/components/production/ProductionContent";

export default function ProductionPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement de la production...</div>}>
            <ProductionContent />
        </Suspense>
    );
}
