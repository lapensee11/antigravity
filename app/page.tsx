"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/data-service";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  ChefHat,
  AlertTriangle,
  Plus,
  FileText,
  Settings,
  ArrowUpRight
} from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      const data = await getDashboardStats();
      setStats(data);
    }
    fetchStats();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(val);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0 transition-all duration-300">
        <TopBar />

        <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <section>
            <h2 className="text-3xl font-bold text-slate-800 mb-6 font-outfit tracking-tight">Vue d&apos;ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Ventes (Mois)</p>
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {stats ? formatCurrency(stats.totalSales) : "---"}
                  </h3>
                  <div className="text-[10px] text-green-500 font-medium mt-1 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    Mise à jour en temps réel
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Achats à Régler</p>
                  <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {stats ? stats.pendingCount : "---"}
                  </h3>
                  <div className="text-[10px] text-orange-500 font-medium mt-1">
                    Total: {stats ? formatCurrency(stats.pendingAmount) : "---"}
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Catalogue Production</p>
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <ChefHat className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {stats ? stats.recipeCount : "---"}
                  </h3>
                  <div className="text-[10px] text-indigo-500 font-medium mt-1">Recettes actives</div>
                </div>
              </GlassCard>

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Articles en Stock</p>
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {stats ? stats.articleCount : "---"}
                  </h3>
                  <div className="text-[10px] text-blue-500 font-medium mt-1">Gérés en base locale</div>
                </div>
              </GlassCard>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 min-h-[400px]">
              <h3 className="text-xl font-bold text-slate-700 mb-6 font-outfit">Flux d&apos;Activité (Achats)</h3>
              <div className="space-y-4">
                {stats?.recentActivity?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {stats.recentActivity.map((act: any) => (
                      <div key={act.id} className="py-4 flex items-center justify-between group cursor-pointer hover:bg-slate-50/50 transition-colors rounded-lg px-2">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{act.label}</p>
                            <p className="text-xs text-slate-400">{new Date(act.date).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-700 text-sm">{formatCurrency(act.amount)}</p>
                          <p className="text-[10px] text-blue-500 font-medium uppercase tracking-widest">Validé</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Clock className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Aucune activité récente détectée</p>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="min-h-[400px]">
              <h3 className="text-xl font-bold text-slate-700 mb-6 font-outfit">Actions Rapides</h3>
              <div className="space-y-4">
                <Link href="/ventes" className="block w-full">
                  <button className="w-full py-5 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl shadow-xl shadow-blue-200 transition-all font-bold flex items-center justify-between group active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <Plus className="h-6 w-6" />
                      <span>Nouvelle Vente</span>
                    </div>
                    <ArrowUpRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>

                <Link href="/achats" className="block w-full">
                  <button className="w-full py-5 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl transition-all font-bold flex items-center justify-between shadow-sm group active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-orange-500" />
                      <span>Saisir Facture</span>
                    </div>
                    <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300" />
                  </button>
                </Link>

                <Link href="/production" className="block w-full">
                  <button className="w-full py-5 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl transition-all font-bold flex items-center justify-between shadow-sm group active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <ChefHat className="h-6 w-6 text-indigo-500" />
                      <span>Production</span>
                    </div>
                    <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300" />
                  </button>
                </Link>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link href="/settings" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium px-2 group">
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                    <span>Gérer mes données & sauvegarde</span>
                  </Link>
                </div>
              </div>
            </GlassCard>
          </section>
        </div>
      </main>
    </div>
  );
}
