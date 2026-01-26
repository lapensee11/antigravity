import { useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Invoice, InvoiceLine } from "@/lib/types";
import { Save, Trash2, Copy, RefreshCw, Plus, Calendar, Check, CloudUpload } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InvoiceEditorProps {
    invoice?: Invoice | null;
    onSave: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onSync: (id: string) => void;
    onUpdate?: (invoice: Invoice) => void;
    suppliers?: { id: string; name: string; code: string }[];
    onGenerateNumber?: (name: string) => string;
    articles?: any[];
}

// Helper Component for Strict Decimal Formatting (fr-FR)
const DecimalInput = ({ value, onChange, className, ...props }: any) => {
    const [localValue, setLocalValue] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isEditing) {
            setLocalValue(Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    }, [value, isEditing]);

    const handleFocus = (e: any) => {
        setIsEditing(true);
        // We set the value to string for editing. 
        // If we want to keep it formatted: do nothing special, just editing the string.
        setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
        setIsEditing(false);
        // Parse: remove spaces (including non-breaking), replace comma with dot
        const normalized = localValue.replace(/[\s\u00A0]/g, '').replace(',', '.');
        const num = parseFloat(normalized);
        if (!isNaN(num)) {
            onChange(num);
        } else {
            // Revert if invalid
            setLocalValue(Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        }
    };

    return (
        <input
            {...props}
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (props.onKeyDown) props.onKeyDown(e);
            }}
            className={className}
        />
    );
};

export function InvoiceEditor({ invoice, onSave, onDelete, onSync, onUpdate, suppliers = [], onGenerateNumber, articles = [] }: InvoiceEditorProps) {
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

    // Refs for Focus Management
    const designationRefs = useRef<(HTMLInputElement | null)[]>([]);
    const quantityRefs = useRef<(HTMLInputElement | null)[]>([]);
    const prevLinesLength = useRef(0);

    useEffect(() => {
        if (formData.lines && formData.lines.length > prevLinesLength.current) {
            const lastIndex = formData.lines.length - 1;
            setTimeout(() => designationRefs.current[lastIndex]?.focus(), 50);
        }
        prevLinesLength.current = formData.lines?.length || 0;
    }, [formData.lines]);

    useEffect(() => {
        if (invoice) {
            // Recalculate totals to ensure consistency with lines/payments
            const lines = invoice.lines || [];
            const calculatedHT = lines.reduce((sum, l) => sum + (l.quantity * l.priceHT * (1 - (l.discount || 0) / 100)), 0);
            const calculatedTTC = lines.reduce((sum, l) => sum + l.totalTTC, 0);

            const payments = invoice.payments || [];
            const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const balanceDue = calculatedTTC - totalPaid;

            setFormData({
                ...invoice,
                totalHT: calculatedHT,
                totalTTC: calculatedTTC,
                deposit: totalPaid,
                balanceDue: balanceDue
            });

            prevLinesLength.current = invoice.lines?.length || 0;
            // Auto focus if new draft
            if (invoice.status === "Draft" && (!invoice.supplierId || invoice.supplierId === "") && inputRef.current) {
                // Small timeout to ensure render
                setTimeout(() => inputRef.current?.focus(), 50);
                setShowSuggestions(true);
            }
        } else {
            setFormData({
                status: "Draft",
                date: new Date().toISOString().split('T')[0],
                dateEncaissement: new Date().toISOString().split('T')[0],
                lines: [],
                payments: [],
                totalTTC: 0,
                balanceDue: 0
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoice]);

    // Filter Logic
    useEffect(() => {
        if (!showSuggestions) return;
        if (formData.supplierId) {
            const search = formData.supplierId.toLowerCase();
            setFilteredSuppliers(suppliers.filter(s => s.name.toLowerCase().includes(search)));
        } else {
            setFilteredSuppliers(suppliers);
        }
    }, [formData.supplierId, suppliers, showSuggestions]);

    const selectSupplier = (name: string) => {
        const newNumber = onGenerateNumber ? onGenerateNumber(name) : formData.number;
        const newData = { ...formData, supplierId: name, number: newNumber };
        setFormData(newData);
        if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
        setShowSuggestions(false);
        setFocusIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusIndex(prev => Math.min(prev + 1, filteredSuppliers.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            if (focusIndex >= 0 && filteredSuppliers[focusIndex]) {
                e.preventDefault();
                selectSupplier(filteredSuppliers[focusIndex].name);
                inputRef.current?.blur();
            } else if (filteredSuppliers.length > 0 && formData.supplierId) {
                // Select top match if typing and hitting enter?
                // Or just do nothing.
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    // Pass focusIndex to scrollIntoView logic if needed (skip for now)

    const handleToggleStatus = () => {
        // Toggle Logic: Draft <-> Validated

        const isCurrentlyValidated = formData.status === 'Validated';

        if (isCurrentlyValidated) {
            // Attempting to go back to Draft
            // Check for Reconciliation (Pointage)
            const hasReconciled = formData.payments?.some(p => p.isReconciled);
            if (hasReconciled) {
                alert("Impossible de passer en brouillon : Des paiements sont déjà pointés en banque.\nVeuillez supprimer le pointage avant de modifier la facture.");
                return;
            }

            // Switch to Draft & De-sync
            // "réinitialiser le paiement" -> We keep the lines but they fall back to 'Coffre' logic visually and are desynced
            const updatedData = { ...formData, status: 'Draft' as any };
            setFormData(updatedData);
            if (onUpdate && invoice) onUpdate({ ...invoice, ...updatedData } as Invoice);

        } else {
            // Attempting to Validate
            // Switch to Validated & De-sync (removes from Coffre effectively by needing new sync)
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
        const totalTTC = newLines.reduce((sum, l) => sum + l.totalTTC, 0);

        const newData = { ...formData, lines: newLines, totalHT, totalTTC };
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
        const vat = article.vatRate !== undefined ? article.vatRate : 0;

        const line = {
            ...newLines[index],
            articleId: article.id,
            articleName: article.name,
            unit: article.unitAchat || "Unité",
            vatRate: vat,
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

    const handleAddPayment = () => {
        const newPayment = {
            id: `pay_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            mode: "Virement",
            account: "Banque"
        };
        const newPayments = [...(formData.payments || []), newPayment];
        updatePayments(newPayments);
    };

    const handlePaymentChange = (index: number, field: string, value: any) => {
        const newPayments = [...(formData.payments || [])];
        const payment = { ...newPayments[index] };
        (payment as any)[field] = value;

        // Auto Logic
        if (field === "mode") {
            if (value === "Especes") payment.account = "Caisse";
            else payment.account = "Banque";
        }

        newPayments[index] = payment;
        updatePayments(newPayments);
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
            }
        } else if (e.key === "Escape") {
            setActiveRow(null);
        }
    };

    return (
        <GlassCard className="h-full flex flex-col overflow-hidden">
            {/* Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Header Section */}
                <div className="shrink-0 pt-6 pb-8 pl-5 pr-3 flex items-end justify-between gap-4 bg-gradient-to-b from-white to-[#FDF6E3]/20">

                    {/* LEFT: Toggle & Info */}
                    <div className="flex items-center gap-4">
                        {/* Green Toggle Button */}
                        <button
                            onClick={handleToggleStatus}
                            className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md border shrink-0",
                                isValidated
                                    ? "bg-[#4CAF50] border-[#43A047] shadow-green-200 scale-100"
                                    : "bg-white border-slate-200 text-slate-300 hover:border-slate-300 shadow-sm"
                            )}
                            title={isValidated ? "Facture Déclarée" : "Cliquer pour valider"}
                        >
                            <Check className={cn(
                                "w-6 h-6 stroke-[4px] text-white transition-all duration-500 ease-spring",
                                isValidated ? "opacity-100 scale-100 rotate-[360deg]" : "opacity-0 scale-0 -rotate-90"
                            )} />
                        </button>

                        {/* Info Block */}
                        <div className="flex flex-col gap-0 relative">
                            <input
                                ref={inputRef}
                                value={formData.supplierId || ""}
                                onChange={e => {
                                    const newData = { ...formData, supplierId: e.target.value };
                                    setFormData(newData);
                                    if (onUpdate && invoice) onUpdate({ ...invoice, ...newData } as Invoice);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onKeyDown={handleKeyDown}
                                className="text-3xl font-serif font-black text-slate-900 bg-transparent outline-none placeholder:text-slate-300 min-w-[250px] leading-none"
                                placeholder="Nom du Fournisseur"
                            />

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && filteredSuppliers.length > 0 && (
                                <div className="absolute top-full left-0 w-[350px] bg-white shadow-2xl rounded-xl border border-slate-100 z-50 max-h-[200px] overflow-y-auto mt-2 animate-in fade-in slide-in-from-top-2 custom-scrollbar">
                                    {filteredSuppliers.map((s, i) => (
                                        <div
                                            key={s.id}
                                            className={cn(
                                                "px-4 py-3 text-sm font-bold text-slate-700 cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                i === focusIndex ? "bg-[#FFF8E1] text-[#5D4037]" : "hover:bg-slate-50"
                                            )}
                                            onClick={() => selectSupplier(s.name)}
                                        >
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <span className="text-xs font-bold text-[#A0522D] uppercase tracking-wider font-mono opacity-80 pl-0.5 mt-1">
                                {/* Editable Number */}
                                <input
                                    value={formData.number || ""}
                                    onChange={e => {
                                        setFormData({ ...formData, number: e.target.value });
                                        // Update on type too?
                                        if (onUpdate && invoice) onUpdate({ ...invoice, ...formData, number: e.target.value } as Invoice);
                                    }}
                                    className="bg-transparent outline-none text-[#A0522D] placeholder:text-[#A0522D]/50 w-full"
                                    placeholder="N° Facture"
                                />
                            </span>
                        </div>
                    </div>


                    {/* RIGHT: Date Selector & Delay Pill */}
                    <div className="flex items-center gap-2">
                        {/* Dual Date Selector */}
                        <div className="bg-white px-1 py-0.5 h-11 rounded-xl flex items-center border border-[#D7CCC8] shadow-sm">
                            {/* Date 1: Facture */}
                            <div className="flex flex-col px-3 border-r border-[#D7CCC8] hover:bg-[#FAF3E0]/50 transition-colors rounded-l-lg group justify-center h-full">
                                <span className="text-[8px] font-bold text-[#A0522D] uppercase tracking-wide group-hover:text-[#5D4037] leading-none mb-0.5">Date Facture</span>
                                <input
                                    type="date"
                                    value={formData.date || ""}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="bg-transparent text-[11px] font-bold text-[#5D4037] focus:outline-none w-20 cursor-pointer leading-none"
                                />
                            </div>

                            {/* Date 2: Echéance */}
                            <div className="flex flex-col px-3 hover:bg-[#FAF3E0]/50 transition-colors rounded-r-lg group justify-center h-full">
                                <span className="text-[8px] font-bold text-[#A0522D] uppercase tracking-wide group-hover:text-[#5D4037] leading-none mb-0.5">Echéance</span>
                                <input
                                    type="date"
                                    // Simple calc logic placeholder
                                    value={formData.date ? new Date(new Date(formData.date).setDate(new Date(formData.date).getDate() + 30)).toISOString().split('T')[0] : ""}
                                    disabled
                                    className="bg-transparent text-[11px] font-bold text-[#5D4037] opacity-60 w-20 cursor-not-allowed leading-none"
                                />
                            </div>
                        </div>

                        {/* Delay Pill (Conditional) */}
                        <div className={cn(
                            "h-11 w-11 rounded-xl flex flex-col items-center justify-center border shadow-sm transition-all",
                            "bg-[#FFF8E1] border-[#FFE0B2] text-[#F57C00]" // Amber/Orange look
                        )}>
                            <span className="text-sm font-black leading-none">30</span>
                            <span className="text-[8px] font-bold uppercase leading-none mt-0.5">Jours</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 space-y-6 custom-scrollbar pb-20">


                    {/* Lines */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700">Lignes de Facture</h3>
                            <button
                                onClick={handleAddLine}
                                className="px-3 py-1.5 bg-[#Cca47c] rounded-lg text-xs font-bold text-white hover:bg-[#bca382] flex items-center gap-1 shadow-sm transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Ajouter Ligne
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-[20%]">Désignation</th>
                                        <th className="px-2 py-3 text-right w-[8%]">Qté</th>
                                        <th className="px-2 py-3 text-center w-[12%]">Unité</th>
                                        <th className="px-2 py-3 text-right w-[12%]">PU HT</th>
                                        <th className="px-2 py-3 text-right w-[8%]">TVA %</th>
                                        <th className="px-2 py-3 text-right w-[10%]">Remise %</th>
                                        <th className="px-2 py-3 text-right w-[12%]">Total HT</th>
                                        <th className="px-4 py-3 text-right w-[13%]">Total TTC</th>
                                        <th className="px-2 py-3 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 relative">
                                    {formData.lines?.map((line, index) => {
                                        const ht = line.quantity * line.priceHT * (1 - (line.discount || 0) / 100);
                                        return (
                                            <tr key={line.id} className="group hover:bg-slate-50/50">
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
                                                        <div className="absolute top-full left-0 w-[300px] bg-white shadow-xl rounded-lg border border-slate-200 z-50 max-h-[200px] overflow-y-auto mt-1 custom-scrollbar">
                                                            {filteredArticles.map((a, i) => (
                                                                <div
                                                                    key={a.id}
                                                                    className={cn(
                                                                        "px-3 py-2 text-xs font-semibold cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                                        i === articleFocusIndex ? "bg-[#FFF8E1] text-[#5D4037]" : "hover:bg-slate-50 text-slate-700"
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
                                                        className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Unit (Select) */}
                                                <td className="px-2 py-2">
                                                    <select
                                                        value={line.unit}
                                                        onChange={e => handleLineChange(index, "unit", e.target.value)}
                                                        className="w-full text-center bg-transparent outline-none text-xs font-medium cursor-pointer"
                                                    >
                                                        {["Kg", "L", "Unité", "Carton", "Quintal", "Sac", "Palette", "Plateau"].map(u => (
                                                            <option key={u} value={u}>{u}</option>
                                                        ))}
                                                    </select>
                                                </td>

                                                {/* PU HT */}
                                                <td className="px-2 py-2">
                                                    <DecimalInput
                                                        value={line.priceHT}
                                                        onChange={(val: number) => handleLineChange(index, "priceHT", val)}
                                                        className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* TVA */}
                                                <td className="px-2 py-2">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="number"
                                                            value={line.vatRate !== undefined ? line.vatRate : 0}
                                                            onChange={e => handleLineChange(index, "vatRate", e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-full text-right bg-transparent outline-none font-medium text-slate-500 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <span className="absolute right-0 text-[10px] text-slate-400 font-bold pointer-events-none">%</span>
                                                    </div>
                                                </td>

                                                {/* Discount */}
                                                <td className="px-2 py-2">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="number"
                                                            value={line.discount}
                                                            onChange={e => handleLineChange(index, "discount", e.target.value)}
                                                            onFocus={(e) => e.target.select()}
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
                                                Aucune ligne. Cliquez sur &quot;Ajouter Ligne&quot;.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold text-slate-800 text-xs border-t border-slate-200">
                                    <tr>
                                        <td colSpan={6} className="px-4 py-3 text-right uppercase tracking-wide text-slate-500">Totaux</td>
                                        <td className="px-2 py-3 text-right text-slate-700">{(formData.totalHT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</td>
                                        <td className="px-4 py-3 text-right font-black text-[#5D4037]">{(formData.totalTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} Dh</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Payments Table */}
                    <div className="space-y-3 pt-6 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700">Paiements</h3>
                            <button
                                onClick={handleAddPayment}
                                className="px-3 py-1.5 bg-[#Cca47c] rounded-lg text-xs font-bold text-white hover:bg-[#bca382] flex items-center gap-1 shadow-sm transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" /> Ajouter Paiement
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-[15%]">Date</th>
                                        <th className="px-4 py-3 text-right w-[15%]">Montant</th>
                                        <th className="px-4 py-3 text-center w-[15%]">Mode</th>
                                        <th className="px-4 py-3 text-center w-[15%]">Compte</th>
                                        <th className="px-4 py-3 text-left w-[30%]">Infos Chèque</th>
                                        <th className="px-2 py-3 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.payments?.map((payment, index) => (
                                        <tr key={payment.id} className="group hover:bg-slate-50/50">
                                            {/* Date */}
                                            <td className="px-4 py-2">
                                                <input
                                                    type="date"
                                                    value={payment.date}
                                                    onChange={e => handlePaymentChange(index, "date", e.target.value)}
                                                    className="w-full bg-transparent font-medium text-slate-700 outline-none text-xs"
                                                />
                                            </td>

                                            {/* Amount */}
                                            <td className="px-4 py-2">
                                                <DecimalInput
                                                    value={payment.amount}
                                                    onChange={(val: number) => handlePaymentChange(index, "amount", val)}
                                                    className="w-full text-right bg-transparent outline-none font-bold text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </td>

                                            {/* Mode */}
                                            <td className="px-4 py-2">
                                                <select
                                                    value={payment.mode}
                                                    onChange={e => handlePaymentChange(index, "mode", e.target.value)}
                                                    className="w-full text-center bg-transparent outline-none text-xs font-medium cursor-pointer"
                                                >
                                                    <option value="Cheque">Chèque</option>
                                                    <option value="Virement">Virement</option>
                                                    <option value="Prelevement">Prélèvement</option>
                                                    <option value="Especes">Espèces</option>
                                                </select>
                                            </td>

                                            {/* Account (Computed & Colored) */}
                                            <td className="px-4 py-2 text-center">
                                                {(() => {
                                                    // Determine if "Declared" based on Number (DRAFT prefix means not declared as final invoice usually)
                                                    // Or use status logic? User said "Si jamais elle passe de Brouillon à facture...".
                                                    // Safer to use the toggle status.
                                                    // But we allow Syncing Drafts.
                                                    // If status is "Synced", we need to know if it's a Synced DRAFT or Synced FACTURE.
                                                    // Let's use the Number prefix as the convention.
                                                    const isDraftNumber = formData.number?.startsWith('DRAFT') || formData.number?.startsWith('draft');
                                                    const isDeclared = !isDraftNumber;

                                                    let account = "Coffre";
                                                    let colorClass = "bg-slate-100 text-slate-500 border-slate-200";

                                                    if (isDeclared) {
                                                        if (payment.mode === "Especes") {
                                                            account = "Caisse";
                                                            colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                                        } else {
                                                            account = "Banque";
                                                            colorClass = "bg-[#FFF8E1] text-[#A0522D] border-[#FFE0B2]";
                                                        }
                                                    }

                                                    return (
                                                        <div className={cn(
                                                            "mx-auto w-20 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider select-none",
                                                            colorClass
                                                        )}>
                                                            {account}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Cheque Info */}
                                            <td className="px-4 py-2">
                                                {payment.mode === "Cheque" && (
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="N° Chèque"
                                                            value={payment.reference || ""}
                                                            onChange={e => handlePaymentChange(index, "reference", e.target.value)}
                                                            className="flex-1 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none text-xs placeholder:text-slate-300"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Montant Chèque"
                                                            value={payment.checkAmount || ""}
                                                            onChange={e => handlePaymentChange(index, "checkAmount", parseFloat(e.target.value))}
                                                            className="w-24 bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none text-xs text-right placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                )}
                                            </td>

                                            {/* Delete */}
                                            <td className="px-2 py-2 text-center">
                                                <button
                                                    onClick={() => {
                                                        const newPayments = formData.payments?.filter((_, i) => i !== index) || [];
                                                        updatePayments(newPayments);
                                                    }}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!formData.payments || formData.payments.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-slate-400 italic text-xs">
                                                Aucun paiement. Cliquez sur "Ajouter Paiement".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary & Sync */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {/* Total Payé */}
                        <div className="bg-emerald-50/50 px-3 rounded-lg border border-emerald-100 flex flex-col items-center justify-center text-center h-16">
                            <h4 className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Total Payé</h4>
                            <div className="text-lg font-black text-emerald-700 leading-none">
                                {(formData.deposit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs opacity-60 font-medium">Dh</span>
                            </div>
                        </div>

                        {/* Reste à Payer */}
                        <div className="bg-red-50/50 px-3 rounded-lg border border-red-100 flex flex-col items-center justify-center text-center h-16">
                            <h4 className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Reste à Payer</h4>
                            <div className="text-lg font-black text-red-700 leading-none">
                                {(formData.balanceDue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs opacity-60 font-medium">Dh</span>
                            </div>
                        </div>

                        {/* Sync Button (Mirror) */}
                        <button
                            onClick={() => invoice && onSync(invoice.id)}
                            className={cn(
                                "flex flex-row items-center justify-center gap-3 rounded-lg border transition-all shadow-sm active:scale-95 group relative overflow-hidden h-16",
                                "bg-[#Cca47c] border-[#bca382] hover:bg-[#b08d65]"
                            )}
                        >
                            <div className="relative">
                                {(formData.status === "Synced" || formData.syncTime) ? (
                                    <div className="w-8 h-8 rounded-full bg-[#3E2723] flex items-center justify-center">
                                        <CloudUpload className="w-5 h-5 text-white stroke-[3px]" />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#3E2723] flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                        <RefreshCw className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>

                            <span className="text-xs font-bold leading-none text-white">
                                {(formData.status === "Synced" || formData.syncTime) ? "Synchronisé" : "Prêt"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
