"use client";

import { Invoice, Article, Tier } from "@/lib/types";
import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, Calendar, ChevronUp, ChevronDown, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";

interface InvoiceListProps {
    invoices: Invoice[];
    allInvoices?: Invoice[];
    selectedInvoiceId: string | null;
    onSelectInvoice: (invoice: Invoice | null) => void;
    /** Un clic sur l'icône brouillon passe la facture en déclarée (Validated) */
    onToggleDeclared?: (invoice: Invoice) => void;
    suppliers: Tier[];
    articles: Article[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

export function InvoiceList({
    invoices,
    allInvoices = [],
    selectedInvoiceId,
    onSelectInvoice,
    onToggleDeclared,
    suppliers,
    total,
    page = 0,
    pageSize = 50,
    onPageChange,
    onPageSizeChange
}: InvoiceListProps) {
    const [dateFilter, setDateFilter] = useState<"Semaine" | "Mois" | "Trimestre" | "TOUT">("TOUT");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [declaredFilter, setDeclaredFilter] = useState<"Oui" | "Tous" | "Non">("Tous");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [sortColumn, setSortColumn] = useState<"date" | "supplier" | "number" | "total" | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Toujours utiliser toute la liste pour appliquer le tri global (non soldées → non synchronisées → date décroissante)
    const hasActiveFilter = !!(supplierSearch || dateFrom || dateTo || declaredFilter !== "Tous");
    
    // CRITIQUE : TOUJOURS utiliser allInvoices pour le tri global - c'est la source de vérité pour toutes les factures
    // Ne jamais utiliser invoices (paginated) pour le tri car elles ne contiennent qu'une page
    // Si allInvoices n'est pas encore chargé, on attend (afficher un loader ou utiliser un tableau vide)
    const invoicesToFilter = allInvoices.length > 0 ? allInvoices : [];
    
    // Créer un Set des IDs des factures sauvegardées (dans la base de données)
    const savedInvoiceIds = useMemo(() => {
        return new Set(allInvoices.map(inv => inv.id));
    }, [allInvoices]);

    // Helper: reste à payer = totalTTC - somme des paiements
    const restToPay = useMemo(() => (inv: Invoice) => {
        const paid = (inv.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
        return (inv.totalTTC || 0) - paid;
    }, []);

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let filtered = invoicesToFilter;

        // Date filter
        if (dateFrom) {
            filtered = filtered.filter(inv => inv.date >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(inv => inv.date <= dateTo);
        }

        // Declared filter
        if (declaredFilter === "Oui") {
            filtered = filtered.filter(inv => inv.status === "Synced" || inv.status === "Validated");
        } else if (declaredFilter === "Non") {
            filtered = filtered.filter(inv => inv.status === "Draft" || inv.status === "Modified");
        }

        // Supplier filter
        if (supplierSearch) {
            const searchLower = supplierSearch.toLowerCase();
            filtered = filtered.filter(inv => {
                const supplier = suppliers.find(s => s.id === inv.supplierId);
                return supplier && (
                    supplier.name.toLowerCase().includes(searchLower) ||
                    (supplier.code && supplier.code.toLowerCase().includes(searchLower))
                );
            });
        }

        // Sort: 0) Nouvelles factures (non sauvegardées) en tête, 1) Reste à payer > 0, 2) Pas synchronisées, 3) Autres par date décroissante
        // IMPORTANT : Toujours réappliquer le tri pour garantir l'ordre correct
        filtered = [...filtered].sort((a, b) => {
            // Nouvelles factures (non sauvegardées) toujours en tête
            // Une facture est "nouvelle" si elle n'est pas dans la base de données (allInvoices)
            const aIsNew = !savedInvoiceIds.has(a.id);
            const bIsNew = !savedInvoiceIds.has(b.id);
            if (aIsNew !== bIsNew) return aIsNew ? -1 : 1; // Nouvelles factures en premier
            
            // Si les deux sont nouvelles, garder l'ordre de création (plus récent en premier)
            if (aIsNew && bIsNew) {
                // Extraire le timestamp de l'ID si possible (new_1234567890 ou dup_1234567890)
                const aTimeMatch = a.id.match(/_(new|dup)_?(\d+)/);
                const bTimeMatch = b.id.match(/_(new|dup)_?(\d+)/);
                if (aTimeMatch && bTimeMatch) {
                    const aTime = parseInt(aTimeMatch[2] || '0');
                    const bTime = parseInt(bTimeMatch[2] || '0');
                    return bTime - aTime; // Plus récent en premier
                }
                // Sinon, utiliser la date de création ou l'ordre d'ajout
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA; // Plus récent en premier
            }

            // 1) Reste à payer > 0 (non soldées) en premier
            const aUnpaid = restToPay(a) > 0.01; // Tolérance pour les erreurs de précision flottante
            const bUnpaid = restToPay(b) > 0.01;
            if (aUnpaid !== bUnpaid) return aUnpaid ? -1 : 1; // Non soldées en premier

            // 2) Pas synchronisées ensuite
            const aSynced = !!a.syncTime;
            const bSynced = !!b.syncTime;
            if (aSynced !== bSynced) return aSynced ? 1 : -1; // Non synchronisées ensuite

            // 3) Puis par colonne choisie ou par date décroissante
            let comparison = 0;
            if (sortColumn) {
                switch (sortColumn) {
                    case "date":
                        // Comparer les dates de manière robuste
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        comparison = dateA - dateB;
                        break;
                    case "supplier":
                        const supplierA = suppliers.find(s => s.id === a.supplierId)?.name || "";
                        const supplierB = suppliers.find(s => s.id === b.supplierId)?.name || "";
                        comparison = supplierA.localeCompare(supplierB);
                        break;
                    case "number":
                        comparison = (a.number || "").localeCompare(b.number || "");
                        break;
                    case "total":
                        comparison = (a.totalTTC || 0) - (b.totalTTC || 0);
                        break;
                }
                return sortDirection === "asc" ? comparison : -comparison;
            }
            // Tri par défaut : date décroissante (plus récent en premier)
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA; // Décroissant : plus récent en premier
        });

        return filtered;
    }, [invoicesToFilter, dateFrom, dateTo, declaredFilter, supplierSearch, suppliers, sortColumn, sortDirection, savedInvoiceIds, restToPay]);

    // Pagination côté client sur la liste triée (pour que le tri global soit respecté)
    const totalFiltered = filteredInvoices.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const safePage = totalFiltered === 0 ? 0 : Math.min(page, totalPages - 1);
    const displayedInvoices = totalFiltered <= pageSize
        ? filteredInvoices
        : filteredInvoices.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const totalTTC = filteredInvoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (totalFiltered > 0 && safePage !== page && onPageChange) onPageChange(safePage);
    }, [totalFiltered, safePage, page, onPageChange]);
    const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

    const handleSort = (column: "date" | "supplier" | "number" | "total") => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("desc");
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input, textarea, or button
            const target = e.target as HTMLElement;
            const tagName = target.tagName;
            if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "BUTTON") {
                return;
            }

            if (filteredInvoices.length === 0) return;

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                
                const currentIndex = filteredInvoices.findIndex(inv => inv.id === selectedInvoiceId);
                let newIndex = currentIndex;

                if (currentIndex === -1) {
                    // No selection, start at first item
                    newIndex = 0;
                } else if (e.key === "ArrowDown") {
                    newIndex = Math.min(filteredInvoices.length - 1, currentIndex + 1);
                } else {
                    newIndex = Math.max(0, currentIndex - 1);
                }

                if (newIndex !== currentIndex && filteredInvoices[newIndex]) {
                    const newInvoice = filteredInvoices[newIndex];
                    onSelectInvoice(newInvoice);
                    const newPage = Math.floor(newIndex / pageSize);
                    if (onPageChange && newPage !== page) onPageChange(newPage);
                    setTimeout(() => {
                        const row = rowRefs.current.get(newInvoice.id);
                        if (row && tableContainerRef.current) {
                            row.scrollIntoView({ block: "center", behavior: "smooth" });
                        }
                    }, 0);
                }
            }

            if (e.key === "Enter" && selectedInvoiceId) {
                e.preventDefault();
                const invoice = filteredInvoices.find(inv => inv.id === selectedInvoiceId);
                if (invoice) {
                    onSelectInvoice(invoice);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredInvoices, selectedInvoiceId, onSelectInvoice, page, pageSize, onPageChange]);

    // Auto-scroll selected row into view - ensure it's always visible
    useEffect(() => {
        if (selectedInvoiceId && tableContainerRef.current) {
            const row = rowRefs.current.get(selectedInvoiceId);
            if (row && tableContainerRef.current) {
                const container = tableContainerRef.current;
                const rowRect = row.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Check if row is not fully visible
                const isAboveViewport = rowRect.top < containerRect.top;
                const isBelowViewport = rowRect.bottom > containerRect.bottom;
                
                if (isAboveViewport || isBelowViewport) {
                    // Scroll to center the row in the viewport
                    row.scrollIntoView({ block: "center", behavior: "smooth" });
                }
            }
        }
    }, [selectedInvoiceId]);

    // Si allInvoices n'est pas encore chargé, afficher un message
    if (allInvoices.length === 0 && invoices.length === 0) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#F6F8FC]">
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Chargement des factures...
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F6F8FC]">
            {/* Filters */}
            <div className="p-5 flex flex-col gap-4 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100">
                <div className="bg-white/60 backdrop-blur-sm p-1 rounded-xl flex gap-1 shadow-sm border border-slate-200/50">
                    {["TOUS", "FACTURES", "BROUILLONS"].map((label) => {
                        const isActive = declaredFilter === "Tous" ? label === "TOUS" : 
                                       declaredFilter === "Oui" ? label === "FACTURES" : 
                                       label === "BROUILLONS";
                        return (
                            <button
                                key={label}
                                onClick={() => {
                                    if (label === "TOUS") setDeclaredFilter("Tous");
                                    else if (label === "FACTURES") setDeclaredFilter("Oui");
                                    else setDeclaredFilter("Non");
                                }}
                                className={cn(
                                    "flex-1 py-1.5 rounded-md text-[12px] font-bold tracking-wide transition-all relative overflow-hidden mb-[1px]",
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
                            placeholder="Nom du fournisseur..."
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            className="w-full bg-white/80 backdrop-blur-sm border-2 border-[#1E293B] rounded-xl pl-9 pr-8 py-2 text-base font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E293B]/30 focus:border-[#1E293B] focus:bg-white transition-all shadow-sm placeholder:text-slate-400"
                        />
                        {supplierSearch && (
                            <button
                                onClick={() => setSupplierSearch("")}
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
                                           dateFilter === "Trimestre" ? label === "TRIMESTRE" :
                                           dateFilter === "Mois" ? label === "MOIS" :
                                           false;
                            return (
                                <button
                                    key={label}
                                    onClick={() => {
                                        if (label === "MOIS") {
                                            setDateFilter("Mois");
                                            const now = new Date();
                                            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                                            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                                            setDateFrom(start);
                                            setDateTo(end);
                                        } else if (label === "TRIMESTRE") {
                                            setDateFilter("Trimestre");
                                            const now = new Date();
                                            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
                                            const start = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0];
                                            const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0).toISOString().split('T')[0];
                                            setDateFrom(start);
                                            setDateTo(end);
                                        } else {
                                            setDateFilter("TOUT");
                                            setDateFrom("");
                                            setDateTo("");
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-md text-[12px] font-bold tracking-wide transition-all relative overflow-hidden",
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
                            <span className="text-[12px] font-black text-slate-500 uppercase">Du</span>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-[13px] font-bold text-blue-600 focus:outline-none focus:border-blue-400 focus:bg-blue-100 focus:text-blue-700"
                            />
                        </div>
                        <div className="flex-1 flex items-center gap-1.5">
                            <span className="text-[12px] font-black text-slate-500 uppercase">Au</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 text-[13px] font-bold text-blue-600 focus:outline-none focus:border-blue-400 focus:bg-blue-100 focus:text-blue-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Table */}
            <div ref={tableContainerRef} className="flex-1 overflow-auto">
                <table className="w-full text-base">
                    <thead className="bg-[#1E293B] border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="px-3 py-1.5 text-left border-r border-slate-200/60">
                                <button
                                    onClick={() => handleSort("date")}
                                    className="flex items-center gap-1 text-base font-bold text-white uppercase hover:text-blue-300"
                                >
                                    Date
                                    {sortColumn === "date" && (
                                        sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>
                            </th>
                            <th className="px-3 py-1.5 text-left border-r border-slate-200/60">
                                <button
                                    onClick={() => handleSort("supplier")}
                                    className="flex items-center gap-1 text-base font-bold text-white uppercase hover:text-blue-300"
                                >
                                    Fournisseur
                                    {sortColumn === "supplier" && (
                                        sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>
                            </th>
                            <th className="px-3 py-1.5 text-left border-r border-slate-200/60">
                                <button
                                    onClick={() => handleSort("number")}
                                    className="flex items-center gap-1 text-base font-bold text-white uppercase hover:text-blue-300"
                                >
                                    N° Facture
                                    {sortColumn === "number" && (
                                        sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>
                            </th>
                            <th className="px-3 py-1.5 text-right border-r border-slate-200/60">
                                <button
                                    onClick={() => handleSort("total")}
                                    className="flex items-center gap-1 text-base font-bold text-white uppercase hover:text-blue-300 ml-auto"
                                >
                                    Total TTC
                                    {sortColumn === "total" && (
                                        sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                    )}
                                </button>
                            </th>
                            <th className="px-3 py-1.5 text-center text-base font-bold text-white uppercase">
                                <div className="flex items-center justify-center gap-1">
                                    <span>D-S</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayedInvoices.map((invoice) => {
                            const supplier = suppliers.find(s => s.id === invoice.supplierId);
                            const isSelected = invoice.id === selectedInvoiceId;
                            const isDeclared = invoice.status === "Synced" || invoice.status === "Validated";
                            
                            // Recalculate balanceDue to ensure accuracy
                            const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                            const calculatedBalanceDue = (invoice.totalTTC || 0) - totalPaid;
                            // Use tolerance for floating point precision issues (consider < 0.01 as zero)
                            const hasBalanceDue = Math.abs(calculatedBalanceDue) > 0.01;
                            
                            return (
                                <tr
                                    key={invoice.id}
                                    ref={(el) => {
                                        if (el) {
                                            rowRefs.current.set(invoice.id, el);
                                        } else {
                                            rowRefs.current.delete(invoice.id);
                                        }
                                    }}
                                    onClick={() => onSelectInvoice(invoice)}
                                    className={cn(
                                        "cursor-pointer transition-colors",
                                        isSelected ? "bg-blue-100 border-2 border-[#1E293B]" : "hover:bg-slate-50"
                                    )}
                                >
                                    <td className="px-3 py-1.5 text-base font-medium text-slate-700 border-r border-slate-200">
                                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className={cn(
                                        "px-3 py-1.5 text-base border-r border-slate-200",
                                        hasBalanceDue ? "font-bold text-red-600" : "font-medium text-slate-700"
                                    )}>
                                        {supplier?.name || invoice.supplierId}
                                    </td>
                                    <td className="px-3 py-1.5 text-base font-medium text-slate-700 border-r border-slate-200">
                                        {invoice.number || "—"}
                                    </td>
                                    <td className="px-3 py-1.5 text-right text-base font-bold text-slate-900 border-r border-slate-200">
                                        {(invoice.totalTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                    </td>
                                    <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between gap-2 min-w-[4rem]">
                                            <div className="flex items-center shrink-0">
                                                {isDeclared ? (
                                                    <div className="w-3.5 h-3.5 bg-[#4CAF50] text-white rounded flex items-center justify-center shadow-sm" title="Déclarée">
                                                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleDeclared?.(invoice)}
                                                        className="w-3.5 h-3.5 rounded-md border-2 border-red-500 bg-transparent flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                                                        title="Brouillon — Cliquer pour passer en facture déclarée"
                                                    />
                                                )}
                                            </div>
                                            {invoice.syncTime ? (
                                                <div className="w-3.5 h-3.5 bg-[#1E293B] text-white rounded-full flex items-center justify-center shadow-sm shrink-0" title="Synchronisée">
                                                    <RefreshCw className="w-2.5 h-2.5 stroke-[2.5px]" />
                                                </div>
                                            ) : (
                                                <span className="w-3.5 h-3.5 shrink-0" />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-[#1E293B] border-t-2 border-slate-300 sticky bottom-0">
                        <tr>
                            <td colSpan={3} className="px-3 py-1.5 text-base font-bold text-white uppercase border-r border-slate-200/60">
                                Total
                            </td>
                            <td className="px-3 py-1.5 text-right text-base font-bold text-white border-r border-slate-200/60">
                                {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            {/* Pagination : masquée quand filtres actifs (on affiche toutes les factures correspondantes) */}
            {hasActiveFilter ? (
                <div className="p-4 border-t border-slate-200 bg-white text-center text-base text-slate-600">
                    {filteredInvoices.length} facture{filteredInvoices.length > 1 ? "s" : ""} correspondant aux critères
                </div>
            ) : totalFiltered > 0 && onPageChange ? (
                <div className="p-4 border-t border-slate-200 bg-white">
                    <Pagination
                        page={safePage}
                        pageSize={pageSize}
                        total={totalFiltered}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        onPageSizeChange={onPageSizeChange}
                    />
                </div>
            ) : null}
        </div>
    );
}
