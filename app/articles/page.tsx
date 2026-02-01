"use client";

import { Suspense, useEffect, useState } from "react";
import { ArticlesContent } from "@/components/articles/ArticlesContent";
import { getArticles } from "@/lib/data-service";
import { Article } from "@/lib/types";

export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[] | null>(null);

    useEffect(() => {
        async function fetchData() {
            setArticles(await getArticles());
        }
        fetchData();
    }, []);

    if (!articles) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement du catalogue...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ArticlesContent initialArticles={articles} />
        </Suspense>
    );
}
