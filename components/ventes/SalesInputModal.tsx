import { GlassModal } from "@/components/ui/GlassModal";
import { GlassInput } from "@/components/ui/GlassInput";
import { useState } from "react";
import { Activity } from "lucide-react";

interface SalesInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    isDeclared?: boolean; // If true, apply coefficients logic display
}

export function SalesInputModal({ isOpen, onClose, date, isDeclared }: SalesInputModalProps) {
    const [families] = useState(["Boulangerie", "Pâtisserie", "Viennoiserie", "Snacking", "Boissons"]);

    // Coefficients constants
    const COEFF_EXO = 1.10; // For Boulangerie (Exonéré)
    const COEFF_IMP = 0.60; // For others (Imposable)

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Saisie CA ${isDeclared ? "Déclaré" : "Réel"} - ${date}`}
            className="max-w-2xl"
        >
            <div className="space-y-6">
                {isDeclared && (
                    <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-center gap-2 border border-blue-100 mb-4">
                        <Activity className="w-4 h-4" />
                        <span>Coefficients appliqués : <strong>{COEFF_EXO}</strong> (Exo) et <strong>{COEFF_IMP}</strong> (Imp)</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2">Ventes par Famille</h4>
                        {families.map(family => {
                            const isExo = family === "Boulangerie";
                            return (
                                <div key={family} className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                                    <span className="text-sm font-medium text-slate-700">{family}</span>
                                    <div className="flex items-center gap-2">
                                        {isDeclared && (
                                            <span className="text-xs text-slate-400 font-mono">
                                                x {isExo ? COEFF_EXO : COEFF_IMP}
                                            </span>
                                        )}
                                        <GlassInput className="w-24 text-right h-8" placeholder="0.00" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2">Encaissements</h4>
                        {["Espèces", "Chèque", "Carte Bancaire (CMI)", "Glovo"].map(mode => (
                            <div key={mode} className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                                <span className="text-sm font-medium text-slate-700">{mode}</span>
                                <GlassInput className="w-24 text-right h-8" placeholder="0.00" />
                            </div>
                        ))}

                        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <div className="flex justify-between text-indigo-900 font-bold mb-1">
                                <span>Total HT</span>
                                <span>0.00 Dh</span>
                            </div>
                            <div className="flex justify-between text-indigo-700 text-sm mb-2 border-b border-indigo-200 pb-2">
                                <span>TVA</span>
                                <span>0.00 Dh</span>
                            </div>
                            <div className="flex justify-between text-indigo-900 font-bold text-lg">
                                <span>Total TTC</span>
                                <span>0.00 Dh</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg">
                        Valider la Journée
                    </button>
                </div>
            </div>
        </GlassModal>
    );
}
