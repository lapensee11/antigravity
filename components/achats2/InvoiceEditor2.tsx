"use client";

import { useRef, forwardRef } from "react";
import { GlassCard } from "@/components/ui/GlassComponents";
import { Invoice, InvoiceLine } from "@/lib/types";
import { InvoiceDocuments } from "../achats/editor/InvoiceDocuments";
import { InvoiceFinancials } from "../achats/editor/InvoiceFinancials";
import { InvoicePayments } from "../achats/editor/InvoicePayments";
import { DateInput } from "@/components/ui/DateInput";
import { Trash2, Plus, Check, File, Copy, Files, RefreshCw, CloudUpload, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { UnitSelector } from "@/components/ui/UnitSelector";
import { useAccountingAccounts, useArticles, usePartners, useTiers } from "@/lib/hooks/use-data";

interface InvoiceEditor2Props {
    invoice: Invoice | null;
    invoices: Invoice[];
    articles: Article[];
    suppliers: Tier[];
    onSave: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onUpdate?: (invoice: Invoice) => void;
    onCreateNew: () => void;
    onDuplicate: (isEmpty: boolean) => void;
    onSync?: (id: string) => void;
    onDesync?: (id: string) => void;
    onSummaryOpen?: () => void;
}

// Helper Component for Strict Decimal Formatting (fr-FR)
const DecimalInput = forwardRef<HTMLInputElement, { value: number; onChange: (val: number) => void; onKeyDown?: (e: any) => void; className?: string }>(
    ({ value, onChange, onKeyDown, className }, ref) => {
        const [displayValue, setDisplayValue] = useState(value.toFixed(2));

        useEffect(() => {
            setDisplayValue(value.toFixed(2));
        }, [value]);

        const handleBlur = () => {
            const num = parseFloat(displayValue.replace(/,/g, '.')) || 0;
            onChange(num);
            setDisplayValue(num.toFixed(2));
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setDisplayValue(e.target.value);
        };

        return (
            <input
                ref={ref}
                type="text"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={onKeyDown}
                className={className}
            />
        );
    }
);
DecimalInput.displayName = "DecimalInput";

export function InvoiceEditor2({
    invoice,
    invoices,
    articles: articlesProp,
    suppliers: suppliersProp,
    onSave,
    onDelete,
    onUpdate,
    onCreateNew,
    onDuplicate,
    onSync,
    onDesync,
    onSummaryOpen
}: InvoiceEditor2Props) {
    const [formData, setFormData] = useState<Partial<Invoice>>({});
    const [activeAction, setActiveAction] = useState<'new' | 'empty' | 'full' | null>(null);

    // Data Hooks
    const { data: accountingAccounts = [] } = useAccountingAccounts();
    const { data: articles = [] } = useArticles();
    const { data: partners = [] } = usePartners();
    const { data: tiers = [] } = useTiers();

    // Use props if available, otherwise use hooks
    const finalArticles = articlesProp.length > 0 ? articlesProp : articles;
    const finalSuppliers = suppliersProp.length > 0 ? suppliersProp : tiers.filter(t => t.type === 'Fournisseur');

    // Filter Suppliers from Tiers and sort alphabetically
    const suppliers = useMemo(() => {
        return finalSuppliers
            .map(t => ({ id: t.id, name: t.name, code: t.code }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    }, [finalSuppliers]);

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

    // Autocomplete State for Supplier
    const [supplierSearch, setSupplierSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState<{ id: string; name: string; code: string }[]>(suppliers);
    const [focusIndex, setFocusIndex] = useState(-1);
    const supplierInputRef = useRef<HTMLInputElement>(null);

    // Article Autocomplete State
    const [activeRow, setActiveRow] = useState<number | null>(null);
    const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
    const [articleFocusIndex, setArticleFocusIndex] = useState(-1);

    // Refs for Focus Management
    const designationRefs = useRef<(HTMLInputElement | null)[]>([]);
    const detailsRefs = useRef<(HTMLInputElement | null)[]>([]);
    const quantityRefs = useRef<(HTMLInputElement | null)[]>([]);
    const priceRefs = useRef<(HTMLInputElement | null)[]>([]);
    const unitRefs = useRef<(HTMLSelectElement | null)[]>([]);
    const vatRefs = useRef<(HTMLInputElement | null)[]>([]);
    const discountRefs = useRef<(HTMLInputElement | null)[]>([]);

    const prevLinesLength = useRef(0);
    const supplierListRef = useRef<HTMLDivElement>(null);
    const articleListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (formData.lines && formData.lines.length > prevLinesLength.current) {
            const lastIndex = formData.lines.length - 1;
            setTimeout(() => designationRefs.current[lastIndex]?.focus(), 150);
        }
        prevLinesLength.current = formData.lines?.length || 0;
    }, [formData.lines]);

    useEffect(() => {
        if (invoice) {
            const lines = invoice.lines || [];
            const totalHT = lines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);
            const totalVAT = lines.reduce((sum, l) => {
                const lineHT = l.quantity * l.priceHT * (1 - (l.discount || 0) / 100);
                return sum + (lineHT * (l.vatRate / 100));
            }, 0);
            const totalRemise = lines.reduce((sum, l) => {
                const lineBase = l.quantity * l.priceHT;
                return sum + (lineBase * ((l.discount || 0) / 100));
            }, 0);
            const rounding = invoice.rounding || 0;
            const totalTTC = totalHT + totalVAT + rounding;
            let payments = invoice.payments || [];
            if (payments.length === 0) {
                payments = [{
                    id: `pay_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    amount: 0,
                    mode: "Chèques" as const,
                    account: "Caisse" as const
                }];
            }
            const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const balanceDue = totalTTC - totalPaid;
            setFormData({
                ...invoice,
                payments: payments,
                totalHT,
                totalTTC,
                totalVAT,
                totalRemise,
                deposit: totalPaid,
                balanceDue: balanceDue
            });
            prevLinesLength.current = invoice.lines?.length || 0;
            const supplier = suppliers.find(s => s.id === invoice.supplierId);
            setSupplierSearch(supplier?.name || "");
            
            // Generate invoice number if empty and supplier exists
            if ((!invoice.number || invoice.number === "" || invoice.number === "---") && invoice.supplierId) {
                const generatedNumber = generateInvoiceNumber(invoice.supplierId);
                if (generatedNumber) {
                    setFormData(prev => ({ ...prev, number: generatedNumber }));
                    if (onUpdate && invoice) {
                        onUpdate({ ...invoice, number: generatedNumber } as Invoice);
                    }
                }
            }
        } else {
            const initialPayment = {
                id: `pay_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                mode: "Chèques" as const,
                account: "Caisse" as const
            };
            setFormData({
                status: "Draft",
                date: new Date().toISOString().split('T')[0],
                dateEncaissement: new Date().toISOString().split('T')[0],
                lines: [],
                payments: [initialPayment],
                totalTTC: 0,
                balanceDue: 0
            });
            setSupplierSearch("");
        }
        // Initialize filtered suppliers with all suppliers
        setFilteredSuppliers(suppliers);
    }, [invoice, suppliers]);

    useEffect(() => {
        setArticleFocusIndex(-1);
    }, [activeRow]);

    useEffect(() => {
        if (focusIndex >= 0 && supplierListRef.current) {
            const focusedElement = supplierListRef.current.children[focusIndex] as HTMLElement;
            if (focusedElement) {
                focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [focusIndex]);

    const handleSupplierChange = (id: string) => {
        const supplier = suppliers.find(s => s.id === id);
        const name = supplier ? supplier.name : "";
        
        // Generate invoice number only if it's empty or just a placeholder
        const currentNumber = formData.number || "";
        const shouldGenerateNumber = !currentNumber || currentNumber === "" || currentNumber === "---";
        const newNumber = shouldGenerateNumber ? generateInvoiceNumber(id) : currentNumber;
        
        const newData = { ...formData, supplierId: id, number: newNumber };
        setFormData(newData);
        setSupplierSearch(name);
        setShowSuggestions(false);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    // Filter suppliers based on incremental search
    useEffect(() => {
        if (!suppliers || suppliers.length === 0) {
            setFilteredSuppliers([]);
            return;
        }
        
        if (supplierSearch.trim() === "") {
            setFilteredSuppliers(suppliers);
        } else {
            const searchLower = supplierSearch.toLowerCase().trim();
            const filtered = suppliers.filter(s => {
                const nameMatch = s.name.toLowerCase().includes(searchLower);
                const codeMatch = s.code && s.code.toLowerCase().includes(searchLower);
                return nameMatch || codeMatch;
            });
            // Sort: exact matches first, then by name
            const sorted = filtered.sort((a, b) => {
                const aNameLower = a.name.toLowerCase();
                const bNameLower = b.name.toLowerCase();
                const aExact = aNameLower.startsWith(searchLower) || (a.code && a.code.toLowerCase().startsWith(searchLower));
                const bExact = bNameLower.startsWith(searchLower) || (b.code && b.code.toLowerCase().startsWith(searchLower));
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
            });
            setFilteredSuppliers(sorted);
        }
    }, [supplierSearch, suppliers]);

    // Initialize filteredSuppliers on mount and when suppliers change
    useEffect(() => {
        if (suppliers && suppliers.length > 0) {
            setFilteredSuppliers(suppliers);
        }
    }, [suppliers]);

    useEffect(() => {
        if (formData.supplierId) {
            const supplier = suppliers.find(s => s.id === formData.supplierId);
            if (supplier && supplierSearch !== supplier.name) {
                setSupplierSearch(supplier.name);
            }
        } else if (!formData.supplierId && supplierSearch !== "") {
            setSupplierSearch("");
        }
    }, [formData.supplierId, suppliers, supplierSearch]);

    const handleNumberChange = (val: string) => {
        const newData = { ...formData, number: val };
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    const handleToggleStatus = () => {
        const isCurrentlyValidated = formData.status === 'Validated';
        if (isCurrentlyValidated) {
            if (invoice?.syncTime) {
                alert("Impossible de passer en brouillon : Cette pièce est déjà synchronisée.");
                return;
            }
            const hasReconciled = formData.payments?.some(p => p.isReconciled);
            if (hasReconciled) {
                alert("Impossible de passer en brouillon : Des paiements sont déjà pointés en banque.");
                return;
            }
            const updatedData = { ...formData, status: 'Draft' as any };
            setFormData(updatedData);
            if (onUpdate && invoice) onUpdate({ ...invoice, ...updatedData } as Invoice);
        } else {
            const updatedData = { ...formData, status: 'Validated' as any };
            setFormData(updatedData);
            if (onUpdate && invoice) onUpdate({ ...invoice, ...updatedData } as Invoice);
        }
    };

    const isValidated = formData.status === "Validated";

    const updateLines = (newLines: InvoiceLine[]) => {
        const totalHT = newLines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);
        const totalVAT = newLines.reduce((sum, l) => {
            const lineHT = l.quantity * l.priceHT * (1 - (l.discount || 0) / 100);
            return sum + (lineHT * (l.vatRate / 100));
        }, 0);
        const totalRemise = newLines.reduce((sum, l) => {
            const lineBase = l.quantity * l.priceHT;
            return sum + (lineBase * ((l.discount || 0) / 100));
        }, 0);
        const rounding = formData.rounding || 0;
        const totalTTC = totalHT + totalVAT + rounding;
        const balanceDue = totalTTC - (formData.deposit || 0);
        const newData = { ...formData, lines: newLines, totalHT, totalTTC, totalVAT, totalRemise, balanceDue };
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    const handleAddLine = () => {
        const newLine: InvoiceLine = {
            id: `line_${Date.now()}`,
            articleId: "",
            articleName: "",
            quantity: 1,
            unit: "Kg",
            priceHT: 0,
            discount: 0,
            vatRate: 20,
            totalTTC: 0,
            details: ""
        };
        const newLines = [...(formData.lines || []), newLine];
        updateLines(newLines);
    };

    const handleLineChange = (index: number, field: keyof InvoiceLine, value: any) => {
        const newLines = [...(formData.lines || [])];
        const line = { ...newLines[index] };
        (line as any)[field] = value;
        const qty = field === "quantity" ? Number(value) : line.quantity;
        const price = field === "priceHT" ? Number(value) : line.priceHT;
        const discount = field === "discount" ? Number(value) : line.discount || 0;
        const vat = line.vatRate !== undefined ? line.vatRate : 0;
        const totalHTLine = qty * price * (1 - discount / 100);
        line.totalTTC = totalHTLine * (1 + vat / 100);
        newLines[index] = line;
        if (field === "articleName") {
            setActiveRow(index);
            if (value) {
                setFilteredArticles(finalArticles.filter(a => a.name.toLowerCase().includes(String(value).toLowerCase())));
            } else {
                setFilteredArticles(finalArticles);
            }
        }
        updateLines(newLines);
    };

    const handleSelectArticle = (index: number, article: any) => {
        const newLines = [...(formData.lines || [])];
        const vat = article.vatRate !== undefined ? Number(article.vatRate) : 20;
        const line = {
            ...newLines[index],
            articleId: article.id,
            articleName: article.name,
            unit: article.unitAchat || "Unité",
            vatRate: vat,
            accountingCode: article.accountingCode || "",
        };
        const totalHTLine = line.quantity * line.priceHT * (1 - (line.discount || 0) / 100);
        line.totalTTC = totalHTLine * (1 + vat / 100);
        newLines[index] = line;
        updateLines(newLines);
        setTimeout(() => {
            setActiveRow(null);
            detailsRefs.current[index]?.focus();
        }, 50);
    };

    const updatePayments = (newPayments: any[]) => {
        const totalPaid = newPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const balanceDue = (formData.totalTTC || 0) - totalPaid;
        const newData = { ...formData, payments: newPayments, deposit: totalPaid, balanceDue };
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    const handleRoundingChange = (val: number) => {
        const rounding = val;
        const lines = formData.lines || [];
        const totalHT = lines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);
        const totalVAT = lines.reduce((sum, l) => {
            const lineHT = l.quantity * l.priceHT * (1 - (l.discount || 0) / 100);
            return sum + (lineHT * (l.vatRate / 100));
        }, 0);
        const newTotalTTC = totalHT + totalVAT + rounding;
        const totalPaid = (formData.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const balanceDue = newTotalTTC - totalPaid;
        const newData = { ...formData, rounding, totalTTC: newTotalTTC, balanceDue };
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    const handleArticleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (activeRow !== index) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setArticleFocusIndex(prev => Math.min(prev + 1, filteredArticles.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setArticleFocusIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" || e.key === "Tab") {
            if (filteredArticles.length > 0 && articleFocusIndex >= 0 && filteredArticles[articleFocusIndex]) {
                e.preventDefault();
                handleSelectArticle(index, filteredArticles[articleFocusIndex]);
            } else if (e.key === "Enter") {
                e.preventDefault();
                detailsRefs.current[index]?.focus();
            }
        } else if (e.key === "Escape") {
            setActiveRow(null);
        }
    };

    const handleLineKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (field === "details") {
                quantityRefs.current[index]?.focus();
            } else if (field === "quantity") {
                unitRefs.current[index]?.focus();
            } else if (field === "unit") {
                priceRefs.current[index]?.focus();
            } else if (field === "priceHT") {
                vatRefs.current[index]?.focus();
            } else if (field === "vatRate") {
                discountRefs.current[index]?.focus();
            } else if (field === "discount") {
                if (index < (formData.lines?.length || 0) - 1) {
                    designationRefs.current[index + 1]?.focus();
                } else {
                    handleAddLine();
                }
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeRow !== null && !articleListRef.current?.contains(event.target as Node)) {
                if (designationRefs.current[activeRow] && designationRefs.current[activeRow]?.contains(event.target as Node)) return;
                setActiveRow(null);
            }
            if (showSuggestions && !supplierListRef.current?.contains(event.target as Node)) {
                if (supplierInputRef.current && supplierInputRef.current.contains(event.target as Node)) return;
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeRow, showSuggestions]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Header Section - Same as Factures Achat - Always Visible */}
            <div className="h-24 border-b border-slate-200 bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 shrink-0 shadow-sm z-20 px-4 flex items-center justify-between gap-4">
                <div className="flex w-[40%] h-16 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm">
                    <button
                        onClick={() => { onCreateNew(); setActiveAction('new'); setTimeout(() => setActiveAction(null), 2000); }}
                        className="flex-1 flex items-center justify-center gap-3 hover:bg-blue-50/80 transition-all group border-r border-slate-200/50 active:bg-blue-100/80"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                            activeAction === 'new' ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                        )}>
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === 'new' ? "text-orange-500" : "text-slate-700")}>Nouvelle</span>
                    </button>
                    <button
                        onClick={() => { if (formData) { onDuplicate(true); setActiveAction('empty'); setTimeout(() => setActiveAction(null), 2000); } }}
                        disabled={!formData}
                        className="flex-1 flex items-center justify-center gap-3 hover:bg-blue-50/80 transition-all group border-r border-slate-200/50 active:bg-blue-100/80 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                            activeAction === 'empty' ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                        )}>
                            <File className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === 'empty' ? "text-orange-500" : "text-slate-700")}>Vide</span>
                    </button>
                    <button
                        onClick={() => { if (formData) { onDuplicate(false); setActiveAction('full'); setTimeout(() => setActiveAction(null), 2000); } }}
                        disabled={!formData}
                        className="flex-1 flex items-center justify-center gap-3 hover:bg-blue-50/80 transition-all group active:bg-blue-100/80 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-180 transition-all duration-500",
                            activeAction === 'full' ? "bg-orange-500 shadow-orange-500/30" : "bg-blue-500 shadow-blue-500/30"
                        )}>
                            <Copy className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors duration-300", activeAction === 'full' ? "text-orange-500" : "text-slate-700")}>Pleine</span>
                    </button>
                </div>

                <div className="flex w-[12%] h-16 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm">
                    <button onClick={onSummaryOpen} className="flex-1 flex items-center justify-center gap-2 text-slate-700 hover:bg-blue-50/80 transition-colors text-xs font-black uppercase tracking-widest active:bg-blue-100/80">
                        <Files className="w-5 h-5 text-blue-500" />
                        <span className="hidden xl:inline">Résumé</span>
                    </button>
                </div>

                {formData && (
                    <button
                        onClick={() => onDelete(formData.id!)}
                        className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all shadow-md group"
                        title="Supprimer la facture"
                    >
                        <Trash2 className="w-7 h-7 stroke-[2.5px] group-hover:rotate-12 transition-transform" />
                    </button>
                )}

                {formData && (
                    <div className="flex items-center gap-2">
                        <div className="bg-white/80 backdrop-blur-sm px-2 py-1 h-16 rounded-2xl flex items-center border border-slate-200/50 shadow-sm">
                            <div className="flex flex-col px-4 border-r border-slate-200/50 transition-colors rounded-l-lg group justify-center h-full">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">État Synchro</span>
                                <span className={cn(
                                    "text-lg font-black leading-none",
                                    formData.syncTime ? "text-green-600" : "text-orange-500"
                                )}>
                                    {formData.syncTime ? "Synchronisé" : "Prêt"}
                                </span>
                            </div>

                            <div className="flex flex-col px-4 transition-colors rounded-r-lg group justify-center h-full min-w-[140px]">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mb-1">Dernier Envoi</span>
                                {formData.syncTime ? (
                                    <div className="flex flex-col leading-none">
                                        <span className="text-sm font-black text-slate-800">{new Date(formData.syncTime).toLocaleDateString('fr-FR')}</span>
                                        <span className="text-[11px] font-bold text-slate-500 mt-0.5">{new Date(formData.syncTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-bold text-slate-400">--/-- --:--</span>
                                )}
                            </div>
                        </div>

                        {onSync && (
                            <button
                                onClick={() => onSync(formData.id!)}
                                className={cn(
                                    "h-16 w-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer",
                                    formData.syncTime ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                                )}
                                title="Synchroniser la facture"
                            >
                                {formData.syncTime ? <CloudUpload className="w-7 h-7 stroke-[2.5px]" /> : <RefreshCw className="w-7 h-7 stroke-[2.5px]" />}
                            </button>
                        )}
                        {onDesync && formData.syncTime && (
                            <button
                                onClick={() => {
                                    if (confirm("Êtes-vous sûr de vouloir désynchroniser cette facture ?")) {
                                        onDesync(formData.id!);
                                    }
                                }}
                                className="h-16 w-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                                title="Désynchroniser la facture"
                            >
                                <X className="w-7 h-7 stroke-[2.5px]" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content from InvoiceEditor */}
            {formData && invoice ? (
                <GlassCard className="flex-1 flex flex-col overflow-hidden rounded-none shadow-none border-0 font-outfit">
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {/* Header Section - Restored Light Style */}
                        <div className="shrink-0 pt-6 pb-8 pl-8 pr-6 flex items-end justify-between gap-4 bg-white">
                        <div className="flex items-center gap-4">
                            {/* Status Toggle Button */}
                            <button
                                onClick={handleToggleStatus}
                                className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm border shrink-0",
                                    isValidated
                                        ? "bg-[#4CAF50] border-[#43A047] shadow-green-200"
                                        : "bg-white border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                                )}
                                title={isValidated ? "Facture Déclarée" : "Cliquer pour valider"}
                            >
                                <Check className={cn(
                                    "w-6 h-6 stroke-[4px] text-white transition-all duration-500 ease-spring",
                                    isValidated ? "opacity-100 scale-100 rotate-[360deg]" : "opacity-0 scale-0 -rotate-90"
                                )} />
                            </button>

                            {/* Info Block */}
                            <div className="flex flex-col gap-1 relative">
                                <div className="relative">
                                    <input
                                        ref={supplierInputRef}
                                        type="text"
                                        value={supplierSearch}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSupplierSearch(value);
                                            setFocusIndex(-1);
                                            // Show suggestions when typing
                                            if (value.trim() !== "") {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onFocus={() => {
                                            setShowSuggestions(true);
                                        }}
                                        onBlur={() => {
                                            setTimeout(() => setShowSuggestions(false), 200);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setShowSuggestions(true);
                                                setFocusIndex(prev =>
                                                    prev < filteredSuppliers.length - 1 ? prev + 1 : prev
                                                );
                                            } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setFocusIndex(prev => prev > 0 ? prev - 1 : -1);
                                            } else if (e.key === "Enter") {
                                                e.preventDefault();
                                                if (focusIndex >= 0 && filteredSuppliers[focusIndex]) {
                                                    handleSupplierChange(filteredSuppliers[focusIndex].id);
                                                } else if (filteredSuppliers.length === 1) {
                                                    // Auto-select if only one match
                                                    handleSupplierChange(filteredSuppliers[0].id);
                                                }
                                            } else if (e.key === "Escape") {
                                                setShowSuggestions(false);
                                                setFocusIndex(-1);
                                            }
                                        }}
                                        placeholder="Choisir un Fournisseur..."
                                        className="text-2xl font-serif font-black text-slate-800 bg-transparent outline-none hover:text-blue-600 transition-colors pr-8 min-w-[250px] w-full"
                                    />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                        <Plus className="w-4 h-4 rotate-45" />
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && filteredSuppliers.length > 0 && (
                                        <div
                                            ref={supplierListRef}
                                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[300px] overflow-y-auto z-50"
                                        >
                                            {filteredSuppliers.map((supplier, idx) => (
                                                <div
                                                    key={supplier.id}
                                                    onClick={() => handleSupplierChange(supplier.id)}
                                                    onMouseEnter={() => setFocusIndex(idx)}
                                                    className={cn(
                                                        "px-4 py-3 cursor-pointer transition-colors",
                                                        idx === focusIndex
                                                            ? "bg-blue-50 text-blue-700"
                                                            : "hover:bg-slate-50 text-slate-700"
                                                    )}
                                                >
                                                    <div className="font-semibold text-sm">{supplier.name}</div>
                                                    {supplier.code && (
                                                        <div className="text-xs text-slate-400 font-mono">{supplier.code}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono opacity-80">
                                        N°
                                    </span>
                                    <input
                                        type="text"
                                        value={formData.number || ""}
                                        onChange={e => handleNumberChange(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        placeholder="---"
                                        className="bg-transparent text-xs font-bold text-slate-500 uppercase tracking-wider font-mono focus:outline-none focus:text-blue-600 focus:bg-blue-50/50 rounded px-1 transition-all w-full max-w-[200px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Date Selector */}
                        <div className="flex items-center gap-2">
                            <div className="bg-white px-2 py-1 h-16 rounded-2xl flex items-center border border-slate-200 shadow-sm">
                                <div className="flex flex-col px-4 border-r border-slate-100 hover:bg-slate-50 transition-colors rounded-l-lg group justify-center h-full">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Date Facture</span>
                                    <DateInput
                                        value={formData.date || ""}
                                        onChange={val => setFormData({ ...formData, date: val })}
                                        className="bg-transparent border-none text-lg font-black text-slate-700 focus:outline-none w-40 cursor-pointer p-0 h-auto"
                                    />
                                </div>
                                <div className="flex flex-col px-4 hover:bg-slate-50 transition-colors rounded-r-lg group justify-center h-full">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Echéance</span>
                                    <DateInput
                                        value={formData.date ? new Date(new Date(formData.date).setDate(new Date(formData.date).getDate() + 30)).toISOString().split('T')[0] : ""}
                                        onChange={() => { }}
                                        className="bg-transparent border-none text-lg font-black text-slate-300 focus:outline-none w-40 cursor-not-allowed p-0 h-auto"
                                    />
                                </div>
                            </div>
                            <div className="h-16 w-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-all bg-[#E5D1BD]/10 border-[#E5D1BD]/30 text-[#5D4037]">
                                <span className="text-2xl font-black leading-none">30</span>
                                <span className="text-[10px] font-bold uppercase leading-none mt-1">Jours</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar pb-20">
                        <div className="border-b border-slate-200" />

                        {/* Lines */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[#1E293B] rounded-full" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lignes de Facture</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddLine}
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
                                            <th className="px-4 py-2 text-left w-[25%] rounded-tl-xl border-r border-slate-200">Désignation</th>
                                            <th className="px-4 py-2 text-left w-[12%] border-r border-slate-200">Détails</th>
                                            <th className="px-2 py-2 text-right w-[7%] border-r border-slate-200">Qté</th>
                                            <th className="px-2 py-2 text-center w-[12%] border-r border-slate-200">Unité</th>
                                            <th className="px-2 py-2 text-right w-[8%] border-r border-slate-200">PU HT</th>
                                            <th className="px-2 py-2 text-right w-[7%] border-r border-slate-200">TVA %</th>
                                            <th className="px-2 py-2 text-right w-[9%] border-r border-slate-200">Remise %</th>
                                            <th className="px-2 py-2 text-right w-[11%] border-r border-slate-200">Total HT</th>
                                            <th className="px-4 py-2 text-right w-[13%] border-r border-slate-200">Total TTC</th>
                                            <th className="px-2 py-2 w-8 rounded-tr-xl"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="relative [&_tr:last-child_td:first-child]:rounded-bl-xl [&_tr:last-child_td:last-child]:rounded-br-xl">
                                        {formData.lines?.map((line, index) => {
                                            const ht = line.quantity * line.priceHT * (1 - (line.discount || 0) / 100);
                                            return (
                                                <tr key={line.id} className="group hover:bg-slate-50/50 border-b border-slate-200">
                                                    <td className="px-4 py-1 relative border-r border-slate-200">
                                                        <input
                                                            ref={(el) => { designationRefs.current[index] = el; }}
                                                            value={line.articleName}
                                                            onChange={e => handleLineChange(index, "articleName", e.target.value)}
                                                            onKeyDown={(e) => handleArticleKeyDown(e, index)}
                                                            className="w-full bg-transparent font-medium text-slate-700 outline-none placeholder:text-slate-300 truncate"
                                                            placeholder="Article..."
                                                            onFocus={() => {
                                                                setActiveRow(index);
                                                                setFilteredArticles(finalArticles);
                                                                setArticleFocusIndex(-1);
                                                            }}
                                                            onBlur={() => setTimeout(() => setActiveRow(null), 200)}
                                                        />
                                                        {activeRow === index && filteredArticles.length > 0 && (
                                                            <div ref={articleListRef} className="absolute top-full left-0 w-[300px] bg-white shadow-xl rounded-lg border border-slate-200 z-50 max-h-[200px] overflow-y-auto mt-1 custom-scrollbar">
                                                                {filteredArticles.map((a, i) => (
                                                                    <div
                                                                        key={a.id}
                                                                        className={cn(
                                                                            "px-3 py-2 text-xs font-semibold cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                                            i === articleFocusIndex ? "bg-[#E5D1BD] text-[#5D4037]" : "hover:bg-slate-50 text-slate-700"
                                                                        )}
                                                                        onClick={() => handleSelectArticle(index, a)}
                                                                    >
                                                                        {a.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-1 border-r border-slate-200">
                                                        <input
                                                            ref={(el) => { detailsRefs.current[index] = el; }}
                                                            value={line.details || ""}
                                                            onChange={e => handleLineChange(index, "details", e.target.value)}
                                                            onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                                                            onKeyDown={(e) => handleLineKeyDown(e, index, "details")}
                                                            className="w-full bg-transparent font-normal text-slate-500 italic text-[11px] outline-none placeholder:text-slate-300"
                                                            placeholder="Détails..."
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 border-r border-slate-200">
                                                        <input
                                                            ref={(el) => { quantityRefs.current[index] = el; }}
                                                            type="number"
                                                            value={line.quantity}
                                                            onChange={e => handleLineChange(index, "quantity", e.target.value)}
                                                            onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                                            onKeyDown={(e) => handleLineKeyDown(e, index, "quantity")}
                                                            className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 border-r border-slate-200">
                                                        <div className="relative">
                                                            <UnitSelector
                                                                ref={(el) => { unitRefs.current[index] = el; }}
                                                                value={line.unit || ""}
                                                                onChange={(val) => handleLineChange(index, "unit", val)}
                                                                onKeyDown={(e) => handleLineKeyDown(e, index, "unit")}
                                                                type="achat"
                                                                variant="invoice"
                                                                className="w-full"
                                                                textClassName={isValidated ? "cursor-default" : "hover:border-slate-200 border border-transparent"}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 border-r border-slate-200">
                                                        <DecimalInput
                                                            ref={el => { priceRefs.current[index] = el; }}
                                                            value={line.priceHT}
                                                            onChange={(val: number) => handleLineChange(index, "priceHT", val)}
                                                            onKeyDown={(e: any) => handleLineKeyDown(e, index, "priceHT")}
                                                            className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-1 border-r border-slate-200">
                                                        <div className="relative flex items-center">
                                                            <input
                                                                ref={(el) => { vatRefs.current[index] = el; }}
                                                                type="number"
                                                                value={line.vatRate !== undefined ? line.vatRate : 0}
                                                                onChange={e => handleLineChange(index, "vatRate", e.target.value)}
                                                                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                                                                onKeyDown={(e) => handleLineKeyDown(e, index, "vatRate")}
                                                                className="w-full text-right bg-transparent outline-none font-medium text-slate-500 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <span className="absolute right-0 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 border-r border-slate-200">
                                                        <div className="relative flex items-center">
                                                            <input
                                                                ref={(el) => { discountRefs.current[index] = el; }}
                                                                type="number"
                                                                value={line.discount}
                                                                onChange={e => handleLineChange(index, "discount", e.target.value)}
                                                                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                                                                onKeyDown={(e) => handleLineKeyDown(e, index, "discount")}
                                                                className="w-full text-right bg-transparent outline-none font-medium text-slate-500 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <span className="absolute right-0 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-right text-xs font-bold text-slate-600 border-r border-slate-200">
                                                        {ht.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-1 text-right text-xs font-black text-slate-800 border-r border-slate-200">
                                                        {line.totalTTC.toFixed(2)}
                                                    </td>
                                                    <td className="px-2 py-1 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    const newLines = formData.lines?.filter((_, i) => i !== index) || [];
                                                                    updateLines(newLines);
                                                                }}
                                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!formData.lines || formData.lines.length === 0) && (
                                            <tr>
                                                <td colSpan={10} className="py-8 text-center text-slate-400 italic text-xs">
                                                    Aucune ligne. Cliquez sur le bouton "+".
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bloc Totaux juste en dessous du tableau avec espacement minimal */}
                            <div className="flex justify-end -mt-3">
                                <InvoiceFinancials
                                    formData={formData}
                                    handleRoundingChange={handleRoundingChange}
                                />
                            </div>
                        </div>

                        <div className="border-b border-slate-200 mt-6" />
                        <InvoicePayments
                            payments={formData.payments || []}
                            onPaymentsChange={updatePayments}
                            status={formData.status || 'Draft'}
                            invoiceSyncTime={invoice?.syncTime}
                            balanceDue={formData.balanceDue || 0}
                            deposit={formData.deposit || 0}
                        />
                        <InvoiceDocuments
                            comment={formData.comment}
                            onCommentChange={(comment) => setFormData(prev => ({ ...prev, comment }))}
                        />
                    </div>
                </div>
            </GlassCard>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white/50">
                    <div className="w-24 h-24 bg-slate-50 rounded-full mb-6 flex items-center justify-center shadow-sm">
                        <Files className="w-10 h-10 opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-300">Aucune sélection</h3>
                    <p className="text-sm text-slate-400 mt-2">Sélectionnez une facture dans la liste pour voir les détails</p>
                </div>
            )}
        </div>
    );
}
