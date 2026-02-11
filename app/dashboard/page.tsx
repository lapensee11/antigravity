"use client";

import { Suspense, useEffect, useState } from "react";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { getDashboardStats } from "@/lib/data-service";

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        async function fetchData() {
            const stats = await getDashboardStats();

            // Map the simple stats to the more complex DashboardContent structure
            // In a real app, these would be calculated more thoroughly
            setData({
                revenue: stats.totalSales,
                prevRevenue: stats.prevTotalSales,
                materialCost: stats.pendingAmount,
                grossMargin: stats.totalSales - (stats.pendingAmount * 0.4), // Simulated
                marginRate: 60,
                laborCost: 15000, // Simulated
                laborRatio: 25,
                recipeCount: stats.recipeCount,
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
                monthlyComparison: stats.monthlyComparison || []
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
