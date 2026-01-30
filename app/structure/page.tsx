import { StructureContent } from "@/components/structure/StructureContent";
import { getFamilies, getSubFamilies, getStructureTypes } from "@/lib/actions/articles";
import { initialTypes } from "@/lib/data";

export default async function StructurePage() {
    const families = await getFamilies();
    const subFamilies = await getSubFamilies();
    const dbTypes = await getStructureTypes();

    // Fallback to initialTypes if DB table structure_types is empty
    const types = dbTypes.length > 0 ? dbTypes : (initialTypes as any[]);

    return (
        <StructureContent
            initialFamilies={families}
            initialSubFamilies={subFamilies}
            initialTypes={types}
        />
    );
}
