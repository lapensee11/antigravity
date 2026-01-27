"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { useState } from "react";
import { Users, FileText, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const staff = [
    { id: 1, name: "Ahmed Benali", matricule: "00123", netCible: 3500, avance: 0, credit: 1200 },
    { id: 2, name: "Fautima Zahra", matricule: "00124", netCible: 4200, avance: 500, credit: 0 },
    { id: 3, name: "Youssef Idrissi", matricule: "00125", netCible: 3000, avance: 200, credit: 800 },
];

export default function PayePage() {
    const [viewMode, setViewMode] = useState<"Saisie" | "Journal">("Saisie");
    const [month, setMonth] = useState("Janvier 2024");

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0">
                <TopBar />

                <div className="px-8 pb-8 h-[calc(100vh-140px)] flex flex-col">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 font-outfit">Paye & RH</h2>
                            <p className="text-slate-500 mt-1">Staff payroll and accounting generation.</p>
                        </div>

                        <div className="flex bg-white/40 p-1 rounded-xl backdrop-blur-sm border border-white/40 shadow-sm">
                            <button
                                onClick={() => setViewMode("Saisie")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                    viewMode === "Saisie" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-indigo-600"
                                )}
                            >
                                <Users className="w-4 h-4" /> Saisie Personnel
                            </button>
                            <button
                                onClick={() => setViewMode("Journal")}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                    viewMode === "Journal" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-indigo-600"
                                )}
                            >
                                <FileText className="w-4 h-4" /> Journal Comptable
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white/30 p-4 rounded-xl flex items-center justify-between mb-4 border border-white/40">
                        <div className="flex items-center gap-4">
                            <button className="p-1 hover:bg-white/40 rounded-lg">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <span className="font-bold text-slate-800 w-32 text-center">{month}</span>
                            <button className="p-1 hover:bg-white/40 rounded-lg">
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        {viewMode === "Saisie" && (
                            <button className="flex items-center gap-2 text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Plus className="w-4 h-4" /> Add Employee
                            </button>
                        )}
                    </div>

                    <GlassCard className="flex-1 overflow-hidden p-0">
                        <div className="overflow-x-auto h-full p-4 custom-scrollbar">
                            {viewMode === "Saisie" ? (
                                <table className="w-full text-sm min-w-[1000px]">
                                    <thead className="bg-[#1E293B] text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-20">
                                        <tr>
                                            <th className="px-3 py-1.5 text-left border-r border-white/10 uppercase">Employé</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">Net Cible</th>
                                            <th className="px-3 py-1.5 text-center border-r border-white/10 uppercase">Jours</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">H. Sup</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">Primes</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">Avances</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase text-orange-200">Remb. Crédit</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase text-green-200 font-bold">Net à Payer</th>
                                            <th className="px-3 py-1.5 text-center uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {staff.map(emp => (
                                            <tr key={emp.id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="px-3 py-2 border-r border-slate-100">
                                                    <div className="font-bold text-slate-800 text-sm leading-tight">{emp.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">Mat: {emp.matricule}</div>
                                                </td>
                                                <td className="px-3 py-2 text-right text-sm font-medium border-r border-slate-100">{emp.netCible}</td>
                                                <td className="px-3 py-2 text-center border-r border-slate-100">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button className="w-5 h-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs transition-colors">-</button>
                                                        <span className="w-6 font-bold text-center text-sm">26</span>
                                                        <button className="w-5 h-5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs transition-colors">+</button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right border-r border-slate-100">
                                                    <input className="w-14 h-7 text-right p-1 bg-slate-50 rounded border border-slate-200 text-sm focus:ring-1 focus:ring-indigo-100 outline-none" placeholder="0" />
                                                </td>
                                                <td className="px-3 py-2 text-right border-r border-slate-100">
                                                    <input className="w-16 h-7 text-right p-1 bg-slate-50 rounded border border-slate-200 text-sm focus:ring-1 focus:ring-indigo-100 outline-none" placeholder="0" />
                                                </td>
                                                <td className="px-3 py-2 text-right text-red-500 font-medium text-sm border-r border-slate-100">
                                                    {emp.avance > 0 ? `-${emp.avance}` : "-"}
                                                </td>
                                                <td className="px-3 py-2 text-right border-r border-slate-100">
                                                    <div className="flex flex-col items-end">
                                                        <input className="w-16 h-7 text-right p-1 bg-slate-50 rounded border border-slate-200 text-sm focus:ring-1 focus:ring-indigo-100 outline-none" placeholder="0" />
                                                        <span className="text-[9px] text-slate-400 mt-0.5">Reste: {emp.credit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-base text-slate-800 border-r border-slate-100">
                                                    {emp.netCible - emp.avance}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm min-w-[1000px] border-collapse">
                                    <thead className="bg-[#1E293B] text-white text-[10px] font-bold uppercase tracking-wider sticky top-0 z-20">
                                        <tr>
                                            <th className="px-3 py-1.5 text-left border-r border-white/10 uppercase">Employé / Mat</th>
                                            <th className="px-3 py-1.5 text-center border-r border-white/10 uppercase">Jours</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">Brut Global</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">Brut Imp.</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase text-slate-200">CNSS</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase text-slate-200">AMO</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase">Net Imp.</th>
                                            <th className="px-3 py-1.5 text-right border-r border-white/10 uppercase text-slate-200">I.R.</th>
                                            <th className="px-3 py-1.5 text-right font-bold bg-indigo-500/10 text-indigo-300 uppercase">Net à Payer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {staff.map(emp => {
                                            const brut = emp.netCible * 1.25; // Dummy logic
                                            return (
                                                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-3 py-1.5 border-r border-slate-100">
                                                        <div className="font-bold text-slate-800 text-sm leading-tight">{emp.name}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono">{emp.matricule}</div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-center border-r border-slate-100 text-sm">26</td>
                                                    <td className="px-3 py-1.5 text-right border-r border-slate-100 text-sm font-medium">{brut.toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 text-right border-r border-slate-100 text-sm font-medium">{(brut * 0.9).toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 text-right border-r border-slate-100 text-sm text-slate-500">{(brut * 0.0448).toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 text-right border-r border-slate-100 text-sm text-slate-500">{(brut * 0.0226).toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 text-right border-r border-slate-100 text-sm font-medium">{(brut * 0.85).toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 text-right border-r border-slate-100 text-sm text-slate-500">{(brut * 0.1).toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 text-right font-bold bg-indigo-50/30 text-slate-800 text-sm">
                                                        {emp.netCible.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </GlassCard>
                </div>
            </main>
        </div>
    );
}
