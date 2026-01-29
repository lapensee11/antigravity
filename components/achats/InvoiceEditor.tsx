import { useRef, forwardRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput } from "@/components/ui/GlassInput";
import { Invoice, InvoiceLine } from "@/lib/types";
import { initialFamilies, initialSubFamilies, initialUnits } from "@/lib/data";
import { Save, Trash2, Copy, RefreshCw, Plus, Calendar, Check, CloudUpload } from "lucide-react";
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

    // Payment Autocomplete State
    const [activePaymentRow, setActivePaymentRow] = useState<number | null>(null);
    const [paymentModeFocusIndex, setPaymentModeFocusIndex] = useState(-1);

    // Refs for Focus Management
    const designationRefs = useRef<(HTMLInputElement | null)[]>([]);
    const quantityRefs = useRef<(HTMLInputElement | null)[]>([]);
    const unitRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const priceRefs = useRef<(HTMLInputElement | null)[]>([]);
    const vatRefs = useRef<(HTMLInputElement | null)[]>([]);
    const discountRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentDateRefs = useRef<(HTMLInputElement | null)[]>([]);
    const amountRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentModeRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const paymentNoteRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentRefRefs = useRef<(HTMLInputElement | null)[]>([]);
    const prevLinesLength = useRef(0);

    const supplierListRef = useRef<HTMLDivElement>(null);
    const articleListRef = useRef<HTMLDivElement>(null);
    const unitListRef = useRef<HTMLDivElement>(null);
    const paymentListRef = useRef<HTMLDivElement>(null);

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
        setPaymentModeFocusIndex(-1);
    }, [activePaymentRow]);

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

    useEffect(() => {
        if (paymentModeFocusIndex >= 0 && paymentListRef.current) {
            const el = paymentListRef.current.children[paymentModeFocusIndex] as HTMLElement;
            el?.scrollIntoView({ block: 'nearest' });
        }
    }, [paymentModeFocusIndex]);

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

    const handleAddPayment = () => {
        const newPayment = {
            id: `pay_${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            mode: "Espèces" as const,
            account: "Caisse" as const
        };
        const newPayments = [...(formData.payments || []), newPayment];
        updatePayments(newPayments);

        // Focus the new date field
        const index = newPayments.length - 1;
        setTimeout(() => {
            paymentDateRefs.current[index]?.focus();
        }, 50);
    };

    const handlePaymentChange = (index: number, field: string, value: any) => {
        const newPayments = [...(formData.payments || [])];
        const payment = { ...newPayments[index] };
        (payment as any)[field] = value;

        // Auto Logic
        if (field === "mode") {
            if (value === "Espèces") payment.account = "Caisse";
            else payment.account = "Banque";
        }

        newPayments[index] = payment;
        updatePayments(newPayments);
    };

    const MODES = ["Chèque", "Virement", "Prélèvement", "Espèces", "Carte Bancaire"];

    const handlePaymentModeKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (activePaymentRow !== index) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setPaymentModeFocusIndex(prev => Math.min(prev + 1, MODES.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setPaymentModeFocusIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" || e.key === "Tab") {
            if (paymentModeFocusIndex >= 0) {
                e.preventDefault();
                handlePaymentChange(index, "mode", MODES[paymentModeFocusIndex]);
                setActivePaymentRow(null);
                // Focus note field (Infos)
                setTimeout(() => paymentNoteRefs.current[index]?.focus(), 50);
            }
        } else if (e.key === "Escape") {
            setActivePaymentRow(null);
        }
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

    const paymentDayRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentMonthRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentYearRefs = useRef<(HTMLInputElement | null)[]>([]);

    // ... (existing refs)

    // Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activePaymentRow !== null && paymentListRef.current && !paymentListRef.current.contains(event.target as Node)) {
                // Check if the click was on the button itself (to toggle)? 
                // Actually, if we click outside the dropdown, just close it.
                // But we need to make sure we don't close it if we just clicked the button to open it.
                // The button onClick sets activePaymentRow.
                // If we click elsewhere, we want to close.
                // Let's rely on the fact that if we click the button, it might toggle.
                // Simple approach: if target is not in paymentListRef, close.
                // But wait, the button is outside the list ref usually? 
                // In my code structure, the list is absolute positioned relative to the parent div.
                // So if I click the button 'paymentModeRefs.current[index]', I might trigger toggle.

                // Let's try a safer approach: checking if click is inside the container div of the mode cell?
                // Or just:
                if (activePaymentRow !== null && !paymentListRef.current?.contains(event.target as Node)) {
                    // Check if target is the toggle button
                    const btn = paymentModeRefs.current[activePaymentRow];
                    if (btn && btn.contains(event.target as Node)) {
                        // Clicked the button, let the button handler do its thing (toggle)
                        return;
                    }
                    setActivePaymentRow(null);
                }
            }

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
    }, [activePaymentRow, activeUnitRow, activeRow, showSuggestions]);


    const handleDatePartChange = (index: number, part: 'day' | 'month' | 'year', val: string) => {
        const newPayments = [...(formData.payments || [])];
        const payment = { ...newPayments[index] };

        const currentParams = payment.date ? payment.date.split('-') : [new Date().getFullYear().toString(), '01', '01'];
        // YYYY-MM-DD
        let y = currentParams[0];
        let m = currentParams[1];
        let d = currentParams[2];

        if (part === 'day') d = val.padStart(2, '0');
        if (part === 'month') m = val.padStart(2, '0');
        if (part === 'year') y = val;

        // Validation simple
        if (parseInt(m) > 12) m = '12';
        if (parseInt(m) < 1) m = '01';
        if (parseInt(d) > 31) d = '31'; // approx
        if (parseInt(d) < 1) d = '01';

        payment.date = `${y}-${m}-${d}`;
        newPayments[index] = payment;
        updatePayments(newPayments);
    };

    const handleDateArrow = (index: number, part: 'day' | 'month' | 'year', direction: 'up' | 'down') => {
        const newPayments = [...(formData.payments || [])];
        const payment = { ...newPayments[index] };

        const parts = payment.date ? payment.date.split('-') : [];
        let date;
        if (parts.length === 3) {
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            date = new Date();
        }

        const change = direction === 'up' ? 1 : -1;

        if (part === 'day') {
            date.setDate(date.getDate() + change);
        } else if (part === 'month') {
            date.setMonth(date.getMonth() + change);
        } else if (part === 'year') {
            date.setFullYear(date.getFullYear() + change);
        }

        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');

        payment.date = `${y}-${m}-${d}`;
        newPayments[index] = payment;
        updatePayments(newPayments);
    };

    return (
        <GlassCard className="h-full flex flex-col overflow-hidden rounded-none shadow-none border-0 font-outfit">
            {/* Content Container */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Header Section - Restored Light Style */}
                <div className="shrink-0 pt-6 pb-8 pl-8 pr-6 flex items-end justify-between gap-4 bg-[#FBF7F4] border-b border-slate-100">
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


                    {/* Lines */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-[#E5D1BD] rounded-full" />
                                <h3 className="text-sm font-bold text-slate-700">Lignes de Facture</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddLine}
                                className="px-3 py-1.5 bg-[#E5D1BD] rounded-lg text-xs font-bold text-[#5D4037] shadow-sm hover:bg-[#D7CCC8] hover:scale-105 transition-all flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Ajouter Ligne
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
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-[#E5D1BD] rounded-full" />
                                <h3 className="text-sm font-bold text-slate-700">Paiements</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddPayment}
                                className="px-3 py-1.5 bg-[#E5D1BD] rounded-lg text-xs font-bold text-[#5D4037] shadow-sm hover:bg-[#D7CCC8] hover:scale-105 transition-all flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Ajouter Paiement
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-visible shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-[12%]">Date</th>
                                        <th className="px-4 py-3 text-right w-[12%]">Montant</th>
                                        <th className="px-4 py-3 text-center w-[12%]">Mode</th>
                                        <th className="px-4 py-3 text-center w-[10%]">Compte</th>
                                        <th className="px-4 py-3 text-left w-[15%]">N° Chèque</th>
                                        <th className="px-4 py-3 text-left w-[25%]">Info</th>
                                        <th className="px-2 py-3 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {formData.payments?.map((payment, index) => {
                                        const handleDateArrow = (paymentIndex: number, part: "day" | "month" | "year", direction: "up" | "down") => {
                                            const currentPayment = formData.payments?.[paymentIndex];
                                            if (!currentPayment || !currentPayment.date) return;

                                            const [yearStr, monthStr, dayStr] = currentPayment.date.split('-');
                                            let year = parseInt(yearStr, 10);
                                            let month = parseInt(monthStr, 10);
                                            let day = parseInt(dayStr, 10);

                                            const date = new Date(year, month - 1, day); // Month is 0-indexed for Date object

                                            if (direction === "up") {
                                                if (part === "day") {
                                                    date.setDate(date.getDate() + 1);
                                                } else if (part === "month") {
                                                    date.setMonth(date.getMonth() + 1);
                                                } else if (part === "year") {
                                                    date.setFullYear(date.getFullYear() + 1);
                                                }
                                            } else { // direction === "down"
                                                if (part === "day") {
                                                    date.setDate(date.getDate() - 1);
                                                } else if (part === "month") {
                                                    date.setMonth(date.getMonth() - 1);
                                                } else if (part === "year") {
                                                    date.setFullYear(date.getFullYear() - 1);
                                                }
                                            }

                                            const newYear = date.getFullYear().toString();
                                            const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
                                            const newDay = date.getDate().toString().padStart(2, '0');

                                            // Update the entire date string
                                            const newDateString = `${newYear}-${newMonth}-${newDay}`;
                                            handlePaymentChange(paymentIndex, "date", newDateString);
                                        };

                                        return (
                                            <tr key={payment.id} className="group hover:bg-slate-50/50">
                                                {/* Date Split */}
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-1">
                                                        {/* DD */}
                                                        <input
                                                            ref={el => { paymentDayRefs.current[index] = el; }}
                                                            type="text"
                                                            maxLength={2}
                                                            placeholder="JJ"
                                                            value={payment.date ? payment.date.split('-')[2] : ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, '');
                                                                handleDatePartChange(index, "day", val);
                                                                if (val.length === 2) paymentMonthRefs.current[index]?.focus();
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "ArrowUp") {
                                                                    e.preventDefault();
                                                                    handleDateArrow(index, "day", "up");
                                                                } else if (e.key === "ArrowDown") {
                                                                    e.preventDefault();
                                                                    handleDateArrow(index, "day", "down");
                                                                } else if (e.key === "Tab" && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    paymentMonthRefs.current[index]?.focus();
                                                                }
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-7 text-center bg-transparent border-b border-slate-200 outline-none text-xs font-medium placeholder:text-slate-300 focus:bg-[#2196F3] focus:text-white focus:border-transparent focus:rounded-sm transition-all"
                                                        />
                                                        <span className="text-slate-300">/</span>
                                                        {/* MM */}
                                                        <input
                                                            ref={el => { paymentMonthRefs.current[index] = el; }}
                                                            type="text"
                                                            maxLength={2}
                                                            placeholder="MM"
                                                            value={payment.date ? payment.date.split('-')[1] : ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, '');
                                                                handleDatePartChange(index, "month", val);
                                                                if (val.length === 2) paymentYearRefs.current[index]?.focus();
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "ArrowUp") {
                                                                    e.preventDefault();
                                                                    handleDateArrow(index, "month", "up");
                                                                } else if (e.key === "ArrowDown") {
                                                                    e.preventDefault();
                                                                    handleDateArrow(index, "month", "down");
                                                                } else if (e.key === "Tab" && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    paymentYearRefs.current[index]?.focus();
                                                                } else if (e.key === "Tab" && e.shiftKey) {
                                                                    e.preventDefault();
                                                                    paymentDayRefs.current[index]?.focus();
                                                                } else if (e.key === "Backspace" && !e.currentTarget.value) {
                                                                    paymentDayRefs.current[index]?.focus();
                                                                }
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-7 text-center bg-transparent border-b border-slate-200 outline-none text-xs font-medium placeholder:text-slate-300 focus:bg-[#2196F3] focus:text-white focus:border-transparent focus:rounded-sm transition-all"
                                                        />
                                                        <span className="text-slate-300">/</span>
                                                        {/* YYYY */}
                                                        <input
                                                            ref={el => { paymentYearRefs.current[index] = el; }}
                                                            type="text"
                                                            maxLength={4}
                                                            placeholder="AAAA"
                                                            value={payment.date ? payment.date.split('-')[0] : ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, '');
                                                                handleDatePartChange(index, "year", val);
                                                                if (val.length === 4) amountRefs.current[index]?.focus();
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "ArrowUp") {
                                                                    e.preventDefault();
                                                                    handleDateArrow(index, "year", "up");
                                                                } else if (e.key === "ArrowDown") {
                                                                    e.preventDefault();
                                                                    handleDateArrow(index, "year", "down");
                                                                } else if (e.key === "Tab" && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    amountRefs.current[index]?.focus();
                                                                } else if (e.key === "Tab" && e.shiftKey) {
                                                                    e.preventDefault();
                                                                    paymentMonthRefs.current[index]?.focus();
                                                                } else if (e.key === "Backspace" && !e.currentTarget.value) {
                                                                    paymentMonthRefs.current[index]?.focus();
                                                                }
                                                            }}
                                                            onFocus={(e) => e.target.select()}
                                                            className="w-10 text-center bg-transparent border-b border-slate-200 outline-none text-xs font-medium placeholder:text-slate-300 focus:bg-[#2196F3] focus:text-white focus:border-transparent focus:rounded-sm transition-all"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Amount */}
                                                <td className="px-4 py-2">
                                                    <DecimalInput
                                                        ref={el => { amountRefs.current[index] = el; }}
                                                        value={payment.amount}
                                                        onChange={(val: number) => handlePaymentChange(index, "amount", val)}
                                                        onKeyDown={(e: React.KeyboardEvent) => {
                                                            if (e.key === "Tab" && !e.shiftKey) {
                                                                e.preventDefault();
                                                                paymentModeRefs.current[index]?.focus();
                                                            } else if (e.key === "Tab" && e.shiftKey) {
                                                                e.preventDefault();
                                                                paymentYearRefs.current[index]?.focus();
                                                            }
                                                        }}
                                                        className="w-full text-right bg-transparent outline-none font-bold text-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </td>

                                                {/* Mode */}
                                                <td className="px-4 py-2">
                                                    <div className="relative">
                                                        <button
                                                            ref={el => { paymentModeRefs.current[index] = el; }}
                                                            onClick={() => {
                                                                if (activePaymentRow === index) {
                                                                    setActivePaymentRow(null);
                                                                } else {
                                                                    setActivePaymentRow(index);
                                                                    setPaymentModeFocusIndex(MODES.indexOf(payment.mode));
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (activePaymentRow !== index) {
                                                                        setActivePaymentRow(index);
                                                                        setPaymentModeFocusIndex(MODES.indexOf(payment.mode));
                                                                    } else {
                                                                        const dir = e.key === "ArrowDown" ? 1 : -1;
                                                                        const nextIndex = Math.min(Math.max(0, paymentModeFocusIndex + dir), MODES.length - 1);
                                                                        setPaymentModeFocusIndex(nextIndex);
                                                                    }
                                                                } else if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (activePaymentRow === index) {
                                                                        if (paymentModeFocusIndex >= 0) {
                                                                            const selectedMode = MODES[paymentModeFocusIndex];
                                                                            handlePaymentChange(index, "mode", selectedMode);
                                                                            setActivePaymentRow(null);
                                                                            if (selectedMode === "Chèque") {
                                                                                setTimeout(() => paymentRefRefs.current[index]?.focus(), 50);
                                                                            } else {
                                                                                setTimeout(() => paymentNoteRefs.current[index]?.focus(), 50);
                                                                            }
                                                                        }
                                                                    } else {
                                                                        setActivePaymentRow(index);
                                                                        setPaymentModeFocusIndex(MODES.indexOf(payment.mode));
                                                                    }
                                                                } else if (e.key === "Tab" && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    setActivePaymentRow(null);
                                                                    if (payment.mode === "Chèque") {
                                                                        paymentRefRefs.current[index]?.focus();
                                                                    } else {
                                                                        paymentNoteRefs.current[index]?.focus();
                                                                    }
                                                                } else if (e.key === "Tab" && e.shiftKey) {
                                                                    e.preventDefault();
                                                                    amountRefs.current[index]?.focus();
                                                                } else if (e.key === "Escape") {
                                                                    setActivePaymentRow(null);
                                                                }
                                                            }}
                                                            className="w-full text-center bg-transparent outline-none text-xs font-medium cursor-pointer py-1 border border-transparent hover:border-slate-200 rounded focus:border-blue-500 focus:bg-slate-50"
                                                        >
                                                            {payment.mode}
                                                        </button>

                                                        {activePaymentRow === index && (
                                                            <div ref={paymentListRef} className="absolute top-full left-1/2 -translate-x-1/2 w-40 bg-white shadow-xl rounded-lg border border-slate-200 z-50 mt-1 py-1">
                                                                {MODES.map((mode, i) => (
                                                                    <div
                                                                        key={mode}
                                                                        className={cn(
                                                                            "px-3 py-2 text-xs font-semibold cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                                            i === paymentModeFocusIndex ? "bg-[#e5d1bd] text-[#5D4037]" : "hover:bg-slate-50 text-slate-700"
                                                                        )}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation(); // Stop propagation to prevent button's onClick from firing again
                                                                            handlePaymentChange(index, "mode", mode);
                                                                            setActivePaymentRow(null);
                                                                            if (mode === "Chèque") {
                                                                                setTimeout(() => paymentRefRefs.current[index]?.focus(), 50);
                                                                            } else {
                                                                                setTimeout(() => paymentNoteRefs.current[index]?.focus(), 50);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {mode}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Account (Computed & Colored) */}
                                                <td className="px-4 py-2 text-center">
                                                    {(() => {
                                                        // Pièce Achat = Document fourni à la livraison.
                                                        // Si déclarée (Validated) = Facture. Sinon = Brouillon.
                                                        const isDraft = formData.status !== 'Validated';
                                                        const isSynced = !!invoice?.syncTime;

                                                        let account = "Caisse"; // Default appearance when not synced
                                                        let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";

                                                        if (isSynced) {
                                                            if (isDraft) {
                                                                // Even if draft, show the intended account based on mode?
                                                                // User wants: "dès qu'on selectionne un mode de paiement, le compte associé doit être modifié"
                                                                if (payment.mode === "Espèces") {
                                                                    account = "Caisse";
                                                                    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                                                } else {
                                                                    account = "Banque";
                                                                    colorClass = "bg-[#FFF8E1] text-[#A0522D] border-[#FFE0B2]";
                                                                }
                                                            } else {
                                                                if (payment.mode === "Espèces") {
                                                                    account = "Caisse";
                                                                    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                                                } else {
                                                                    account = "Banque";
                                                                    colorClass = "bg-[#FFF8E1] text-[#A0522D] border-[#FFE0B2]";
                                                                }
                                                            }
                                                        } else {
                                                            // Non-synced Draft or Ready Invoice
                                                            // User wants immediate feedback:
                                                            if (payment.mode === "Espèces") {
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

                                                {/* Cheque Info (N° Chèque) - Swapped Order */}
                                                <td className="px-4 py-2">
                                                    {payment.mode === "Chèque" ? (
                                                        <input
                                                            ref={el => { paymentRefRefs.current[index] = el; }}
                                                            placeholder="N° Chèque"
                                                            value={payment.reference || ""}
                                                            onChange={e => handlePaymentChange(index, "reference", e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Tab" && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    paymentNoteRefs.current[index]?.focus();
                                                                } else if (e.key === "Tab" && e.shiftKey) {
                                                                    e.preventDefault();
                                                                    // Tab back to Mode? Or Account (which is not focusable)?
                                                                    // Account is visual. So Back to Mode button (paymentModeRefs).
                                                                    paymentModeRefs.current[index]?.focus();
                                                                }
                                                            }}
                                                            className="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none text-xs placeholder:text-slate-300"
                                                        />
                                                    ) : (
                                                        <span className="block w-full border-b border-transparent">&nbsp;</span>
                                                    )}
                                                </td>

                                                {/* Note (Infos) - Swapped Order */}
                                                <td className="px-4 py-2">
                                                    <input
                                                        ref={el => { paymentNoteRefs.current[index] = el; }}
                                                        placeholder="Infos..."
                                                        value={payment.note || ""}
                                                        onChange={e => handlePaymentChange(index, "note", e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Tab" && !e.shiftKey) {
                                                                if (index === (formData.payments?.length || 0) - 1) {
                                                                    e.preventDefault();
                                                                    // Exit editing and go to list
                                                                    if (onExit) onExit();
                                                                }
                                                            } else if (e.key === "Tab" && e.shiftKey) {
                                                                e.preventDefault();
                                                                if (payment.mode === "Chèque") {
                                                                    paymentRefRefs.current[index]?.focus();
                                                                } else {
                                                                    // Back to Mode
                                                                    paymentModeRefs.current[index]?.focus();
                                                                }
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-b border-slate-100 focus:border-blue-400 outline-none text-xs placeholder:text-slate-300"
                                                    />
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
                                        );
                                    })}
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

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
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
                    </div>
                </div>
            </div >
        </GlassCard >
    );
}
