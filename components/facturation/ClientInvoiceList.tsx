"use client";

import { ClientInvoice, Tier } from "@/lib/types";
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientInvoiceListProps {
    invoices: ClientInvoice[];
    clients: Tier[];
    selectedInvoiceId: string | null;
    onSelectInvoice: (invoice: ClientInvoice | null) => void;
    onCreateNew: () => void;
}

export function ClientInvoiceList({
    invoices,
    clients,
    selectedInvoiceId,
    onSelectInvoice,
    onCreateNew,
}: ClientInvoiceListProps) {
    const [clientSearch, setClientSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [declaredFilter, setDeclaredFilter] = useState<"Tous" | "Oui" | "Non">("Tous");
    const [dateFilter, setDateFilter] = useState<"TOUT" | "MOIS" | "TRIMESTRE">("TOUT");
    const [sortColumn, setSortColumn] = useState<"date" | "client" | "number" | "total" | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

    const hasActiveFilter = !!(clientSearch || dateFrom || dateTo);

    const filteredInvoices = useMemo(() => {
        let filtered = invoices;

        if (declaredFilter === "Oui") {
            filtered = filtered; // Toutes les factures clients sont "validées"
        } else if (declaredFilter === "Non") {
            filtered = []; // Pas de brouillons pour factures clients
        }

        if (dateFrom) {
            filtered = filtered.filter(inv => inv.date >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(inv => inv.date <= dateTo);
        }
        if (clientSearch) {
            const searchLower = clientSearch.toLowerCase();
            filtered = filtered.filter(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                return client && (
                    client.name.toLowerCase().includes(searchLower) ||
                    (client.code && client.code.toLowerCase().includes(searchLower))
                );
            });
        }

        filtered = [...filtered].sort((a, b) => {
            let comparison = 0;
            if (sortColumn) {
                switch (sortColumn) {
                    case "date":
                        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                        break;
                    case "client":
                        const clientA = clients.find(c => c.id === a.clientId)?.name || "";
                        const clientB = clients.find(c => c.id === b.clientId)?.name || "";
                        comparison = clientA.localeCompare(clientB);
                        break;
                    case "number":
                        comparison = (a.number || "").localeCompare(b.number || "");
                        break;
                    case "total":
                        comparison = (a.totalTtc || 0) - (b.totalTtc || 0);
                        break;
                }
                return sortDirection === "asc" ? comparison : -comparison;
            } else {
                comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                return comparison;
            }
        });

        return filtered;
    }, [invoices, dateFrom, dateTo, clientSearch, clients, sortColumn, sortDirection, declaredFilter]);

    const totalTTC = filteredInvoices.reduce((sum, inv) => sum + (inv.totalTtc || 0), 0);

    const handleSort = (column: "date" | "client" | "number" | "total") => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("desc");
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (["INPUT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
            if (filteredInvoices.length === 0) return;

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const currentIndex = filteredInvoices.findIndex(inv => inv.id === selectedInvoiceId);
                let newIndex = currentIndex === -1 ? 0 : e.key === "ArrowDown"
                    ? Math.min(filteredInvoices.length - 1, currentIndex + 1)
                    : Math.max(0, currentIndex - 1);
                if (newIndex !== currentIndex && filteredInvoices[newIndex]) {
                    onSelectInvoice(filteredInvoices[newIndex]);
                    setTimeout(() => {
                        const row = rowRefs.current.get(filteredInvoices[newIndex].id);
                        if (row && tableContainerRef.current) {
                            row.scrollIntoView({ block: "center", behavior: "smooth" });
                        }
                    }, 0);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredInvoices, selectedInvoiceId, onSelectInvoice]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F6F8FC]">
            {/* Filters - same as Factures Achat */}
            <div className="p-5 flex flex-col gap-4 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100">
                <div className="bg-white/60 backdrop-blur-sm p-1 rounded-xl flex gap-1 shadow-sm border border-slate-200/50">
                    {["TOUS", "FACTURES", "BROUILLONS"].map((label) => {
                        const isActive = declaredFilter === "Tous" ? label === "TOUS" :
                            declaredFilter === "Oui" ? label === "FACTURES" : label === "BROUILLONS";
                        return (
                            <button
                                key={label}
                                onClick={() => {
                                    if (label === "TOUS") setDeclaredFilter("Tous");
                                    else if (label === "FACTURES") setDeclaredFilter("Oui");
                                    else setDeclaredFilter("Non");
                                }}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden mb-[1px]",
                                    isActive
                                        ? "bg-blue-100 text-blue-600 shadow-sm border border-blue-200"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-white/80"
                                )}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            placeholder="Nom du client..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="w-full bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl pl-9 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm placeholder:text-slate-400"
                        />
                        {clientSearch && (
                            <button
                                onClick={() => setClientSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="bg-white/80 backdrop-blur-sm p-1 rounded-xl flex gap-1 shadow-sm border border-slate-200/50">
                        {["TOUT", "TRIMESTRE", "MOIS"].map((label) => {
                            const isActive = dateFilter === "TOUT" ? label === "TOUT" :
                                dateFilter === "TRIMESTRE" ? label === "TRIMESTRE" : label === "MOIS";
                            return (
                                <button
                                    key={label}
                                    onClick={() => {
                                        if (label === "MOIS") {
                                            setDateFilter("MOIS");
                                            const now = new Date();
                                            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                                            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
                                            setDateFrom(start);
                                            setDateTo(end);
                                        } else if (label === "TRIMESTRE") {
                                            setDateFilter("TRIMESTRE");
                                            const now = new Date();
                                            const q = Math.floor(now.getMonth() / 3) * 3;
                                            const start = new Date(now.getFullYear(), q, 1).toISOString().split("T")[0];
                                            const end = new Date(now.getFullYear(), q + 3, 0).toISOString().split("T")[0];
                                            setDateFrom(start);
                                            setDateTo(end);
                                        } else {
                                            setDateFilter("TOUT");
                                            setDateFrom("");
                                            setDateTo("");
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all",
                                        isActive
                                            ? "bg-blue-100 text-blue-600 shadow-sm border border-blue-200"
                                            : "text-slate-500 hover:text-slate-700 hover:bg-white/80"
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl flex items-center gap-1.5 border border-slate-200/50 shadow-sm">
                        <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Du</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-600 focus:outline-none focus:border-blue-400 focus:bg-blue-100 focus:text-blue-700"
                            />
                        </div>
                        <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Au</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-600 focus:outline-none focus:border-blue-400 focus:bg-blue-100 focus:text-blue-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div ref={tableContainerRef} className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="bg-[#1E293B] border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <button
                                    onClick={() => handleSort("date")}
                                    className="flex items-center gap-1 text-xs font-bold text-white uppercase hover:text-blue-300"
                                >
                                    Date
                                    {sortColumn === "date" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button
                                    onClick={() => handleSort("number")}
                                    className="flex items-center gap-1 text-xs font-bold text-white uppercase hover:text-blue-300"
                                >
                                    N° Facture
                                    {sortColumn === "number" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button
                                    onClick={() => handleSort("client")}
                                    className="flex items-center gap-1 text-xs font-bold text-white uppercase hover:text-blue-300"
                                >
                                    Client
                                    {sortColumn === "client" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                </button>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <button
                                    onClick={() => handleSort("total")}
                                    className="flex items-center gap-1 text-xs font-bold text-white uppercase hover:text-blue-300 ml-auto"
                                >
                                    Total TTC
                                    {sortColumn === "total" && (sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map((inv) => {
                            const client = clients.find(c => c.id === inv.clientId);
                            const isSelected = inv.id === selectedInvoiceId;
                            return (
                                <tr
                                    key={inv.id}
                                    ref={(el) => { if (el) rowRefs.current.set(inv.id, el); else rowRefs.current.delete(inv.id); }}
                                    onClick={() => onSelectInvoice(inv)}
                                    className={cn("cursor-pointer transition-colors", isSelected ? "bg-blue-100 border-2 border-[#1E293B]" : "hover:bg-slate-50")}
                                >
                                    <td className="px-4 py-3 text-xs font-medium text-slate-700">
                                        {new Date(inv.date).toLocaleDateString("fr-FR")}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono text-slate-700">{inv.number || "—"}</td>
                                    <td className="px-4 py-3 text-xs font-medium text-slate-700">{client?.name || "—"}</td>
                                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                                        {(inv.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-[#1E293B] border-t-2 border-slate-300 sticky bottom-0">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-xs font-bold text-white uppercase">Total</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-white">
                                {totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {hasActiveFilter && (
                <div className="p-4 border-t border-slate-200 bg-white text-center text-sm text-slate-600">
                    {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""} correspondant aux critères
                </div>
            )}
        </div>
    );
}
