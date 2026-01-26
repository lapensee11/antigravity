import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 border border-slate-100",
                "relative overflow-hidden",
                className
            )}
            {...props}
        >
            <div className="relative z-10">{children}</div>
        </div>
    );
}
