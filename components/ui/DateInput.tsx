import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DateInputProps {
    value?: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    className?: string;
}

export const DateInput: React.FC<DateInputProps> = ({ value = "", onChange, className }) => {
    // Split initial value if present
    const parseValue = (val: string) => {
        if (!val) return { d: "", m: "", y: "" };
        const [y, m, d] = val.split("-");
        // Ensure we handle potential "DD/MM/YYYY" or other formats strictly if messy, 
        // but assuming standard YYYY-MM-DD from props as per other comps.
        return {
            d: d || "",
            m: m || "",
            y: y || ""
        };
    };

    const [parts, setParts] = useState(parseValue(value));
    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);
    const hiddenDateRef = useRef<HTMLInputElement>(null);

    // Sync from parent prop change
    useEffect(() => {
        setParts(parseValue(value));
    }, [value]);

    const handleChange = (part: 'd' | 'm' | 'y', val: string) => {
        // Only allow numbers
        if (!/^\d*$/.test(val)) return;

        const newParts = { ...parts, [part]: val };
        setParts(newParts);

        // Auto-focus logic
        if (part === 'd' && val.length === 2) monthRef.current?.focus();
        if (part === 'm' && val.length === 2) yearRef.current?.focus();

        // Construct date string if potentially valid
        // We allow partial updates to be sent? Usually date inputs want full valid dates.
        // But for a smoother UX let's wait until we have a generally full date or at least send it up 
        // so the parent can handle it. BUT standard input type="date" expects YYYY-MM-DD.
        // Let's send it when we have all parts.

        if (newParts.y.length === 4 && newParts.m.length > 0 && newParts.d.length > 0) {
            // Basic formatting to ensure 2 digits
            const d = newParts.d.padStart(2, '0');
            const m = newParts.m.padStart(2, '0');
            const y = newParts.y;
            onChange(`${y}-${m}-${d}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, part: 'd' | 'm' | 'y') => {
        if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
            if (part === 'm') dayRef.current?.focus();
            if (part === 'y') monthRef.current?.focus();
        }
    };

    const triggerCalendar = () => {
        hiddenDateRef.current?.showPicker();
    };

    const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className={cn(
            "flex items-center bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition-all group",
            className
        )}>
            <div className="flex items-center gap-1 flex-1">
                <input
                    ref={dayRef}
                    value={parts.d}
                    onChange={(e) => handleChange('d', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'd')}
                    placeholder="JJ"
                    maxLength={2}
                    className="w-7 bg-transparent text-center font-black text-slate-800 placeholder:text-slate-300 focus:outline-none text-base p-0"
                />
                <span className="text-slate-300 font-bold">/</span>
                <input
                    ref={monthRef}
                    value={parts.m}
                    onChange={(e) => handleChange('m', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'm')}
                    placeholder="MM"
                    maxLength={2}
                    className="w-8 bg-transparent text-center font-black text-slate-800 placeholder:text-slate-300 focus:outline-none text-base p-0"
                />
                <span className="text-slate-300 font-bold">/</span>
                <input
                    ref={yearRef}
                    value={parts.y}
                    onChange={(e) => handleChange('y', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'y')}
                    placeholder="AAAA"
                    maxLength={4}
                    className="w-12 bg-transparent text-center font-black text-slate-800 placeholder:text-slate-300 focus:outline-none text-base p-0"
                />
            </div>

            <button
                onClick={triggerCalendar}
                className="p-1 rounded-md text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                type="button"
            >
                <Calendar className="w-4 h-4" />
            </button>

            {/* Hidden native input for the picker popup */}
            <input
                ref={hiddenDateRef}
                type="date"
                className="sr-only absolute bottom-0 left-0" // hidden but reachable
                value={value}
                onChange={handleNativePickerChange}
                tabIndex={-1}
            />
        </div>
    );
};
