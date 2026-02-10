import React, { useRef, useState, forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/DateInput";

// --- Types ---
// Assuming these are compatible with your main types. 
// If specific types define Payment, import them. 
// For now using any/loose typing as seen in the original file to be safe, 
// but in a real refactor we should import shared types.
interface Payment {
    id?: string;
    amount: number;
    mode: string;
    date: string;
    account?: string;
    reference?: string;
    note?: string;
}

interface InvoicePaymentsProps {
    payments: Payment[];
    onPaymentsChange: (payments: Payment[]) => void;
    status: string; // 'Draft' | 'Validated' etc.
    invoiceSyncTime?: string;
    balanceDue: number;
    deposit: number;
    onExit?: () => void;
}

const MODES = ["Chèques", "Espèces", "Virement", "Prélèvement"];

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
        setLocalValue(Number(value).toString());
        e.target.select();
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


export const InvoicePayments: React.FC<InvoicePaymentsProps> = ({
    payments = [],
    onPaymentsChange,
    status,
    invoiceSyncTime,
    balanceDue,
    deposit,
    onExit
}) => {
    // Refs
    const amountRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentModeRefs = useRef<(HTMLButtonElement | null)[]>([]);
    // const paymentYearRefs = useRef<(HTMLInputElement | null)[]>([]); // Not fully used in original snippet? Keeping for safety if needed
    const paymentDateRefs = useRef<(HTMLInputElement | null)[]>([]); // For the hidden date input or wrapper
    const paymentRefRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentNoteRefs = useRef<(HTMLInputElement | null)[]>([]);
    const paymentListRef = useRef<HTMLDivElement>(null);

    // Local State
    const [activePaymentRow, setActivePaymentRow] = useState<number | null>(null);
    const [paymentModeFocusIndex, setPaymentModeFocusIndex] = useState<number>(-1);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    // Click outside handler for payment mode dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activePaymentRow !== null &&
                paymentListRef.current &&
                !paymentListRef.current.contains(event.target as Node) &&
                !paymentModeRefs.current[activePaymentRow]?.contains(event.target as Node)) {
                setActivePaymentRow(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePaymentRow]);


    // Handlers
    const handlePaymentChange = (index: number, field: string, value: any) => {
        const safePayments = Array.isArray(payments) ? payments : [];
        if (index < 0 || index >= safePayments.length) return;

        const newPayments = [...safePayments];
        newPayments[index] = { ...newPayments[index], [field]: value };
        onPaymentsChange(newPayments);
    };

    const handleAddPayment = () => {
        const safePayments = Array.isArray(payments) ? payments : [];
        const newPayment = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: 0,
            mode: "Chèques",
            date: new Date().toISOString().split('T')[0],
            account: "Caisse"
        };
        const newPayments = [...safePayments, newPayment];

        onPaymentsChange(newPayments);

        // Auto focus logic
        setTimeout(() => {
            const lastIndex = newPayments.length - 1;
            amountRefs.current[lastIndex]?.focus();
        }, 100);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-4 mt-8">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#1E293B] rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Paiements & Echéances</h3>
                </div>
                <button
                    onClick={handleAddPayment}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg shadow-gray-400/20 group"
                >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ajouter Paiement</span>
                </button>
            </div>

            <div className="bg-white rounded-xl border border-[#1E293B] overflow-hidden shadow-md shadow-gray-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 tracking-wider">
                            <tr>
                                <th className="px-4 py-3 text-left w-32">Date</th>
                                <th className="px-4 py-3 text-right w-32">Montant</th>
                                <th className="px-4 py-3 text-center w-32">Mode</th>
                                <th className="px-4 py-3 text-center w-24">Compte</th>
                                <th className="px-4 py-3 text-left w-32">N° Pièce/Chèque</th>
                                <th className="px-4 py-3 text-left">Note</th>
                                <th className="px-2 py-3 w-8"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.map((payment, index) => {
                                return (
                                    <tr key={payment.id || index} className="group hover:bg-slate-50/50">
                                        {/* Date */}
                                        <td className="px-4 py-2 w-48">
                                            <DateInput
                                                value={payment.date}
                                                onChange={(val: string) => handlePaymentChange(index, "date", val)}
                                                className="bg-transparent border-slate-200 text-slate-700 h-8"
                                            />
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
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setDropdownPos({
                                                            top: rect.bottom + window.scrollY,
                                                            left: rect.left + window.scrollX + (rect.width / 2),
                                                            width: 160 // Matches the w-40 class
                                                        });
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
                                                                    if (selectedMode === "Chèques") {
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
                                                            if (payment.mode === "Chèques") {
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

                                                {activePaymentRow === index && typeof document !== 'undefined' && createPortal(
                                                    <div
                                                        ref={paymentListRef}
                                                        style={{
                                                            position: 'absolute',
                                                            top: `${dropdownPos.top}px`,
                                                            left: `${dropdownPos.left}px`,
                                                            transform: 'translateX(-50%)',
                                                            width: `${dropdownPos.width}px`
                                                        }}
                                                        className="bg-white shadow-2xl rounded-lg border border-slate-200 z-[9999] mt-1 py-1"
                                                    >
                                                        {MODES.map((mode, i) => (
                                                            <div
                                                                key={mode}
                                                                className={cn(
                                                                    "px-3 py-2 text-xs font-semibold cursor-pointer transition-colors border-b border-slate-50 last:border-0",
                                                                    i === paymentModeFocusIndex ? "bg-[#e5d1bd] text-[#5D4037]" : "hover:bg-slate-50 text-slate-700"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePaymentChange(index, "mode", mode);
                                                                    setActivePaymentRow(null);
                                                                    if (mode === "Chèques") {
                                                                        setTimeout(() => paymentRefRefs.current[index]?.focus(), 50);
                                                                    } else {
                                                                        setTimeout(() => paymentNoteRefs.current[index]?.focus(), 50);
                                                                    }
                                                                }}
                                                            >
                                                                {mode}
                                                            </div>
                                                        ))}
                                                    </div>,
                                                    document.body
                                                )}
                                            </div>
                                        </td>

                                        {/* Account (Computed & Colored) */}
                                        <td className="px-4 py-2 text-center">
                                            {(() => {
                                                const isDraft = status !== 'Validated';
                                                const isSynced = !!invoiceSyncTime;

                                                let account = "Caisse";
                                                let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";

                                                if (payment.mode !== "Espèces") {
                                                    account = "Banque";
                                                    colorClass = "bg-[#FFF8E1] text-[#A0522D] border-[#FFE0B2]";
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

                                        {/* Cheque Info (N° Chèque) */}
                                        <td className="px-4 py-2">
                                            {payment.mode === "Chèques" ? (
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
                                                            paymentModeRefs.current[index]?.focus();
                                                        }
                                                    }}
                                                    className="w-full bg-transparent border-b border-slate-200 focus:border-blue-400 outline-none text-xs placeholder:text-slate-300"
                                                />
                                            ) : (
                                                <span className="block w-full border-b border-transparent">&nbsp;</span>
                                            )}
                                        </td>

                                        {/* Note (Infos) */}
                                        <td className="px-4 py-2">
                                            <input
                                                ref={el => { paymentNoteRefs.current[index] = el; }}
                                                placeholder="Infos..."
                                                value={payment.note || ""}
                                                onChange={e => handlePaymentChange(index, "note", e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Tab" && !e.shiftKey) {
                                                        if (index === payments.length - 1) {
                                                            e.preventDefault();
                                                            if (onExit) onExit();
                                                        }
                                                    } else if (e.key === "Tab" && e.shiftKey) {
                                                        e.preventDefault();
                                                        if (payment.mode === "Chèques") {
                                                            paymentRefRefs.current[index]?.focus();
                                                        } else {
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
                                                    const newPayments = payments.filter((_, i) => i !== index);
                                                    onPaymentsChange(newPayments);
                                                }}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(payments.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="py-6 text-center text-slate-400 italic text-xs">
                                        Aucun paiement. Cliquez sur le bouton "+".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Add Button Below Payments Table */}
            <div className="mt-2 flex justify-start">
                <button
                    type="button"
                    onClick={handleAddPayment}
                    className="w-8 h-8 bg-[#1E293B] text-white rounded-lg flex items-center justify-center hover:bg-slate-700 transition-all shadow-md shadow-slate-200 group active:scale-95 translate-x-1"
                    title="Ajouter un paiement rapidement"
                >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end mt-4">
                <div className="bg-[#1E293B] text-white rounded-xl py-3 px-6 flex items-center gap-8 shadow-lg shadow-gray-400/20 h-16">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payé</span>
                        <span className="text-lg font-black text-emerald-400 leading-none">
                            {(deposit || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs opacity-60 font-medium">Dh</span>
                        </span>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reste à Payer</span>
                        <span className="text-lg font-black text-red-400 leading-none">
                            {(balanceDue || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs opacity-60 font-medium">Dh</span>
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};
