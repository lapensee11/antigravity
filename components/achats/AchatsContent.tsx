"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { InvoiceList } from "./InvoiceList";
import { InvoiceEditor } from "./InvoiceEditor";
import { InvoiceSummary } from "@/components/achats/InvoiceSummary";
import { Invoice, Article, Tier } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    getInvoices,
    saveInvoice,
    deleteInvoice,
    getArticles,
    getTiers,
    syncInvoiceTransactions,
    updateArticlePivotPrices
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
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const queryClient = useQueryClient();

    // Filter suppliers from tiers
    const suppliers = useMemo(() => {
        const filtered = tiers.filter(t => {
            const typeLower = (t.type || "").trim().toLowerCase();
            return typeLower === "fournisseur" || typeLower === "fournisseurs" || typeLower === "frs";
        });
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [tiers]);

    // Runtime Data Load
    useEffect(() => {
        const loadData = async () => {
            const [liveInvoices, liveArticles, liveTiers] = await Promise.all([
                getInvoices(),
                getArticles(),
                getTiers()
            ]);
            setInvoices(liveInvoices || []);
            setArticles(liveArticles || []);
            setTiers(liveTiers || []);
        };
        loadData();
    }, []);

    const handleSave = async (invoice: Invoice) => {
        const result = await saveInvoice(invoice);
        if (result.success) {
            const updated = invoices.map(i => i.id === invoice.id ? invoice : i);
            setInvoices(updated);
            setSelectedInvoice(invoice);
            await syncInvoiceTransactions(invoice.id, []);
            updateArticlePivotPrices([]);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
        const result = await deleteInvoice(id);
        if (result.success) {
            setInvoices(prev => prev.filter(i => i.id !== id));
            if (selectedInvoice?.id === id) setSelectedInvoice(null);
        }
    };

    // Generate invoice number: BL-'Code Frs'-'JJ/MM'-'##'
    const generateInvoiceNumber = (supplierId: string): string => {
        if (!supplierId) return "";
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier || !supplier.code) return "";
        
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const dateStr = `${day}/${month}`;
        
        // Find all invoices for this supplier with the same date prefix
        const prefix = `BL-${supplier.code}-${dateStr}-`;
        const matchingInvoices = invoices.filter(inv => {
            if (!inv.number || !inv.supplierId || inv.supplierId !== supplierId) return false;
            return inv.number.startsWith(prefix);
        });
        
        // Extract sequence numbers and find the highest
        let maxSeq = 0;
        matchingInvoices.forEach(inv => {
            const suffix = inv.number.replace(prefix, '');
            const seqMatch = suffix.match(/^(\d+)$/);
            if (seqMatch) {
                const seq = parseInt(seqMatch[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        });
        
        // Next sequence number
        const nextSeq = maxSeq + 1;
        const seqStr = String(nextSeq).padStart(2, '0');
        
        return `${prefix}${seqStr}`;
    };

    const handleCreateNew = () => {
        const newInv: Invoice = {
            id: `new_${Date.now()}`,
            supplierId: "",
            number: "",
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
        
        // Generate new invoice number using the same format as new invoices
        const newNumber = selectedInvoice.supplierId 
            ? generateInvoiceNumber(selectedInvoice.supplierId)
            : "";
        
        const newInv: Invoice = {
            ...selectedInvoice,
            id: `dup_${Date.now()}`,
            number: newNumber,
            date: new Date().toISOString().split('T')[0],
            status: "Draft",
            lines: idsEmpty ? [] : selectedInvoice.lines.map(l => ({
                ...l,
                id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                quantity: 0,
                discount: 0,
                totalTTC: 0
            })),
            totalHT: 0,
            totalTTC: 0,
            rounding: 0,
            deposit: 0,
            balanceDue: 0,
            payments: [],
            syncTime: undefined
        };
        setInvoices(prev => [newInv, ...prev]);
        setSelectedInvoice(newInv);
    };

    const handleUpdate = async (updatedInvoice: Invoice) => {
        const updated = invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
        setInvoices(updated);
        if (selectedInvoice?.id === updatedInvoice.id) {
            setSelectedInvoice(updatedInvoice);
        }
    };

    const handleSync = async (id: string) => {
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

        const newTxs: any[] = (inv.payments || []).map(p => {
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

    const handleDesync = async (id: string) => {
        const inv = invoices.find(i => i.id === id);
        if (!inv) return;

        // 1. Update Invoices State locally - Remove syncTime
        const updatedInvoice = { ...inv, syncTime: undefined };
        const updatedInvoices = invoices.map(i => i.id === id ? updatedInvoice : i);
        setInvoices(updatedInvoices);
        if (selectedInvoice?.id === id) {
            setSelectedInvoice(updatedInvoice);
        }

        // 2. Persist Invoice
        await saveInvoice(updatedInvoice);
    };

    return (
        <div className="flex h-screen bg-[#F6F8FC] overflow-hidden">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen flex">
                <div className="w-[600px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC] shrink-0">
                    <div className="h-24 min-h-[96px] shrink-0 flex flex-col items-center justify-center border-b border-slate-200 bg-white shadow-[0_1px_10px_rgba(0,0,0,0.03)] z-10 relative">
                        <h2 className="text-2xl font-extrabold text-slate-800 font-outfit tracking-tight">Factures achats</h2>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-xs font-medium uppercase tracking-wider">Suivi & Paiements</span>
                        </div>
                    </div>

                    <InvoiceList
                        invoices={invoices}
                        selectedInvoiceId={selectedInvoice?.id || null}
                        onSelectInvoice={setSelectedInvoice}
                        suppliers={suppliers}
                        articles={articles}
                    />
                </div>

                {/* Right Panel - Invoice Editor */}
                <div className="flex-1 bg-white flex flex-col">
                    <InvoiceEditor
                        invoice={selectedInvoice}
                        invoices={invoices}
                        articles={articles}
                        suppliers={suppliers}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        onCreateNew={handleCreateNew}
                        onDuplicate={handleDuplicate}
                        onSync={handleSync}
                        onDesync={handleDesync}
                        onSummaryOpen={() => setIsSummaryOpen(true)}
                    />
                </div>
            </main>
            <InvoiceSummary
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                invoices={invoices}
                tiers={tiers}
                onSync={handleSync}
            />
        </div>
    );
}
