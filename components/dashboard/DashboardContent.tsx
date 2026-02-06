"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    Users,
    ChefHat,
    DollarSign,
    Percent,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Calendar,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
    data: {
        revenue: number;
        prevRevenue: number;
        materialCost: number;
        grossMargin: number;
        marginRate: number;
        laborCost: number;
        laborRatio: number;
        recipeCount: number;
        staffCount: number;
        chartData: { name: string; revenue: number; margin: number }[];
    } | null;
}

export function DashboardContent({ data }: DashboardProps) {
    if (!data) return <div>Erreur lors du chargement des données.</div>;

    const cards = [
        {
            title: "Ventes (Mois)",
            value: `${data.revenue.toLocaleString()} DH`,
            change: data.prevRevenue > 0
                ? `${(((data.revenue - data.prevRevenue) / data.prevRevenue) * 100).toFixed(1)}%`
                : "N/A",
            trend: data.revenue >= data.prevRevenue ? "up" : "down",
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50",
            subValue: `Précédent: ${data.prevRevenue.toLocaleString()} DH`
        },
        {
            title: "Marge Brute",
            value: `${data.grossMargin.toLocaleString()} DH`,
            change: `${data.marginRate.toFixed(1)}%`,
            trend: "up",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Masse Salariale",
            value: `${data.laborCost.toLocaleString()} DH`,
            change: `${data.laborRatio.toFixed(1)}% du CA`,
            trend: data.laborRatio > 35 ? "down" : "up",
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            title: "Recettes & Staff",
            value: `${data.recipeCount} / ${data.staffCount}`,
            change: "Actifs",
            trend: "neutral",
            icon: ChefHat,
            color: "text-orange-600",
            bg: "bg-orange-50"
        }
    ];

    const maxChartValue = Math.max(...data.chartData.map(d => d.revenue), 1);

    return (
        <div className="flex min-h-screen bg-[#F6F8FC] font-outfit">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl font-extrabold text-slate-800 tracking-tight"
                        >
                            Tableau de Bord
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 mt-2 text-lg font-light"
                        >
                            Pilotage en temps réel de votre performance.
                        </motion.p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 text-slate-600 font-bold capitalize">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span>{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <GlassCard className="p-6 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-default overflow-hidden relative group">
                                <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-all group-hover:opacity-40", card.bg)} />
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={cn("p-3 rounded-2xl", card.bg)}>
                                        <card.icon className={cn("w-6 h-6", card.color)} />
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                                        card.trend === "up" ? "bg-green-100 text-green-600" :
                                            card.trend === "down" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                        {card.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> :
                                            card.trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : null}
                                        {card.change}
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-slate-500 font-medium text-sm mb-1">{card.title}</h3>
                                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{card.value}</p>
                                    {(card as any).subValue && (
                                        <p className="text-[10px] text-slate-400 mt-1 font-bold italic">
                                            {(card as any).subValue}
                                        </p>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Evolution Chart (Custom SVG Implementation) */}
                    <GlassCard className="lg:col-span-2 p-8 border-none shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-500" />
                                Revenus vs Marge
                            </h3>
                            <div className="flex gap-4 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                    <span className="text-slate-500">REVENU</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    <span className="text-slate-500">MARGE</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-64 flex items-end gap-6 px-4">
                            {data.chartData.map((d, i) => (
                                <div key={d.name} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="w-full flex justify-center items-end gap-1 h-full relative">
                                        {/* Revenue Bar */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(d.revenue / maxChartValue) * 100}%` }}
                                            className="w-8 bg-blue-500/80 rounded-t-lg group-hover:bg-blue-600 transition-colors relative"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                                                {d.revenue.toLocaleString()} DH
                                            </div>
                                        </motion.div>
                                        {/* Margin Bar */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(d.margin / maxChartValue) * 100}%` }}
                                            className="w-8 bg-green-500/80 rounded-t-lg group-hover:bg-green-600 transition-colors relative"
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                                                {d.margin.toLocaleString()} DH
                                            </div>
                                        </motion.div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Secondary Metrics / Alerts */}
                    <div className="space-y-6">
                        <GlassCard className="p-8 border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-400" />
                                Masse Salariale
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Ratio Objectif: 30%</span>
                                        <span className={cn(
                                            "font-bold",
                                            data.laborRatio > 35 ? "text-red-400" : "text-green-400"
                                        )}>
                                            {data.laborRatio.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(data.laborRatio, 100)}%` }}
                                            className={cn(
                                                "h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]",
                                                data.laborRatio > 35 ? "bg-red-500" : "bg-purple-500"
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-xs text-slate-400 mb-1">Total Salaries</p>
                                    <p className="text-2xl font-bold">{data.laborCost.toLocaleString()} <span className="text-sm font-light text-slate-400">DH</span></p>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6 border-none shadow-xl shadow-slate-200/50">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                Quick Insights
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Percent className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-orange-600 font-bold uppercase">Taux de Marge</p>
                                        <p className="text-sm font-bold text-slate-800">{data.marginRate.toFixed(1)}%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <PieChart className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Production Active</p>
                                        <p className="text-sm font-bold text-slate-800">{data.recipeCount} Recettes</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </main>
        </div>
    );
}
