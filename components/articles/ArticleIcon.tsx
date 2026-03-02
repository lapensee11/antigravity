"use client";

import {
    Package,
    Boxes,
    Wheat,
    Coffee,
    UtensilsCrossed,
    Apple,
    Carrot,
    Cookie,
    Leaf,
    Flame,
    type LucideIcon,
} from "lucide-react";

const ICON_COLOR = "#D69E2E";
const ICON_SIZE = 32;

/** Liste de toutes les icônes proposées au choix (id = nom Lucide). */
export const ARTICLE_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
    { id: "Package", label: "Colis", Icon: Package },
    { id: "Boxes", label: "Cartons", Icon: Boxes },
    { id: "Wheat", label: "Blé", Icon: Wheat },
    { id: "Coffee", label: "Café", Icon: Coffee },
    { id: "Apple", label: "Pomme", Icon: Apple },
    { id: "Carrot", label: "Carotte", Icon: Carrot },
    { id: "Cookie", label: "Biscuit", Icon: Cookie },
    { id: "Leaf", label: "Feuille", Icon: Leaf },
    { id: "Flame", label: "Flammes", Icon: Flame },
    { id: "UtensilsCrossed", label: "Recette", Icon: UtensilsCrossed },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
    ARTICLE_ICONS.map(({ id, Icon }) => [id, Icon])
);

/** Normalise un id (ex. "wheat" -> "Wheat") pour compat avec anciennes données. */
function normalizeIconId(id: string): string {
    if (!id || id.startsWith("data:")) return id;
    const lower = id.toLowerCase();
    const found = ARTICLE_ICONS.find(({ id: k }) => k.toLowerCase() === lower);
    return found?.id ?? id;
}

/** Retourne l'icône Lucide par id (ex. "Wheat" ou "wheat"), ou null. */
export function getArticleIconById(iconId: string | undefined): LucideIcon | null {
    if (!iconId || iconId.startsWith("data:")) return null;
    const normalized = normalizeIconId(iconId);
    return ICON_MAP[normalized] ?? null;
}

/** Indique si une valeur icon est une image importée (data URL). */
export function isCustomIconDataUrl(icon: string | null | undefined): boolean {
    return !!icon && icon.startsWith("data:");
}

/** Associe type + code famille à une icône par défaut. */
function getDefaultArticleIcon(typeId: string | undefined, familyCode: string | undefined): LucideIcon {
    const code = (familyCode || "").toUpperCase();
    if (typeId === "1") {
        if (/^FA01$/i.test(code)) return Wheat;
        if (/^FA02$/i.test(code)) return Apple;
        if (/^FA03$/i.test(code)) return Carrot;
        if (/^FA04$/i.test(code)) return Coffee;
        if (/^FA05$/i.test(code)) return Leaf;
        if (/^FA06$/i.test(code)) return Flame;
        if (/^FA07$/i.test(code)) return Boxes;
        return Package;
    }
    if (typeId === "3") return UtensilsCrossed;
    if (typeId === "4") return Cookie;
    if (typeId === "2") return Boxes;
    return Package;
}

export interface ArticleIconProps {
    typeId?: string;
    familyCode?: string;
    /** Icône famille/sous-famille ou article : id Lucide (ex. "Wheat") ou data URL. */
    icon?: string | null;
    /** @deprecated Préférer icon (famille/sous-famille). Gardé pour compat. */
    iconId?: string;
    className?: string;
    size?: number;
    color?: string;
}

/** Icône d'article : icon ou iconId prioritaire, sinon dérivée du type/famille. */
export function ArticleIcon({
    typeId,
    familyCode,
    icon,
    iconId,
    className,
    size = ICON_SIZE,
    color = ICON_COLOR,
}: ArticleIconProps) {
    const resolved = icon ?? iconId;
    if (isCustomIconDataUrl(resolved)) {
        return (
            <img
                src={resolved}
                alt=""
                width={size}
                height={size}
                className={className}
                style={{ flexShrink: 0, objectFit: "contain" }}
            />
        );
    }
    const CustomIcon = getArticleIconById(resolved ?? undefined);
    const Icon = CustomIcon ?? getDefaultArticleIcon(typeId, familyCode);
    return (
        <Icon
            size={size}
            color={color}
            strokeWidth={1.5}
            className={className}
            style={{ flexShrink: 0 }}
        />
    );
}

/** Affiche une icône structure (famille/sous-famille) : id Lucide ou data URL. Pour liste et modals. */
export function StructureIconView({
    icon,
    size = 24,
    className,
}: {
    icon: string | null | undefined;
    size?: number;
    className?: string;
}) {
    if (!icon) return null;
    if (isCustomIconDataUrl(icon)) {
        return (
            <img
                src={icon}
                alt=""
                width={size}
                height={size}
                className={className}
                style={{ objectFit: "contain" }}
            />
        );
    }
    const Icon = getArticleIconById(icon);
    if (!Icon) return null;
    return <Icon size={size} strokeWidth={1.5} className={className} />;
}
