"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { SalesInputModal } from "@/components/ventes/SalesInputModal";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, TrendingUp, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VentesPage() {
    const searchParams = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [modalType, setModalType] = useState<"Real" | "Declared" | null>(null);

    useEffect(() => {
        const action = searchParams.get('action');
        const clientName = searchParams.get('clientName');

        if (action === 'new' && clientName) {
            // Placeholder for Client Invoice Modal
            // setModalType("ClientInvoice"); // Future generic modal
            alert(`Création de facture pour le client : ${clientName} (Module à venir)`);
        }
    }, [searchParams]);

    // Mock Data for "Today"
    const dailyData = {
        real: { ht: 12500, ttc: 13200 },
        declared: { ht: 8400, ttc: 8900 }
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0">
                <TopBar />

                <div className="px-8 pb-8 h-[calc(100vh-140px)] flex flex-col">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 font-outfit">Ventes Journalières</h2>
                            <p className="text-slate-500 mt-1">Daily Turnover Management.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/40 p-1 rounded-xl backdrop-blur-sm border border-white/40">
                            <span className="pl-3 text-slate-500 text-sm font-medium">Date:</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none text-slate-700 font-bold focus:ring-0"
                            />
                        </div>
                    </div>

                    {/* The 2 Big Buttons (Cards) */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <button
                            onClick={() => setModalType("Real")}
                            className="group relative overflow-hidden rounded-3xl p-8 text-left transition-all hover:scale-[1.01] hover:shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <TrendingUp className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-indigo-100 font-mono text-sm">{selectedDate}</span>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold text-indigo-100 mb-1">Chiffre d&apos;Affaires Réel</h3>
                                    <div className="text-5xl font-bold text-white tracking-tight">
                                        {dailyData.real.ttc.toLocaleString()} <span className="text-2xl opacity-60">Dh TTC</span>
                                    </div>
                                    <p className="text-indigo-200 mt-2 font-medium">HT: {dailyData.real.ht.toLocaleString()} Dh</p>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-white text-xs font-bold uppercase tracking-wider">Glovo Inc.</span>
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-white text-xs font-bold uppercase tracking-wider">Boulangerie + Pâtisserie</span>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setModalType("Declared")}
                            className="group relative overflow-hidden rounded-3xl p-8 text-left transition-all hover:scale-[1.01] hover:shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <ShieldCheck className="w-8 h-8 text-white" />
                                    </div>
                                    <span className="text-purple-100 font-mono text-sm">{selectedDate}</span>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-2xl font-bold text-purple-100 mb-1">Chiffre d&apos;Affaires Déclaré</h3>
                                    <div className="text-5xl font-bold text-white tracking-tight">
                                        {dailyData.declared.ttc.toLocaleString()} <span className="text-2xl opacity-60">Dh TTC</span>
                                    </div>
                                    <p className="text-purple-200 mt-2 font-medium">HT: {dailyData.declared.ht.toLocaleString()} Dh</p>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <span className="px-3 py-1 bg-white/20 rounded-lg text-white text-xs font-bold uppercase tracking-wider">Coefficients Appliqués</span>
                                    <span className="px-3 py-1 bg-purple-800/20 rounded-lg text-purple-100 text-xs font-bold uppercase tracking-wider border border-white/20">Fiscal Optimized</span>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Detailed Journal Table below */}
                    <GlassCard className="flex-1 p-0 overflow-hidden">
                        <div className="p-4 border-b border-white/20 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">Journal des ventes (Janvier 2024)</h3>
                            <button className="text-xs text-indigo-600 font-bold uppercase tracking-wider hover:underline">Export Accounting</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/30 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3 text-right">CA Réel TTC</th>
                                        <th className="px-4 py-3 text-right">CA Déclaré TTC</th>
                                        <th className="px-4 py-3 text-right text-indigo-600">Espèces</th>
                                        <th className="px-4 py-3 text-right text-indigo-600">Cheque</th>
                                        <th className="px-4 py-3 text-right text-indigo-600">CMI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/20">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="hover:bg-white/40">
                                            <td className="px-4 py-3 font-mono text-slate-600">2024-01-0{i}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">12,500.00</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">8,900.00</td>
                                            <td className="px-4 py-3 text-right text-slate-500">5,000.00</td>
                                            <td className="px-4 py-3 text-right text-slate-500">2,000.00</td>
                                            <td className="px-4 py-3 text-right text-slate-500">1,900.00</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>

                <SalesInputModal
                    isOpen={!!modalType}
                    onClose={() => setModalType(null)}
                    date={selectedDate}
                    isDeclared={modalType === "Declared"}
                />

            </main>
        </div>
    );
}
