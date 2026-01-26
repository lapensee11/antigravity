import { cn } from "@/lib/utils";
import React from "react";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    className?: string;
    icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
    ({ className, icon, ...props }, ref) => {
        return (
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--buddy-purple)] transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={cn(
                        "w-full bg-[#E5E5EA] border-transparent", // iOS light gray input style
                        "text-slate-900 placeholder:text-slate-500 font-medium",
                        "rounded-2xl py-3 px-4 transition-all duration-200",
                        "focus:outline-none focus:bg-white focus:shadow-[0_0_0_2px_var(--buddy-purple)]",
                        "hover:bg-[#D1D1D6]",
                        icon && "pl-11",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

GlassInput.displayName = "GlassInput";
