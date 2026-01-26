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
                                    <thead className="bg-white/30 text-xs text-slate-500 uppercase rounded-t-xl">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Employé</th>
                                            <th className="px-4 py-3 text-right">Net Cible</th>
                                            <th className="px-4 py-3 text-center">Jours</th>
                                            <th className="px-4 py-3 text-right">H. Sup</th>
                                            <th className="px-4 py-3 text-right">Primes</th>
                                            <th className="px-4 py-3 text-right">Avances</th>
                                            <th className="px-4 py-3 text-right text-orange-600">Remb. Crédit</th>
                                            <th className="px-4 py-3 text-right text-green-700 font-bold">Net à Payer</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                        {staff.map(emp => (
                                            <tr key={emp.id} className="hover:bg-white/40 group">
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-800">{emp.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">Mat: {emp.matricule}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">{emp.netCible}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button className="w-6 h-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">-</button>
                                                        <span className="w-8 font-bold text-center">26</span>
                                                        <button className="w-6 h-6 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">+</button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <GlassInput className="w-16 h-8 text-right p-1" placeholder="0" />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <GlassInput className="w-20 h-8 text-right p-1" placeholder="0" />
                                                </td>
                                                <td className="px-4 py-3 text-right text-red-500">
                                                    {emp.avance > 0 ? `-${emp.avance}` : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <GlassInput className="w-20 h-8 text-right p-1" placeholder="0" />
                                                        <span className="text-[10px] text-slate-400 mt-0.5">Reste: {emp.credit}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-lg text-slate-800">
                                                    {emp.netCible - emp.avance}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm min-w-[1000px]">
                                    <thead className="bg-indigo-50/50 text-xs text-indigo-800 uppercase rounded-t-xl">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Employé / Mat</th>
                                            <th className="px-4 py-3 text-center">Jours</th>
                                            <th className="px-4 py-3 text-right">Brut Global</th>
                                            <th className="px-4 py-3 text-right">Brut Imp.</th>
                                            <th className="px-4 py-3 text-right text-slate-600">CNSS</th>
                                            <th className="px-4 py-3 text-right text-slate-600">AMO</th>
                                            <th className="px-4 py-3 text-right">Net Imp.</th>
                                            <th className="px-4 py-3 text-right text-slate-600">I.R.</th>
                                            <th className="px-4 py-3 text-right font-bold bg-indigo-100/50">Net à Payer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-100/50">
                                        {staff.map(emp => {
                                            const brut = emp.netCible * 1.25; // Dummy logic
                                            return (
                                                <tr key={emp.id} className="hover:bg-white/40">
                                                    <td className="px-4 py-3">
                                                        <div className="font-bold text-slate-800">{emp.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{emp.matricule}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">26</td>
                                                    <td className="px-4 py-3 text-right">{brut.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right">{(brut * 0.9).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{(brut * 0.0448).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{(brut * 0.0226).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right">{(brut * 0.85).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right text-slate-500">{(brut * 0.1).toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-right font-bold bg-indigo-50/30 text-slate-800">
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
