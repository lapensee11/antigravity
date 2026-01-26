import { GlassCard } from "./GlassCard";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface GlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function GlassModal({ isOpen, onClose, title, children, className }: GlassModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Use timeout to avoid "synchronous setState in effect" lint error
        const timer = setTimeout(() => {
            setMounted(true);
            if (isOpen) {
                document.body.style.overflow = "hidden";
            }
        }, 0);

        if (!isOpen) {
            document.body.style.overflow = "unset";
        }

        return () => {
            clearTimeout(timer);
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <GlassCard className={cn("w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200", className)}>
                <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-4">
                    <h3 className="text-xl font-bold text-slate-800 font-outfit">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/40 rounded-full transition-colors font-bold text-slate-500 hover:text-red-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-slate-700">
                    {children}
                </div>
            </GlassCard>
        </div>,
        document.body
    );
}
