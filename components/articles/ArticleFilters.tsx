import { GlassInput } from "@/components/ui/GlassInput";
import { Search } from "lucide-react";
import { Article } from "@/lib/types";
import { GlassCard } from "@/components/ui/GlassCard";

interface ArticleFiltersProps {
    onSearch: (query: string) => void;
    articles: Article[];
    onSelectArticle: (article: Article) => void;
    selectedArticleId?: string;
}

export function ArticleFilters({ onSearch, articles, onSelectArticle, selectedArticleId }: ArticleFiltersProps) {
    return (
        <div className="h-full flex flex-col gap-4">
            <GlassCard className="p-4 flex flex-col gap-4">
                <h3 className="font-bold text-slate-700 font-outfit">Filters</h3>
                <GlassInput
                    placeholder="Search by name, code..."
                    icon={<Search className="w-4 h-4" />}
                    onChange={(e) => onSearch(e.target.value)}
                />

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Sub-Family</label>
                    <select className="w-full bg-white/50 border border-white/40 rounded-lg p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">All Sub-Families</option>
                        {/* Populate dynamically */}
                        <option value="farine">Farines</option>
                        <option value="levure">Levures</option>
                    </select>
                </div>
            </GlassCard>

            <GlassCard className="flex-1 overflow-hidden flex flex-col p-0">
                <div className="p-3 border-b border-white/20 bg-white/20">
                    <span className="text-xs font-bold text-slate-500 uppercase">{articles.length} Articles Found</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {articles.map(article => (
                        <div
                            key={article.id}
                            onClick={() => onSelectArticle(article)}
                            className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedArticleId === article.id
                                    ? "bg-indigo-600/10 border-indigo-500/50"
                                    : "bg-white/30 border-transparent hover:bg-white/50"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-800">{article.name}</span>
                                    {article.isSubRecipe && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">Sous-recette</span>
                                    )}
                                </div>
                                <span className="text-xs font-mono bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-600">{article.code}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-slate-500">{article.subFamilyId}</span>
                                <span className="text-xs font-medium text-indigo-600">
                                    {article.lastPivotPrice ? article.lastPivotPrice + " Dh" : "-"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
}
