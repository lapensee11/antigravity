"use client";

import { Suspense } from "react";
import { FinanceContent } from "@/components/finance/FinanceContent";

export default function FinancePage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement des finances...</div>}>
            <FinanceContent />
        </Suspense>
    );
}
