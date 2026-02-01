import React, { forwardRef, useState, useEffect } from "react";
import { Invoice } from "@/lib/types";

// Helper Component for Strict Decimal Formatting (fr-FR)
// Copied from main file, could be moved to ui/DecimalInput later
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

interface InvoiceFinancialsProps {
    formData: Partial<Invoice>;
    handleRoundingChange: (val: number) => void;
}

export const InvoiceFinancials: React.FC<InvoiceFinancialsProps> = ({ formData, handleRoundingChange }) => {
    return (
        <div className="flex justify-end mt-4">
            <div className="bg-[#1E293B] text-white rounded-xl py-3 px-6 flex items-center gap-8 shadow-lg shadow-gray-400/20">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total HT</span>
                    <span className="text-sm font-black">{(formData.totalHT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-60">Dh</span></span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TVA</span>
                    <span className="text-sm font-black">{((formData as any).totalVAT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-60">Dh</span></span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remise</span>
                    <span className="text-sm font-black text-white">{((formData as any).totalRemise || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-[10px] opacity-60 font-medium">Dh</span></span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrondi</span>
                    <div className="flex items-baseline gap-1">
                        <DecimalInput
                            value={formData.rounding || 0}
                            onChange={handleRoundingChange}
                            className="text-sm font-black text-orange-400 bg-transparent outline-none w-16 text-right border-b border-orange-400/20 focus:border-orange-400 transition-colors"
                        />
                        <span className="text-[10px] opacity-60 font-medium text-orange-400">Dh</span>
                    </div>
                </div>
                <div className="w-px h-10 bg-white/20 mx-2" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Total TTC</span>
                    <span className="text-xl font-black text-blue-400">{(formData.totalTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs opacity-80">Dh</span></span>
                </div>
            </div>
        </div>
    );
};
