"use client";

import React, { useRef } from 'react';
import { db } from '@/lib/db';
import { GlassCard, GlassButton } from '@/components/ui/GlassComponents';
import { Download, Upload, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function DataBackup() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportData = async () => {
        const data: any = {};
        const tables = ['invoices', 'employees', 'articles', 'tiers'];

        for (const table of tables) {
            data[table] = await (db as any)[table].toArray();
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `bako-backup-${date}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("Attention : cette opération va écraser toutes vos données actuelles. Souhaitez-vous continuer ?")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);

                // Reset DB
                await db.delete();
                await db.open();

                const tables = ['invoices', 'employees', 'articles', 'tiers'];
                for (const table of tables) {
                    if (data[table]) {
                        await (db as any)[table].bulkAdd(data[table]);
                    }
                }

                alert("Restauration réussie ! L'application va se recharger.");
                window.location.reload();
            } catch (err) {
                console.error("Import failed", err);
                alert("Erreur lors de l'importation. Le fichier est peut-être corrompu.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <GlassCard className="max-w-md w-full mx-auto mt-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Sécurité & Sauvegarde</h2>
                    <p className="text-xs text-slate-500">Gérez la persistance de vos données locales</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-700 font-medium">
                        Vos données sont stockées uniquement dans ce navigateur. Pensez à faire des sauvegardes régulières pour éviter toute perte en cas de nettoyage du cache.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <GlassButton onClick={exportData} className="w-full flex items-center justify-center gap-2 py-4">
                        <Download className="w-4 h-4" /> Sauvegarder mes données
                    </GlassButton>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={importData}
                        accept=".json"
                        className="hidden"
                    />

                    <GlassButton
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-4"
                    >
                        <Upload className="w-4 h-4" /> Restaurer une sauvegarde
                    </GlassButton>
                </div>
            </div>
        </GlassCard>
    );
}
