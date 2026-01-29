"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { InvoiceEditor } from "@/components/achats/InvoiceEditor";
import { Invoice, Transaction, Article, Tier } from "@/lib/types";
import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, X, FileText, File, Calendar, RefreshCw, Copy, Files, Trash2, Check, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

// Initial empty states
const initialInvoices: Invoice[] = [];
const initialArticles: Article[] = [];
const initialTiers: Tier[] = [];

function AchatsContent() {
    const [invoices, setInvoices, isLoaded] = usePersistedState<Invoice[]>("bakery_invoices", initialInvoices);
    const [articles, setArticles] = usePersistedState<Article[]>("bakery_articles", initialArticles);
    const [tiers] = usePersistedState<Tier[]>("bakery_tiers", initialTiers);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Filter suppliers from tiers
    const suppliers = useMemo(() => tiers.filter(t => t.type === "Fournisseur"), [tiers]);
    const sidebarListRef = useRef<HTMLDivElement>(null);


    // URL Params
    const searchParams = useSearchParams();

    // Migration and Initial Load Sync
    useEffect(() => {
        if (isLoaded) {
            const hasSynced = invoices.some(inv => (inv as any).status === "Synced");
            if (hasSynced) {
                setInvoices(prev => prev.map(inv => (inv as any).status === "Synced" ? { ...inv, status: "Validated" } : inv));
            }
        }
    }, [isLoaded, invoices, setInvoices]);

    // Handle External Actions (from Tiers)
    useEffect(() => {
        if (!isLoaded) return;

        const action = searchParams.get('action');
        const supplierName = searchParams.get('supplierName');
        const invoiceRef = searchParams.get('invoiceRef');

        if (action === 'new') {
            // Create new invoice for supplier
            const newInv: Invoice = {
                id: `new_${Date.now()}`,
                supplierId: supplierName || "",
                number: `DRAFT-${Date.now().toString().slice(-4)}`,
                date: new Date().toISOString().split('T')[0], // Today
                status: "Draft",
                lines: [],
                payments: [],
                totalHT: 0,
                totalTTC: 0,
                rounding: 0,
                deposit: 0,
                balanceDue: 0
            };
            setInvoices(prev => [newInv, ...prev]);
            setSelectedInvoice(newInv);

            // Clear params to avoid loop (optional, but good UX)
            // window.history.replaceState({}, '', '/achats'); 
        } else if (invoiceRef) {
            // Find and select invoice by ref (number)
            const target = invoices.find(inv => inv.number === invoiceRef);
            if (target) {
                setSelectedInvoice(target);
            }
        }
    }, [isLoaded, searchParams]);


    // Filters
    const [statusFilter, setStatusFilter] = useState<"TOUS" | "FACTURES" | "BROUILLONS">("TOUS");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"TOUT" | "MOIS" | "TRIMESTRE">("MOIS");

    // Custom Date Range
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
        const now = new Date();
        const start = new Date(new Date().setDate(now.getDate() - 30)).toISOString().split('T')[0];
        const end = now.toISOString().split('T')[0];
        return { start, end };
    });

    const setPeriod = (period: "TOUT" | "MOIS" | "TRIMESTRE") => {
        setPeriodFilter(period);
        const now = new Date();
        const end = now.toISOString().split('T')[0];

        if (period === "TOUT") {
            setDateRange({ start: "", end: "" });
        } else if (period === "MOIS") {
            const start = new Date(new Date().setDate(now.getDate() - 30)).toISOString().split('T')[0];
            setDateRange({ start, end });
        } else if (period === "TRIMESTRE") {
            const start = new Date(new Date().setDate(now.getDate() - 90)).toISOString().split('T')[0];
            setDateRange({ start, end });
        }
    };

    // Generator
    const generateInvoiceNumber = (supplierName: string) => {
        const supplier = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
        const code = supplier ? supplier.code : supplierName.substring(0, 3).toUpperCase();

        // Count invoices with this supplier to increment
        const count = invoices.filter(inv => inv.supplierId.toLowerCase() === supplierName.toLowerCase()).length;
        // Simple increment logic for demo (in real app, check max number)
        const nextSeq = count + 1;
        return `BL-${code}-${nextSeq.toString().padStart(3, '0')}`;
    };

    // Handlers
    const handleSync = (id: string) => {
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;

        const now = new Date().toISOString();

        // 1. Update Invoices
        const updatedInvoices = invoices.map(i => i.id === id ? { ...i, syncTime: now } : i);
        setInvoices(updatedInvoices);
        if (selectedInvoice?.id === id) {
            setSelectedInvoice({ ...inv, syncTime: now });
        }

        // 2. Update Finance Transactions
        const financeKey = 'finance_transactions';
        const rawFinance = localStorage.getItem(financeKey);
        let transactions: Transaction[] = [];
        if (rawFinance) {
            try {
                transactions = JSON.parse(rawFinance);
            } catch (e) {
                console.error("Failed to parse finance transactions", e);
            }
        }

        // Overwrite: remove existing transactions for this invoice
        let filteredTxs = transactions.filter(t => t.invoiceId !== id);

        // Add new transactions from payments
        const isDraft = inv.status !== "Validated";
        const newTxs: Transaction[] = (inv.payments || []).map(p => {
            let account: "Banque" | "Caisse" | "Coffre" = "Coffre";

            if (!isDraft) {
                account = p.mode === "Espèces" ? "Caisse" : "Banque";
            }

            return {
                id: `t_sync_${id}_${p.id}`,
                date: p.date,
                label: `Achat: ${inv.supplierId || 'Inconnu'} (${inv.number})`,
                amount: p.amount,
                type: "Depense",
                category: "Achat",
                account: account,
                invoiceId: id,
                tier: inv.supplierId,
                pieceNumber: inv.number,
                isReconciled: false
            };
        });

        const finalTxs = [...newTxs, ...filteredTxs];
        localStorage.setItem(financeKey, JSON.stringify(finalTxs));
    };

    const syncArticlePrices = (currentInvoices: Invoice[], currentArticles: Article[]) => {
        if (currentInvoices.length === 0) return;

        const updatedArticles = currentArticles.map(article => {
            const articlePurchaseLines: { date: string; priceHT: number }[] = [];
            currentInvoices.forEach(inv => {
                inv.lines.forEach(line => {
                    if (line.articleId === article.id || (line.articleName === article.name && !line.articleId)) {
                        articlePurchaseLines.push({ date: inv.date, priceHT: line.priceHT });
                    }
                });
            });

            if (articlePurchaseLines.length === 0) return article;

            articlePurchaseLines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latest = articlePurchaseLines[0];
            const pivotPrice = latest.priceHT / (article.contenace || 1);

            if (article.lastPivotPrice === pivotPrice) return article;

            return { ...article, lastPivotPrice: pivotPrice };
        });

        // Only update if something changed
        const hasChanges = updatedArticles.some((a, i) => a.lastPivotPrice !== currentArticles[i].lastPivotPrice);
        if (hasChanges) {
            setArticles(updatedArticles);
        }
    };

    const handleCreateNew = () => {
        const newInv: Invoice = {
            id: `new_${Date.now()}`,
            supplierId: "",
            number: `DRAFT-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString().split('T')[0],
            status: "Draft",
            lines: [],
            payments: [],
            totalHT: 0,
            totalTTC: 0,
            rounding: 0,
            deposit: 0,
            balanceDue: 0
        };
        setInvoices(prev => [newInv, ...prev]);
        setSelectedInvoice(newInv);
    };

    const handleDuplicate = (idsEmpty: boolean) => {
        if (!selectedInvoice) return;

        const newInv: Invoice = {
            ...selectedInvoice,
            id: `dup_${Date.now()}`,
            number: `DRAFT-DUP-${Date.now().toString().slice(-4)}`,
            date: new Date().toISOString().split('T')[0],
            status: "Draft",
            // If empty requested, clear lines. If full, keep lines but reset quantities to 0.
            lines: idsEmpty ? [] : selectedInvoice.lines.map(l => ({
                ...l,
                id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // New IDs for lines
                quantity: 0,
                totalTTC: 0
            })),
            totalHT: 0,
            totalTTC: 0,
            deposit: 0,
            balanceDue: 0,
            payments: [],
            syncTime: undefined
        };

        setInvoices(prev => [newInv, ...prev]);
        setSelectedInvoice(newInv);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
        const newInvoices = invoices.filter(i => i.id !== id);
        setInvoices(newInvoices);
        syncArticlePrices(newInvoices, articles);
        if (selectedInvoice?.id === id) setSelectedInvoice(null);
    };

    const handleUpdate = (updatedInvoice: Invoice) => {
        // Desynchronization logic: if a synced invoice is modified, we clear syncTime and remove finance transactions
        const existing = invoices.find(i => i.id === updatedInvoice.id);
        let finalInvoice = updatedInvoice;

        if (existing?.syncTime) {
            // Check if it's a real change (simplistic check: compare stringified versions of relevant data)
            // For now, assume any update call from Editor means modification
            finalInvoice = { ...updatedInvoice, syncTime: undefined };

            // Remove from finance
            const financeKey = 'finance_transactions';
            const rawFinance = localStorage.getItem(financeKey);
            if (rawFinance) {
                try {
                    const transactions: Transaction[] = JSON.parse(rawFinance);
                    const filtered = transactions.filter(t => t.invoiceId !== updatedInvoice.id);
                    localStorage.setItem(financeKey, JSON.stringify(filtered));
                } catch (e) {
                    console.error("Failed to update finance on desync", e);
                }
            }
        }

        const newInvoices = invoices.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv);
        setInvoices(newInvoices);
        syncArticlePrices(newInvoices, articles);
        if (selectedInvoice?.id === finalInvoice.id) {
            setSelectedInvoice(finalInvoice);
        }
    };

    const resetDateRange = () => setDateRange({ start: "", end: "" });

    const handleExitEdit = () => {
        if (!selectedInvoice || !sidebarListRef.current) return;
        const index = filteredInvoices.findIndex(inv => inv.id === selectedInvoice.id);
        if (index >= 0) {
            const el = sidebarListRef.current.children[index] as HTMLElement;
            el?.focus();
        }
    };

    // Filter Logic
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            // 1. Status
            if (statusFilter === "FACTURES" && inv.status === "Draft") return false;
            if (statusFilter === "BROUILLONS" && inv.status !== "Draft") return false;

            // 2. Supplier Search
            if (supplierSearch) {
                if (!inv.supplierId.toLowerCase().includes(supplierSearch.toLowerCase())) return false;
            }

            // 3. Date Filter
            const invDateStr = inv.date; // Already YYYY-MM-DD
            if (dateRange.start && invDateStr < dateRange.start) return false;
            if (dateRange.end && invDateStr > dateRange.end) return false;

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [invoices, statusFilter, supplierSearch, periodFilter, dateRange]);

    // Auto-select
    useEffect(() => {
        if (!selectedInvoice && filteredInvoices.length > 0) {
            setSelectedInvoice(filteredInvoices[0]);
        }
    }, [filteredInvoices, selectedInvoice]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
                return;
            }

            if (filteredInvoices.length === 0) return;

            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const currentIndex = filteredInvoices.findIndex(inv => inv.id === selectedInvoice?.id);

                if (currentIndex === -1) {
                    if (filteredInvoices.length > 0) setSelectedInvoice(filteredInvoices[0]);
                    return;
                }

                let newIndex = currentIndex;
                if (e.key === "ArrowUp") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(filteredInvoices.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    setSelectedInvoice(filteredInvoices[newIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [filteredInvoices, selectedInvoice]);

    // Auto-scroll sidebar logic
    useEffect(() => {
        if (selectedInvoice && sidebarListRef.current) {
            const index = filteredInvoices.findIndex(inv => inv.id === selectedInvoice.id);
            if (index >= 0) {
                const el = sidebarListRef.current.children[index] as HTMLElement;
                el?.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedInvoice, filteredInvoices]);

    return (
        <div className="flex h-screen bg-[#F6F8FC] overflow-hidden">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen flex">

                {/* LEFT COLUMN: List & Filters */}
                <div className="w-[340px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC]">

                    {/* Header Zone */}
                    <div className="p-5 pb-2 flex flex-col gap-4">
                        {/* Title */}
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-800 font-outfit tracking-tight">Factures Achat</h2>
                            <p className="text-slate-400 text-sm font-light">Suivi & Paiements</p>
                        </div>

                        {/* Status Tabs */}
                        <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                            {["TOUS", "FACTURES", "BROUILLONS"].map((label) => {
                                const isActive = statusFilter === label;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setStatusFilter(label as any)}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden mb-[1px]",
                                            isActive
                                                ? "bg-[#E5D1BD] text-[#5D4037] shadow-md"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Supplier Search */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    placeholder="Nom du fournisseur..."
                                    value={supplierSearch}
                                    onChange={(e) => setSupplierSearch(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300"
                                />
                                {supplierSearch && (
                                    <button
                                        onClick={() => setSupplierSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleCreateNew}
                                className="w-9 h-9 bg-[#E5D1BD] rounded-full flex items-center justify-center text-[#5D4037] shadow-lg hover:bg-[#D7CCC8] hover:scale-105 transition-all shrink-0"
                                title="Nouvelle Facture"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            {selectedInvoice && (
                                <button
                                    onClick={() => handleDelete(selectedInvoice.id)}
                                    className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-red-500 shadow-md hover:bg-red-50 hover:border-red-200 hover:scale-105 transition-all shrink-0"
                                    title="Supprimer la sélection"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Date Filtering Zone */}
                        <div className="flex flex-col gap-2">
                            {/* Line 1: Quick Filters */}
                            <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                                {["TOUT", "TRIMESTRE", "MOIS"].map((label) => {
                                    const isActive = periodFilter === label;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => setPeriod(label as any)}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden",
                                                isActive
                                                    ? "bg-[#E5D1BD] text-[#5D4037] shadow-md"
                                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Line 2: Manual Inputs (Single Line) */}
                            <div className="bg-white/40 p-2 rounded-xl flex items-center gap-1.5 border border-white/60 shadow-inner">
                                <div className="flex-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Du</span>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => {
                                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                                            setPeriodFilter("" as any);
                                        }}
                                        className="flex-1 bg-white border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-black text-slate-800 focus:outline-none focus:border-[#E5D1BD]"
                                    />
                                </div>
                                <div className="flex-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Au</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => {
                                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                                            setPeriodFilter("" as any);
                                        }}
                                        className="flex-1 bg-white border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-black text-slate-800 focus:outline-none focus:border-[#E5D1BD]"
                                    />
                                </div>
                                {(dateRange.start || dateRange.end) && (
                                    <button
                                        onClick={() => setPeriod("TOUT")}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-100 rounded-lg text-slate-300 hover:text-red-500 transition-all shrink-0"
                                        title="Réinitialiser"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Invoices List */}
                    <div ref={sidebarListRef} className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200 bg-white">
                        {filteredInvoices.map(inv => {
                            const isSelected = selectedInvoice?.id === inv.id;
                            const isValidated = inv.status === "Validated";

                            return (
                                <div
                                    key={inv.id}
                                    tabIndex={0}
                                    onClick={() => setSelectedInvoice(inv)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelectedInvoice(inv);
                                        }
                                    }}
                                    className={cn(
                                        "relative w-full rounded-none px-5 py-3 transition-all duration-200 cursor-pointer group overflow-hidden border-b border-slate-100 min-h-[76px] flex flex-col justify-center outline-none focus:bg-slate-100",
                                        isSelected
                                            ? "bg-[#E5D1BD] z-10"
                                            : "bg-[#FAF7F2] hover:bg-slate-50 z-0"
                                    )}
                                >
                                    {/* Selection Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#5D4037]/20" />
                                    )}

                                    {/* Validated Decoration */}
                                    {isValidated && (
                                        <>
                                            {/* Green Cloud Blob */}
                                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#E8F5E9] rounded-full blur-[20px] opacity-70 pointer-events-none" />
                                            <div className="absolute top-0 right-0 w-10 h-10 bg-[#E8F5E9] rounded-bl-[24px] pointer-events-none" />

                                            {/* Green Point/Badge */}
                                            <div className="absolute top-2.5 right-2.5">
                                                <div className="w-2 h-2 bg-[#00C853] rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.5)]" />
                                            </div>
                                        </>
                                    )}

                                    <div className={cn("relative z-10 flex flex-col h-full justify-center gap-1", isSelected ? "pl-2" : "")}>
                                        {/* Row 1: Date & Total */}
                                        <div className="flex justify-between items-center w-full">
                                            <span className={cn(
                                                "text-xs font-bold font-outfit tracking-wide",
                                                isSelected ? "text-[#5D4037]/70" : "text-[#B0BEC5]"
                                            )}>
                                                {new Date(inv.date).toLocaleDateString('fr-FR')}
                                            </span>
                                            <span className={cn(
                                                "text-[13px] font-extrabold",
                                                isSelected ? "text-[#3E2723]" : "text-[#8D6E63]"
                                            )}>
                                                {inv.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] font-bold opacity-70">Dh</span>
                                            </span>
                                        </div>

                                        {/* Row 2: Supplier & Balance (Aligned Bottom) */}
                                        <div className="flex justify-between items-end w-full">
                                            <h3 className={cn(
                                                "text-sm font-black uppercase tracking-tight truncate pr-2 leading-none mb-0.5",
                                                isSelected ? "text-[#3E2723]" : "text-[#263238]"
                                            )}>
                                                {inv.supplierId || "Fournisseur"}
                                            </h3>

                                            {/* Calculated Balance on the fly */}
                                            {(() => {
                                                const totalPaid = (inv.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                                                const activeBalance = inv.totalTTC - totalPaid;

                                                if (activeBalance > 0.05) {
                                                    return (
                                                        <span className="text-[11px] font-black text-red-500/90 leading-none shrink-0 mb-0.5">
                                                            {activeBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredInvoices.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                                <Search className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">Aucune facture</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Stats */}
                    <div className="shrink-0 h-16 bg-white border-t border-[#bca382]/30 px-6 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-[#B0BEC5] uppercase tracking-wider">Nombre</span>
                            <span className="text-sm font-black text-[#546E7A]">
                                {filteredInvoices.length} <span className="text-[10px] font-bold opacity-60">factures</span>
                            </span>
                        </div>

                        <div className="flex flex-col items-end justify-center">
                            <span className="text-[10px] font-bold text-[#B0BEC5] uppercase tracking-wider">Total TTC</span>
                            <span className="text-base font-black text-[#3E2723]">
                                {filteredInvoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-[10px] font-bold opacity-60 ml-0.5">Dh</span>
                            </span>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: Editor */}
                <div className="flex-1 bg-white h-full relative z-10 flex flex-col">
                    {/* TOP TOOLBAR - Midnight Blue Band with Actions & Sync */}
                    <div className="h-24 border-b border-white/10 bg-[#1E293B] shrink-0 shadow-md z-20 px-4 flex items-center justify-between gap-4">
                        {/* 1. Shrunken Action Buttons (40% width) */}
                        <div className="flex w-[40%] h-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                            <button
                                onClick={handleCreateNew}
                                className="flex-1 flex items-center justify-center text-blue-400 hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest border-r border-white/10 active:bg-white/20"
                            >
                                F. Nouvelle
                            </button>
                            <button
                                onClick={() => selectedInvoice && handleDuplicate(true)}
                                disabled={!selectedInvoice}
                                className="flex-1 flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest border-r border-white/10 active:bg-white/20 disabled:opacity-20 disabled:hover:bg-transparent"
                            >
                                F. Vide
                            </button>
                            <button
                                onClick={() => selectedInvoice && handleDuplicate(false)}
                                disabled={!selectedInvoice}
                                className="flex-1 flex items-center justify-center text-white hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest active:bg-white/20 disabled:opacity-20 disabled:hover:bg-transparent"
                            >
                                F. Pleine
                            </button>
                        </div>

                        {/* 2. NEW Delete Button (Red Glass Style) */}
                        {selectedInvoice && (
                            <button
                                onClick={() => handleDelete(selectedInvoice.id)}
                                className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all shadow-md group"
                                title="Supprimer la facture"
                            >
                                <Trash2 className="w-7 h-7 stroke-[2.5px] group-hover:rotate-12 transition-transform" />
                            </button>
                        )}

                        {/* 2. Synchronization Info (Moved from Editor) */}
                        {selectedInvoice && (
                            <div className="flex items-center gap-2">
                                <div className="bg-white/5 backdrop-blur-md px-2 py-1 h-16 rounded-2xl flex items-center border border-white/10 shadow-sm">
                                    {/* State: Prêt / Synchronisé */}
                                    <div className="flex flex-col px-4 border-r border-white/10 transition-colors rounded-l-lg group justify-center h-full">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-none mb-1">État Synchro</span>
                                        <span className={cn(
                                            "text-lg font-black leading-none",
                                            (selectedInvoice.status === "Synced" || selectedInvoice.syncTime) ? "text-green-400" : "text-orange-400"
                                        )}>
                                            {(selectedInvoice.status === "Synced" || selectedInvoice.syncTime) ? "Synchronisé" : "Prêt"}
                                        </span>
                                    </div>

                                    {/* Last Send Time */}
                                    <div className="flex flex-col px-4 transition-colors rounded-r-lg group justify-center h-full min-w-[140px]">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-none mb-1">Dernier Envoi</span>
                                        {selectedInvoice.syncTime ? (
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-black text-white">{new Date(selectedInvoice.syncTime).toLocaleDateString('fr-FR')}</span>
                                                <span className="text-[11px] font-bold text-white/40 mt-0.5">
                                                    {new Date(selectedInvoice.syncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-white/20">--/-- --:--</span>
                                        )}
                                    </div>
                                </div>

                                {/* Icon Pill (Static) */}
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm",
                                    (selectedInvoice.status === "Synced" || selectedInvoice.syncTime)
                                        ? "bg-green-500/10 border-green-500/20 text-green-400"
                                        : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                )}>
                                    {(selectedInvoice.status === "Synced" || selectedInvoice.syncTime) ? (
                                        <CloudUpload className="w-7 h-7 stroke-[2.5px]" />
                                    ) : (
                                        <RefreshCw className="w-7 h-7 stroke-[2.5px]" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedInvoice ? (
                        <div className="flex-1 overflow-hidden">
                            <InvoiceEditor
                                invoice={selectedInvoice}
                                onSave={(inv) => console.log("Save layout placeholder", inv)}
                                onDelete={() => { }}
                                onSync={handleSync}
                                onUpdate={handleUpdate}
                                onCreateNew={handleCreateNew}
                                onDuplicate={handleDuplicate}
                                suppliers={suppliers}
                                articles={articles}
                                onGenerateNumber={generateInvoiceNumber}
                                onExit={handleExitEdit}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white/50">
                            <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center shadow-sm">
                                <FileText className="w-10 h-10 opacity-20" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-300">Aucune sélection</h3>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

export default function AchatsPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <AchatsContent />
        </Suspense>
    );
}
