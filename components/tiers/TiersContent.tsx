"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TiersEditor } from "@/components/tiers/TiersEditor";
import { useState, useEffect, useRef } from "react";
import { Search, Plus, User, Briefcase, Phone, X, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTier, deleteTier, getTiers } from "@/lib/data-service";
import { GlassCard, GlassInput, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import { Tier } from "@/lib/types";

export function TiersContent({ initialTiers }: { initialTiers: Tier[] }) {
    // State
    const [tiers, setTiers] = useState<Tier[]>(initialTiers);
    const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
    const [typeFilter, setTypeFilter] = useState<"TOUS" | "Fournisseur" | "Client">("TOUS");
    const [searchQuery, setSearchQuery] = useState("");

    // --- RUNTIME LOAD ---
    useEffect(() => {
        const loadTiers = async () => {
            const liveTiers = await getTiers();
            setTiers(liveTiers || []);
            if (liveTiers && liveTiers.length > 0) {
                setSelectedTier(liveTiers[0]);
            } else {
                setSelectedTier(null);
            }
        };
        loadTiers();
    }, [initialTiers]);

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
            if (e.defaultPrevented) return;

            // Ignorer si focus dans un input, textarea, select ou bouton
            const isInputActive = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName || "");
            if (isInputActive) return;

            if (filteredTiers.length === 0) return;

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const currentIndex = filteredTiers.findIndex(t => t.id === selectedTier?.id);

                if (currentIndex === -1) {
                    // If nothing selected (or not in filtered list), select first
                    setSelectedTier(filteredTiers.length > 0 ? filteredTiers[0] : null);
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
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const filters: ("TOUS" | "Fournisseur" | "Client")[] = ["TOUS", "Fournisseur", "Client"];
                const currentIndex = filters.indexOf(typeFilter);
                let newIndex = currentIndex;

                if (e.key === "ArrowLeft") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(filters.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    e.preventDefault();
                    setTypeFilter(filters[newIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredTiers, selectedTier]);

    // Auto-scroll sidebar logic
    const sidebarListRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selectedTier && sidebarListRef.current) {
            const index = filteredTiers.findIndex(t => t.id === selectedTier.id);
            if (index >= 0) {
                const el = sidebarListRef.current.children[index] as HTMLElement;
                el?.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedTier, filteredTiers]);

    return (
        <div className="flex h-screen w-full bg-[#F2F2F7] overflow-hidden font-outfit">
            <Sidebar />

            <main className="flex-1 flex h-full overflow-hidden ml-64 bg-white/30 backdrop-blur-md">
                {/* LEFT COLUMN: List */}
                <div className="flex flex-col w-[340px] h-full border-r border-slate-200 bg-[#F6F8FC] relative z-20 shadow-xl">
                    {/* Header */}
                    <div className="p-5 pb-2 flex flex-col gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 font-outfit tracking-tight">Tiers</h2>
                            <p className="text-slate-400 text-sm font-light">Liste & Contacts</p>
                        </div>

                        {/* Top Controls Row */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                                <GlassInput
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 py-2"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10"
                                    >
                                        <X className="w-3.5 h-3.5" />
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
                                className="w-10 h-10 bg-white border border-blue-200 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                                title="Ajouter un tiers"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Type Selector (Matching Articles style) */}
                        <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                            {[
                                { id: "TOUS", label: "TOUS", icon: Users },
                                { id: "Fournisseur", label: "FRS", icon: Building2 },
                                { id: "Client", label: "CLI", icon: User }
                            ].map((btn) => {
                                const isActive = typeFilter === (btn.id as any);
                                const Icon = btn.icon;
                                return (
                                    <button
                                        key={btn.id}
                                        onClick={() => setTypeFilter(btn.id as any)}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all relative overflow-hidden flex items-center justify-center gap-1.5 mb-[1px]",
                                            isActive
                                                ? "bg-blue-50 text-blue-600"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <Icon className={cn("w-3.5 h-3.5", isActive ? "text-blue-500" : "text-slate-300")} />
                                        {btn.label}
                                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* List Section */}
                    <div
                        ref={sidebarListRef}
                        className="flex-1 overflow-y-auto custom-scrollbar px-0 py-0 divide-y divide-slate-100"
                    >
                        {filteredTiers.map(tier => (
                            <div
                                key={tier.id}
                                onClick={() => setSelectedTier(tier)}
                                className={cn(
                                    "relative w-full px-8 py-5 transition-all duration-200 cursor-pointer group min-h-[90px] flex flex-col justify-center",
                                    selectedTier?.id === tier.id
                                        ? "bg-white"
                                        : "bg-transparent hover:bg-white/60"
                                )}
                            >
                                {selectedTier?.id === tier.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 shadow-[2px_0_10px_rgba(37,99,235,0.2)]" />
                                )}

                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                                            tier.type === "Fournisseur" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-slate-50 text-slate-600 border border-slate-100"
                                        )}>
                                            {tier.type}
                                        </span>
                                        <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tighter">{tier.code}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-bold text-slate-800 leading-tight truncate pr-4">{tier.name}</h3>
                                    {tier.phone && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100/50">
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
                < div className="flex-1 bg-[#F2F2F7] p-0 overflow-hidden flex flex-col" >
                    <TiersEditor
                        tier={selectedTier}
                        onSave={async (savedTier) => {
                            let updatedTier = { ...savedTier };
                            if (savedTier.id === "new") {
                                updatedTier.id = Math.random().toString(36).substr(2, 9);
                                setTiers(prev => [...prev, updatedTier]);
                                setSelectedTier(updatedTier);
                            } else {
                                setTiers(prev => prev.map(t => t.id === savedTier.id ? updatedTier : t));
                                setSelectedTier(updatedTier);
                            }
                            await saveTier(updatedTier);
                        }}
                        onDelete={async (id) => {
                            const res = await deleteTier(id);
                            if (res.success) {
                                setTiers(prev => prev.filter(t => t.id !== id));
                                setSelectedTier(tiers[0] || null);
                            } else {
                                alert("Erreur lors de la suppression");
                            }
                        }}
                        onGetTypeCode={getNextTierCode}
                    />
                </div >
            </main >
        </div >
    );
}
