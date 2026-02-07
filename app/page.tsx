"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/lib/data-service";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChefHat,
  AlertTriangle,
  Plus,
  FileText,
  Settings,
  ArrowUpRight,
  Activity,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-bold font-outfit animate-pulse">Initialisation du système...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const currentMonthName = new Date().toLocaleDateString('fr-FR', { month: 'long' });
  const prevMonthName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('fr-FR', { month: 'long' });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0 transition-all duration-300">
        <TopBar />

        <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <section>
            <h2 className="text-3xl font-bold text-slate-800 mb-6 font-outfit tracking-tight">Vue d&apos;ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Sales Card */}
              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">CA Réel ({currentMonthName})</p>
                  <div className="p-2 bg-green-50 rounded-xl text-green-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {stats ? formatCurrency(stats.totalSales) : "---"}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <div className={cn(
                      "text-[10px] font-bold flex items-center gap-1",
                      stats?.totalSales >= stats?.prevTotalSales ? "text-green-500" : "text-red-500"
                    )}>
                      {stats?.totalSales >= stats?.prevTotalSales ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stats?.prevTotalSales > 0
                        ? `${(((stats.totalSales - stats.prevTotalSales) / stats.prevTotalSales) * 100).toFixed(1)}%`
                        : "N/A"}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold italic">
                      vs {prevMonthName}: {stats ? formatCurrency(stats.prevTotalSales) : "---"}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Invoices Card */}
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

              {/* Production Card */}
              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-indigo-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Production</p>
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

              {/* Articles Card */}
              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300 cursor-pointer border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Articles</p>
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {stats ? stats.articleCount : "---"}
                  </h3>
                  <div className="text-[10px] text-blue-500 font-medium mt-1">Base locale sécurisée</div>
                </div>
              </GlassCard>
            </div>
          </section>

          {/* Graph Section */}
          <section>
            <SalesComparisonGraph data={stats?.dailyComparison || []} currentMonth={currentMonthName} prevMonth={prevMonthName} />
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

function SalesComparisonGraph({ data, currentMonth, prevMonth }: { data: any[], currentMonth: string, prevMonth: string }) {
  const maxValue = Math.max(1000, ...data.map(d => Math.max(d.current || 0, d.prev || 0)));
  const height = 200;
  const width = 800;
  const padding = 40;

  const pointsCurrent = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding) / 30);
    const y = height - padding - (d.current / maxValue * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  const pointsPrev = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding) / 30);
    const y = height - padding - (d.prev / maxValue * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  // Area paths
  const areaCurrent = `${pointsCurrent} ${padding + (data.length - 1) * (width - 2 * padding) / 30},${height - padding} ${padding},${height - padding}`;
  const areaPrev = `${pointsPrev} ${padding + (data.length - 1) * (width - 2 * padding) / 30},${height - padding} ${padding},${height - padding}`;

  return (
    <GlassCard className="p-8 border-none shadow-xl bg-white/50 overflow-hidden relative group">
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Performance Comparative
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Ventes Journalières : {currentMonth} vs {prevMonth}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{currentMonth}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300 rounded-full" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{prevMonth}</span>
          </div>
        </div>
      </div>

      <div className="relative h-[220px] w-full group/svg">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <line
              key={i}
              x1={padding}
              y1={height - padding - (v * (height - 2 * padding))}
              x2={width - padding}
              y2={height - padding - (v * (height - 2 * padding))}
              stroke="#E2E8F0"
              strokeDasharray="4 4"
            />
          ))}

          {/* Previous Month Area */}
          <motion.polyline
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            points={areaPrev}
            fill="#94A3B8"
          />
          <motion.polyline
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 1.5 }}
            points={pointsPrev}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
          />

          {/* Current Month Area */}
          <defs>
            <linearGradient id="gradCurrent" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <motion.polyline
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            points={areaCurrent}
            fill="url(#gradCurrent)"
          />
          <motion.polyline
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            points={pointsCurrent}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interaction points (Current) */}
          {data.map((d, i) => {
            if (d.current === 0 && d.prev === 0) return null;
            const x = padding + (i * (width - 2 * padding) / 30);
            const y = height - padding - (d.current / maxValue * (height - 2 * padding));
            return (
              <g key={i} className="cursor-pointer group/point">
                <circle cx={x} cy={y} r="4" fill="#3B82F6" className="opacity-0 group-hover/svg:opacity-100 transition-opacity" />
                <rect x={x - 40} y={y - 30} width="80" height="20" rx="4" fill="#1E293B" className="opacity-0 group-hover/point:opacity-100 transition-opacity" />
                <text x={x} y={y - 17} textAnchor="middle" fill="#fff" className="text-[10px] font-bold opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none">
                  Jour {d.day}: {d.current.toLocaleString()}
                </text>
              </g>
            )
          })}

          {/* X-axis days */}
          {[1, 5, 10, 15, 20, 25, 30].map(day => (
            <text
              key={day}
              x={padding + ((day - 1) * (width - 2 * padding) / 30)}
              y={height - 15}
              textAnchor="middle"
              className="text-[10px] fill-slate-400 font-bold"
            >
              {day}
            </text>
          ))}
        </svg>
      </div>

      {/* Decorative Blur */}
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-slate-500/5 blur-[100px] rounded-full pointer-events-none" />
    </GlassCard>
  );
}
