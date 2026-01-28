"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface PayrollDatePickerProps {
    value: string; // Format: "DD/MM/YYYY" or "-"
    onChange: (value: string) => void;
    gender?: "Homme" | "Femme";
    placeholder?: string;
    className?: string;
}

export function PayrollDatePicker({
    value,
    onChange,
    gender = "Homme",
    className
}: PayrollDatePickerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);
    const nativeRef = useRef<HTMLInputElement>(null);

    // Parse initial value (DD/MM/YYYY -> YYYY-MM-DD for native)
    const toNative = (v: string) => {
        if (!v || v === "-") return "";
        const parts = v.split("/");
        if (parts.length !== 3) return "";
        const [d, m, y] = parts;
        if (d.includes("?") || m.includes("?") || y.includes("?")) return "";
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    };

    const fromNative = (v: string) => {
        if (!v) return ["", "", ""];
        const [y, m, d] = v.split("-");
        return [d, m, y];
    };

    // State for segments
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");

    // Initial load and sync from props
    useEffect(() => {
        if (value && value !== "-") {
            const [d, m, y] = value.split("/");
            setDay(d === "??" ? "" : d);
            setMonth(m === "??" ? "" : m);
            setYear(y === "????" ? "" : y);
        } else {
            setDay("");
            setMonth("");
            setYear("");
        }
    }, [value]);

    const notifyParent = (d: string, m: string, y: string) => {
        if (!d && !m && !y) {
            onChange("-");
            return;
        }
        // Send as is, parent handles partials or we pad lightly
        const dStr = d || "??";
        const mStr = m || "??";
        const yStr = y || "????";
        onChange(`${dStr}/${mStr}/${yStr}`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, part: "day" | "month" | "year") => {
        const val = e.target.value.replace(/\D/g, "");
        if (part === "day") {
            const truncated = val.slice(0, 2);
            setDay(truncated);
            if (truncated.length === 2) {
                monthRef.current?.focus();
                notifyParent(truncated, month, year);
            }
        } else if (part === "month") {
            const truncated = val.slice(0, 2);
            setMonth(truncated);
            if (truncated.length === 2) {
                yearRef.current?.focus();
                notifyParent(day, truncated, year);
            }
        } else {
            const truncated = val.slice(0, 4);
            setYear(truncated);
            if (truncated.length === 4) {
                notifyParent(day, month, truncated);
            }
        }
    };

    const handleBlur = () => {
        // Final Formatting on blur: pad if needed
        const dFinal = day ? day.padStart(2, '0') : "";
        const mFinal = month ? month.padStart(2, '0') : "";
        const yFinal = year; // Keep year as is
        setDay(dFinal);
        setMonth(mFinal);
        notifyParent(dFinal, mFinal, yFinal);
    };

    const handleKeyDown = (e: React.KeyboardEvent, part: "day" | "month" | "year") => {
        if (e.key === "Backspace" && !e.currentTarget.getAttribute("value")) {
            if (part === "month") dayRef.current?.focus();
            if (part === "year") monthRef.current?.focus();
        }

        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const isUp = e.key === "ArrowUp";
            const delta = isUp ? 1 : -1;

            if (part === "day") {
                let v = parseInt(day) || 1;
                v = ((v + delta - 1 + 31) % 31) + 1;
                const next = String(v).padStart(2, '0');
                setDay(next);
                notifyParent(next, month, year);
            } else if (part === "month") {
                let v = parseInt(month) || 1;
                v = ((v + delta - 1 + 12) % 12) + 1;
                const next = String(v).padStart(2, '0');
                setMonth(next);
                notifyParent(day, next, year);
            } else {
                let v = parseInt(year) || new Date().getFullYear();
                v += delta;
                const next = String(v);
                setYear(next);
                notifyParent(day, month, next);
            }
        }
    };

    const openCalendar = () => {
        if (nativeRef.current) {
            try {
                // @ts-ignore - showPicker is modern but not in all types
                if (nativeRef.current.showPicker) nativeRef.current.showPicker();
                else nativeRef.current.click();
            } catch (e) {
                nativeRef.current.click();
            }
        }
    };

    const isWoman = gender === "Femme";
    const accentColor = isWoman ? "text-red-600" : "text-blue-600";
    const accentBorder = isWoman ? "focus-within:border-red-400" : "focus-within:border-blue-400";
    const accentHover = isWoman ? "hover:bg-red-50" : "hover:bg-blue-50";

    return (
        <div className={cn("relative group", className)} ref={containerRef}>
            {/* Hidden Native Input for Picker */}
            <input
                ref={nativeRef}
                type="date"
                className="absolute opacity-0 pointer-events-none w-0 h-0"
                value={toNative(value)}
                onChange={(e) => {
                    const [d, m, y] = fromNative(e.target.value);
                    setDay(d);
                    setMonth(m);
                    setYear(y);
                    onChange(`${d}/${m}/${y}`);
                }}
            />

            <div
                className={cn(
                    "flex items-center bg-white border border-slate-200 rounded-lg p-1 transition-all h-9 shadow-sm px-3",
                    accentBorder
                )}
            >
                <div
                    className="flex items-center gap-0.5 text-sm font-bold text-slate-700 flex-1 cursor-text"
                    onClick={() => dayRef.current?.focus()}
                >
                    <input
                        ref={dayRef}
                        type="text"
                        value={day}
                        onChange={(e) => handleInputChange(e, "day")}
                        onKeyDown={(e) => handleKeyDown(e, "day")}
                        onBlur={handleBlur}
                        placeholder="JJ"
                        className="w-5 bg-transparent outline-none placeholder:text-slate-300 text-center focus:text-blue-600 transition-colors"
                    />
                    <span className="text-slate-300">/</span>
                    <input
                        ref={monthRef}
                        type="text"
                        value={month}
                        onChange={(e) => handleInputChange(e, "month")}
                        onKeyDown={(e) => handleKeyDown(e, "month")}
                        onBlur={handleBlur}
                        placeholder="MM"
                        className="w-6 bg-transparent outline-none placeholder:text-slate-300 text-center focus:text-blue-600 transition-colors"
                    />
                    <span className="text-slate-300">/</span>
                    <input
                        ref={yearRef}
                        type="text"
                        value={year}
                        onChange={(e) => handleInputChange(e, "year")}
                        onKeyDown={(e) => handleKeyDown(e, "year")}
                        onBlur={handleBlur}
                        placeholder="AAAA"
                        className="w-10 bg-transparent outline-none placeholder:text-slate-300 text-center focus:text-blue-600 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-1 ml-2">
                    {(day || month || year) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDay("");
                                setMonth("");
                                setYear("");
                                onChange("-");
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openCalendar();
                        }}
                        className={cn("p-1.5 rounded-md transition-colors", accentHover, accentColor)}
                    >
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
