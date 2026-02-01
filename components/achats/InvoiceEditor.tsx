import { useRef, forwardRef } from "react";
import { GlassCard, GlassInput, GlassButton, GlassBadge } from "@/components/ui/GlassComponents";
import { Invoice, InvoiceLine } from "@/lib/types";
import { InvoiceDocuments } from "./editor/InvoiceDocuments";
import { InvoiceFinancials } from "./editor/InvoiceFinancials";
import { InvoicePayments } from "./editor/InvoicePayments";
import { initialFamilies, initialSubFamilies } from "@/lib/data";
import { Trash2, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { deleteUnitGlobal } from "@/lib/data-service";
import { UnitSelector } from "@/components/ui/UnitSelector";
import { AccountingAccount } from "@/lib/types";
import { getAccountingAccounts } from "@/lib/data-service";

interface InvoiceEditorProps {
    invoice?: Invoice | null;
    onSave: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onSync: (id: string) => void;
    onUpdate?: (invoice: Invoice) => void;
    onCreateNew?: () => void;
    onDuplicate?: (isEmpty: boolean) => void;
    suppliers?: { id: string; name: string; code: string }[];
    onGenerateNumber?: (name: string) => string;
    articles?: any[];
    onExit?: () => void;
}

// Helper Component for Strict Decimal Formatting (fr-FR)
const DecimalInput = forwardRef<HTMLInputElement, any>(({ value, onChange, className, ...props }, ref) => {
    const [localValue, setLocalValue] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setLocalValue(Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    }, [value, isEditing]);

    const handleFocus = (e: any) => {
        setIsEditing(true);
        setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        const normalized = localValue.replace(/[\s\u00A0]/g, '').replace(',', '.');
        const num = parseFloat(normalized);
        if (!isNaN(num)) {
            onChange(num);
        } else {
            setLocalValue(Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    };

    return (
        <input
            {...props}
            ref={ref}
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    // Prevent default and let higher-level handlers manage focus
                    // or just blur if it's a standalone field
                }
                if (props.onKeyDown) props.onKeyDown(e);
            }}
            className={className}
        />
    );
});
DecimalInput.displayName = "DecimalInput";

export function InvoiceEditor({ invoice, onSave, onDelete, onSync, onUpdate, onCreateNew, onDuplicate, suppliers = [], onGenerateNumber, articles = [], onExit }: InvoiceEditorProps) {
    const [formData, setFormData] = useState<Partial<Invoice>>({});

    // Autocomplete State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuppliers, setFilteredSuppliers] = useState<{ id: string; name: string; code: string }[]>([]);
    const [focusIndex, setFocusIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    // Article Autocomplete State
    const [activeRow, setActiveRow] = useState<number | null>(null);
    const [filteredArticles, setFilteredArticles] = useState<any[]>([]);
    const [articleFocusIndex, setArticleFocusIndex] = useState(-1);

    // Accounting State
    const [accountingAccounts, setAccountingAccounts] = useState<AccountingAccount[]>([]);

    useEffect(() => {
        getAccountingAccounts().then(setAccountingAccounts);
    }, []);



    // Refs for Focus Management
    const designationRefs = useRef<(HTMLInputElement | null)[]>([]);
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
            // Recalculate totals to ensure consistency with lines/payments
            const lines = invoice.lines || [];
            const calculatedHT = lines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);
            const calculatedTTC = lines.reduce((sum, l) => sum + l.totalTTC, 0);

            let payments = invoice.payments || [];
            if (payments.length === 0) {
                payments = [{
                    id: `pay_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    amount: 0,
                    mode: "Espèces" as const,
                    account: "Caisse" as const
                }];
            }

            const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const balanceDue = calculatedTTC - totalPaid;

            setFormData({
                ...invoice,
                payments: payments, // Use the potentially modified payments array
                totalHT: calculatedHT,
                totalTTC: calculatedTTC,
                deposit: totalPaid,
                balanceDue: balanceDue
            });

            prevLinesLength.current = invoice.lines?.length || 0;
            // Auto focus if new draft
            if (invoice.status === "Draft" && (!invoice.supplierId || invoice.supplierId === "")) {
                // Focus not needed for select as much, but could be useful
            }
        } else {
            const initialPayment = {
                id: `pay_${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                mode: "Espèces" as const,
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoice]);


    // List navigation reset
    useEffect(() => {
        setArticleFocusIndex(-1);
    }, [activeRow]);



    const handleSupplierChange = (id: string) => {
        const supplier = suppliers.find(s => s.id === id);
        const name = supplier ? supplier.name : "";
        const newNumber = onGenerateNumber ? onGenerateNumber(name) : formData.number;
        const newData = { ...formData, supplierId: id, number: newNumber };
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    // Pass focusIndex to scrollIntoView logic if needed (skip for now)

    const handleToggleStatus = () => {
        // Toggle Logic: Draft <-> Validated

        const isCurrentlyValidated = formData.status === 'Validated';

        if (isCurrentlyValidated) {
            // Attempting to go back to Draft

            // 1. Check if synchronized
            if (invoice?.syncTime) {
                alert("Impossible de passer en brouillon : Cette pièce est déjà synchronisée.\nVeuillez d'abord la désynchroniser ou annuler la synchronisation.");
                return;
            }

            // 2. Check for Reconciliation (Pointage)
            const hasReconciled = formData.payments?.some(p => p.isReconciled);
            if (hasReconciled) {
                alert("Impossible de passer en brouillon : Des paiements sont déjà pointés en banque.\nVeuillez supprimer le pointage avant de modifier la facture.");
                return;
            }

            // Switch to Draft & De-sync logic
            const updatedData = { ...formData, status: 'Draft' as any };
            setFormData(updatedData);
            if (onUpdate && invoice) onUpdate({ ...invoice, ...updatedData } as Invoice);

        } else {
            // Attempting to Validate
            const updatedData = { ...formData, status: 'Validated' as any };
            setFormData(updatedData);
            if (onUpdate && invoice) onUpdate({ ...invoice, ...updatedData } as Invoice);
        }
    };

    const isValidated = formData.status === "Validated";
    const isDraft = formData.status === "Draft";

    // --- Line Handlers ---
    const updateLines = (newLines: InvoiceLine[]) => {
        const totalHT = newLines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);

        // Calculate VAT and Discounts
        const totalVAT = newLines.reduce((sum, l) => {
            const lineHT = l.quantity * l.priceHT * (1 - (l.discount || 0) / 100);
            return sum + (lineHT * (l.vatRate / 100));
        }, 0);

        const totalRemise = newLines.reduce((sum, l) => {
            const lineBase = l.quantity * l.priceHT;
            return sum + (lineBase * ((l.discount || 0) / 100));
        }, 0);

        // Explicit Formula: TTC = HT + TVA + Arrondi
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
            totalTTC: 0
        };
        const newLines = [...(formData.lines || []), newLine];
        updateLines(newLines);
        // Focus handled by effect
    };

    const handleLineChange = (index: number, field: keyof InvoiceLine, value: any) => {
        const newLines = [...(formData.lines || [])];
        const line = { ...newLines[index] };

        // Update field
        (line as any)[field] = value;

        // Auto Calc
        const qty = field === "quantity" ? Number(value) : line.quantity;
        const price = field === "priceHT" ? Number(value) : line.priceHT;
        const discount = field === "discount" ? Number(value) : line.discount || 0;
        const vat = line.vatRate !== undefined ? line.vatRate : 0;

        const totalHTLine = qty * price * (1 - discount / 100);
        line.totalTTC = totalHTLine * (1 + vat / 100);

        newLines[index] = line;

        // Autocomplete filter
        if (field === "articleName") {
            setActiveRow(index);
            if (value) {
                setFilteredArticles(articles.filter(a => a.name.toLowerCase().includes(String(value).toLowerCase())));
            } else {
                setFilteredArticles(articles);
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

        // Recalc
        const totalHTLine = line.quantity * line.priceHT * (1 - (line.discount || 0) / 100);
        line.totalTTC = totalHTLine * (1 + vat / 100);

        newLines[index] = line;
        updateLines(newLines);
        setTimeout(() => {
            setActiveRow(null);
            quantityRefs.current[index]?.focus();
        }, 50);
    };

    const handleDuplicateLine = (index: number) => {
        if (!formData.lines) return;
        const lineToClone = formData.lines[index];
        const newLine: InvoiceLine = {
            ...lineToClone,
            id: `line_${Date.now()}`,
            quantity: 0, // Reset quantity as requested ("vide")
            totalTTC: 0
        };

        // Recalc totals for 0 quantity
        const ht = 0 * newLine.priceHT * (1 - (newLine.discount || 0) / 100);
        newLine.totalTTC = ht * (1 + (newLine.vatRate || 0) / 100);

        const newLines = [...formData.lines];
        newLines.splice(index + 1, 0, newLine);
        updateLines(newLines);

        // Focus the new quantity field
        setTimeout(() => {
            quantityRefs.current[index + 1]?.focus();
        }, 50);
    };
    // --- Payment Handlers ---
    const updatePayments = (newPayments: any[]) => {
        const totalPaid = newPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const balanceDue = (formData.totalTTC || 0) - totalPaid;
        const newData = { ...formData, payments: newPayments, deposit: totalPaid, balanceDue }; // deposit as total paid for now?
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
    };

    const handleRoundingChange = (val: number) => {
        const rounding = val;

        // Recalculate based on lines for explicit formula: TTC = HT + TVA + Arrondi
        const lines = formData.lines || [];
        const totalHT = lines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);
        const totalVAT = lines.reduce((sum, l) => {
            const lineHT = l.quantity * l.priceHT * (1 - (l.discount || 0) / 100);
            return sum + (lineHT * (l.vatRate / 100));
        }, 0);

        const newTotalTTC = totalHT + totalVAT + rounding;

        // Update balance due
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
            // If Enter/Tab and list has selection, select it
            if (filteredArticles.length > 0 && articleFocusIndex >= 0 && filteredArticles[articleFocusIndex]) {
                e.preventDefault();
                handleSelectArticle(index, filteredArticles[articleFocusIndex]);
            } else if (e.key === "Enter") {
                // If Enter but no selection, just focus quantity
                e.preventDefault();
                quantityRefs.current[index]?.focus();
            }
        } else if (e.key === "Escape") {
            setActiveRow(null);
        }
    };

    // Global line-to-line navigation
    const handleLineKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (field === "quantity") {
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




    // ... (existing refs)

    // Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeRow !== null && !articleListRef.current?.contains(event.target as Node)) {
                // allow click on input
                if (designationRefs.current[activeRow] && designationRefs.current[activeRow]?.contains(event.target as Node)) return;
                setActiveRow(null);
            }

            if (showSuggestions && !supplierListRef.current?.contains(event.target as Node)) {
                if (inputRef.current && inputRef.current.contains(event.target as Node)) return;
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [activeRow, showSuggestions]);




    return (
        <GlassCard className="h-full flex flex-col overflow-hidden rounded-none shadow-none border-0 font-outfit">
            {/* Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Header Section - Restored Light Style */}
                <div className="shrink-0 pt-6 pb-8 pl-8 pr-6 flex items-end justify-between gap-4 bg-white">
                    <div className="flex items-center gap-4">
                        {/* Status Toggle Button (Restored) */}
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
                            <select
                                value={formData.supplierId || ""}
                                onChange={e => handleSupplierChange(e.target.value)}
                                className="text-2xl font-serif font-black text-slate-800 bg-transparent outline-none cursor-pointer hover:text-blue-600 transition-colors appearance-none pr-8 min-w-[250px]"
                            >
                                <option value="">Choisir un Fournisseur...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                <Plus className="w-4 h-4 rotate-45" />
                            </div>

                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono opacity-80 pl-0.5 mt-1">
                                N° {formData.number || "---"}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Date Selector (Classic Light Design) */}
                    <div className="flex items-center gap-2">
                        <div className="bg-white px-2 py-1 h-16 rounded-2xl flex items-center border border-slate-200 shadow-sm">
                            {/* Date 1: Facture */}
                            <div className="flex flex-col px-4 border-r border-slate-100 hover:bg-slate-50 transition-colors rounded-l-lg group justify-center h-full">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Date Facture</span>
                                <input
                                    type="date"
                                    value={formData.date || ""}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="bg-transparent text-lg font-black text-slate-700 focus:outline-none w-32 cursor-pointer leading-none"
                                />
                            </div>

                            {/* Date 2: Echéance */}
                            <div className="flex flex-col px-4 hover:bg-slate-50 transition-colors rounded-r-lg group justify-center h-full">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Echéance</span>
                                <input
                                    type="date"
                                    value={formData.date ? new Date(new Date(formData.date).setDate(new Date(formData.date).getDate() + 30)).toISOString().split('T')[0] : ""}
                                    disabled
                                    className="bg-transparent text-lg font-black text-slate-300 focus:outline-none w-32 cursor-not-allowed leading-none"
                                />
                            </div>
                        </div>

                        {/* Delay Pill */}
                        <div className="h-16 w-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-all bg-[#E5D1BD]/10 border-[#E5D1BD]/30 text-[#5D4037]">
                            <span className="text-2xl font-black leading-none">30</span>
                            <span className="text-[10px] font-bold uppercase leading-none mt-1">Jours</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar pb-20">

                    {/* Separator Header/Body */}
                    <div className="border-b border-slate-200" />

                    {/* Lines */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-[#1E293B] rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Lignes de Facture</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddLine}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg shadow-gray-400/20 group"
                                >
                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Ajouter Ligne</span>
                                </button>

                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-[#1E293B] overflow-visible shadow-md shadow-gray-300">
                            <table className="w-full text-sm border-separate border-spacing-0">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-2 py-3 text-left w-[8%] rounded-tl-xl">Cpt.</th>
                                        <th className="px-4 py-3 text-left w-[20%]">Désignation</th>
                                        <th className="px-2 py-3 text-right w-[8%]">Qté</th>
                                        <th className="px-2 py-3 text-center w-[12%]">Unité</th>
                                        <th className="px-2 py-3 text-right w-[12%]">PU HT</th>
                                        <th className="px-2 py-3 text-right w-[8%]">TVA %</th>
                                        <th className="px-2 py-3 text-right w-[10%]">Remise %</th>
                                        <th className="px-2 py-3 text-right w-[12%]">Total HT</th>
                                        <th className="px-4 py-3 text-right w-[13%]">Total TTC</th>
                                        <th className="px-2 py-3 w-8 rounded-tr-xl"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 relative [&_tr:last-child_td:first-child]:rounded-bl-xl [&_tr:last-child_td:last-child]:rounded-br-xl">
                                    {formData.lines?.map((line, index) => {
                                        const ht = line.quantity * line.priceHT * (1 - (line.discount || 0) / 100);
                                        return (
                                            <tr key={line.id} className="group hover:bg-slate-50/50">
                                                {/* Accounting Code */}
                                                <td className="px-2 py-2">
                                                    <input
                                                        value={line.accountingCode || ""}
                                                        onChange={e => handleLineChange(index, "accountingCode", e.target.value)}
                                                        className="w-full bg-slate-50 font-mono text-xs font-bold text-slate-500 rounded px-1 py-1 outline-none text-center focus:bg-white focus:ring-1 focus:ring-blue-300"
                                                        placeholder="----"
                                                    />
                                                </td>

                                                {/* Designation (Autocomplete) */}
                                                <td className="px-4 py-2 relative">
                                                    <input
                                                        ref={(el) => { designationRefs.current[index] = el; }}
                                                        value={line.articleName}
                                                        onChange={e => handleLineChange(index, "articleName", e.target.value)}
                                                        onKeyDown={(e) => handleArticleKeyDown(e, index)}
                                                        className="w-full bg-transparent font-medium text-slate-700 outline-none placeholder:text-slate-300 truncate"
                                                        placeholder="Article..."
                                                        onFocus={() => {
                                                            setActiveRow(index);
                                                            setFilteredArticles(articles);
                                                            setArticleFocusIndex(-1);
                                                        }}
                                                        onBlur={() => setTimeout(() => setActiveRow(null), 200)}
                                                    />
                                                    {/* Suggestions */}
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

                                                {/* Qty */}
                                                <td className="px-2 py-2">
                                                    <input
                                                        ref={(el) => { quantityRefs.current[index] = el; }}
                                                        type="number"
                                                        value={line.quantity}
                                                        onChange={e => handleLineChange(index, "quantity", e.target.value)}
                                                        onFocus={(e) => e.target.select()}
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                        onKeyDown={(e) => handleLineKeyDown(e, index, "quantity")}
                                                        className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Unit (Custom Select) */}
                                                <td className="px-2 py-2">
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

                                                {/* PU HT */}
                                                <td className="px-2 py-2">
                                                    <DecimalInput
                                                        ref={el => { priceRefs.current[index] = el; }}
                                                        value={line.priceHT}
                                                        onChange={(val: number) => handleLineChange(index, "priceHT", val)}
                                                        onKeyDown={(e: any) => handleLineKeyDown(e, index, "priceHT")}
                                                        className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* TVA */}
                                                <td className="px-2 py-2">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            ref={(el) => { vatRefs.current[index] = el; }}
                                                            type="number"
                                                            value={line.vatRate !== undefined ? line.vatRate : 0}
                                                            onChange={e => handleLineChange(index, "vatRate", e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            onKeyDown={(e) => handleLineKeyDown(e, index, "vatRate")}
                                                            className="w-full text-right bg-transparent outline-none font-medium text-slate-500 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <span className="absolute right-0 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                                                    </div>
                                                </td>

                                                {/* Discount */}
                                                <td className="px-2 py-2">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            ref={(el) => { discountRefs.current[index] = el; }}
                                                            type="number"
                                                            value={line.discount}
                                                            onChange={e => handleLineChange(index, "discount", e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            onKeyDown={(e) => handleLineKeyDown(e, index, "discount")}
                                                            className="w-full text-right bg-transparent outline-none font-medium text-slate-500 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <span className="absolute right-0 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                                                    </div>
                                                </td>

                                                {/* Total HT (Calc) */}
                                                <td className="px-2 py-2 text-right text-xs font-bold text-slate-600">
                                                    {ht.toFixed(2)}
                                                </td>

                                                {/* Total TTC (Calc) */}
                                                <td className="px-4 py-2 text-right text-xs font-black text-slate-800">
                                                    {line.totalTTC.toFixed(2)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-2 py-2 text-center">
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
                                            <td colSpan={9} className="py-8 text-center text-slate-400 italic text-xs">
                                                Aucune ligne. Cliquez sur le bouton "+".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold text-slate-800 text-xs border-t border-slate-200">
                                    <tr>
                                        <td colSpan={6} className="px-4 py-3 text-right uppercase tracking-wide text-slate-500 rounded-bl-xl">Totaux</td>
                                        <td className="px-2 py-3 text-right text-slate-700">{(formData.totalHT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</td>
                                        <td className="px-4 py-3 text-right font-black text-[#5D4037]">{(formData.totalTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</td>
                                        <td className="rounded-br-xl"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Detailed Calculation Summary */}
                        <InvoiceFinancials
                            formData={formData}
                            handleRoundingChange={handleRoundingChange}
                        />
                    </div>

                    {/* Separator */}
                    <div className="border-b border-slate-200 mt-6" />
                    {/* Payments Table */}
                    {/* Payment Section - Extracted */}
                    <InvoicePayments
                        payments={formData.payments || []}
                        onPaymentsChange={updatePayments}
                        status={formData.status || 'Draft'}
                        invoiceSyncTime={invoice?.syncTime}
                        balanceDue={formData.balanceDue || 0}
                        deposit={formData.deposit || 0}
                        onExit={onExit}
                    />

                    {/* Documents Section */}
                    <InvoiceDocuments
                        comment={formData.comment}
                        onCommentChange={(comment) => setFormData(prev => ({ ...prev, comment }))}
                    />
                </div>
            </div>
        </GlassCard>
    );
}
