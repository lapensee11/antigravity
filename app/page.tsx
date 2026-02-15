"use client";

import { Suspense, useEffect, useState } from "react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { getDashboardStats, getDatabaseRegistry } from "@/lib/data-service";

export default function Home() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        async function fetchData() {
            const [stats, tableCounts] = await Promise.all([
                getDashboardStats(),
                getDatabaseRegistry()
            ]);

            // Generate default monthly comparison data if empty
            const defaultMonthlyData = [
                { month: 'Jan', currentYear: stats.totalSales * 0.8, prevYear: stats.prevTotalSales * 0.7 },
                { month: 'Fév', currentYear: stats.totalSales * 0.9, prevYear: stats.prevTotalSales * 0.8 },
                { month: 'Mar', currentYear: stats.totalSales * 1.0, prevYear: stats.prevTotalSales * 0.9 },
                { month: 'Avr', currentYear: stats.totalSales * 1.1, prevYear: stats.prevTotalSales * 1.0 },
                { month: 'Mai', currentYear: stats.totalSales * 1.2, prevYear: stats.prevTotalSales * 1.1 },
                { month: 'Jun', currentYear: stats.totalSales * 1.1, prevYear: stats.prevTotalSales * 1.0 },
                { month: 'Jul', currentYear: stats.totalSales * 1.0, prevYear: stats.prevTotalSales * 0.9 },
                { month: 'Aoû', currentYear: stats.totalSales * 0.9, prevYear: stats.prevTotalSales * 0.8 },
                { month: 'Sep', currentYear: stats.totalSales * 0.8, prevYear: stats.prevTotalSales * 0.7 },
                { month: 'Oct', currentYear: stats.totalSales * 0.7, prevYear: stats.prevTotalSales * 0.6 },
                { month: 'Nov', currentYear: stats.totalSales * 0.6, prevYear: stats.prevTotalSales * 0.5 },
                { month: 'Déc', currentYear: stats.totalSales * 0.5, prevYear: stats.prevTotalSales * 0.4 },
            ];

            setData({
                revenue: stats.totalSales,
                prevRevenue: stats.prevTotalSales,
                materialCost: stats.materialCost ?? stats.pendingAmount,
                prevMaterialCost: stats.prevMaterialCost ?? 0,
                grossMargin: stats.totalSales - (stats.pendingAmount * 0.4), // Simulated
                marginRate: 60,
                laborCost: stats.lastClosedMonthLaborCost || 0,
                laborRatio: stats.lastClosedMonthRevenue > 0 
                    ? ((stats.lastClosedMonthLaborCost || 0) / stats.lastClosedMonthRevenue) * 100 
                    : 0,
                recipeCount: stats.recipeCount,
                subRecipeCount: stats.subRecipeCount || 0,
                staffCount: stats.articleCount,
                chartData: [
                    { name: "LUN", revenue: stats.totalSales / 30, margin: stats.totalSales / 50 },
                    { name: "MAR", revenue: stats.totalSales / 25, margin: stats.totalSales / 45 },
                    { name: "MER", revenue: stats.totalSales / 28, margin: stats.totalSales / 48 },
                    { name: "JEU", revenue: stats.totalSales / 32, margin: stats.totalSales / 52 },
                    { name: "VEN", revenue: stats.totalSales / 20, margin: stats.totalSales / 40 },
                    { name: "SAM", revenue: stats.totalSales / 15, margin: stats.totalSales / 35 },
                    { name: "DIM", revenue: stats.totalSales / 18, margin: stats.totalSales / 38 },
                ],
                monthlyComparison: (stats.monthlyComparison && stats.monthlyComparison.length > 0) 
                    ? stats.monthlyComparison 
                    : defaultMonthlyData,
                monthlyFamilySales: stats.monthlyFamilySales || [],
                tableCounts: {
                    articles: tableCounts.articles,
                    tiers: tableCounts.tiers,
                    invoices: tableCounts.invoices,
                    employees: tableCounts.employees,
                    recipes: tableCounts.recipes
                },
                accountBalances: stats.accountBalances || { Banque: 0, Caisse: 0, Coffre: 0 }
            });
        }
        fetchData();
    }, []);

    if (!data) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Calcul des analyses...</div>;

    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <DashboardContent data={data} />
        </Suspense>
    );
}
