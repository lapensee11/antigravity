"use client";

import { Suspense } from "react";
import { AchatsContent } from "@/components/achats/AchatsContent";

export default function AchatsPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement des factures...</div>}>
            <AchatsContent />
        </Suspense>
    );
}
