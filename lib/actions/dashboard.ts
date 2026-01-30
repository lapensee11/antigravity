import { getLocalDB } from "@/lib/db";
import { getRecipes } from "./production";
import { getStaffMembers } from "./paye";
import { getArticles } from "./articles";
import { isTauri, getDesktopDB } from "./db-desktop";

export async function getDashboardData() {
    try {
        // 1. Fetch all necessary data via our cross-platform functions
        const allRecipes = await getRecipes();
        const allStaff = await getStaffMembers();
        const allArticles = await getArticles();

        // This is a bit tricky for sales
        let allSalesEntries: any[] = [];
        if (isTauri()) {
            const tauriDb = await getDesktopDB();
            allSalesEntries = await tauriDb.select("SELECT * FROM daily_sales") as any[];
        } else {
            const db = await getLocalDB();
            if (!db) return null;
            allSalesEntries = await db.query.dailySales.findMany();
        }

        // 2. Map articles for quick lookup
        const articleMap = new Map(allArticles.map(a => [a.id, a]));

        // 3. Calculate Material Cost per Recipe
        const recipeCosts = new Map<string, number>();
        allRecipes.forEach(recipe => {
            const materialCost = (recipe.ingredients || []).reduce((sum, ing) => {
                const articleId = ing.articleId || (ing as any).article_id;
                const article = articleMap.get(articleId);
                const lastPivotPrice = article?.lastPivotPrice || (article as any)?.last_pivot_price || 0;
                const coeffProd = article?.coeffProd || (article as any)?.coeff_prod || 1;
                const pu = lastPivotPrice / (coeffProd || 1);
                return sum + (ing.quantity * pu);
            }, 0);

            const lossRate = recipe.costing?.lossRate || 0;
            const totalWithLoss = materialCost * (1 + (lossRate / 100));
            const costPerUnit = recipe.yield > 0 ? totalWithLoss / recipe.yield : 0;
            recipeCosts.set(recipe.id, costPerUnit || 0);
        });

        // 4. Aggregate Sales
        let totalRevenue = 0;
        let totalMaterialCost = 0;
        const dailyStats: Record<string, { revenue: number, margin: number }> = {};

        allSalesEntries.forEach(day => {
            const realDataStr = day.real_data || day.realData;
            const data = realDataStr ? JSON.parse(realDataStr) : null;
            if (!data || !data.calculated) return;

            const dayRevenue = parseFloat(data.calculated.totHt || "0");
            totalRevenue += dayRevenue;

            let dayMaterialCost = 0;
            if (data.sales) {
                Object.entries(data.sales).forEach(([recipeId, qty]) => {
                    const quantity = parseFloat(qty as string);
                    if (isNaN(quantity)) return;
                    const costPerUnit = recipeCosts.get(recipeId) || 0;
                    dayMaterialCost += quantity * costPerUnit;
                });
            }

            totalMaterialCost += dayMaterialCost;
            const dayMargin = dayRevenue - dayMaterialCost;
            const dateStr = day.date_str || day.date;
            const dateObj = new Date(dateStr);
            const monthKey = dateObj.toLocaleString('fr-FR', { month: 'short' });

            if (!dailyStats[monthKey]) dailyStats[monthKey] = { revenue: 0, margin: 0 };
            dailyStats[monthKey].revenue += dayRevenue;
            dailyStats[monthKey].margin += dayMargin;
        });

        // 5. Labor Costs
        const totalLaborCost = allStaff.reduce((sum, staff) => {
            let monthlySalary = 0;
            if (staff.monthlyData) {
                const mData = staff.monthlyData as any;
                const months = Object.keys(mData).sort();
                if (months.length > 0) {
                    monthlySalary = mData[months[months.length - 1]].netToPay || 0;
                }
            }
            if (monthlySalary === 0 && staff.contract) {
                const contract = staff.contract as any;
                monthlySalary = contract.baseSalary || 0;
            }
            return sum + monthlySalary;
        }, 0);

        const grossMargin = totalRevenue - totalMaterialCost;
        const laborRatio = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;
        const marginRate = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

        const monthNames = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
        const chartData = Object.entries(dailyStats)
            .map(([name, vals]) => ({ name, ...vals }))
            .sort((a: any, b: any) => monthNames.indexOf(a.name) - monthNames.indexOf(b.name));

        return {
            revenue: totalRevenue,
            materialCost: totalMaterialCost,
            grossMargin,
            marginRate,
            laborCost: totalLaborCost,
            laborRatio,
            recipeCount: allRecipes.length,
            staffCount: allStaff.length,
            chartData
        };
    } catch (error) {
        console.error("Dashboard Data Error:", error);
        return null;
    }
}
