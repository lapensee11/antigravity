"use client";

import React, { useState, useMemo } from "react";
import { X, Upload, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCY = "Dh";

export interface GlovoDayRow {
    date: string;
    dateLabel: string;
    /** Nombre de lignes CSV pour cette journée */
    lineCount: number;
    total: number;
    incidents: number;
    cash: number;
    net: number;
    /** Détail du calcul : valeurs parsées + brutes ; rawCol10 = col avant Total, rawCol11 = Total (col. 9) */
    detail: { totalValues: number[]; incidentsValues: number[]; cashValues: number[]; rawTotal: string[]; rawIncidents: string[]; rawCash: string[]; rawCol10: string[]; rawCol11: string[] };
}

interface GlovoModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Applique pour cette date les valeurs Glovo Brut, Incidents, Cash dans le journal de ventes (Saisie) */
    onSyncRow?: (dateKey: string, values: { brut: number; incid: number; cash: number }) => void;
    /** Dates déjà synchronisées (icône passe à une couleur différente) */
    syncedDates?: Set<string>;
}

// Parse CSV text: detect delimiter (;, comma, tab), strip BOM, return rows and headers
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    let s = text.trimStart().replace(/^\uFEFF/, ""); // BOM
    const lines = s.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const first = lines[0];
    const delim = first.includes(";") ? ";" : first.includes("\t") ? "\t" : ",";
    const splitLine = (line: string): string[] => {
        const parts: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"' || c === "'") {
                inQuotes = !inQuotes;
            } else if (!inQuotes && c === delim) {
                parts.push(current.trim().replace(/^["']|["']$/g, ""));
                current = "";
            } else {
                current += c;
            }
        }
        parts.push(current.trim().replace(/^["']|["']$/g, ""));
        return parts;
    };
    const headers = splitLine(first);
    const rows = lines.slice(1).map(splitLine);
    return { headers, rows };
}

// Normalize for matching: lowercase, remove accents, collapse spaces
function normalizeForMatch(s: string): string {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}

// Find column index by possible names (case-insensitive, accent-insensitive, contains or equals)
function findColumn(headers: string[], names: string[]): number {
    const normalizedHeaders = headers.map(h => normalizeForMatch(h));
    for (const name of names) {
        const n = normalizeForMatch(name);
        let idx = normalizedHeaders.findIndex(h => h === n || h.includes(n) || n.includes(h));
        if (idx >= 0) return idx;
    }
    return -1;
}

// Parse date from CSV → clé interne AAAA-MM-JJ (pour cumul par jour).
// Accepte : AAAA-MM-JJ, AAAA-MM-JJ HH:MM:SS, AAAA-MM-JJTHH:MM:SS, AAAA/MM/JJ, JJ/MM/AAAA, JJ-MM-AAAA, JJ.MM.AAAA.
function toDateKey(val: string | undefined): string | null {
    if (val == null) return null;
    const s = String(val).trim();
    if (!s) return null;
    // AAAA-MM-JJ (avec ou sans heure, avec ou sans T)
    const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    // AAAA/MM/JJ
    const isoSlash = /(\d{4})\/(\d{2})\/(\d{2})/.exec(s);
    if (isoSlash) return `${isoSlash[1]}-${isoSlash[2]}-${isoSlash[3]}`;
    // JJ/MM/AAAA ou JJ-MM-AAAA ou JJ.MM.AAAA
    const dmy = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/.exec(s);
    if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
    // Nombre : timestamp ms ou numéro de série Excel (jours depuis 30/12/1899)
    // Ne pas interpréter comme date si la chaîne contient des décimales (ex. "45250,00" = montant en Dh)
    if (/[,.]\d/.test(s) || /\d[,.]\d/.test(s)) return null;
    const num = parseFloat(s.replace(",", "."));
    if (!isNaN(num) && num > 0) {
        let date: Date;
        if (num > 1e12) date = new Date(num); // timestamp en millisecondes
        else if (num > 25569) date = new Date((num - 25569) * 86400 * 1000); // Excel (25569 = 01/01/1970)
        else return null;
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
        if (y >= 2000 && y <= 2100) return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    // Dernier recours : parser natif (ex. "4 Feb 2026", "Feb 4, 2026", etc.)
    const parsed = Date.parse(s);
    if (!isNaN(parsed)) {
        const date = new Date(parsed);
        const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
        if (y >= 2000 && y <= 2100) return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return null;
}

// Correspondance CSV (AAAA-MM-JJ) → affichage tableau (JJ/MM/AAAA)
function formatDateForTable(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    const jj = String(d).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${jj}/${mm}/${y}`;
}

// Normaliser tous les espaces (y compris insécables \u00A0, \u202F) et caractères de contrôle
function normalizeSpace(s: string): string {
    return String(s)
        .replace(/[\s\u00A0\u202F\u2000-\u200B\u2028\u2029\u3000]+/g, " ")
        .trim();
}

// Caractères à ignorer (invisibles, zero-width, BOM, etc.)
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u2060\u00AD]/g;

// Parse number : formats EU/US, strip Dh/MAD/€, espaces et caractères invisibles
function parseAmount(val: string): number {
    if (val == null) return 0;
    let s = normalizeSpace(String(val));
    if (!s) return 0;
    s = s.replace(/\s*(Dh|DH|MAD|€|EUR|eur)\s*$/gi, "");
    s = s.replace(/[\s\u00A0\u202F\u2000-\u200B\u2028\u2029\u3000]/g, "");
    s = s.replace(INVISIBLE_CHARS, "");
    s = s.replace(/[,،٫]/g, ",").replace(/[.．]/g, "."); // virgule/point Unicode → ASCII
    if (!s) return 0;
    // Si une virgule est présente : format EU (point = milliers, virgule = décimal)
    if (s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
    } else {
        s = s.replace(/,/g, "");
    }
    let n = parseFloat(s);
    if (!isNaN(n)) return n;
    // Fallback 1 : premier nombre avec regex (décimal possible)
    const match = s.match(/-?\d+([.,]\d+)?/);
    if (match) {
        const numStr = match[0].replace(",", ".");
        n = parseFloat(numStr);
        if (!isNaN(n)) return n;
    }
    // Fallback 2 : garder uniquement chiffres, une virgule/point, et signe moins
    const digitsOnly = s.replace(/[^\d,.\-]/g, "");
    if (digitsOnly) {
        let d = digitsOnly;
        if (d.includes(",")) d = d.replace(/\./g, "").replace(",", ".");
        else d = d.replace(/,/g, "");
        n = parseFloat(d);
        if (!isNaN(n)) return n;
    }
    return 0;
}

export function GlovoModal({ isOpen, onClose, onSyncRow, syncedDates }: GlovoModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [rawText, setRawText] = useState<string | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) {
            setFile(null);
            setRawText(null);
            return;
        }
        setFile(f);
        const reader = new FileReader();
        reader.onload = () => {
            const text = (reader.result as string) || "";
            setRawText(text);
        };
        reader.readAsText(f, "UTF-8");
    };

    const { dayRows, parseError: computedError, detectedColumns, csvPreview } = useMemo(() => {
        type Preview = { headers: string[]; sampleRows: string[][]; dateIdx: number; totalIdx: number; incidentsIdx: number; cashIdx: number; datesFoundInCsv: string[]; sumTotalAllRows: number; rowsWithDate: number; totalRows: number } | null;
        if (!rawText) return { dayRows: [] as GlovoDayRow[], parseError: null as string | null, detectedColumns: null as { date: string; total: string; incidents: string; cash: string } | null, csvPreview: null as Preview };
        try {
            const { headers, rows } = parseCSV(rawText);

            // Date col. 7, Total col. 9, Incidents col. 15, Cash col. 16 (indices 6, 8, 14, 15)
            const COL_DATE = 6;
            const COL_TOTAL = 8;
            const COL_INCIDENTS = 14;
            const COL_CASH = 15;

            // Lecture d'un montant depuis une cellule (évite 0 si la cellule contient un nombre)
            const readAmount = (raw: string): number => {
                const s = (raw ?? "").trim();
                if (!s) return 0;
                const v = parseAmount(s);
                if (v > 0) return v;
                const stripped = s.replace(/[^\d,.\-]/g, "");
                if (stripped) {
                    const v2 = parseAmount(stripped);
                    if (v2 > 0) return v2;
                }
                const m = s.match(/\d+[,.]\d+|\d+/);
                if (m) {
                    const numStr = m[0].replace(",", ".");
                    const n = parseFloat(numStr);
                    if (!isNaN(n) && n >= 0) return n;
                }
                return 0;
            };

            const readAmountFromRow = (row: string[], baseIndex: number, alternates: number[]): { value: number; raw: string } => {
                const indices = [baseIndex, ...alternates];
                for (const i of indices) {
                    if (i < 0 || i >= row.length) continue;
                    const raw = (row[i] ?? "").trim();
                    const v = readAmount(raw);
                    if (v > 0) return { value: v, raw };
                }
                const raw = (row[baseIndex] ?? "").trim();
                return { value: readAmount(raw), raw };
            };

            // Cumul par jour + détail
            type DayDetail = {
                suppliedDelayed: number; remboursements: number; produitsPates: number;
                totalValues: number[]; incidentsValues: number[]; cashValues: number[];
                rawTotal: string[]; rawIncidents: string[]; rawCash: string[];
                rawCol10: string[]; rawCol11: string[];
            };
            const byDay: Record<string, DayDetail> = {};
            const datesFoundInCsv: string[] = [];
            for (const row of rows) {
                const dateKey = toDateKey(row[COL_DATE]);
                if (!dateKey) continue;
                if (!byDay[dateKey]) {
                    byDay[dateKey] = {
                        suppliedDelayed: 0, remboursements: 0, produitsPates: 0,
                        totalValues: [], incidentsValues: [], cashValues: [],
                        rawTotal: [], rawIncidents: [], rawCash: [],
                        rawCol10: [], rawCol11: [],
                    };
                    datesFoundInCsv.push(dateKey);
                }
                const { value: t, raw: rawT } = readAmountFromRow(row, COL_TOTAL, []);
                const { value: inc, raw: rawInc } = readAmountFromRow(row, COL_INCIDENTS, []);
                const { value: c, raw: rawC } = readAmountFromRow(row, COL_CASH, []);
                byDay[dateKey].suppliedDelayed += t;
                byDay[dateKey].remboursements += inc;
                byDay[dateKey].produitsPates += c;
                byDay[dateKey].totalValues.push(t);
                byDay[dateKey].incidentsValues.push(inc);
                byDay[dateKey].cashValues.push(c);
                byDay[dateKey].rawTotal.push(rawT);
                byDay[dateKey].rawIncidents.push(rawInc);
                byDay[dateKey].rawCash.push(rawC);
                byDay[dateKey].rawCol10.push(COL_TOTAL > 0 ? (row[COL_TOTAL - 1] ?? "").trim() : "");
                byDay[dateKey].rawCol11.push(rawT);
            }
            datesFoundInCsv.sort();

            let sumTotalAllRows = 0;
            let rowsWithDate = 0;
            for (const row of rows) {
                sumTotalAllRows += readAmountFromRow(row, COL_TOTAL, []).value;
                if (toDateKey(row[COL_DATE])) rowsWithDate++;
            }

            const detectedColumns = {
                date: headers[COL_DATE] ? `Col. ${COL_DATE + 1}: ${headers[COL_DATE]}` : `Col. ${COL_DATE + 1} (date)`,
                total: headers[COL_TOTAL] ? `Col. ${COL_TOTAL + 1}: ${headers[COL_TOTAL]}` : `Col. ${COL_TOTAL + 1}`,
                incidents: headers[COL_INCIDENTS] ? `Col. ${COL_INCIDENTS + 1}: ${headers[COL_INCIDENTS]}` : `Col. ${COL_INCIDENTS + 1}`,
                cash: headers[COL_CASH] ? `Col. ${COL_CASH + 1}: ${headers[COL_CASH]}` : `Col. ${COL_CASH + 1}`,
            };
            const csvPreview: Preview = { headers, sampleRows: rows.slice(0, 3), dateIdx: COL_DATE, totalIdx: COL_TOTAL, incidentsIdx: COL_INCIDENTS, cashIdx: COL_CASH, datesFoundInCsv, sumTotalAllRows, rowsWithDate, totalRows: rows.length };

            // Une ligne du tableau = une date trouvée dans le CSV (cumul déjà fait ci-dessus)
            const out: GlovoDayRow[] = datesFoundInCsv.map(key => {
                const info = byDay[key];
                const totalVal = info.suppliedDelayed;
                const incidentsVal = info.remboursements;
                const cashVal = info.produitsPates;
                const netVal = totalVal - incidentsVal - cashVal;
                return {
                    date: key,
                    dateLabel: formatDateForTable(key),
                    lineCount: info.totalValues.length,
                    total: totalVal,
                    incidents: incidentsVal,
                    cash: cashVal,
                    net: netVal,
                    detail: {
                    totalValues: info.totalValues, incidentsValues: info.incidentsValues, cashValues: info.cashValues,
                    rawTotal: info.rawTotal, rawIncidents: info.rawIncidents, rawCash: info.rawCash,
                    rawCol10: info.rawCol10, rawCol11: info.rawCol11,
                },
                };
            });
            return { dayRows: out, parseError: null, detectedColumns, csvPreview };
        } catch (err) {
            return { dayRows: [] as GlovoDayRow[], parseError: err instanceof Error ? err.message : "Erreur lecture CSV", detectedColumns: null, csvPreview: null };
        }
    }, [rawText]);

    const totals = useMemo(() => ({
        total: dayRows.reduce((s, r) => s + r.total, 0),
        incidents: dayRows.reduce((s, r) => s + r.incidents, 0),
        cash: dayRows.reduce((s, r) => s + r.cash, 0),
        net: dayRows.reduce((s, r) => s + r.net, 0),
    }), [dayRows]);

    const allZeros = rawText && dayRows.length > 0 && totals.total === 0 && totals.incidents === 0 && totals.cash === 0;

    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    if (!isOpen) return null;

    function formatCalcWithRaw(values: number[], raw: string[], label: string): React.ReactNode {
        const sum = values.reduce((a, b) => a + b, 0);
        if (values.length === 0) return <p>{label} = 0</p>;
        const sumStr = sum.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const countStr = `${values.length} ligne${values.length > 1 ? "s" : ""}`;
        return (
            <p>
                {label} ={" "}
                {values.map((v, i) => {
                    const r = raw[i]?.trim() ?? "";
                    const showRaw = v === 0 && r !== "";
                    const valStr = v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (
                        <React.Fragment key={i}>
                            {i > 0 && " + "}
                            {showRaw ? (
                                <span title={r}>{valStr} <span className="text-amber-600">(brut : « {r.slice(0, 50)}{r.length > 50 ? "…" : ""} »)</span></span>
                            ) : (
                                valStr
                            )}
                        </React.Fragment>
                    );
                })}
                {" "}= {sumStr} Dh ({countStr})
            </p>
        );
    }

    function formatTotalWithCol10Col11(values: number[], rawCol10: string[], rawCol11: string[], label: string): React.ReactNode {
        const sum = values.reduce((a, b) => a + b, 0);
        if (values.length === 0) return <p>{label} = 0</p>;
        const sumStr = sum.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const countStr = `${values.length} ligne${values.length > 1 ? "s" : ""}`;
        return (
            <p>
                {label} ={" "}
                {values.map((v, i) => {
                    const r10 = (rawCol10[i] ?? "").trim();
                    const r11 = (rawCol11[i] ?? "").trim();
                    const valStr = v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const showRaw = v === 0;
                    return (
                        <React.Fragment key={i}>
                            {i > 0 && " + "}
                            {showRaw ? (
                                <span className="text-amber-700" title={`col.10: ${r10 || "(vide)"}\ncol.11: ${r11 || "(vide)"}`}>
                                    {valStr} <span className="text-amber-600">(col.10: « {r10 || "vide"} » | col.11: « {r11 || "vide"} »)</span>
                                </span>
                            ) : (
                                valStr
                            )}
                        </React.Fragment>
                    );
                })}
                {" "}= {sumStr} Dh ({countStr})
            </p>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Ventes Glovo – Quinzaine</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Import + Sync quinzaine */}
                <div className="p-5 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-medium cursor-pointer hover:bg-amber-100 transition-colors">
                                <Upload className="w-4 h-4" />
                                <span>Importer CSV Glovo</span>
                                <input
                                    type="file"
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                            </label>
                            {file && (
                                <span className="text-sm text-slate-600 font-medium" title={file.name}>
                                    {file.name}
                                </span>
                            )}
                        </div>
                        {onSyncRow && dayRows.length > 0 && (
                            <button
                                type="button"
                                onClick={() => dayRows.forEach(row => onSyncRow(row.date, { brut: row.total, incid: row.incidents, cash: row.cash }))}
                                title="Appliquer Glovo Brut, Incidents et Cash au journal pour toutes les dates de la quinzaine"
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
                                    syncedDates && dayRows.length > 0 && dayRows.every(r => syncedDates.has(r.date))
                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                                        : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                                )}
                            >
                                <RefreshCw className="w-4 h-4" />
                                Synchroniser la quinzaine
                            </button>
                        )}
                    </div>
                    {computedError && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-3">{computedError}</p>
                    )}
                    {(allZeros || (rawText && dayRows.length === 0)) && csvPreview && (
                        <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                            <p className="font-semibold text-amber-800">Aperçu du CSV (Date=col. 7, Total=col. 9, Incidents=col. 15, Cash=col. 16) :</p>
                            <p className="text-amber-700">En-têtes ({csvPreview.headers.length} colonnes) :</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-slate-600">
                                {csvPreview.headers.map((h, i) => (
                                    <span key={i} className="bg-white px-1.5 py-0.5 rounded border border-amber-100">
                                        [{i}] {h || "(vide)"}
                                    </span>
                                ))}
                            </div>
                            {csvPreview.sampleRows.length > 0 && (
                                <>
                                    <p className="text-amber-700 mt-2">Aperçu des {Math.min(2, csvPreview.sampleRows.length)} première(s) ligne(s) de données :</p>
                                    <div className="overflow-x-auto font-mono text-slate-600 text-[11px] border border-amber-100 rounded bg-white p-2">
                                        {csvPreview.sampleRows.slice(0, 2).map((row, ri) => (
                                            <div key={ri} className="flex flex-wrap gap-x-3 gap-y-1 mb-1">
                                                {row.map((cell, ci) => (
                                                    <span key={ci} title={csvPreview.headers[ci] ?? ""}>
                                                        <span className="text-amber-600">[{ci}]</span> {cell?.slice(0, 30)}{cell && cell.length > 30 ? "…" : ""}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    {csvPreview.datesFoundInCsv.length > 0 ? (
                                    <p className="text-amber-700 mt-1">
                                        Dates trouvées dans le CSV (cumul par jour) : {csvPreview.datesFoundInCsv.slice(0, 15).join(", ")}
                                        {csvPreview.datesFoundInCsv.length > 15 && " …"}.
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-amber-700 mt-1 font-medium">
                                            Aucune date reconnue en colonne 7. Formats acceptés : AAAA-MM-JJ, JJ/MM/AAAA, JJ.MM.AAAA, nombre Excel, ou format anglais (ex. 4 Feb 2026).
                                        </p>
                                        <p className="text-amber-700 mt-1">Valeurs brutes de la colonne 7 (col. Date) sur les premières lignes :</p>
                                        <div className="font-mono text-slate-600 text-[11px] bg-white border border-amber-100 rounded p-2">
                                            {csvPreview.sampleRows.slice(0, 5).map((row, ri) => (
                                                <div key={ri}>Ligne {ri + 1} : « {row[6] ?? "(vide)"} »</div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-5">
                    {dayRows.length === 0 && !rawText && (
                        <p className="text-slate-500 text-sm">Importez un fichier CSV des ventes Glovo pour afficher le tableau par jour.</p>
                    )}
                    {dayRows.length === 0 && rawText && !computedError && (
                        <p className="text-slate-500 text-sm">Aucune donnée à afficher pour cette période.</p>
                    )}
                    {dayRows.length > 0 && (
                        <table className="w-full border-collapse table-fixed min-w-[640px] [&_th]:border-r [&_th]:border-slate-100 [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-slate-100 [&_td:last-child]:border-r-0">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[220px]">Date</th>
                                    <th className="text-center py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[70px]">Lignes</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Incidents</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Cash</th>
                                    <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Net</th>
                                    <th className="text-center py-2.5 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-[140px]">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayRows.map((row, i) => (
                                    <React.Fragment key={row.date}>
                                        <tr
                                            className={cn(
                                                "border-b border-slate-100",
                                                i % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                                            )}
                                        >
                                            <td className="py-2.5 px-3 text-sm font-medium text-slate-700 whitespace-nowrap">{row.dateLabel}</td>
                                            <td className="py-2.5 px-3 text-sm text-slate-600 text-center whitespace-nowrap">{row.lineCount}</td>
                                            <td className="py-2.5 px-3 text-sm text-slate-600 text-right whitespace-nowrap">
                                                {row.total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                            </td>
                                            <td className="py-2.5 px-3 text-sm text-slate-600 text-right whitespace-nowrap">
                                                {row.incidents.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                            </td>
                                            <td className="py-2.5 px-3 text-sm text-slate-600 text-right whitespace-nowrap">
                                                {row.cash.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                            </td>
                                            <td className="py-2.5 px-3 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">
                                                {row.net.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedDate(expandedDate === row.date ? null : row.date)}
                                                    className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 p-1.5 rounded-lg hover:bg-blue-50 transition-colors mx-auto"
                                                    title="Afficher le détail du calcul"
                                                >
                                                    {expandedDate === row.date ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                    Détail
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedDate === row.date && (
                                            <tr key={`${row.date}-detail`} className="bg-blue-50/50 border-b border-slate-100">
                                                <td colSpan={7} className="py-3 px-4 text-xs text-slate-600">
                                                    <div className="font-mono space-y-1 text-xs">
                                                        {formatTotalWithCol10Col11(row.detail.totalValues, row.detail.rawCol10, row.detail.rawCol11, "Total (col. 9)")}
                                                        {formatCalcWithRaw(row.detail.incidentsValues, row.detail.rawIncidents, "Incidents (col. 15)")}
                                                        {formatCalcWithRaw(row.detail.cashValues, row.detail.rawCash, "Cash (col. 16)")}
                                                        <p className="pt-1 font-semibold text-slate-700">Net = Total − Incidents − Cash = {row.net.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-slate-200 bg-slate-100/80 font-bold">
                                    <td className="py-3 px-3 text-sm text-slate-700">Total quinzaine</td>
                                    <td className="py-3 px-3 text-sm text-slate-500 text-center">—</td>
                                    <td className="py-3 px-3 text-sm text-slate-700 text-right whitespace-nowrap">
                                        {totals.total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                    </td>
                                    <td className="py-3 px-3 text-sm text-slate-700 text-right whitespace-nowrap">
                                        {totals.incidents.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                    </td>
                                    <td className="py-3 px-3 text-sm text-slate-700 text-right whitespace-nowrap">
                                        {totals.cash.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                    </td>
                                    <td className="py-3 px-3 text-sm text-slate-800 text-right whitespace-nowrap">
                                        {totals.net.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {CURRENCY}
                                    </td>
                                    <td className="py-3 px-3" />
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
