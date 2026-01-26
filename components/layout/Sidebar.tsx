"use client";

import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Layers,
    Package,
    FileText,
    Users,
    ChefHat,
    Landmark,
    ShoppingCart,
    CreditCard,
    Settings,
    LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de Bord", href: "/" },
    { icon: Layers, label: "Structure", href: "/structure" },
    { icon: Package, label: "Articles", href: "/articles" },
    { icon: FileText, label: "Factures Achat", href: "/achats" },
    { icon: Users, label: "Tiers", href: "/tiers" },
    { icon: ChefHat, label: "Production", href: "/production" },
    { icon: Landmark, label: "Finance", href: "/finance" },
    { icon: ShoppingCart, label: "Ventes", href: "/ventes" },
    { icon: CreditCard, label: "Paye", href: "/paye" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-50 bg-[#F6F8FC] border-r border-slate-200">
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Logo Area */}
                <div className="p-6 border-b border-[#E8E2D2] flex justify-center">
                    <div className="w-full max-w-[120px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo_la_pensee.png"
                            alt="La Pensée"
                            className="w-full h-auto object-contain drop-shadow-sm"
                        />
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-8 py-4 transition-all duration-200 group font-medium text-sm border-l-4",
                                    isActive
                                        ? "bg-white border-[#9A1B1F] text-[#9A1B1F] shadow-sm"
                                        : "border-transparent text-[#5C5C5C] hover:bg-white/50 hover:text-[#9A1B1F]"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#9A1B1F]" : "text-[#8C8C8C] group-hover:text-[#9A1B1F]")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Settings */}
                <div className="p-4 border-t border-[#E8E2D2] mt-auto space-y-1">
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#5C5C5C] hover:bg-[#9A1B1F]/[0.11] hover:text-[#9A1B1F] transition-all font-medium text-sm"
                    >
                        <Settings className="w-5 h-5 text-[#8C8C8C] group-hover:text-[#9A1B1F]" />
                        Paramètres
                    </Link>
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </div>
        </aside>
    );
}
