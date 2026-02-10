"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { InvoiceEditor } from "@/components/achats/InvoiceEditor";
import { InvoiceSummary } from "@/components/achats/InvoiceSummary";
import { Invoice, Transaction, Article, Tier } from "@/lib/types";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, X, FileText, File, Calendar, RefreshCw, Copy, Files, Trash2, Check, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
    getInvoices,
    saveInvoice,
    deleteInvoice,
    getArticles,
    getTiers,
    syncInvoiceTransactions,
    updateArticlePivotPrices,
    ensureArticlesExist
} from "@/lib/data-service";

export function AchatsContent({
    initialInvoices,
    initialArticles,
    initialTiers
}: {
    initialInvoices: Invoice[],
    initialArticles: Article[],
    initialTiers: Tier[]
}) {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [tiers, setTiers] = useState<Tier[]>(initialTiers);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const queryClient = useQueryClient();

    // Filter suppliers from tiers (Extremely Robust filtering)
    const suppliers = useMemo(() => {
        const filtered = tiers.filter(t => {
            const typeLower = (t.type || "").trim().toLowerCase();
            return typeLower === "fournisseur" || typeLower === "fournisseurs" || typeLower === "frs";
        });

        console.log(`AchatsContent: Found ${filtered.length} suppliers in ${tiers.length} total tiers.`);
        if (tiers.length > 0 && filtered.length === 0) {
            console.warn("AchatsContent: NO SUPPLIERS FOUND. Checking first tier types:", tiers.slice(0, 3).map(t => `"${t.type}"`));
        }
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [tiers]);
    const sidebarListRef = useRef<HTMLDivElement>(null);

    // URL Params
    const searchParams = useSearchParams();

    // Runtime Data Load
    useEffect(() => {
        const loadData = async () => {
            try {
                const [invs, arts, ts] = await Promise.all([
                    getInvoices(),
                    getArticles(),
                    getTiers()
                ]);

                setTiers(ts);
                setInvoices(invs);
                await ensureArticlesExist();
                queryClient.invalidateQueries({ queryKey: ["articles"] });
                queryClient.invalidateQueries({ queryKey: ["subFamilies"] });
                const updatedArts = await getArticles();
                setArticles(updatedArts);
            } catch (error) {
                console.error("AchatsContent: Load Error:", error);
            }
        };

        loadData();
    }, []);

    // Initial Load Sync (Cleanup any "Synced" status)
    useEffect(() => {
        const hasSynced = invoices.some(inv => (inv as any).status === "Synced");
        if (hasSynced) {
            setInvoices(prev => prev.map(inv => (inv as any).status === "Synced" ? { ...inv, status: "Validated" } as Invoice : inv));
        }
    }, []); // Only run once on mount/data load

    // Handle External Actions (from Tiers)
    const handledActionRef = useRef<string | null>(null);
    useEffect(() => {
        const action = searchParams.get('action');
        const supplierName = searchParams.get('supplierName');
        const invoiceRef = searchParams.get('invoiceRef');
        const currentParams = searchParams.toString();

        if (currentParams === handledActionRef.current) return;
        handledActionRef.current = currentParams;

        if (action === 'new') {
            const newInv: Invoice = {
                id: `new_${Date.now()}`,
                supplierId: supplierName || "",
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
        } else if (invoiceRef) {
            const target = invoices.find(inv => inv.number === invoiceRef);
            if (target) {
                setSelectedInvoice(target);
            }
        }
    }, [searchParams, invoices]);


    // UI States
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<"TOUS" | "FACTURES" | "BROUILLONS">("TOUS");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"TOUT" | "MOIS" | "TRIMESTRE">("TOUT");

    // Custom Date Range
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

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
        const count = invoices.filter(inv => inv.supplierId.toLowerCase() === supplierName.toLowerCase()).length;
        const nextSeq = count + 1;
        return `BL-${code}-${nextSeq.toString().padStart(3, '0')}`;
    };

    // Handlers
    const handleSync = async (id: string | undefined) => {
        if (!id) return;
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;

        const now = new Date().toISOString();

        // 1. Update Invoices State locally
        const updatedInvoice = { ...inv, syncTime: now };
        const updatedInvoices = invoices.map(i => i.id === id ? updatedInvoice : i);
        setInvoices(updatedInvoices);
        if (selectedInvoice?.id === id) {
            setSelectedInvoice(updatedInvoice);
        }

        // 2. Persist Invoice
        await saveInvoice(updatedInvoice);

        // 3. Prepare Transactions
        const isDraft = inv.status !== "Validated";
        const supplierName = suppliers.find(s => s.id === inv.supplierId)?.name || inv.supplierId || 'Inconnu';

        const newTxs: Transaction[] = (inv.payments || []).map(p => {
            let account: "Banque" | "Caisse" | "Coffre" = "Coffre";
            if (!isDraft) {
                account = p.mode === "Espèces" ? "Caisse" : "Banque";
            }

            return {
                id: `t_sync_${id}_${p.id}`,
                date: p.date,
                label: `Achat: ${inv.number}`,
                amount: p.amount,
                type: "Depense",
                category: "Achat",
                account: account,
                invoiceId: id,
                tier: supplierName,
                pieceNumber: p.mode === "Chèques" ? (p.reference || inv.number) : inv.number,
                mode: p.mode,
                isReconciled: false
            };
        });

        // 4. Persist Transactions
        await syncInvoiceTransactions(id, newTxs);
    };

    const syncArticlePrices = async (currentInvoices: Invoice[], currentArticles: Article[]) => {
        if (currentInvoices.length === 0) return;

        const updates: { id: string, lastPivotPrice: number }[] = [];
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

            updates.push({ id: article.id, lastPivotPrice: pivotPrice });
            return { ...article, lastPivotPrice: pivotPrice };
        });

        if (updates.length > 0) {
            setArticles(updatedArticles);
            await updateArticlePivotPrices(updates);
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
            lines: idsEmpty ? [] : selectedInvoice.lines.map(l => ({
                ...l,
                id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

        console.log("Deleting invoice:", id);
        const originalInvoices = [...invoices];
        const newInvoices = invoices.filter(i => i.id !== id);
        setInvoices(newInvoices);

        try {
            const result = await deleteInvoice(id);
            if (!result.success) {
                console.error("Delete Invoice Failed");
                alert("Erreur lors de la suppression");
                setInvoices(originalInvoices); // Rollback
                return;
            }
            console.log("Invoice deleted successfully");
            syncArticlePrices(newInvoices, articles);
            if (selectedInvoice?.id === id) setSelectedInvoice(null);
        } catch (error) {
            console.error("HandleDelete Error:", error);
            alert("Erreur critique lors de la suppression");
            setInvoices(originalInvoices); // Rollback
        }
    };

    const handleUpdate = async (updatedInvoice: Invoice) => {
        const existing = invoices.find(i => i.id === updatedInvoice.id);
        let finalInvoice = updatedInvoice;

        if (existing?.syncTime) {
            finalInvoice = { ...updatedInvoice, syncTime: undefined };
            // Desync transactions
            await syncInvoiceTransactions(finalInvoice.id, []);
        }

        const newInvoices = invoices.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv);

        // Optimistic update
        setInvoices(newInvoices);
        if (selectedInvoice?.id === finalInvoice.id) {
            setSelectedInvoice(finalInvoice);
        }

        // Persist
        await saveInvoice(finalInvoice);
        syncArticlePrices(newInvoices, articles);
    };

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
            if (statusFilter === "FACTURES" && inv.status === "Draft") return false;
            if (statusFilter === "BROUILLONS" && inv.status !== "Draft") return false;
            if (supplierSearch) {
                const supplier = suppliers.find(s => s.id === inv.supplierId || s.code === inv.supplierId);
                const name = supplier ? supplier.name : inv.supplierId;
                if (!name.toLowerCase().includes(supplierSearch.toLowerCase())) return false;
            }
            const invDateStr = inv.date;
            if (dateRange.start && invDateStr < dateRange.start) return false;
            if (dateRange.end && invDateStr > dateRange.end) return false;
            return true;
        }).sort((a, b) => {
            // 1. Non-synchronized first
            const aSynced = !!a.syncTime;
            const bSynced = !!b.syncTime;
            if (aSynced !== bSynced) {
                return aSynced ? 1 : -1;
            }
            // 2. Then by date descending
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
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
            if (e.defaultPrevented) return;

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
            } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const filters: ("TOUS" | "FACTURES" | "BROUILLONS")[] = ["TOUS", "FACTURES", "BROUILLONS"];
                const currentIndex = filters.indexOf(statusFilter);
                let newIndex = currentIndex;

                if (e.key === "ArrowLeft") {
                    newIndex = Math.max(0, currentIndex - 1);
                } else {
                    newIndex = Math.min(filters.length - 1, currentIndex + 1);
                }

                if (newIndex !== currentIndex) {
                    e.preventDefault();
                    setStatusFilter(filters[newIndex]);
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
                <div className="w-[340px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC]">
                    <div className="h-24 min-h-[96px] shrink-0 flex flex-col items-center justify-center border-b border-slate-200 bg-white shadow-[0_1px_10px_rgba(0,0,0,0.03)] z-10 relative">
                        <h2 className="text-2xl font-extrabold text-slate-800 font-outfit tracking-tight">Factures achats</h2>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Suivi & Paiements</span>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col gap-4 bg-[#1E293B]">
                        <div className="bg-[#0F172A] p-1 rounded-xl flex gap-1 shadow-inner border border-white/5">
                            {["TOUS", "FACTURES", "BROUILLONS"].map((label) => {
                                const isActive = statusFilter === label;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setStatusFilter(label as any)}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden mb-[1px]",
                                            isActive
                                                ? "bg-[#1E293B] text-blue-400 shadow-md border border-white/5"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
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
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm font-medium text-white focus:outline-none focus:border-[#E5D1BD] transition-all shadow-inner placeholder:text-slate-500"
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
                            <div className="bg-[#0F172A] p-1 rounded-xl flex gap-1 shadow-inner border border-white/5">
                                {["TOUT", "TRIMESTRE", "MOIS"].map((label) => {
                                    const isActive = periodFilter === label;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => setPeriod(label as any)}
                                            className={cn(
                                                "flex-1 py-1.5 rounded-md text-[10px] font-bold tracking-wide transition-all relative overflow-hidden",
                                                isActive
                                                    ? "bg-[#1E293B] text-blue-400 shadow-md border border-white/5"
                                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="bg-[#0F172A] p-2 rounded-xl flex items-center gap-1.5 border border-white/5 shadow-inner">
                                <div className="flex-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Du</span>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => {
                                            setDateRange(prev => ({ ...prev, start: e.target.value }));
                                            setPeriodFilter("" as any);
                                        }}
                                        className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-[#E5D1BD] focus:text-white"
                                    />
                                </div>
                                <div className="flex-1 flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Au</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => {
                                            setDateRange(prev => ({ ...prev, end: e.target.value }));
                                            setPeriodFilter("" as any);
                                        }}
                                        className="flex-1 bg-transparent border border-white/10 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-[#E5D1BD] focus:text-white"
                                    />
                                </div>
                                {(dateRange.start || dateRange.end) && (
                                    <button
                                        onClick={() => setPeriod("TOUT")}
                                        className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-slate-500 hover:text-red-400 transition-all shrink-0"
                                        title="Réinitialiser"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

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
                                        isSelected ? "bg-[#E3F2FD] z-10" : "bg-white hover:bg-slate-50 z-0"
                                    )}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1E293B]" />}
                                    {isValidated && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#4CAF50]" />}

                                    <div className={cn("relative z-10 flex flex-col h-full justify-center gap-1 transition-transform duration-200", isSelected ? "translate-x-[6px]" : "")}>
                                        <div className="flex justify-between items-end w-full">
                                            <span className={cn("text-xs font-bold font-outfit tracking-wide mb-0.5", isSelected ? "text-slate-600" : "text-slate-400")}>
                                                {new Date(inv.date).toLocaleDateString('fr-FR')}
                                            </span>
                                            <div className="flex flex-col items-end gap-0.5">
                                                {isValidated && (
                                                    <div className="w-3.5 h-3.5 bg-[#4CAF50] text-white rounded flex items-center justify-center shadow-sm scale-75 origin-right" title="Validée">
                                                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                    </div>
                                                )}
                                                <span className={cn("text-[13px] font-extrabold leading-none", isSelected ? "text-slate-900" : "text-slate-600")}>
                                                    {inv.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] font-bold opacity-70">Dh</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end w-full">
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <h3 className={cn("text-sm font-black uppercase tracking-tight truncate pr-2 leading-none mb-0.5", isSelected ? "text-slate-800" : "text-slate-700")}>
                                                    {(() => {
                                                        const s = tiers.find(t => t.id === inv.supplierId || t.code === inv.supplierId);
                                                        return s ? s.name : (inv.supplierId || "Fournisseur");
                                                    })()}
                                                </h3>
                                                {!inv.syncTime && (
                                                    <div className="h-0.5 w-8 bg-orange-500 rounded-full mt-0.5 shadow-sm shadow-orange-500/20" />
                                                )}
                                            </div>
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

                <div className="flex-1 bg-white h-full relative z-10 flex flex-col">
                    <div className="h-24 border-b border-white/10 bg-[#1E293B] shrink-0 shadow-md z-20 px-4 flex items-center justify-between gap-4">
                        <div className="flex w-[40%] h-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                            <button
                                onClick={() => { handleCreateNew(); setActiveAction('new'); setTimeout(() => setActiveAction(null), 2000); }}
                                className="flex-1 flex items-center justify-center gap-3 hover:bg-white/5 transition-all group border-r border-white/5 active:bg-white/10"
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                                    activeAction === 'new' ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                                )}>
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === 'new' ? "text-orange-400" : "text-white")}>Nouvelle</span>
                            </button>
                            <button
                                onClick={() => { if (selectedInvoice) { handleDuplicate(true); setActiveAction('empty'); setTimeout(() => setActiveAction(null), 2000); } }}
                                disabled={!selectedInvoice}
                                className="flex-1 flex items-center justify-center gap-3 hover:bg-white/5 transition-all group border-r border-white/5 active:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                                    activeAction === 'empty' ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                                )}>
                                    <File className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === 'empty' ? "text-orange-400" : "text-white")}>Vide</span>
                            </button>
                            <button
                                onClick={() => { if (selectedInvoice) { handleDuplicate(false); setActiveAction('full'); setTimeout(() => setActiveAction(null), 2000); } }}
                                disabled={!selectedInvoice}
                                className="flex-1 flex items-center justify-center gap-3 hover:bg-white/5 transition-all group active:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                                    activeAction === 'full' ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                                )}>
                                    <Copy className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === 'full' ? "text-orange-400" : "text-white")}>Pleine</span>
                            </button>
                        </div>

                        <div className="flex w-[12%] h-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                            <button onClick={() => setIsSummaryOpen(true)} className="flex-1 flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest active:bg-white/20">
                                <Files className="w-5 h-5 text-blue-300" />
                                <span className="hidden xl:inline">Résumé</span>
                            </button>
                        </div>

                        {selectedInvoice && (
                            <button
                                onClick={() => handleDelete(selectedInvoice.id)}
                                className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all shadow-md group"
                                title="Supprimer la facture"
                            >
                                <Trash2 className="w-7 h-7 stroke-[2.5px] group-hover:rotate-12 transition-transform" />
                            </button>
                        )}

                        {selectedInvoice && (
                            <div className="flex items-center gap-2">
                                <div className="bg-white/5 backdrop-blur-md px-2 py-1 h-16 rounded-2xl flex items-center border border-white/10 shadow-sm">
                                    <div className="flex flex-col px-4 border-r border-white/10 transition-colors rounded-l-lg group justify-center h-full">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-none mb-1">État Synchro</span>
                                        <span className={cn(
                                            "text-lg font-black leading-none",
                                            selectedInvoice.syncTime ? "text-green-400" : "text-orange-400"
                                        )}>
                                            {selectedInvoice.syncTime ? "Synchronisé" : "Prêt"}
                                        </span>
                                    </div>

                                    <div className="flex flex-col px-4 transition-colors rounded-r-lg group justify-center h-full min-w-[140px]">
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider leading-none mb-1">Dernier Envoi</span>
                                        {selectedInvoice.syncTime ? (
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-black text-white">{new Date(selectedInvoice.syncTime).toLocaleDateString('fr-FR')}</span>
                                                <span className="text-[11px] font-bold text-white/40 mt-0.5">{new Date(selectedInvoice.syncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm font-bold text-white/20">--/-- --:--</span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSync(selectedInvoice.id)}
                                    className={cn(
                                        "h-16 w-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer",
                                        selectedInvoice.syncTime ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                                    )}
                                    title="Synchroniser la facture"
                                >
                                    {selectedInvoice.syncTime ? <CloudUpload className="w-7 h-7 stroke-[2.5px]" /> : <RefreshCw className="w-7 h-7 stroke-[2.5px]" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedInvoice ? (
                        <div className="flex-1 overflow-hidden">
                            <InvoiceEditor
                                invoice={selectedInvoice}
                                onSave={() => { }}
                                onDelete={handleDelete}
                                onSync={handleSync}
                                onUpdate={handleUpdate}
                                onCreateNew={handleCreateNew}
                                onDuplicate={handleDuplicate}
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
            <InvoiceSummary
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                invoices={invoices}
                onSync={handleSync}
            />
        </div>
    );
}
