import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
        relative overflow-hidden
        bg-white/70 backdrop-blur-xl border border-white/40
        shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
        rounded-2xl p-6
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-white/80 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] active:scale-[0.98]' : ''}
        ${className}
      `}
        >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
            {children}
        </div>
    );
};

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(({ label, icon, className = '', ...props }, ref) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-xs font-semibold text-slate-500/80 ml-1 uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    ref={ref}
                    className={`
            w-full bg-white/50 backdrop-blur-md border border-white/60
            focus:border-blue-400/50 focus:ring-4 focus:ring-blue-400/10 focus:bg-white/80
            placeholder:text-slate-400 text-slate-700
            rounded-xl py-2.5 outline-none
            transition-all duration-200
            ${icon ? 'pl-11 pr-4' : 'px-4'}
            ${className}
          `}
                />
            </div>
        </div>
    );
});
GlassInput.displayName = 'GlassInput';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}, ref) => {
    const variants = {
        primary: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5',
        secondary: 'bg-white/80 text-slate-700 border border-white hover:bg-white hover:shadow-md hover:-translate-y-0.5',
        danger: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5',
        ghost: 'bg-transparent text-slate-600 hover:bg-white/40',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5',
        lg: 'px-8 py-3.5 text-lg font-semibold',
    };

    return (
        <button
            {...props}
            ref={ref}
            className={`
        rounded-xl backdrop-blur-md font-medium
        active:scale-95 transition-all duration-200
        flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        >
            {children}
        </button>
    );
});
GlassButton.displayName = 'GlassButton';

export const GlassBadge: React.FC<{ children: React.ReactNode; color?: string; className?: string }> = ({
    children,
    color = 'blue',
    className = ''
}) => {
    const colors: Record<string, string> = {
        blue: 'bg-blue-100/50 text-blue-600 border-blue-200/50',
        green: 'bg-emerald-100/50 text-emerald-600 border-emerald-200/50',
        yellow: 'bg-amber-100/50 text-amber-600 border-amber-200/50',
        red: 'bg-rose-100/50 text-rose-600 border-rose-200/50',
        slate: 'bg-slate-100/50 text-slate-600 border-slate-200/50',
    };

    return (
        <span className={`
      px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight 
      border backdrop-blur-sm
      ${colors[color] || colors.blue}
      ${className}
    `}>
            {children}
        </span>
    );
};
