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
    Zap,
    Layers,
    Package,
    FileText,
    Landmark,
    ShoppingCart,
    CreditCard,
    Settings,
    Database,
    Wallet,
    Archive
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DashboardProps {
    data: {
        revenue: number;
        prevRevenue: number;
        materialCost: number;
        prevMaterialCost?: number;
        grossMargin: number;
        marginRate: number;
        laborCost: number;
        laborRatio: number;
        recipeCount: number;
        subRecipeCount: number;
        staffCount: number;
        chartData: { name: string; revenue: number; margin: number }[];
        monthlyComparison: { month: string; currentYear: number; prevYear: number }[];
        tableCounts?: {
            articles: number;
            tiers: number;
            invoices: number;
            employees: number;
            recipes: number;
        };
        accountBalances?: {
            Banque: number;
            Caisse: number;
            Coffre: number;
        };
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
            title: "Dépenses (Mois)",
            value: `${data.materialCost.toLocaleString()} DH`,
            change: data.prevMaterialCost > 0
                ? `${(((data.materialCost - data.prevMaterialCost) / data.prevMaterialCost) * 100).toFixed(1)}%`
                : "N/A",
            trend: data.materialCost >= (data.prevMaterialCost || 0) ? "up" : "down",
            icon: TrendingDown,
            color: "text-red-600",
            bg: "bg-red-50",
            subValue: `Précédent: ${(data.prevMaterialCost || 0).toLocaleString()} DH`
        },
        {
            title: "Masse Salariale",
            value: `${data.laborCost.toLocaleString()} DH`,
            change: data.laborRatio > 0 ? `${data.laborRatio.toFixed(1)}% du CA` : "N/A",
            trend: "up", // Always green for percentage display
            icon: Users,
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            title: "Recettes / Sous-Recettes",
            value: `${data.recipeCount} / ${data.subRecipeCount || 0}`,
            change: "Total",
            trend: "neutral",
            icon: ChefHat,
            color: "text-orange-600",
            bg: "bg-orange-50"
        }
    ];

    // Quick access buttons configuration - Reorganized in 2 rows of 3
    // Row 1: Achat - Vente - Banque
    // Row 2: Articles - Tiers - Production
    const quickAccessButtons = [
        // Row 1
        { icon: FileText, label: "Achats", href: "/achats", color: "bg-blue-200", hoverColor: "hover:bg-blue-300", iconColor: "text-blue-600", textColor: "text-blue-900" },
        { icon: ShoppingCart, label: "Ventes", href: "/ventes", color: "bg-orange-200", hoverColor: "hover:bg-orange-300", iconColor: "text-orange-600", textColor: "text-orange-900" },
        { icon: Landmark, label: "Banque", href: "/finance", color: "bg-cyan-200", hoverColor: "hover:bg-cyan-300", iconColor: "text-cyan-600", textColor: "text-cyan-900" },
        // Row 2
        { icon: Package, label: "Articles", href: "/articles", color: "bg-green-200", hoverColor: "hover:bg-green-300", iconColor: "text-green-600", textColor: "text-green-900" },
        { icon: Users, label: "Tiers", href: "/tiers", color: "bg-purple-200", hoverColor: "hover:bg-purple-300", iconColor: "text-purple-600", textColor: "text-purple-900" },
        { icon: ChefHat, label: "Production", href: "/production", color: "bg-indigo-200", hoverColor: "hover:bg-indigo-300", iconColor: "text-indigo-600", textColor: "text-indigo-900" },
    ];

    // Generate monthly chart data (annuel)
    const annualChartData = data.monthlyComparison || [];
    // Calculate max value - use currentYear values primarily, fallback to 1 if all zeros
    const allCurrentYearValues = annualChartData.map(d => d.currentYear || 0);
    const allPrevYearValues = annualChartData.map(d => d.prevYear || 0);
    const annualMaxValue = Math.max(
        ...allCurrentYearValues,
        ...allPrevYearValues,
        1 // Minimum value to avoid division by zero
    );
    
    // Pastel colors matching quick access buttons (using hex colors for better compatibility)
    const pastelColors = {
        indigo: { from: "#818cf8", to: "#6366f1" },
        blue: { from: "#93c5fd", to: "#60a5fa" },
        purple: { from: "#c4b5fd", to: "#a78bfa" },
        orange: { from: "#fdba74", to: "#fb923c" },
        green: { from: "#86efac", to: "#4ade80" },
        cyan: { from: "#67e8f9", to: "#22d3ee" },
    };
    
    // Color cycle for annual chart (12 months)
    const annualColors = [
        pastelColors.indigo, pastelColors.blue, pastelColors.purple, pastelColors.orange,
        pastelColors.green, pastelColors.cyan, pastelColors.indigo, pastelColors.blue,
        pastelColors.purple, pastelColors.orange, pastelColors.green, pastelColors.cyan
    ];

    // Generate daily chart data (mensuel) - using chartData as base
    const monthlyChartData = data.chartData || [];
    const monthlyMaxValue = Math.max(...monthlyChartData.map(d => d.revenue), 1);

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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 text-slate-600"
                    >
                        <Calendar className="w-7 h-7 text-blue-500" />
                        <span className="text-2xl font-bold capitalize whitespace-nowrap">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </motion.div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                                    {(card.title === "Ventes (Mois)" || card.title === "Dépenses (Mois)") && (card as any).subValue ? (
                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{card.value}</p>
                                            <p className="text-[10px] text-slate-400 font-bold italic whitespace-nowrap">
                                                {(card as any).subValue}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{card.value}</p>
                                            {(card as any).subValue && (
                                                <p className="text-[10px] text-slate-400 mt-1 font-bold italic">
                                                    {(card as any).subValue}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                {/* Two Charts Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Graphique Annuel */}
                    <GlassCard className="p-6 border-none shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Comparaison Annuelle
                            </h3>
                            <div className="flex gap-3 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-300 rounded-full" />
                                    <span className="text-slate-600">{new Date().getFullYear()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-amber-300 rounded-full opacity-60" />
                                    <span className="text-slate-600">{new Date().getFullYear() - 1}</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-64 w-full bg-slate-50 rounded-lg p-4 border border-slate-200 relative" style={{ minHeight: '256px' }}>
                            {annualChartData.length > 0 ? (
                                <div className="h-full flex items-end gap-1.5" style={{ height: '100%', minHeight: '200px' }}>
                                    {annualChartData.map((item, idx) => {
                                        const currentValue = item.currentYear || 0;
                                        const prevValue = item.prevYear || 0;
                                        
                                        // Use the max value, but ensure we have a minimum scale
                                        const effectiveMax = annualMaxValue > 0 ? annualMaxValue : 1;
                                        
                                        // Calculate heights - ensure proper scaling with actual pixel values
                                        const containerHeight = 200; // Fixed height in pixels
                                        const currentHeightPx = currentValue > 0 
                                            ? Math.max((currentValue / effectiveMax) * containerHeight, 10) // Minimum 10px
                                            : 0;
                                        const prevHeightPx = prevValue > 0 
                                            ? Math.max((prevValue / effectiveMax) * containerHeight, 10) // Minimum 10px
                                            : 0;
                                        
                                        const monthColor = annualColors[idx] || pastelColors.blue;
                                        
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group" style={{ height: '100%' }}>
                                                <div className="w-full flex justify-center items-end gap-1 relative" style={{ height: '100%', alignItems: 'flex-end' }}>
                                                    {/* Barre année précédente (2025) */}
                                                    {prevHeightPx > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${prevHeightPx}px` }}
                                                            transition={{ delay: idx * 0.03, duration: 0.5 }}
                                                            className="w-[45%] rounded-t-md shadow-sm hover:shadow-md transition-all cursor-pointer"
                                                            style={{ 
                                                                background: `linear-gradient(to top, ${monthColor.to}, ${monthColor.from})`,
                                                                opacity: 0.6
                                                            }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                                                {item.prevYear.toLocaleString('fr-FR')} DH
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {/* Barre année courante (2026) */}
                                                    {currentHeightPx > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${currentHeightPx}px` }}
                                                            transition={{ delay: idx * 0.03 + 0.05, duration: 0.5 }}
                                                            className="w-[45%] rounded-t-md shadow-md hover:shadow-lg transition-all cursor-pointer"
                                                            style={{ 
                                                                background: `linear-gradient(to top, ${monthColor.to}, ${monthColor.from})`
                                                            }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                                                {item.currentYear.toLocaleString('fr-FR')} DH
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 mt-auto">{item.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-slate-400 text-sm">Aucune donnée disponible</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Graphique Mensuel */}
                    <GlassCard className="p-6 border-none shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-500" />
                                Comparaison Mensuelle
                            </h3>
                            <div className="flex gap-3 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-300 rounded-full" />
                                    <span className="text-slate-600">REVENU</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-300 rounded-full" />
                                    <span className="text-slate-600">MARGE</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-64 w-full bg-slate-50 rounded-lg p-4 border border-slate-200 relative" style={{ minHeight: '256px' }}>
                            {monthlyChartData.length > 0 ? (
                                <div className="h-full flex items-end gap-2" style={{ height: '100%', minHeight: '200px' }}>
                                    {monthlyChartData.map((item, idx) => {
                                        const revenueValue = item.revenue || 0;
                                        const marginValue = item.margin || 0;
                                        const effectiveMax = monthlyMaxValue > 0 ? monthlyMaxValue : 1;
                                        
                                        // Calculate heights in pixels
                                        const containerHeight = 200; // Fixed height in pixels
                                        const revenueHeightPx = revenueValue > 0 
                                            ? Math.max((revenueValue / effectiveMax) * containerHeight, 10) // Minimum 10px
                                            : 0;
                                        const marginHeightPx = marginValue > 0 
                                            ? Math.max((marginValue / effectiveMax) * containerHeight, 10) // Minimum 10px
                                            : 0;
                                        
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group" style={{ height: '100%' }}>
                                                <div className="w-full flex justify-center items-end gap-1 relative" style={{ height: '100%', alignItems: 'flex-end' }}>
                                                    {/* Barre Revenu */}
                                                    {revenueHeightPx > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${revenueHeightPx}px` }}
                                                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                                                            className="w-[45%] rounded-t-md shadow-md hover:shadow-lg transition-all cursor-pointer"
                                                            style={{ 
                                                                background: `linear-gradient(to top, ${pastelColors.blue.to}, ${pastelColors.blue.from})`
                                                            }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                                                {item.revenue.toLocaleString('fr-FR')} DH
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {/* Barre Marge */}
                                                    {marginHeightPx > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${marginHeightPx}px` }}
                                                            transition={{ delay: idx * 0.05 + 0.1, duration: 0.5 }}
                                                            className="w-[45%] rounded-t-md shadow-md hover:shadow-lg transition-all cursor-pointer"
                                                            style={{ 
                                                                background: `linear-gradient(to top, ${pastelColors.green.to}, ${pastelColors.green.from})`
                                                            }}
                                                        >
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                                                {item.margin.toLocaleString('fr-FR')} DH
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 mt-auto uppercase">{item.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <p className="text-slate-400 text-sm">Aucune donnée disponible</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* Quick Access Buttons and Table Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Quick Access - 2/3 width */}
                    <div className="lg:col-span-2">
                        <GlassCard className="p-6 border-none shadow-xl shadow-slate-200/50 h-full">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-500" />
                                Accès Rapide
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {quickAccessButtons.map((button, idx) => {
                                    const Icon = button.icon;
                                    return (
                                        <Link key={button.href} href={button.href}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn(
                                                    "p-5 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all cursor-pointer group",
                                                    button.color,
                                                    button.hoverColor
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-all", button.iconColor)}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={cn("font-bold text-lg", button.textColor)}>{button.label}</h4>
                                                        <p className={cn("text-xs mt-1 opacity-70", button.textColor)}>Accéder rapidement</p>
                                                    </div>
                                                    <ArrowUpRight className={cn("w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all", button.iconColor)} />
                                                </div>
                                            </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Table Status - 1/3 width */}
                    <div className="lg:col-span-1">
                        <GlassCard className="p-4 border-none shadow-xl shadow-slate-200/50 h-full flex flex-col">
                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <Database className="w-4 h-4 text-blue-500" />
                                État des Tables (Local)
                            </h3>
                            <div className="grid grid-cols-2 gap-2 flex-1">
                                {[
                                    { label: "FACTURES", count: data.tableCounts?.invoices ?? 0, icon: ShoppingCart, color: "text-blue-500" },
                                    { label: "ARTICLES", count: data.tableCounts?.articles ?? 0, icon: Package, color: "text-green-500" },
                                    { label: "PERSONNEL", count: data.tableCounts?.employees ?? 0, icon: Users, color: "text-orange-500" },
                                    { label: "TIERS", count: data.tableCounts?.tiers ?? 0, icon: Users, color: "text-purple-500" },
                                    { label: "RECETTES", count: data.tableCounts?.recipes ?? 0, icon: ChefHat, color: "text-purple-600" },
                                ].map((item, idx) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-default flex items-center"
                                        >
                                            <div className="flex items-center justify-between gap-3 w-full">
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <div className={cn("p-1.5 rounded", item.color)}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight leading-tight truncate">{item.label}</span>
                                                </div>
                                                <span className="text-xl font-extrabold text-slate-800 whitespace-nowrap">{item.count}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Account Balance Cards - Below Accès Rapide */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Banque */}
                    <GlassCard className="p-4 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-default overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-all group-hover:opacity-40 bg-[#F2DAC3]" />
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="p-2.5 rounded-xl bg-[#F2DAC3]/30">
                                <Landmark className="w-5 h-5 text-[#C8A890]" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 font-medium text-xs mb-1 uppercase tracking-wider">Banque</h3>
                            <p className="text-2xl font-extrabold text-[#B6967E] tracking-tight">
                                {(data.accountBalances?.Banque || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                            </p>
                        </div>
                    </GlassCard>

                    {/* Caisse */}
                    <GlassCard className="p-4 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-default overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-all group-hover:opacity-40 bg-[#C4E4CF]" />
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="p-2.5 rounded-xl bg-[#C4E4CF]/30">
                                <Wallet className="w-5 h-5 text-[#93BFA2]" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 font-medium text-xs mb-1 uppercase tracking-wider">Caisse</h3>
                            <p className="text-2xl font-extrabold text-[#82AA90] tracking-tight">
                                {(data.accountBalances?.Caisse || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                            </p>
                        </div>
                    </GlassCard>

                    {/* Coffre */}
                    <GlassCard className="p-4 border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-default overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 transition-all group-hover:opacity-40 bg-[#D6E4EB]" />
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <div className="p-2.5 rounded-xl bg-[#D6E4EB]/30">
                                <Archive className="w-5 h-5 text-[#98B2C2]" />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-slate-500 font-medium text-xs mb-1 uppercase tracking-wider">Coffre</h3>
                            <p className="text-2xl font-extrabold text-[#8FA1AF] tracking-tight">
                                {(data.accountBalances?.Coffre || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </main>
        </div>
    );
}
