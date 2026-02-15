"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { ClientInvoice, ClientInvoiceLine, Tier } from "@/lib/types";
import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    getClientInvoices,
    generateClientInvoiceNumber,
    saveClientInvoice,
    deleteClientInvoice,
} from "@/lib/data-service";
import { useClientInvoices, useClients, useClientInvoiceMutation, useClientInvoiceDeletion } from "@/lib/hooks/use-data";
import { generateClientInvoicePdf } from "@/lib/client-invoice-pdf";
import { ClientInvoiceList } from "./ClientInvoiceList";
import { Plus, FileText, Trash2, Download, Copy, File, Check, Printer, X } from "lucide-react";
import { cn, formatIce, formatDateJjMmAaaa, numberToFrenchWords } from "@/lib/utils";
import { createPortal } from "react-dom";

const DEFAULT_TVA = 20;

function calcFromHt(qty: number, puHt: number, tva: number): { totalHt: number; totalTtc: number } {
    const totalHt = qty * puHt;
    const totalTtc = totalHt * (1 + tva / 100);
    return { totalHt, totalTtc };
}

function calcFromTtc(qty: number, puTtc: number, tva: number): { puHt: number; totalHt: number; totalTtc: number } {
    const totalTtc = qty * puTtc;
    const totalHt = totalTtc / (1 + tva / 100);
    const puHt = qty > 0 ? totalHt / qty : 0;
    return { puHt, totalHt, totalTtc };
}

export function FacturationContent() {
    const { data: invoices = [], isLoading } = useClientInvoices();
    const { data: clients = [] } = useClients();
    const mutation = useClientInvoiceMutation();
    const deletion = useClientInvoiceDeletion();
    const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const didOpenFromTiersRef = useRef(false);

    const handleSave = async (inv: ClientInvoice) => {
        await mutation.mutateAsync(inv);
        setSelectedInvoice(inv);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer cette facture client ?")) return;
        await deletion.mutateAsync(id);
        if (selectedInvoice?.id === id) setSelectedInvoice(null);
    };

    const handleCreateNew = async () => {
        const number = generateClientInvoiceNumber(invoices);
        const newInv: ClientInvoice = {
            id: `ci_${Date.now()}`,
            clientId: "",
            number,
            date: new Date().toISOString().split("T")[0],
            lines: [],
            totalHt: 0,
            totalTtc: 0,
        };
        await mutation.mutateAsync(newInv);
        setSelectedInvoice(newInv);
    };

    const handleExportPdf = (inv: ClientInvoice) => {
        const client = clients.find(c => c.id === inv.clientId);
        const blob = generateClientInvoicePdf(inv, client);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Facture_${inv.number.replace(/\//g, "-")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Depuis Tiers : clientId=... → créer une nouvelle facture client pour ce client
    useEffect(() => {
        const clientId = searchParams.get("clientId");
        if (didOpenFromTiersRef.current || !clientId || clients.length === 0 || isLoading) return;
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        didOpenFromTiersRef.current = true;
        (async () => {
            const number = generateClientInvoiceNumber(invoices);
            const newInv: ClientInvoice = {
                id: `ci_${Date.now()}`,
                clientId,
                number,
                date: new Date().toISOString().split("T")[0],
                lines: [],
                totalHt: 0,
                totalTtc: 0,
            };
            await mutation.mutateAsync(newInv);
            setSelectedInvoice(newInv);
            router.replace("/facturation", { scroll: false });
        })();
    }, [searchParams, clients, invoices, isLoading, mutation, router]);

    const handleDuplicate = async (isEmpty: boolean) => {
        if (!selectedInvoice) return;
        const number = generateClientInvoiceNumber(invoices);
        const newInv: ClientInvoice = {
            ...selectedInvoice,
            id: `ci_${Date.now()}`,
            number,
            date: new Date().toISOString().split("T")[0],
            lines: isEmpty ? [] : (selectedInvoice.lines || []).map((l) => ({
                ...l,
                id: `l_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                totalHt: 0,
                totalTtc: 0,
            })),
            totalHt: 0,
            totalTtc: 0,
        };
        await mutation.mutateAsync(newInv);
        setSelectedInvoice(newInv);
    };

    return (
        <div className="flex h-screen bg-[#F6F8FC] overflow-hidden font-outfit">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen flex">
                {/* Left panel - same width as Achats */}
                <div className="w-[600px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC] shrink-0">
                    <div className="h-24 min-h-[96px] shrink-0 flex flex-col items-center justify-center border-b border-slate-200 bg-white shadow-[0_1px_10px_rgba(0,0,0,0.03)] z-10 relative">
                        <h2 className="text-2xl font-extrabold text-slate-800 font-outfit tracking-tight">Facturation</h2>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Factures clients</span>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">Chargement...</div>
                    ) : (
                        <ClientInvoiceList
                            invoices={invoices}
                            clients={clients}
                            selectedInvoiceId={selectedInvoice?.id || null}
                            onSelectInvoice={setSelectedInvoice}
                            onCreateNew={handleCreateNew}
                        />
                    )}
                </div>

                {/* Right panel - Editor - same layout as Factures Achat */}
                <div className="flex-1 bg-white flex flex-col">
                    {selectedInvoice ? (
                        <ClientInvoiceEditor
                            invoice={selectedInvoice}
                            clients={clients}
                            allInvoices={invoices}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            onExportPdf={handleExportPdf}
                            onCreateNew={handleCreateNew}
                            onDuplicate={handleDuplicate}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white/50">
                            <div
                                className="w-64 h-64 rounded-full overflow-hidden flex items-center justify-center bg-transparent opacity-90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-125 hover:opacity-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
                            >
                                <img src="/logo-boujniba.png" alt="Boujniba" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

interface ClientInvoiceEditorProps {
    invoice: ClientInvoice;
    clients: Tier[];
    allInvoices: ClientInvoice[];
    onSave: (inv: ClientInvoice) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onExportPdf: (inv: ClientInvoice) => void;
    onCreateNew: () => void;
    onDuplicate: (isEmpty: boolean) => void;
}

function ClientInvoiceEditor({ invoice, clients, onSave, onDelete, onExportPdf, onCreateNew, onDuplicate }: ClientInvoiceEditorProps) {
    const [inv, setInv] = useState<ClientInvoice>(() => ({
        ...invoice,
        lines: Array.isArray(invoice.lines) ? invoice.lines : [],
    }));
    const [activeAction, setActiveAction] = useState<"new" | "empty" | "full" | null>(null);
    const [clientSearch, setClientSearch] = useState("");
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    const [clientFocusIndex, setClientFocusIndex] = useState(-1);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const clientListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showPdfModal) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [showPdfModal]);
    const clientInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInv({
            ...invoice,
            lines: Array.isArray(invoice.lines) ? invoice.lines : [],
        });
    }, [invoice.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            onSave(inv);
        }, 600);
        return () => clearTimeout(timer);
    }, [inv, onSave]);

    useEffect(() => {
        const c = clients.find(x => x.id === inv.clientId);
        setClientSearch(c?.name || "");
    }, [inv.clientId, clients]);

    const filteredClients = useMemo(() => {
        if (!clientSearch.trim()) return clients;
        const q = clientSearch.toLowerCase();
        return clients.filter(c =>
            c.name.toLowerCase().includes(q) ||
            (c.code && c.code.toLowerCase().includes(q))
        );
    }, [clients, clientSearch]);

    const updateInv = (updates: Partial<ClientInvoice>) => setInv(prev => ({ ...prev, ...updates }));

    const updateLine = (lineId: string, updates: Partial<ClientInvoiceLine>) => {
        setInv(prev => {
            const lines = prev.lines.map(l =>
                l.id === lineId ? { ...l, ...updates } : l
            );
            return recalcInvoice(prev, lines);
        });
    };

    const addLine = () => {
        const newLine: ClientInvoiceLine = {
            id: `l_${Date.now()}`,
            designation: "",
            qty: 1,
            puHt: 0,
            tauxTva: DEFAULT_TVA,
            totalHt: 0,
            totalTtc: 0,
        };
        setInv(prev => recalcInvoice(prev, [...prev.lines, newLine]));
    };

    const removeLine = (lineId: string) => {
        setInv(prev => recalcInvoice(prev, prev.lines.filter(l => l.id !== lineId)));
    };

    const handleClientSelect = (clientId: string) => {
        updateInv({ clientId });
        const c = clients.find(x => x.id === clientId);
        setClientSearch(c?.name || "");
        setShowClientSuggestions(false);
        setClientFocusIndex(-1);
    };

    const handlePuTtcChange = (lineId: string, qty: number, puTtc: number) => {
        const { puHt, totalHt, totalTtc } = calcFromTtc(qty, puTtc, DEFAULT_TVA);
        updateLine(lineId, { tauxTva: DEFAULT_TVA, puHt, totalHt, totalTtc });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Header - same as Factures Achat, WITHOUT sync block */}
            <div className="h-24 border-b border-slate-200 bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 shrink-0 shadow-sm z-20 px-4 flex items-center justify-between gap-4">
                <div className="flex w-[40%] h-16 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        onClick={() => { onCreateNew(); setActiveAction("new"); setTimeout(() => setActiveAction(null), 2000); }}
                        className="flex-1 flex items-center justify-center gap-3 hover:bg-blue-50/80 transition-all group border-r border-slate-200/50 active:bg-blue-100/80"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                            activeAction === "new" ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                        )}>
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === "new" ? "text-orange-500" : "text-slate-700")}>Nouvelle</span>
                    </button>
                    <button
                        onClick={() => { onDuplicate(true); setActiveAction("empty"); setTimeout(() => setActiveAction(null), 2000); }}
                        className="flex-1 flex items-center justify-center gap-3 hover:bg-blue-50/80 transition-all group border-r border-slate-200/50 active:bg-blue-100/80"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                            activeAction === "empty" ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                        )}>
                            <File className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === "empty" ? "text-orange-500" : "text-slate-700")}>Vide</span>
                    </button>
                    <button
                        onClick={() => { onDuplicate(false); setActiveAction("full"); setTimeout(() => setActiveAction(null), 2000); }}
                        className="flex-1 flex items-center justify-center gap-3 hover:bg-blue-50/80 transition-all group active:bg-blue-100/80"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                            activeAction === "full" ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                        )}>
                            <Copy className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === "full" ? "text-orange-500" : "text-slate-700")}>Pleine</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPdfModal(true)}
                        className="h-16 px-4 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 hover:bg-blue-500/20 transition-colors gap-2"
                        title="Aperçu PDF A5"
                    >
                        <Download className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">PDF</span>
                    </button>
                </div>

                <button
                    onClick={() => onDelete(inv.id)}
                    className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all shadow-md group"
                    title="Supprimer la facture"
                >
                    <Trash2 className="w-7 h-7 stroke-[2.5px] group-hover:rotate-12 transition-transform" />
                </button>
            </div>

            {/* Body - same style as InvoiceEditor, without payments/documents */}
            <GlassCard className="flex-1 flex flex-col overflow-hidden rounded-none shadow-none border-0 font-outfit">
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="shrink-0 pt-6 pb-8 pl-8 pr-6 flex items-start justify-between gap-4 bg-white">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-4">
                                <button
                                    className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#4CAF50] border-[#43A047] shadow-green-200 shrink-0"
                                    title="Facture client validée"
                                >
                                    <Check className="w-6 h-6 stroke-[4px] text-white" />
                                </button>
                                <div className="flex flex-col gap-1 relative">
                                    <div className="relative">
                                        <input
                                        ref={clientInputRef}
                                        type="text"
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setClientFocusIndex(-1);
                                            setShowClientSuggestions(true);
                                        }}
                                        onFocus={() => setShowClientSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setClientFocusIndex(prev => prev < filteredClients.length - 1 ? prev + 1 : prev);
                                            } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setClientFocusIndex(prev => prev > 0 ? prev - 1 : -1);
                                            } else if (e.key === "Enter") {
                                                e.preventDefault();
                                                if (clientFocusIndex >= 0 && filteredClients[clientFocusIndex]) {
                                                    handleClientSelect(filteredClients[clientFocusIndex].id);
                                                } else if (filteredClients.length === 1) {
                                                    handleClientSelect(filteredClients[0].id);
                                                }
                                            } else if (e.key === "Escape") setShowClientSuggestions(false);
                                        }}
                                        placeholder="Choisir un Client..."
                                        className="text-2xl font-serif font-black text-slate-800 bg-transparent outline-none hover:text-blue-600 transition-colors pr-8 min-w-[250px] w-full"
                                    />
                                    {showClientSuggestions && filteredClients.length > 0 && (
                                        <div
                                            ref={clientListRef}
                                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[300px] overflow-y-auto z-50"
                                        >
                                            {filteredClients.map((c, idx) => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => handleClientSelect(c.id)}
                                                    onMouseEnter={() => setClientFocusIndex(idx)}
                                                    className={cn(
                                                        "px-4 py-3 cursor-pointer transition-colors",
                                                        idx === clientFocusIndex ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                                                    )}
                                                >
                                                    <div className="font-semibold text-sm">{c.name}</div>
                                                    {c.code && <div className="text-xs text-slate-400 font-mono">{c.code}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono opacity-80">N°</span>
                                        <input
                                            type="text"
                                            value={inv.number}
                                            onChange={(e) => updateInv({ number: e.target.value })}
                                            placeholder="FA26-02-001"
                                            className="bg-transparent text-xs font-bold text-slate-500 uppercase tracking-wider font-mono focus:outline-none focus:text-blue-600 focus:bg-blue-50/50 rounded px-1 transition-all w-full max-w-[200px]"
                                        />
                                    </div>
                                </div>
                            </div>
                            {clients.find(c => c.id === inv.clientId)?.ice && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ICE</span>
                                    <span className="text-sm font-mono font-bold text-slate-700">
                                        {formatIce(clients.find(c => c.id === inv.clientId)?.ice)}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Facture</span>
                                <input
                                    type="date"
                                    value={inv.date}
                                    onChange={(e) => updateInv({ date: e.target.value })}
                                    className="bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-base font-bold text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                        <div className="flex items-start justify-end shrink-0">
                            <img src="/logo-boujniba-rouge.png" alt="Boujniba" className="h-[100px] w-[100px] object-contain" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar pb-20">
                        <div className="border-b border-slate-200" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[#1E293B] rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lignes de Facture</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="w-8 h-8 bg-[#1E293B] text-white rounded-lg flex items-center justify-center hover:bg-slate-700 transition-all shadow-md shadow-slate-200 group active:scale-95"
                                    title="Ajouter une ligne"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                            <div className="bg-white rounded-xl border border-[#1E293B] overflow-visible shadow-md shadow-gray-300">
                                <table className="w-full text-sm border-separate border-spacing-0">
                                    <thead className="bg-blue-100 text-[10px] font-bold text-blue-700 uppercase border-b border-blue-200 tracking-wider">
                                        <tr>
                                            <th className="px-2 py-2 text-left rounded-tl-xl border-r border-slate-200 w-[25%] max-w-[200px]">Désignation</th>
                                            <th className="px-2 py-2 text-right w-[7%] border-r border-slate-200">Qté</th>
                                            <th className="px-2 py-2 text-right w-[12%] border-r border-slate-200">PU TTC</th>
                                            <th className="px-2 py-2 text-right w-[7%] border-r border-slate-200">TVA</th>
                                            <th className="px-2 py-2 text-right w-[11%] border-r border-slate-200">Total HT</th>
                                            <th className="px-4 py-2 text-right border-r border-slate-200">Total TTC</th>
                                            <th className="px-2 py-2 w-8 rounded-tr-xl" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inv.lines.map((line) => (
                                            <InvoiceLineRow
                                                key={line.id}
                                                line={line}
                                                onDesignationChange={(v) => updateLine(line.id, { designation: v })}
                                                onQtyChange={(v) => {
                                                    const qty = Number(v) || 0;
                                                    const { totalHt, totalTtc } = calcFromHt(qty, line.puHt, DEFAULT_TVA);
                                                    updateLine(line.id, { qty, totalHt, totalTtc });
                                                }}
                                                onPuTtcChange={(v) => handlePuTtcChange(line.id, line.qty, Number(v) || 0)}
                                                onRemove={() => removeLine(line.id)}
                                            />
                                        ))}
                                        {inv.lines.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-8 text-center text-slate-400 italic text-xs">
                                                    Aucune ligne. Cliquez sur le bouton &quot;+&quot;.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end mt-[10px]">
                                <div className="bg-[#1E293B] text-white rounded-xl py-2 px-5 flex items-center gap-6 shadow-lg shadow-gray-400/20">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total HT</span>
                                        <span className="text-sm font-black">{(inv.totalHt || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-60">Dh</span></span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total TTC</span>
                                        <span className="text-sm font-black">{(inv.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] opacity-60">Dh</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Modal Aperçu PDF A5 - like Production A5 tab */}
            {showPdfModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                    <div
                        className="absolute inset-0"
                        onClick={() => setShowPdfModal(false)}
                    />
                    <div className="relative z-10 flex flex-col items-center max-h-[95vh] overflow-auto">
                        <div className="flex items-center gap-3 mb-4 w-full max-w-[148mm] justify-end">
                            <button
                                onClick={() => {
                                    onExportPdf(inv);
                                    setShowPdfModal(false);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors"
                            >
                                <Printer className="w-5 h-5" />
                                Exporter PDF
                            </button>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="p-2 hover:bg-white/80 rounded-full text-slate-500 hover:text-slate-700"
                                title="Fermer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* A5 - 148x210mm - En-tête 4cm logo pré-imprimé, séparateur, 2 blocs, tableau, totaux + signature */}
                        <div
                            className="print-facture-a5 bg-white shadow-2xl w-full max-w-[148mm] min-h-[210mm] px-[10mm] pt-0 pb-6 flex flex-col font-sans text-slate-800"
                            style={{ aspectRatio: "148/210", fontSize: "12px" }}
                            lang="fr"
                        >
                            {/* En-tête 4cm pour logo pré-imprimé */}
                            <div className="h-[40mm] min-h-[40mm] shrink-0" />
                            {/* Séparateur élégant */}
                            <div className="border-t-2 border-slate-400 mb-px" />
                            <div className="border-t border-slate-300 mb-3" />
                            {/* 2 blocs côte à côte */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase">N° Facture</div>
                                    <div className="text-base font-mono font-bold">{inv.number || "-"}</div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mt-2">Date</div>
                                    <div className="text-base font-mono">{formatDateJjMmAaaa(inv.date)}</div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase">Client</div>
                                    <div className="text-base font-bold">{clients.find(c => c.id === inv.clientId)?.name || "-"}</div>
                                    <div className="text-[11px] font-bold text-slate-500 uppercase mt-2">ICE</div>
                                    <div className="text-sm font-mono">{formatIce(clients.find(c => c.id === inv.clientId)?.ice) || "-"}</div>
                                </div>
                            </div>
                            {/* Séparateur élégant en dessous des blocs Facture et Client */}
                            <div className="border-t-2 border-slate-400 mb-px" />
                            <div className="border-t border-slate-300 mb-4" />
                            {/* Tableau : Qté, Désignation, PU HT, TVA, Total TTC */}
                            <table className="w-full text-[11px] border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-400 font-bold">
                                        <th className="text-left py-1 w-[12%]">Qté</th>
                                        <th className="text-left py-1 w-[25%]">Désignation</th>
                                        <th className="text-right py-1 w-[20%]">PU HT</th>
                                        <th className="text-right py-1 w-[12%]">TVA</th>
                                        <th className="text-right py-1 w-[20%]">Total TTC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...(inv.lines || []), ...Array(Math.max(0, 3 - (inv.lines || []).length)).fill(null)].map((line, idx) => (
                                        <tr key={line?.id || `empty-${idx}`} className="border-b border-slate-200 min-h-[22px]">
                                            <td className="py-2 min-h-[22px] align-top">{line ? line.qty || 0 : ""}</td>
                                            <td className="py-2 min-h-[22px] align-top">{line ? (line.designation || "-").slice(0, 28) : ""}</td>
                                            <td className="py-2 min-h-[22px] align-top text-right">
                                                {line ? ((line.qty && line.qty > 0 && line.totalHt != null) ? line.totalHt / line.qty : 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : ""}
                                            </td>
                                            <td className="py-2 min-h-[22px] align-top text-right">{line ? "20%" : ""}</td>
                                            <td className="py-2 min-h-[22px] align-top text-right font-bold">{line ? (line.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : ""}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Bloc Totaux à droite */}
                            <div className="mt-4 flex justify-end">
                                <div className="text-right font-bold text-base">
                                    <div className="flex justify-end gap-4">
                                        <span>Total HT :</span>
                                        <span>{(inv.totalHt || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH</span>
                                    </div>
                                    <div className="flex justify-end gap-4 mt-1">
                                        <span>Total TTC :</span>
                                        <span>{(inv.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH</span>
                                    </div>
                                </div>
                            </div>
                            {/* Arrêté la présente facture... */}
                            <div className="mt-3 text-base font-medium text-slate-700">
                                Arrêté la présente facture à la somme de TTC : {numberToFrenchWords(inv.totalTtc || 0)}
                            </div>
                            {/* ICE à 1,5cm du bas de page, à droite */}
                            <div className="mt-auto pb-[15mm] text-[9px] text-slate-600 text-right font-mono">
                                ICE : 001539075.0000.66
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

function recalcInvoice(prev: ClientInvoice, lines: ClientInvoiceLine[]): ClientInvoice {
    const lineArr = Array.isArray(lines) ? lines : [];
    let totalHt = 0;
    let totalTtc = 0;
    for (const l of lineArr) {
        totalHt += l.totalHt || 0;
        totalTtc += l.totalTtc || 0;
    }
    return { ...prev, lines: lineArr, totalHt, totalTtc };
}

interface InvoiceLineRowProps {
    line: ClientInvoiceLine;
    onDesignationChange: (v: string) => void;
    onQtyChange: (v: number) => void;
    onPuTtcChange: (v: number) => void;
    onRemove: () => void;
}

function InvoiceLineRow({
    line,
    onDesignationChange,
    onQtyChange,
    onPuTtcChange,
    onRemove,
}: InvoiceLineRowProps) {
    const qty = line.qty || 0;
    const puTtc = qty > 0 ? (line.totalTtc || 0) / qty : 0;

    return (
        <tr className="group hover:bg-slate-50/50 border-b border-slate-200">
            <td className="px-2 py-1 border-r border-slate-200 w-[25%] max-w-[200px]">
                <input
                    type="text"
                    value={line.designation}
                    onChange={(e) => onDesignationChange(e.target.value)}
                    className="w-full border-0 bg-transparent text-slate-800 font-medium focus:ring-0 p-1"
                    placeholder="Désignation"
                />
            </td>
            <td className="px-2 py-1 text-right border-r border-slate-200">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={qty}
                    onChange={(e) => onQtyChange(parseFloat(e.target.value) || 0)}
                    className="w-16 min-w-0 text-right border-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
            </td>
            <td className="px-2 py-1 text-right border-r border-slate-200">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={puTtc || ""}
                    onChange={(e) => onPuTtcChange(parseFloat(e.target.value) || 0)}
                    className="w-20 min-w-0 text-right border-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Montant TTC"
                />
            </td>
            <td className="px-2 py-1 text-right border-r border-slate-200 text-slate-500 font-medium">
                20%
            </td>
            <td className="px-2 py-1 text-right font-mono text-slate-600 border-r border-slate-200">
                {(line.totalHt || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
            </td>
            <td className="px-4 py-1 text-right font-mono font-bold text-blue-600">
                {(line.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
            </td>
            <td className="px-2 py-1 text-center">
                <button
                    onClick={onRemove}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Supprimer la ligne"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}
