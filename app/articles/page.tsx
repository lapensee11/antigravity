import { getArticles } from "@/lib/actions/articles";
import { ArticlesContent } from "@/components/articles/ArticlesContent";

export default async function ArticlesPage() {
    const articles = await getArticles();
    return <ArticlesContent initialArticles={articles} />;
}
