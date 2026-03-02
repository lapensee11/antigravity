"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { InvoiceList } from "./InvoiceList";
import { InvoiceEditor } from "./InvoiceEditor";
import { InvoiceSummary } from "@/components/achats/InvoiceSummary";
import { Invoice, Article, Tier } from "@/lib/types";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    saveInvoice,
    syncInvoiceTransactions,
    updateArticlePivotPrices
} from "@/lib/data-service";
import { useInvoices, useInvoicesPaginated, useArticles, useTiers, useInvoiceMutation, useInvoiceDeletion } from "@/lib/hooks/use-data";
import { confirmDialog } from "@/lib/utils";

export function AchatsContent() {
    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    
    // Use paginated invoices for display
    const { data: paginatedData, isLoading: invoicesLoading } = useInvoicesPaginated({
        page,
        pageSize,
    });
    const invoices = paginatedData?.invoices || [];
    const totalInvoices = paginatedData?.total || 0;
    
    // Keep full invoices list for sync and list operations
    const { data: allInvoices = [] } = useInvoices();
    const { data: articles = [], isLoading: articlesLoading } = useArticles();
    const { data: tiers = [], isLoading: tiersLoading } = useTiers();
    
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const queryClient = useQueryClient();

    // Toujours afficher les détails de la première facture de la liste au lieu d'un volet droit vide (sauf si on vient de créer/dupliquer une facture)
    useEffect(() => {
        if (invoices.length === 0) return;
        const currentSelectedId = selectedInvoice?.id ?? null;
        const isNewOrDuplicate = currentSelectedId?.startsWith("new_") || currentSelectedId?.startsWith("dup_");
        if (isNewOrDuplicate) return; // garder la nouvelle facture sélectionnée pour pouvoir l'éditer
        const isSelectedInList = currentSelectedId && invoices.some(inv => inv.id === currentSelectedId);
        if (!currentSelectedId || !isSelectedInList) {
            setSelectedInvoice(invoices[0]);
        }
    }, [invoices, selectedInvoice?.id]);
    const router = useRouter();
    const invoiceMutation = useInvoiceMutation();
    const invoiceDeletion = useInvoiceDeletion();
    const didOpenFromTiersRef = useRef(false);
    const searchParams = useSearchParams();

    // Filter suppliers from tiers
    const suppliers = useMemo(() => {
        const filtered = tiers.filter(t => {
            const typeLower = (t.type || "").trim().toLowerCase();
            return typeLower === "fournisseur" || typeLower === "fournisseurs" || typeLower === "frs";
        });
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [tiers]);

    const handleSave = async (invoice: Invoice) => {
        await invoiceMutation.mutateAsync(invoice);
        setSelectedInvoice(invoice);
        await syncInvoiceTransactions(invoice.id, []);
        updateArticlePivotPrices([]);
    };

    const handleDelete = async (id: string) => {
        if (!(await confirmDialog("Êtes-vous sûr de vouloir supprimer cette facture ?"))) return;
        await invoiceDeletion.mutateAsync(id);
        if (selectedInvoice?.id === id) setSelectedInvoice(null);
    };

    // Generate invoice number: BL-(5 premières lettres du nom)-JJ (11 caractères dont 2 '-')
    const generateInvoiceNumber = (supplierId: string, dateStr?: string): string => {
        if (!supplierId) return "";
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return "";

        const name = (supplier.name || supplier.code || "X").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase();
        const fiveLetters = name.slice(0, 5).padEnd(5, name[0] || "X");
        const d = dateStr ? new Date(dateStr) : new Date();
        const day = String(d.getDate()).padStart(2, "0");

        return `BL-${fiveLetters}-${day}`;
    };

    const createDefaultInvoiceLines = (count: number): Invoice["lines"] => {
        const ts = Date.now();
        return Array.from({ length: count }, (_, i) => ({
            id: `line_${ts}_${i}`,
            articleId: "",
            articleName: "",
            quantity: 0,
            unit: "",
            priceHT: 0,
            discount: 0,
            vatRate: 20,
            totalTTC: 0,
        }));
    };

    const handleCreateNew = (presetSupplierId?: string) => {
        const supplierId = presetSupplierId ?? "";
        const newNumber = supplierId ? generateInvoiceNumber(supplierId) : "";
        const newInv: Invoice = {
            id: `new_${Date.now()}`,
            supplierId,
            number: newNumber,
            date: new Date().toISOString().split('T')[0],
            status: "Draft",
            lines: createDefaultInvoiceLines(2),
            payments: [],
            totalHT: 0,
            totalTTC: 0,
            rounding: 0,
            deposit: 0,
            balanceDue: 0
        };
        queryClient.setQueryData<Invoice[]>(["invoices"], (old = []) => [newInv, ...old]);
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
            syncTime: undefined,
            comment: undefined,
            documentImage: undefined,
            photoImage: undefined
        };
        // Invalidate queries to refresh the list, but keep new invoice in local state
        queryClient.setQueryData<Invoice[]>(["invoices"], (old = []) => [newInv, ...old]);
        setSelectedInvoice(newInv);
    };

    // Depuis Tiers : action=new&supplierId=... → ouvrir une facture vide pour ce fournisseur
    useEffect(() => {
        const action = searchParams.get("action");
        const supplierId = searchParams.get("supplierId");
        if (didOpenFromTiersRef.current || action !== "new" || !supplierId || suppliers.length === 0) return;
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;
        didOpenFromTiersRef.current = true;
        const newNumber = generateInvoiceNumber(supplierId);
        const newInv: Invoice = {
            id: `new_${Date.now()}`,
            supplierId,
            number: newNumber,
            date: new Date().toISOString().split("T")[0],
            status: "Draft",
            lines: createDefaultInvoiceLines(2),
            payments: [],
            totalHT: 0,
            totalTTC: 0,
            rounding: 0,
            deposit: 0,
            balanceDue: 0,
        };
        queryClient.setQueryData<Invoice[]>(["invoices"], (old = []) => [newInv, ...old]);
        setSelectedInvoice(newInv);
        router.replace("/achats", { scroll: false });
    }, [searchParams, suppliers, allInvoices, queryClient, router]);

    const handleUpdate = async (updatedInvoice: Invoice) => {
        // Save to database immediately to persist changes
        await invoiceMutation.mutateAsync(updatedInvoice);
        // Update selected invoice if it's the one being updated
        if (selectedInvoice?.id === updatedInvoice.id) {
            setSelectedInvoice(updatedInvoice);
        }
    };

    /** Un clic sur l'icône brouillon dans la liste : passe la facture en déclarée (Validated) */
    const handleToggleDeclared = async (invoice: Invoice) => {
        const updated = { ...invoice, status: "Validated" as const };
        await handleUpdate(updated);
    };

    const handleSync = async (id: string) => {
        const inv = (selectedInvoice?.id === id ? selectedInvoice : null) || allInvoices.find(i => i.id === id) || invoices.find(i => i.id === id);
        if (!inv) return;

        const now = new Date().toISOString();

        // 1. Update Invoice with syncTime
        const updatedInvoice = { ...inv, syncTime: now };
        if (selectedInvoice?.id === id) {
            setSelectedInvoice(updatedInvoice);
        }

        // 2. Persist Invoice (this will invalidate queries automatically)
        await invoiceMutation.mutateAsync(updatedInvoice);

        // 3. Prepare Transactions
        const isDraft = inv.status !== "Validated";
        const supplierName = suppliers.find(s => s.id === inv.supplierId)?.name || inv.supplierId || 'Inconnu';

        const newTxs: any[] = (inv.payments || []).map(p => {
            let account: "Banque" | "Caisse" | "Coffre" = "Coffre";
            if (!isDraft) {
                account = p.mode === "Espèces" ? "Caisse" : "Banque";
            }

            // Déterminer le libellé et le N° Pièce selon le mode de paiement
            let label: string;
            let pieceNumber: string;

            switch (p.mode) {
                case "Chèques":
                    label = "Achat Chèque";
                    pieceNumber = p.reference || "";
                    break;
                case "Virement":
                    label = "Achat Virement";
                    pieceNumber = "";
                    break;
                case "Prélèvement":
                    label = "Achat Prélèvement";
                    pieceNumber = "";
                    break;
                case "Espèces":
                    label = "Achat Espèces";
                    pieceNumber = "";
                    break;
                default:
                    label = `Achat: ${inv.number}`;
                    pieceNumber = "";
            }

            return {
                id: `t_sync_${id}_${p.id}`,
                date: p.date,
                label: label,
                amount: p.amount,
                type: "Depense",
                category: "Achat",
                account: account,
                invoiceId: id,
                tier: supplierName,
                pieceNumber: pieceNumber,
                mode: p.mode,
                isReconciled: false
            };
        });

        // 4. Persist Transactions
        await syncInvoiceTransactions(id, newTxs);
    };

    const handleDesync = async (id: string) => {
        const inv = (selectedInvoice?.id === id ? selectedInvoice : null) || allInvoices.find(i => i.id === id) || invoices.find(i => i.id === id);
        if (!inv) return;

        // 1. Update Invoice - Remove syncTime
        const updatedInvoice = { ...inv, syncTime: undefined };
        if (selectedInvoice?.id === id) {
            setSelectedInvoice(updatedInvoice);
        }

        // 2. Persist Invoice (this will invalidate queries automatically)
        await invoiceMutation.mutateAsync(updatedInvoice);
    };

    return (
        <div className="flex h-screen bg-[#F6F8FC] overflow-hidden">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen flex">
                <div className="w-[720px] flex flex-col h-full border-r border-slate-200 bg-[#F6F8FC] shrink-0">
                    <div className="h-24 min-h-[96px] shrink-0 flex flex-col items-center justify-center border-b border-slate-200 bg-white shadow-[0_1px_10px_rgba(0,0,0,0.03)] z-10 relative">
                        <h2 className="text-[26px] font-extrabold text-slate-800 font-outfit tracking-tight">Factures Achat</h2>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-sm font-medium uppercase tracking-wider">Suivi & Paiements</span>
                        </div>
                    </div>

                    <InvoiceList
                        invoices={invoices}
                        allInvoices={allInvoices}
                        selectedInvoiceId={selectedInvoice?.id || null}
                        onSelectInvoice={setSelectedInvoice}
                        onToggleDeclared={handleToggleDeclared}
                        suppliers={suppliers}
                        articles={articles}
                        total={totalInvoices}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={(newPage) => {
                            setPage(newPage);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        onPageSizeChange={(newSize) => {
                            setPageSize(newSize);
                            setPage(0);
                        }}
                    />
                </div>

                {/* Right Panel - Invoice Editor */}
                <div className="flex-1 bg-white flex flex-col">
                    {invoicesLoading || articlesLoading || tiersLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-slate-400">Chargement...</div>
                        </div>
                    ) : (
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
                    )}
                </div>
            </main>
            <InvoiceSummary
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                invoices={allInvoices}
                tiers={tiers}
                onSync={handleSync}
            />
        </div>
    );
}
