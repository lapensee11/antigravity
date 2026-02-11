"use client";

import { StructureContent } from "@/components/structure/StructureContent";

export default function StructurePage() {
    // StructureContent now handles all data loading internally with React Query
    return (
        <StructureContent
            initialTypes={[]}
            initialFamilies={[]}
            initialSubFamilies={[]}
        />
    );
}
