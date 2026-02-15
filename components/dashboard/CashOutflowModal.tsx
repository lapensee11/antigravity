"use client";

import { useState, useEffect, useRef } from "react";
import { GlassModal } from "@/components/ui/GlassModal";
import {
    getDailyCashOutflowByDate,
    getDailyCashOutflows,
    saveDailyCashOutflow,
    createEmptyDailyCashOutflow,
    purgeDailyCashOutflows,
    getCashOutflowPersonnelList,
    saveCashOutflowPersonnelList,
} from "@/lib/data-service";
import type { DailyCashOutflow } from "@/lib/types";
import { Trash2, Users, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

const formatMoney = (n: number) =>
    n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface CashOutflowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CashOutflowModal({ isOpen, onClose }: CashOutflowModalProps) {
    const [data, setData] = useState<DailyCashOutflow | null>(null);
    const [selectedDate, setSelectedDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [purgeBefore, setPurgeBefore] = useState("");
    const [purgeConfirm, setPurgeConfirm] = useState(false);
    const [purgeResult, setPurgeResult] = useState<number | null>(null);
    const [personnelList, setPersonnelList] = useState<string[]>([]);
    const [showPersonnelEditor, setShowPersonnelEditor] = useState(true);
    const [newPersonnelName, setNewPersonnelName] = useState("");
    const [daysCount, setDaysCount] = useState<number>(0);
    const dataRef = useRef<DailyCashOutflow | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    dataRef.current = data;

    const load = async (dateStr: string) => {
        setLoading(true);
        const existing = await getDailyCashOutflowByDate(dateStr);
        setData(
            existing ?? createEmptyDailyCashOutflow(dateStr)
        );
        setLoading(false);
    };

    const refreshDaysCount = () => {
        getDailyCashOutflows().then((list) => setDaysCount(list.length));
    };

    useEffect(() => {
        if (isOpen) {
            // Sauvegarder les données actuelles avant de charger une autre date
            const run = async () => {
                if (dataRef.current && dataRef.current.id !== selectedDate) {
                    await saveDailyCashOutflow(dataRef.current);
                }
                load(selectedDate);
                getCashOutflowPersonnelList().then(setPersonnelList);
                refreshDaysCount();
            };
            run();
        }
    }, [isOpen, selectedDate]);

    // Auto-enregistrement avec debounce (1,5 s après chaque modification)
    useEffect(() => {
        if (!data || loading) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            await saveDailyCashOutflow(data);
            refreshDaysCount();
            saveTimeoutRef.current = null;
        }, 1500);
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [data, loading]);

    const updatePersonnel = (idx: number, value: string) => {
        if (!data) return;
        const next = [...data.shifts];
        next[idx] = { ...next[idx], personnel: value };
        setData({ ...data, shifts: next });
    };

    const addPersonnel = () => {
        const name = newPersonnelName.trim();
        if (!name || personnelList.includes(name)) return;
        const next = [...personnelList, name];
        setPersonnelList(next);
        saveCashOutflowPersonnelList(next);
        setNewPersonnelName("");
    };

    const removePersonnel = (name: string) => {
        const next = personnelList.filter((n) => n !== name);
        setPersonnelList(next);
        saveCashOutflowPersonnelList(next);
    };

    const updateEspeces = (idx: number, v: number) => {
        if (!data) return;
        const next = [...data.especes];
        next[idx] = v;
        setData({ ...data, especes: next });
    };
    const updateAchatsCh = (idx: number, v: number) => {
        if (!data) return;
        const next = [...data.achatsCh];
        next[idx] = v;
        setData({ ...data, achatsCh: next });
    };
    const updateAvances = (idx: number, v: number) => {
        if (!data) return;
        const next = [...data.avances];
        next[idx] = v;
        setData({ ...data, avances: next });
    };
    const updateCmi = (idx: number, nb: number, mt: number) => {
        if (!data) return;
        const next = [...data.cmi];
        next[idx] = { nb, mt };
        setData({ ...data, cmi: next });
    };
    const updateGlovo = (idx: number, v: number) => {
        if (!data) return;
        const next = [...data.glovo];
        next[idx] = v;
        setData({ ...data, glovo: next });
    };
    const updateCaisse = (v: number) => {
        if (!data) return;
        setData({ ...data, caisse: v });
    };

    const totals = data
        ? {
              especes: data.especes.reduce((a, b) => a + b, 0),
              achatsCh: data.achatsCh.reduce((a, b) => a + b, 0),
              avances: data.avances.reduce((a, b) => a + b, 0),
              cmiNb: data.cmi.reduce((a, b) => a + (b?.nb ?? 0), 0),
              cmiMt: data.cmi.reduce((a, b) => a + (b?.mt ?? 0), 0),
              glovo: data.glovo.reduce((a, b) => a + b, 0),
              grandTotal:
                  data.especes.reduce((a, b) => a + b, 0) +
                  data.achatsCh.reduce((a, b) => a + b, 0) +
                  data.avances.reduce((a, b) => a + b, 0) +
                  data.cmi.reduce((a, b) => a + (b?.mt ?? 0), 0) +
                  data.glovo.reduce((a, b) => a + b, 0),
          }
        : null;

    const colTotals = data
        ? data.shifts.map((_, i) =>
              (data.especes[i] ?? 0) +
              (data.achatsCh[i] ?? 0) +
              (data.avances[i] ?? 0) +
              (data.cmi[i]?.mt ?? 0) +
              (data.glovo[i] ?? 0)
          )
        : [];

    const handleSave = async () => {
        if (!data) return;
        setSaving(true);
        await saveDailyCashOutflow(data);
        setSaving(false);
    };

    const handlePurge = async () => {
        if (!purgeBefore || !purgeConfirm) return;
        const { deleted } = await purgeDailyCashOutflows(purgeBefore);
        setPurgeResult(deleted);
        setPurgeConfirm(false);
        setPurgeBefore("");
        refreshDaysCount();
    };

    const dateObj = new Date(selectedDate + "T12:00:00");
    const dayOfWeek = dateObj.toLocaleDateString("fr-FR", { weekday: "long" });

    const goPrevDay = () => {
        const d = new Date(selectedDate + "T12:00:00");
        d.setDate(d.getDate() - 1);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const goNextDay = () => {
        const d = new Date(selectedDate + "T12:00:00");
        d.setDate(d.getDate() + 1);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const goToday = () => {
        setSelectedDate(new Date().toISOString().slice(0, 10));
    };

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title="Sorties de caisse"
            className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        >
            <div
                className="flex flex-col gap-4 overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Navigation date — 3 lignes centrées à l'axe du modal */}
                <div className="flex flex-col items-center justify-center gap-2 mb-4">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider capitalize">
                        {dayOfWeek}
                    </span>
                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={goPrevDay}
                            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                            aria-label="Jour précédent"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-slate-200 rounded-lg px-4 py-2.5 font-bold text-slate-800 text-center min-w-[160px]"
                        />
                        <button
                            type="button"
                            onClick={goNextDay}
                            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                            aria-label="Jour suivant"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={goToday}
                        className="px-4 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors"
                    >
                        Aujourd&apos;hui
                    </button>
                </div>

                {loading ? (
                    <p className="text-slate-500 py-8 text-center">Chargement…</p>
                ) : data ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden text-sm">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th
                                        rowSpan={2}
                                        className="bg-slate-100 border border-slate-300 p-2 text-left font-bold w-28"
                                    />
                                    {data.shifts.map((s, i) => (
                                        <th
                                            key={s.id}
                                            className="bg-slate-100 border border-slate-300 p-1 w-[120px] min-w-[120px] max-w-[120px]"
                                        >
                                            <select
                                                value={s.personnel ?? ""}
                                                onChange={(e) =>
                                                    updatePersonnel(
                                                        i,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full text-center font-bold bg-transparent border-0 py-1 px-2 text-sm focus:ring-1 focus:ring-slate-400 rounded"
                                            >
                                                <option value="">
                                                    —
                                                </option>
                                                {[
                                                    ...personnelList,
                                                    ...(s.personnel &&
                                                    !personnelList.includes(
                                                        s.personnel
                                                    )
                                                        ? [s.personnel]
                                                        : []),
                                                ].map((name) => (
                                                    <option
                                                        key={name}
                                                        value={name}
                                                    >
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </th>
                                    ))}
                                    <th className="bg-slate-100 border border-slate-300 p-2 text-center font-bold w-[120px] min-w-[120px]">
                                        Total
                                    </th>
                                </tr>
                                <tr>
                                    {data.shifts.map((s) => (
                                        <th
                                            key={s.id}
                                            className="bg-slate-100 border border-slate-300 p-1 text-xs font-medium text-slate-600 w-[120px] min-w-[120px] max-w-[120px]"
                                        >
                                            {s.label}
                                        </th>
                                    ))}
                                    <th className="bg-slate-100 border border-slate-300 w-[120px] min-w-[120px]" />
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="bg-slate-50 border border-slate-200 p-2 font-bold">
                                        Espèces
                                    </td>
                                    {data.shifts.map((_, i) => (
                                        <td
                                            key={i}
                                            className="border border-slate-200 p-1 w-[120px] min-w-[120px] max-w-[120px] text-right"
                                        >
                                            <input
                                                type="number"
                                                step="0.01"
                                                tabIndex={i * 6 + 1}
                                                value={data.especes[i] || ""}
                                                onChange={(e) =>
                                                    updateEspeces(
                                                        i,
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="input-no-spinner w-[120px] min-w-0 text-right px-1.5 py-1 border-0 bg-transparent text-sm"
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-slate-200 p-2 text-right font-medium bg-slate-50 w-[120px] min-w-[120px]">
                                        {formatMoney(totals!.especes)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50 border border-slate-200 p-2 font-bold">
                                        Achats / Ch
                                    </td>
                                    {data.shifts.map((_, i) => (
                                        <td
                                            key={i}
                                            className="border border-slate-200 p-1 w-[120px] min-w-[120px] max-w-[120px] text-right"
                                        >
                                            <input
                                                type="number"
                                                step="0.01"
                                                tabIndex={i * 6 + 2}
                                                value={data.achatsCh[i] || ""}
                                                onChange={(e) =>
                                                    updateAchatsCh(
                                                        i,
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="input-no-spinner w-[120px] min-w-0 text-right px-1.5 py-1 border-0 bg-transparent text-sm"
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-slate-200 p-2 text-right font-medium bg-slate-50 w-[120px] min-w-[120px]">
                                        {formatMoney(totals!.achatsCh)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50 border border-slate-200 p-2 font-bold">
                                        Avances
                                    </td>
                                    {data.shifts.map((_, i) => (
                                        <td
                                            key={i}
                                            className="border border-slate-200 p-1 w-[120px] min-w-[120px] max-w-[120px] text-right"
                                        >
                                            <input
                                                type="number"
                                                step="0.01"
                                                tabIndex={i * 6 + 3}
                                                value={data.avances[i] || ""}
                                                onChange={(e) =>
                                                    updateAvances(
                                                        i,
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className="input-no-spinner w-[120px] min-w-0 text-right px-1.5 py-1 border-0 bg-transparent text-sm"
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-slate-200 p-2 text-right font-medium bg-slate-50 w-[120px] min-w-[120px]">
                                        {formatMoney(totals!.avances)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-50 border border-slate-200 p-2 font-bold">
                                        CMI
                                    </td>
                                    {data.shifts.map((_, i) => (
                                        <td
                                            key={i}
                                            className="border border-slate-200 p-1 w-[120px] min-w-[120px] max-w-[120px] text-left"
                                        >
                                            <div className="flex gap-1 justify-between items-center">
                                                <input
                                                    type="number"
                                                    placeholder="nb"
                                                    tabIndex={i * 6 + 4}
                                                    value={
                                                        data.cmi[i]?.nb || ""
                                                    }
                                                    onChange={(e) =>
                                                        updateCmi(
                                                            i,
                                                            parseInt(
                                                                e.target.value,
                                                                10
                                                            ) || 0,
                                                            data.cmi[i]?.mt ??
                                                                0
                                                        )
                                                    }
                                                    className="input-no-spinner w-[40px] text-center px-1 py-1 border border-rose-200 rounded bg-rose-50/50 text-sm"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="mt"
                                                    tabIndex={i * 6 + 5}
                                                    value={
                                                        data.cmi[i]?.mt || ""
                                                    }
                                                    onChange={(e) =>
                                                        updateCmi(
                                                            i,
                                                            data.cmi[i]?.nb ??
                                                                0,
                                                            parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    className="input-no-spinner w-[82px] min-w-0 text-right px-1.5 py-1 border-0 bg-transparent text-sm"
                                                />
                                            </div>
                                        </td>
                                    ))}
                                    <td className="border border-slate-200 p-2 bg-slate-50 w-[120px] min-w-[120px]">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="inline-flex items-center justify-center min-w-[40px] px-1 py-0.5 text-center font-medium border border-rose-200 rounded bg-rose-50/50 text-sm">
                                                {totals!.cmiNb}
                                            </span>
                                            <span className="font-medium text-slate-700">
                                                {formatMoney(totals!.cmiMt)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                <tr className="bg-amber-50">
                                    <td className="border border-slate-200 p-2 font-bold">
                                        Glovo
                                    </td>
                                    {data.shifts.map((_, i) => (
                                        <td
                                            key={i}
                                            className="border border-slate-200 p-1 w-[120px] min-w-[120px] max-w-[120px] text-right"
                                        >
                                            <input
                                                type="number"
                                                step="0.01"
                                                tabIndex={i < 3 ? -1 : i * 6 + 6}
                                                readOnly={i < 3}
                                                value={data.glovo[i] || ""}
                                                onChange={(e) =>
                                                    i >= 3 &&
                                                    updateGlovo(
                                                        i,
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                className={`input-no-spinner w-[120px] min-w-0 text-right px-1.5 py-1 border-0 outline-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none text-sm bg-transparent ${
                                                    i < 3 ? "cursor-default" : ""
                                                }`}
                                            />
                                        </td>
                                    ))}
                                    <td className="border border-slate-200 p-2 text-right font-medium w-[120px] min-w-[120px]">
                                        {formatMoney(totals!.glovo)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bg-slate-200 border border-slate-300 p-2 font-bold">
                                        Total
                                    </td>
                                    {colTotals.map((v, i) => (
                                        <td
                                            key={i}
                                            className="border border-slate-200 p-2 text-right font-bold bg-slate-50 w-[120px] min-w-[120px] max-w-[120px]"
                                        >
                                            {formatMoney(v)}
                                        </td>
                                    ))}
                                    <td className="border border-slate-300 p-2 text-right font-bold bg-red-100 text-red-800 w-[120px] min-w-[120px]">
                                        {formatMoney(totals!.grandTotal)}
                                    </td>
                                </tr>
                                <tr>
                                    <td
                                        colSpan={data.shifts.length}
                                        className="border border-slate-200 p-2 text-slate-600"
                                    >
                                        Caisse
                                    </td>
                                    <td className="border border-slate-200 p-2 bg-blue-100">
                                        <div className="flex items-center gap-2 justify-end">
                                            <span
                                                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap shrink-0 ${
                                                    (() => {
                                                        const diff = totals!.grandTotal - (data.caisse ?? 0);
                                                        if (diff < 0) return "bg-red-600 text-white";
                                                        return "bg-blue-600 text-white";
                                                    })()
                                                }`}
                                            >
                                                {formatMoney(totals!.grandTotal - (data.caisse ?? 0))}
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                tabIndex={data.shifts.length * 6 + 1}
                                                value={data.caisse ?? ""}
                                                onChange={(e) =>
                                                    updateCaisse(
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0
                                                    )
                                                }
                                                placeholder="Réconciliation"
                                                className="input-no-spinner w-[120px] min-w-0 text-right px-1.5 py-1 border-0 bg-transparent text-sm"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {/* Liste du personnel */}
                <div className="border-t border-slate-200 pt-4 mt-2">
                    <button
                        type="button"
                        onClick={() =>
                            setShowPersonnelEditor((v) => !v)
                        }
                        className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900"
                    >
                        <Users className="w-4 h-4" />
                        Gérer la liste du personnel
                        {showPersonnelEditor ? " ▲" : " ▼"}
                    </button>
                    {showPersonnelEditor && (
                        <div
                            className="mt-3 flex flex-wrap items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="text"
                                value={newPersonnelName}
                                onChange={(e) =>
                                    setNewPersonnelName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addPersonnel();
                                    }
                                }}
                                placeholder="Nouveau nom"
                                className="border border-slate-200 rounded px-2 py-1.5 text-sm w-36"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addPersonnel();
                                }}
                                disabled={!newPersonnelName.trim()}
                                className="flex items-center gap-1 px-2 py-1.5 bg-slate-100 text-slate-700 rounded text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter
                            </button>
                            <div className="flex flex-wrap gap-1.5 ml-2">
                                {personnelList.map((name) => (
                                    <span
                                        key={name}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                                    >
                                        {name}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removePersonnel(name);
                                            }}
                                            className="p-0.5 hover:bg-slate-200 rounded"
                                            aria-label={`Retirer ${name}`}
                                        >
                                            <X className="w-3.5 h-3.5 text-slate-500" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Purge section */}
                <div className="border-t border-slate-200 pt-4 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Purge des données obsolètes
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                        Supprimer toutes les sorties de caisse avant une date
                        (pour alléger la base).
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="date"
                            value={purgeBefore}
                            onChange={(e) => setPurgeBefore(e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1.5 text-sm"
                        />
                        <label className="flex items-center gap-1.5 text-sm">
                            <input
                                type="checkbox"
                                checked={purgeConfirm}
                                onChange={(e) =>
                                    setPurgeConfirm(e.target.checked)
                                }
                            />
                            Confirmer la purge
                        </label>
                        <button
                            onClick={handlePurge}
                            disabled={
                                !purgeBefore || !purgeConfirm
                            }
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Purger
                        </button>
                        {purgeResult !== null && (
                            <span className="text-sm text-slate-600">
                                {purgeResult} enregistrement(s) supprimé(s)
                            </span>
                        )}
                    </div>
                </div>

                {/* Nombre de journées en mémoire */}
                <div className="border-t border-slate-200 pt-3 mt-2 text-center">
                    <span className="text-sm text-slate-500">
                        {daysCount} journée{daysCount !== 1 ? "s" : ""} en mémoire
                    </span>
                </div>
            </div>
        </GlassModal>
    );
}
