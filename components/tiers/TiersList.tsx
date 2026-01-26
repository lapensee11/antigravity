import { GlassInput } from "@/components/ui/GlassInput";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tier } from "@/lib/types";
import { Search, Phone, Briefcase, User } from "lucide-react";

interface TiersListProps {
    tiers: Tier[];
    selectedTierId?: string;
    onSelect: (tier: Tier) => void;
    filterType: "All" | "Fournisseur" | "Client";
    onFilterTypeChange: (type: "All" | "Fournisseur" | "Client") => void;
}

export function TiersList({ tiers, selectedTierId, onSelect, filterType, onFilterTypeChange }: TiersListProps) {
    const filteredTiers = tiers.filter(t => filterType === "All" || t.type === filterType);

    return (
        <div className="h-full flex flex-col gap-4">
            <GlassCard className="p-4 flex flex-col gap-4">
                <h3 className="font-bold text-slate-700 font-outfit">Tiers Directory</h3>

                {/* Type Filters */}
                <div className="bg-white/20 p-1 rounded-xl flex">
                    {["All", "Fournisseur", "Client"].map((type) => (
                        <button
                            key={type}
                            onClick={() => onFilterTypeChange(type as "All" | "Fournisseur" | "Client")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === type
                                ? "bg-white shadow-sm text-indigo-600"
                                : "text-slate-500 hover:text-indigo-500"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <GlassInput
                    placeholder="Search Name, Phone..."
                    icon={<Search className="w-4 h-4" />}
                    className="text-sm"
                />
            </GlassCard>

            <GlassCard className="flex-1 overflow-hidden flex flex-col p-0">
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {filteredTiers.map(tier => {
                        const isSelected = selectedTierId === tier.id;
                        const isSupplier = tier.type === "Fournisseur";

                        return (
                            <div
                                key={tier.id}
                                onClick={() => onSelect(tier)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${isSelected
                                    ? "bg-indigo-600/10 border-indigo-500/50"
                                    : "bg-white/30 border-transparent hover:bg-white/50"
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isSupplier ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                                        }`}>
                                        {isSupplier ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{tier.name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{tier.code}</p>
                                    </div>
                                </div>

                                {tier.phone && (
                                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                                        <Phone className="w-3 h-3" /> {tier.phone}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </GlassCard>
        </div>
    );
}
