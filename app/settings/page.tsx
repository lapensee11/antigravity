"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import DataBackup from "@/components/settings/DataBackup";
import { GlassCard } from "@/components/ui/GlassComponents";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { getDatabaseRegistry } from "@/lib/data-service";
import { Database, Users, ShoppingCart, List, BookOpen, Layers, GitBranch, Layout, Sun, Moon } from "lucide-react";

export default function SettingsPage() {
    const [counts, setCounts] = useState<any>(null);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
        <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#1C1C1E]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-outfit">Paramètres</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Gérez vos données et les préférences de l'application.</p>
                    </div>

                    {/* Apparence */}
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 font-outfit flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full bg-buddy-purple" />
                            Apparence
                        </h2>
                        <GlassCard className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                                        {mounted && theme === "dark"
                                            ? <Moon className="w-5 h-5 text-buddy-purple" />
                                            : <Sun className="w-5 h-5 text-buddy-orange" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mode d'affichage</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {mounted ? (theme === "dark" ? "Mode Nuit activé" : "Mode Jour activé") : "Chargement..."}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    disabled={!mounted}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none
                                        ${mounted && theme === "dark" ? "bg-buddy-purple" : "bg-slate-300 dark:bg-slate-600"}`}
                                    aria-label="Basculer mode jour/nuit"
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300
                                            ${mounted && theme === "dark" ? "translate-x-6" : "translate-x-1"}`}
                                    />
                                </button>
                            </div>
                        </GlassCard>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 font-outfit flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full bg-blue-600" />
                                Sécurité & Données
                            </h2>
                            <DataBackup />

                            <GlassCard className="mt-4">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-blue-600" />
                                    État des tables (Local)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {statsConfig.map((stat) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div key={stat.key} className="p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                                                <div className={`p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm ${stat.color}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{counts ? counts[stat.key] : "..."}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </GlassCard>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 font-outfit flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full bg-slate-400" />
                                À propos
                            </h2>
                            <GlassCard>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Version</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">2.0.0 (Pure Web)</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Moteur</span>
                                        <span className="text-sm font-bold text-blue-600">Dexie.js / IndexedDB</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Statut</span>
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
