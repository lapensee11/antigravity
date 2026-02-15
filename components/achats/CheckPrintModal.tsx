"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Printer } from "lucide-react";
import { type CheckPosition, type CheckPdfData } from "@/lib/check-pdf";
import { numberToFrenchWords } from "@/lib/number-to-words";

const STORAGE_KEY = "bako-check-positions";

interface CheckPositions {
  amountNumbers?: CheckPosition;
  amountLetters?: CheckPosition;
  ordre?: CheckPosition;
  lieu?: CheckPosition;
  date?: CheckPosition;
}

function loadPositions(): CheckPositions | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch (_) {}
  return undefined;
}

function savePositions(pos: CheckPositions) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos || {}));
  } catch (_) {}
}

interface CheckPrintModalProps {
  amount: number;
  ordre: string;
  onClose: () => void;
  onPrint: (data: CheckPdfData) => void;
}

export function CheckPrintModal({ amount, ordre, onClose, onPrint }: CheckPrintModalProps) {
  const [amountNumbers, setAmountNumbers] = useState({ left: 105, top: 18, fontSize: 8 });
  const [amountLetters, setAmountLetters] = useState({ left: 10, top: 32, fontSize: 8 });
  const [ordrePos, setOrdrePos] = useState({ left: 10, top: 12, fontSize: 8 });
  const [lieu, setLieu] = useState({ left: 10, top: 52, fontSize: 8 });
  const [date, setDate] = useState({ left: 105, top: 52, fontSize: 8 });
  const [lieuValue, setLieuValue] = useState("Casablanca");
  const [ordreValue, setOrdreValue] = useState(ordre);

  useEffect(() => {
    setOrdreValue(ordre);
  }, [ordre]);

  useEffect(() => {
    const p = loadPositions();
    if (p?.amountNumbers) setAmountNumbers(p.amountNumbers);
    if (p?.amountLetters) setAmountLetters(p.amountLetters);
    if (p?.ordre) setOrdrePos(p.ordre);
    if (p?.lieu) setLieu(p.lieu);
    if (p?.date) setDate(p.date);
  }, []);

  const currentPositions: CheckPositions = {
    amountNumbers,
    amountLetters,
    ordre: ordrePos,
    lieu,
    date,
  };

  const handleSavePositions = useCallback(() => {
    savePositions(currentPositions);
  }, [currentPositions]);

  const handlePrint = () => {
    handleSavePositions();
    const data: CheckPdfData = {
      amount,
      amountLetters: numberToFrenchWords(amount),
      ordre: ordreValue,
      lieu: lieuValue,
      date: new Date().toLocaleDateString("fr-FR"),
      positions: currentPositions,
    };
    onClose();
    onPrint(data);
  };

  const updatePos = (key: keyof typeof currentPositions, field: keyof CheckPosition, value: number) => {
    const updaters = {
      amountNumbers: setAmountNumbers,
      amountLetters: setAmountLetters,
      ordre: setOrdrePos,
      lieu: setLieu,
      date: setDate,
    };
    const s = updaters[key];
    s((prev) => ({ ...prev, [field]: value }));
  };

  const PosInput = ({
    label,
    keyName,
    field,
    value,
  }: {
    label: string;
    keyName: keyof typeof currentPositions;
    field: keyof CheckPosition;
    value: number;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-600 w-24">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => updatePos(keyName, field, parseFloat(e.target.value) || 0)}
        className="w-16 text-xs border border-slate-200 rounded px-2 py-1"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">Imprimer chèque — Réglage des emplacements</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-bold text-slate-700">Montant : {amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH</p>
            <p className="text-xs text-slate-600">{numberToFrenchWords(amount)}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Ordre (bénéficiaire)</label>
            <input
              type="text"
              value={ordreValue}
              onChange={(e) => setOrdreValue(e.target.value)}
              placeholder="Nom du fournisseur"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Lieu</label>
            <input
              type="text"
              value={lieuValue}
              onChange={(e) => setLieuValue(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-bold text-slate-700 mb-3">Emplacements (mm depuis le coin haut-gauche)</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg">
                <p className="font-bold text-blue-800">Montant (chiffres)</p>
                <PosInput label="Gauche" keyName="amountNumbers" field="left" value={amountNumbers.left} />
                <PosInput label="Haut" keyName="amountNumbers" field="top" value={amountNumbers.top} />
                <PosInput label="Taille" keyName="amountNumbers" field="fontSize" value={amountNumbers.fontSize || 12} />
              </div>
              <div className="space-y-2 p-3 bg-emerald-50 rounded-lg">
                <p className="font-bold text-emerald-800">Montant (lettres)</p>
                <PosInput label="Gauche" keyName="amountLetters" field="left" value={amountLetters.left} />
                <PosInput label="Haut" keyName="amountLetters" field="top" value={amountLetters.top} />
                <PosInput label="Taille" keyName="amountLetters" field="fontSize" value={amountLetters.fontSize || 8} />
              </div>
              <div className="space-y-2 p-3 bg-violet-50 rounded-lg">
                <p className="font-bold text-violet-800">Ordre</p>
                <PosInput label="Gauche" keyName="ordre" field="left" value={ordrePos.left} />
                <PosInput label="Haut" keyName="ordre" field="top" value={ordrePos.top} />
                <PosInput label="Taille" keyName="ordre" field="fontSize" value={ordrePos.fontSize || 8} />
              </div>
              <div className="space-y-2 p-3 bg-amber-50 rounded-lg">
                <p className="font-bold text-amber-800">Lieu</p>
                <PosInput label="Gauche" keyName="lieu" field="left" value={lieu.left} />
                <PosInput label="Haut" keyName="lieu" field="top" value={lieu.top} />
                <PosInput label="Taille" keyName="lieu" field="fontSize" value={lieu.fontSize || 10} />
              </div>
              <div className="space-y-2 p-3 bg-purple-50 rounded-lg">
                <p className="font-bold text-purple-800">Date</p>
                <PosInput label="Gauche" keyName="date" field="left" value={date.left} />
                <PosInput label="Haut" keyName="date" field="top" value={date.top} />
                <PosInput label="Taille" keyName="date" field="fontSize" value={date.fontSize || 10} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={() => handleSavePositions()}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Enregistrer positions
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
