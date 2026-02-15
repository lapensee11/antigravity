"use client";

import { Suspense } from "react";
import { FacturationContent } from "@/components/facturation/FacturationContent";

export default function FacturationPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement...</div>}>
            <FacturationContent />
        </Suspense>
    );
}
