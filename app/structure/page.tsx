"use client";

import { Suspense, useEffect, useState } from "react";
import { StructureContent } from "@/components/structure/StructureContent";
import { getFamilies, getSubFamilies, getStructureTypes } from "@/lib/data-service";
import { Family, SubFamily, StructureType } from "@/lib/types";

export default function StructurePage() {
    const [data, setData] = useState<{
        families: Family[],
        subFamilies: SubFamily[],
        types: StructureType[]
    } | null>(null);

    useEffect(() => {
        async function fetchData() {
            const [families, subFamilies, types] = await Promise.all([
                getFamilies(),
                getSubFamilies(),
                getStructureTypes()
            ]);
            setData({ families, subFamilies, types });
        }
        fetchData();
    }, []);

    if (!data) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Chargement des structures...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <StructureContent
                initialFamilies={data.families}
                initialSubFamilies={data.subFamilies}
                initialTypes={data.types}
            />
        </Suspense>
    );
}
