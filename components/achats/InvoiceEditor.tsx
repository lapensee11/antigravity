import { useRef, forwardRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Invoice, InvoiceLine } from "@/lib/types";
import { InvoiceDocuments } from "./editor/InvoiceDocuments";
import { InvoiceFinancials } from "./editor/InvoiceFinancials";
import { InvoicePayments } from "./editor/InvoicePayments";
import { initialFamilies, initialSubFamilies, initialUnits } from "@/lib/data";
import { Trash2, Plus, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";

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
                if (e.key === 'Enter') e.currentTarget.blur();
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

    // Units State
    const [units, setUnits] = usePersistedState<string[]>("bakery_units", initialUnits);
    const [activeUnitRow, setActiveUnitRow] = useState<number | null>(null);
    const [unitFocusIndex, setUnitFocusIndex] = useState(-1);



    // Refs for Focus Management
    const designationRefs = useRef<(HTMLInputElement | null)[]>([]);
    const quantityRefs = useRef<(HTMLInputElement | null)[]>([]);
    const unitRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const priceRefs = useRef<(HTMLInputElement | null)[]>([]);
    const vatRefs = useRef<(HTMLInputElement | null)[]>([]);
    const discountRefs = useRef<(HTMLInputElement | null)[]>([]);

    const prevLinesLength = useRef(0);

    const supplierListRef = useRef<HTMLDivElement>(null);
    const articleListRef = useRef<HTMLDivElement>(null);
    const unitListRef = useRef<HTMLDivElement>(null);


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
            if (invoice.status === "Draft" && (!invoice.supplierId || invoice.supplierId === "") && inputRef.current) {
                // Small timeout to ensure render
                setTimeout(() => inputRef.current?.focus(), 50);
                setShowSuggestions(true);
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

    useEffect(() => {
        setUnitFocusIndex(-1);
    }, [activeUnitRow]);

    // List navigation reset
    useEffect(() => {
        setArticleFocusIndex(-1);
    }, [activeRow]);



    useEffect(() => {
        setFocusIndex(-1);
    }, [showSuggestions]);

    // Auto-scroll logic for suggestions
    useEffect(() => {
        if (focusIndex >= 0 && supplierListRef.current) {
            const el = supplierListRef.current.children[focusIndex] as HTMLElement;
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [focusIndex]);

    useEffect(() => {
        if (articleFocusIndex >= 0 && articleListRef.current) {
            const el = articleListRef.current.children[articleFocusIndex] as HTMLElement;
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [articleFocusIndex]);

    useEffect(() => {
        if (unitFocusIndex >= 0 && unitListRef.current) {
            const el = unitListRef.current.children[unitFocusIndex] as HTMLElement;
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [unitFocusIndex]);



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

    const handleUnitKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (activeUnitRow !== index) return;

        const allOptions = [...units, "Ajouter..."];

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setUnitFocusIndex(prev => Math.min(prev + 1, allOptions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setUnitFocusIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" || e.key === "Tab") {
            if (unitFocusIndex >= 0) {
                e.preventDefault();
                const selected = allOptions[unitFocusIndex];
                if (selected === "Ajouter...") {
                    handleAddNewUnit(index);
                } else {
                    handleLineChange(index, "unit", selected);
                    setActiveUnitRow(null);
                    setTimeout(() => priceRefs.current[index]?.focus(), 50);
                }
            }
        } else if (e.key === "Escape") {
            setActiveUnitRow(null);
        }
    };

    const handleAddNewUnit = (index: number) => {
        const newUnit = prompt("Nouvelle unité :");
        if (newUnit && !units.includes(newUnit)) {
            setUnits(prev => [...prev, newUnit]);
            handleLineChange(index, "unit", newUnit);
            setActiveUnitRow(null);
            setTimeout(() => priceRefs.current[index]?.focus(), 50);
        } else if (newUnit && units.includes(newUnit)) {
            handleLineChange(index, "unit", newUnit);
            setActiveUnitRow(null);
            setTimeout(() => priceRefs.current[index]?.focus(), 50);
        }
    };



    // ... (existing refs)

    // Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeUnitRow !== null && !unitListRef.current?.contains(event.target as Node)) {
                const btn = unitRefs.current[activeUnitRow];
                if (btn && btn.contains(event.target as Node)) return;
                setActiveUnitRow(null);
            }

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
    }, [activeUnitRow, activeRow, showSuggestions]);




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
                                className="text-3xl font-serif font-black text-slate-800 bg-transparent outline-none placeholder:text-slate-200 min-w-[250px] leading-none"
                                placeholder="Nom du Fournisseur"
                            />

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && filteredSuppliers.length > 0 && (
                                <div ref={supplierListRef} className="absolute top-full left-0 w-[400px] bg-white shadow-2xl rounded-xl border border-slate-200 z-50 max-h-[200px] overflow-y-auto mt-2 animate-in fade-in slide-in-from-top-2 custom-scrollbar">
                                    {filteredSuppliers.map((s, i) => (
                                        <div
                                            key={s.id}
                                            className={cn(
                                                "px-4 py-3 text-sm font-bold text-slate-600 cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                i === focusIndex ? "bg-[#E5D1BD] text-[#5D4037]" : "hover:bg-slate-50"
                                            )}
                                            onClick={() => selectSupplier(s.name)}
                                        >
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                        <th className="px-4 py-3 text-left w-[20%] rounded-tl-xl">Désignation</th>
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
                                                        className="w-full text-right bg-transparent outline-none font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Unit (Custom Select) */}
                                                <td className="px-2 py-2">
                                                    <div className="relative">
                                                        <button
                                                            ref={el => { unitRefs.current[index] = el; }}
                                                            disabled={isValidated}
                                                            onClick={() => {
                                                                setActiveUnitRow(index);
                                                                setUnitFocusIndex(units.indexOf(line.unit));
                                                            }}
                                                            onKeyDown={(e) => handleUnitKeyDown(e, index)}
                                                            className={cn(
                                                                "w-full text-center bg-transparent outline-none text-xs font-medium cursor-pointer py-1 border border-transparent rounded transition-all",
                                                                !isValidated ? "hover:border-slate-200" : "cursor-default"
                                                            )}
                                                        >
                                                            {line.unit || "Unit"}
                                                        </button>

                                                        {activeUnitRow === index && !isValidated && (
                                                            <div ref={unitListRef} className="absolute top-full left-1/2 -translate-x-1/2 w-32 bg-white shadow-xl rounded-lg border border-slate-200 z-50 mt-1 py-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                                {units.concat("Ajouter...").map((u, i) => (
                                                                    <div
                                                                        key={u}
                                                                        className={cn(
                                                                            "group flex items-center justify-between px-3 py-2 text-[10px] font-bold cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                                            i === unitFocusIndex ? "bg-[#E5D1BD] text-[#5D4037]" : "hover:bg-slate-50 text-slate-700",
                                                                            u === "Ajouter..." && "text-blue-600 border-t border-slate-100"
                                                                        )}
                                                                        onClick={() => {
                                                                            if (u === "Ajouter...") {
                                                                                handleAddNewUnit(index);
                                                                            } else {
                                                                                handleLineChange(index, "unit", u);
                                                                                setActiveUnitRow(null);
                                                                                setTimeout(() => priceRefs.current[index]?.focus(), 50);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <span>{u}</span>
                                                                        {u !== "Ajouter..." && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const confirmDelete = window.confirm(`Supprimer l'unité "${u}" ?`);
                                                                                    if (confirmDelete) {
                                                                                        setUnits(prev => prev.filter(unit => unit !== u));
                                                                                    }
                                                                                }}
                                                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                                                title="Supprimer l'unité"
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* PU HT */}
                                                <td className="px-2 py-2">
                                                    <DecimalInput
                                                        ref={el => { priceRefs.current[index] = el; }}
                                                        value={line.priceHT}
                                                        onChange={(val: number) => handleLineChange(index, "priceHT", val)}
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
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Tab" && !e.shiftKey && index === (formData.lines?.length || 0) - 1) {
                                                                    e.preventDefault();
                                                                    handleAddLine();
                                                                }
                                                            }}
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
