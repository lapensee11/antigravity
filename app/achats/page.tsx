"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { InvoiceEditor } from "@/components/achats/InvoiceEditor";
import { Invoice, Transaction } from "@/lib/types";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, X, FileText, File, Calendar, RefreshCw, Copy, Files, Trash2, Check, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const initialInvoices: Invoice[] = [
    {
        id: "inv1",
        supplierId: "Grands Moulins du Maghreb",
        number: "FC-2024-001",
        date: "2024-01-24", // Current
        status: "Validated",
        syncTime: "10:30",
        lines: [],
        payments: [],
        totalHT: 5400,
        totalTTC: 6480,
        rounding: 0,
        deposit: 0,
        balanceDue: 0
    },
    {
        id: "inv2",
        supplierId: "Centrale Danone",
        number: "FC-2024-002",
        date: "2024-01-20",
        status: "Draft",
        lines: [],
        payments: [],
        totalHT: 0,
        totalTTC: 0,
        rounding: 0,
        deposit: 0,
        balanceDue: 0
    },
    {
        id: "inv3",
        supplierId: "Coca-Cola Maroc",
        number: "FC-2023-128",
        date: "2023-12-15", // Last month
        status: "Validated",
        lines: [],
        payments: [],
        totalHT: 3000,
        totalTTC: 3600,
        rounding: 0,
        deposit: 3600,
        balanceDue: 0
    }
];

const mockSuppliers = [
    { id: "1", name: "Grands Moulins du Maghreb", code: "Frs01" },
    { id: "2", name: "Centrale Danone", code: "Frs02" },
    { id: "3", name: "Coca-Cola Maroc", code: "Frs03" },
    { id: "4", name: "Ferme Atlas", code: "Frs04" },
    { id: "5", name: "Boulangerie Patisserie", code: "Frs05" }
];

const mockArticles: any[] = [
    { id: "a1", name: "Farine T55", code: "FA55", unitAchat: "Kg", vatRate: 0, subFamilyId: "sf1" },
    { id: "a2", name: "Sucre Semoule", code: "SUC", unitAchat: "Kg", vatRate: 20, subFamilyId: "sf2" },
    { id: "a3", name: "Beurre Doux", code: "BEU", unitAchat: "Kg", vatRate: 14, subFamilyId: "sf2" },
    { id: "a4", name: "Oeufs Calibre A", code: "OEU", unitAchat: "Plateau", vatRate: 0, subFamilyId: "sf2" },
    { id: "a5", name: "Levure Boulangère", code: "LEV", unitAchat: "Kg", vatRate: 0, subFamilyId: "sf2" },
    { id: "a6", name: "Emballage Croissant", code: "EMB", unitAchat: "Carton", vatRate: 20, subFamilyId: "sf3" },
];

function AchatsContent() {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);


    // URL Params
    const searchParams = useSearchParams();

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem('bakery_invoices');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                const migrated = loaded.map((inv: any) => inv.status === "Synced" ? { ...inv, status: "Validated" } : inv);
                setInvoices(migrated);
            } catch (e) {
                console.error("Failed to load invoices", e);
            }
        }
        setIsLoaded(true);
    }, []);

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

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('bakery_invoices', JSON.stringify(invoices));
        }
    }, [invoices, isLoaded]);

    // Filters
    const [statusFilter, setStatusFilter] = useState<"TOUS" | "FACTURES" | "BROUILLONS">("TOUS");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [periodFilter, setPeriodFilter] = useState<"MOIS" | "TRIMESTRE" | "PÉRIODE">("MOIS");

    // Custom Date Range
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

    // Generator
    const generateInvoiceNumber = (supplierName: string) => {
        const supplier = mockSuppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
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
                account = p.mode === "Especes" ? "Caisse" : "Banque";
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
        setInvoices(prev => prev.filter(i => i.id !== id));
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

        setInvoices(prev => prev.map(inv => inv.id === finalInvoice.id ? finalInvoice : inv));
        if (selectedInvoice?.id === finalInvoice.id) {
            setSelectedInvoice(finalInvoice);
        }
    };

    const resetDateRange = () => setDateRange({ start: "", end: "" });

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
            const invDate = new Date(inv.date);
            const now = new Date();

            if (periodFilter === "MOIS") {
                // Current Month
                if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) return false;
            } else if (periodFilter === "TRIMESTRE") {
                // Current Quarter
                const currentQuarter = Math.floor(now.getMonth() / 3);
                const invQuarter = Math.floor(invDate.getMonth() / 3);
                if (invQuarter !== currentQuarter || invDate.getFullYear() !== now.getFullYear()) return false;
            } else if (periodFilter === "PÉRIODE") {
                if (dateRange.start && new Date(dateRange.start) > invDate) return false;
                if (dateRange.end && new Date(dateRange.end) < invDate) return false;
            }

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
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Period Tabs */}
                        <div className="bg-white p-1 rounded-xl flex gap-1 shadow-sm">
                            {["MOIS", "TRIMESTRE", "PÉRIODE"].map((label) => {
                                const isActive = periodFilter === label;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setPeriodFilter(label as any)}
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

                        {/* Custom Period UI */}
                        {periodFilter === "PÉRIODE" && (
                            <div className="bg-slate-100/50 p-2 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-100">
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Du</span>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-400"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Au</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-400"
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <button
                                        onClick={resetDateRange}
                                        className="mb-[1px] w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Réinitialiser"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Invoices List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200 bg-white">
                        {filteredInvoices.map(inv => {
                            const isSelected = selectedInvoice?.id === inv.id;
                            const isValidated = inv.status === "Validated";

                            return (
                                <div
                                    key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className={cn(
                                        "relative w-full rounded-none px-5 py-3 transition-all duration-200 cursor-pointer group overflow-hidden border-b border-slate-100 min-h-[76px] flex flex-col justify-center",
                                        isSelected
                                            ? "bg-white z-10"
                                            : "bg-[#FAF7F2] hover:bg-slate-50 z-0"
                                    )}
                                >
                                    {/* Selection Bar */}
                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#E5D1BD]" />
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

                                    <div className={cn("relative z-10 flex flex-col gap-0.5", isSelected ? "pl-4" : "")}>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-[#B0BEC5] font-outfit tracking-wide">
                                                {new Date(inv.date).toLocaleDateString('fr-FR')}
                                            </span>
                                            <span className="text-[13px] font-extrabold text-[#8D6E63]">
                                                {inv.totalTTC.toLocaleString('fr-FR')} <span className="text-[9px] font-bold opacity-70">Dh</span>
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-black text-[#263238] uppercase tracking-tight truncate pr-6 leading-tight">
                                            {inv.supplierId || "Fournisseur"}
                                        </h3>
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

                    {/* TOP TOOLBAR - 6 Equal Columns */}
                    <div className="h-20 border-b border-[#D7CCC8]/50 bg-[#E5D1BD] shrink-0 shadow-md z-20 px-4 py-2">
                        <div className="grid grid-cols-6 gap-3 h-full w-full">
                            {/* 1. Nouvelle Facture */}
                            <button
                                onClick={handleCreateNew}
                                className="col-span-1 flex flex-row items-center justify-start pl-3 gap-3 bg-[#5D4037]/5 border border-[#5D4037]/10 rounded-xl text-[#5D4037] hover:bg-[#5D4037]/10 transition-all shadow-sm group"
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[#3E2723] flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                    <Plus className="w-5 h-5 text-white stroke-[3px]" />
                                </div>
                                <span className="text-xs font-bold leading-none text-left">Facture</span>
                            </button>

                            {/* 2. Dupliquer Vide */}
                            {/* 2. Dupliquer Vide */}
                            <button
                                onClick={() => selectedInvoice && handleDuplicate(true)}
                                disabled={!selectedInvoice}
                                className="col-span-1 flex flex-row items-center justify-start pl-3 gap-3 bg-[#5D4037]/5 border border-[#5D4037]/10 rounded-xl text-[#5D4037] hover:bg-[#5D4037]/10 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent group"
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[#3E2723] flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                    <Copy className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold leading-none text-left">Vide</span>
                            </button>

                            {/* 3. Dupliquer Pleine */}
                            {/* 3. Dupliquer Pleine */}
                            <button
                                onClick={() => selectedInvoice && handleDuplicate(false)}
                                disabled={!selectedInvoice}
                                className="col-span-1 flex flex-row items-center justify-start pl-3 gap-3 bg-[#5D4037]/5 border border-[#5D4037]/10 rounded-xl text-[#5D4037] hover:bg-[#5D4037]/10 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent group"
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[#3E2723] flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                    <Files className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold leading-none text-left">Pleine</span>
                            </button>

                            {/* 4. Supprimer */}
                            <button
                                onClick={() => selectedInvoice && handleDelete(selectedInvoice.id)}
                                disabled={!selectedInvoice}
                                className="col-span-1 flex flex-row items-center justify-start pl-3 gap-3 bg-[#5D4037]/5 border border-[#5D4037]/10 rounded-xl text-[#5D4037] hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent group"
                            >
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[#3E2723] group-hover:bg-red-600 flex items-center justify-center group-hover:rotate-180 transition-all duration-500">
                                    <Trash2 className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold leading-none text-left">Supprimer</span>
                            </button>

                            {/* Sync Button & 6. Info */}
                            {selectedInvoice ? (
                                <>
                                    {/* Sync Action */}
                                    <button
                                        onClick={() => handleSync(selectedInvoice.id)}
                                        className="col-span-1 flex flex-row items-center justify-center gap-3 rounded-xl border bg-[#5D4037]/5 border-[#5D4037]/10 hover:bg-[#5D4037]/10 transition-all shadow-sm active:scale-95 group relative overflow-hidden"
                                    >
                                        <div className="relative">
                                            {(selectedInvoice.syncTime) ? (
                                                <div className="w-8 h-8 rounded-full bg-[#3E2723] flex items-center justify-center">
                                                    <CloudUpload className="w-5 h-5 text-white stroke-[3px]" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#3E2723] flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                                    <RefreshCw className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <span className="text-xs font-bold leading-none text-[#5D4037]">
                                            {(selectedInvoice.syncTime) ? "Synchronisé" : "Prêt"}
                                        </span>
                                    </button>

                                    {/* Sync Time Info */}
                                    <div className="col-span-1 flex flex-col items-center justify-center gap-0.5 bg-[#5D4037]/5 border border-[#5D4037]/10 rounded-xl text-[#5D4037]">
                                        <span className={cn(
                                            "text-[9px] font-medium uppercase tracking-wider",
                                            selectedInvoice.syncTime ? "text-[#5D4037] opacity-100" : "text-[#5D4037] opacity-60"
                                        )}>Heure Synchro</span>
                                        <span className="text-xs font-mono font-bold text-[#5D4037] tracking-tight">
                                            {selectedInvoice.syncTime
                                                ? <div className="flex flex-col items-center leading-none gap-0.5">
                                                    <span>{new Date(selectedInvoice.syncTime).toLocaleDateString('fr-FR')}</span>
                                                    <span className="text-[#5D4037]/80">{new Date(selectedInvoice.syncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                : <span className="opacity-40">--/-- --:--</span>
                                            }
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="col-span-2" />
                            )}
                        </div>
                    </div>

                    {selectedInvoice ? (
                        <div className="flex-1 overflow-hidden">
                            <InvoiceEditor
                                invoice={selectedInvoice}
                                onSave={(inv) => console.log("Save layout placeholder", inv)}
                                onDelete={() => { }}
                                onSync={handleSync}
                                onUpdate={handleUpdate}
                                suppliers={mockSuppliers}
                                articles={mockArticles}
                                onGenerateNumber={generateInvoiceNumber}
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
