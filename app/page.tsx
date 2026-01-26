import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-64 min-h-screen flex flex-col p-4 pl-0 transition-all duration-300">
        <TopBar />

        <div className="px-8 pb-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <section>
            <h2 className="text-3xl font-bold text-slate-800 mb-6 font-outfit tracking-tight">Vue d&apos;ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* KPI Cards Placeholder */}
              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Ventes Totales</p>
                  <span className="p-2 bg-green-100 rounded-lg text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">12,450 Dh</h3>
                  <div className="text-sm text-green-500 font-medium mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    +15% vs mois dernier
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Commandes en Cours</p>
                  <span className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">23</h3>
                  <div className="text-sm text-orange-500 font-medium mt-1">5 Urgent</div>
                </div>
              </GlassCard>

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Production</p>
                  <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </span>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">1,204 <span className="text-sm text-slate-400 font-normal">unités</span></h3>
                  <div className="text-sm text-slate-500 font-medium mt-1">Objectifs atteints</div>
                </div>
              </GlassCard>

              <GlassCard className="h-44 flex flex-col justify-between group hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                <div className="flex justify-between items-start">
                  <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Stock Faible</p>
                  <span className="p-2 bg-red-100 rounded-lg text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                  </span>
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-slate-800 mt-2">8</h3>
                  <div className="text-sm text-red-500 font-medium mt-1">Articles à commander</div>
                </div>
              </GlassCard>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 min-h-[400px]">
              <h3 className="text-xl font-bold text-slate-700 mb-6 font-outfit">Activité Récente</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  Graphique / Flux d&apos;activité
                </div>
              </div>
            </GlassCard>
            <GlassCard className="min-h-[400px]">
              <h3 className="text-xl font-bold text-slate-700 mb-6 font-outfit">Actions Rapides</h3>
              <div className="space-y-4">
                <button className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all font-medium flex items-center justify-center gap-2 transform active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Nouvelle Vente
                </button>
                <button className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-sm active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Saisir Facture
                </button>

                <button className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-sm active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Contrôle Production
                </button>
              </div>
            </GlassCard>
          </section>

        </div>
      </main>
    </div>
  );
}
