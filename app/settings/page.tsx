"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import DataBackup from "@/components/settings/DataBackup";
import { GlassCard } from "@/components/ui/GlassComponents";
import { useEffect, useState } from "react";
import { getDatabaseRegistry } from "@/lib/data-service";
import { Database, Table, Users, ShoppingCart, List, BookOpen, Layers, GitBranch, Layout } from "lucide-react";

export default function SettingsPage() {
    const [counts, setCounts] = useState<any>(null);

    useEffect(() => {
        async function fetchCounts() {
            setCounts(await getDatabaseRegistry());
        }
        fetchCounts();
    }, []);

    const statsConfig = [
        { label: "Factures", key: "invoices", icon: ShoppingCart, color: "text-blue-500" },
        { label: "Articles", key: "articles", icon: List, color: "text-green-500" },
        { label: "Personnel", key: "employees", icon: Users, color: "text-orange-500" },
        { label: "Tiers", key: "tiers", icon: Users, color: "text-indigo-500" },
        { label: "Recettes", key: "recipes", icon: BookOpen, color: "text-purple-500" },
        { label: "Familles", key: "families", icon: Layers, color: "text-pink-500" },
        { label: "Sous-familles", key: "subFamilies", icon: GitBranch, color: "text-rose-500" },
        { label: "Types", key: "types", icon: Layout, color: "text-slate-500" },
    ];

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 font-outfit">Paramètres</h1>
                        <p className="text-slate-500 mt-2">Gérez vos données et les préférences de l'application.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-700 font-outfit flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full bg-blue-600" />
                                Sécurité & Données
                            </h2>
                            <DataBackup />

                            <GlassCard className="mt-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-blue-600" />
                                    État des tables (Local)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {statsConfig.map((stat) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div key={stat.key} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-3">
                                                <div className={`p-2 bg-white rounded-lg shadow-sm ${stat.color}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                                    <p className="text-sm font-bold text-slate-700">{counts ? counts[stat.key] : "..."}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlassCard>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-700 font-outfit flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full bg-slate-400" />
                                À propos
                            </h2>
                            <GlassCard>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-sm font-medium text-slate-500">Version</span>
                                        <span className="text-sm font-bold text-slate-800">2.0.0 (Pure Web)</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-sm font-medium text-slate-500">Moteur</span>
                                        <span className="text-sm font-bold text-blue-600">Dexie.js / IndexedDB</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-slate-500">Statut</span>
                                        <div className="flex items-center gap-2 text-green-600">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-sm font-bold">Opérationnel</span>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
