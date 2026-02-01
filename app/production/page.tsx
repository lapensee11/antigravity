"use client";

import { Suspense, useEffect, useState } from "react";
import { ProductionContent } from "@/components/production/ProductionContent";
import { getRecipes, getArticles, getFamilies, getSubFamilies } from "@/lib/data-service";
import { Recipe, Article, Family, SubFamily } from "@/lib/types";

export default function ProductionPage() {
    const [data, setData] = useState<{
        recipes: Recipe[],
        articles: Article[],
        families: Family[],
        subFamilies: SubFamily[]
    } | null>(null);

    useEffect(() => {
        async function fetchData() {
            const [recipes, articles, families, subFamilies] = await Promise.all([
                getRecipes(),
                getArticles(),
                getFamilies(),
                getSubFamilies()
            ]);
            setData({ recipes, articles, families, subFamilies });
        }
        fetchData();
    }, []);

    if (!data) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement de la production...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <ProductionContent
                initialRecipes={data.recipes}
                initialArticles={data.articles}
                initialFamilies={data.families}
                initialSubFamilies={data.subFamilies}
            />
        </Suspense>
    );
}
