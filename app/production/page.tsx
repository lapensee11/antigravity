import { ProductionContent } from "@/components/production/ProductionContent";
import { getRecipes } from "@/lib/actions/production";
import { getArticles, getFamilies, getSubFamilies } from "@/lib/actions/articles";

export default async function ProductionPage() {
    const recipes = await getRecipes();
    const articles = await getArticles();
    const families = await getFamilies();
    const subFamilies = await getSubFamilies();

    return (
        <ProductionContent
            initialRecipes={recipes}
            initialArticles={articles}
            initialFamilies={families}
            initialSubFamilies={subFamilies}
        />
    );
}
