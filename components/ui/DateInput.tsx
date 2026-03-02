import React from 'react';
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DateInputProps {
    value?: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({ value = "", onChange, className, disabled }) => {
    return (
        <div className="relative w-full group">
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                disabled={disabled}
                className={cn(
                    "w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all font-outfit uppercase tracking-tight",
                    disabled && "opacity-60 cursor-not-allowed",
                    !disabled && "cursor-pointer",
                    className
                )}
            />
            {value && !disabled && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange("");
                    }}
                    className="absolute right-7 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-opacity z-10 opacity-0 group-hover:opacity-100"
                    title="Effacer la date"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};



