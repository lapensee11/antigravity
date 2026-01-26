"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TiersEditor } from "@/components/tiers/TiersEditor";
import { Tier } from "@/lib/types";
import { useState, useEffect } from "react";
import { Search, Plus, User, Briefcase, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const initialTiers: Tier[] = [
    {
        id: "t1",
        code: "Frs-023",
        type: "Fournisseur",
        name: "Minoterie du Nord",
        phone: "06 61 22 33 44",
        city: "Tanger"
    } as Tier,
    {
        id: "t2",
        code: "Cli-145",
        type: "Client",
        name: "Café de Paris",
        phone: "05 39 99 88 77",
        ice: "00123456789"
    } as Tier,
    {
        id: "t3",
        code: "Frs-024",
        type: "Fournisseur",
        name: "Centrale Laitière",
        phone: "05 22 00 00 00",
        city: "Casablanca"
    } as Tier,
];

export default function TiersPage() {
    // State
    const [tiers, setTiers] = useState<Tier[]>(initialTiers);
    const [selectedTier, setSelectedTier] = useState<Tier | null>(initialTiers[0]);
    const [typeFilter, setTypeFilter] = useState<"TOUS" | "Fournisseur" | "Client">("TOUS");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter Logic
    const filteredTiers = tiers.filter(tier => {
        const matchesType = typeFilter === "TOUS" || tier.type === typeFilter;
        const matchesSearch = !searchQuery ||
            tier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tier.phone && tier.phone.includes(searchQuery));
        return matchesType && matchesSearch;
    });

    // Auto-Code Generation
    const getNextTierCode = (type: "Fournisseur" | "Client"): string => {
        const prefix = type === "Fournisseur" ? "Frs" : "Cli";
        const existingCodes = tiers
            .filter(t => t.type === type)
            .map(t => t.code);

        let maxNum = 0;
        existingCodes.forEach(code => {
            const match = code.match(new RegExp(`${prefix}-(\\d+)`));
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });

        const nextNum = maxNum + 1;
        return `${prefix}-${nextNum.toString().padStart(3, "0")}`;
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if focus is in an input or textarea
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
                return;
            }

            if (filteredTiers.length === 0) return;

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const currentIndex = filteredTiers.findIndex(t => t.id === selectedTier?.id);

                if (currentIndex === -1) {
                    // If nothing selected (or not in filtered list), select first
                    setSelectedTier(filteredTiers[0]);
                    return;
                }

                let newIndex = currentIndex;
                if (e.key === "ArrowUp") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(filteredTiers.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    setSelectedTier(filteredTiers[newIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredTiers, selectedTier]);

    return (
        <div className="flex h-screen w-full bg-[#F2F2F7] overflow-hidden font-outfit">
            <Sidebar />

            <main className="flex-1 flex h-full overflow-hidden ml-64">
                {/* LEFT COLUMN: List */}
                <div className="flex flex-col w-[380px] h-full border-r border-[#bca382] bg-[#F6F8FC] relative z-20 shadow-xl">
                    {/* Header */}
                    <div className="h-20 shrink-0 border-b border-[#bca382]/30 px-6 flex items-center justify-between bg-[#F6F8FC]">
                        <h1 className="text-2xl font-black text-[#3E2723] tracking-tight">Tiers</h1>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 space-y-3">
                        {/* Search & Add Row */}
                        <div className="flex gap-2">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1887F] group-focus-within:text-[#5E35B1] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 bg-white border border-[#D7CCC8] rounded-xl pl-10 pr-8 text-sm font-bold text-[#3E2723] placeholder:text-[#D7CCC8] focus:outline-none focus:border-[#5E35B1] focus:ring-1 focus:ring-[#5E35B1] transition-all shadow-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedTier({
                                    id: "new",
                                    code: "Nouveau",
                                    type: "Fournisseur",
                                    name: "",
                                } as Tier)}
                                className="w-10 h-10 rounded-full bg-[#5E35B1] flex items-center justify-center text-white shadow-md hover:bg-[#4527A0] hover:scale-105 transition-all shrink-0"
                            >
                                <Plus className="w-6 h-6 stroke-[3px]" />
                            </button>
                        </div>

                        {/* Type Selector (3 Buttons) */}
                        <div className="flex gap-2">
                            {[
                                { id: "TOUS", label: "Tous", icon: null },
                                { id: "Fournisseur", label: "Fournisseurs", icon: Briefcase },
                                { id: "Client", label: "Clients", icon: User }
                            ].map((btn) => {
                                const isActive = typeFilter === (btn.id as any);
                                const Icon = btn.icon;
                                return (
                                    <button
                                        key={btn.id}
                                        onClick={() => setTypeFilter(btn.id as any)}
                                        className={cn(
                                            "flex-1 h-9 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 relative overflow-hidden border border-transparent",
                                            isActive
                                                ? "bg-[#EDE7F6] text-[#5E35B1] border-b-[3px] border-b-[#5E35B1] pb-[3px]" // Compensate height if needed, or just let border handle it. border-b-3 takes space.
                                                : "bg-white text-[#8D6E63] border-b-[#D7CCC8] border-b-[3px] hover:bg-[#EFEBE9]" // Match height with border? Or use border-b-transparent. 
                                            // Actually "bg-white border-[#D7CCC8]" implies full border. 
                                            // Let's use simple logic: Active has underline. Inactive plain.
                                        )}
                                    >
                                        {Icon && <Icon className="w-3.5 h-3.5" />}
                                        {btn.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-0 py-0 divide-y divide-[#D7CCC8]/30">
                        {filteredTiers.map(tier => (
                            <div
                                key={tier.id}
                                onClick={() => setSelectedTier(tier)}
                                className={cn(
                                    "relative w-full px-6 py-4 transition-all duration-200 cursor-pointer group min-h-[80px] flex flex-col justify-center",
                                    selectedTier?.id === tier.id
                                        ? "bg-white"
                                        : "bg-[#F6F8FC] hover:bg-white/60"
                                )}
                            >
                                {selectedTier?.id === tier.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#5E35B1]" />
                                )}

                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm",
                                            tier.type === "Fournisseur" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                        )}>
                                            {tier.type}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">{tier.code}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-black text-[#3E2723] leading-tight truncate pr-2">{tier.name}</h3>
                                    {tier.phone && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8D6E63] shrink-0 bg-white/50 px-1.5 py-0.5 rounded-md">
                                            <Phone className="w-3 h-3" /> {tier.phone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {filteredTiers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                                <Search className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">Aucun tiers trouvé</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Editor */}
                <div className="flex-1 bg-[#F2F2F7] p-0 overflow-hidden flex flex-col">
                    <TiersEditor
                        tier={selectedTier}
                        onSave={(savedTier) => {
                            if (savedTier.id === "new") {
                                const newId = Math.random().toString(36).substr(2, 9);
                                const newTier = { ...savedTier, id: newId };
                                setTiers(prev => [...prev, newTier]);
                                setSelectedTier(newTier);
                            } else {
                                setTiers(prev => prev.map(t => t.id === savedTier.id ? savedTier : t));
                                setSelectedTier(savedTier);
                            }
                        }}
                        onGetTypeCode={getNextTierCode}
                    />
                </div>
            </main>
        </div>
    );
}
