"use client";

import { Suspense, useEffect } from "react";
import { ArticlesContent } from "@/components/articles/ArticlesContent";
import { ensureArticlesExist } from "@/lib/data-service";

export default function ArticlesPage() {
    // Ensure articles exist on mount (one-time setup)
    useEffect(() => {
        ensureArticlesExist();
    }, []);

    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement du catalogue...</div>}>
            <ArticlesContent />
        </Suspense>
    );
}
