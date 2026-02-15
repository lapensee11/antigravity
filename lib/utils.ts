import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function confirmDelete(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
}

/**
 * Format ICE: 9 chiffres . 4 chiffres . reste
 * Ex: 001742957000002 → 001742957.0000.02
 */
/** Compresse une image pour stockage léger (max 400×400, JPEG 75%) - comme photo recette */
export function compressImage(file: File, maxSize = 400): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let w = img.width,
                h = img.height;
            if (w > maxSize || h > maxSize) {
                if (w > h) {
                    h = (h / w) * maxSize;
                    w = maxSize;
                } else {
                    w = (w / h) * maxSize;
                    h = maxSize;
                }
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas 2D"));
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Chargement image"));
        };
        img.src = url;
    });
}

/** Format date JJ/MM/AAAA (entrée: YYYY-MM-DD) */
export function formatDateJjMmAaaa(dateStr: string | undefined | null): string {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    if (!d || !m || !y) return dateStr;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

export function formatIce(ice: string | undefined | null): string {
    if (!ice || typeof ice !== "string") return "";
    const digits = ice.replace(/\D/g, "");
    if (digits.length <= 9) return digits;
    if (digits.length <= 13) return `${digits.slice(0, 9)}.${digits.slice(9)}`;
    return `${digits.slice(0, 9)}.${digits.slice(9, 13)}.${digits.slice(13)}`;
}

/**
 * Convertit un montant en lettres (français)
 * Ex: 120.50 → "Cent vingt Dirhams et cinquante centimes"
 */
export function numberToFrenchWords(n: number): string {
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

    function under100(n: number): string {
        if (n === 0) return "";
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 70) return tens[Math.floor(n / 10)] + (n % 10 ? "-" + units[n % 10] : "");
        if (n < 80) return n === 71 ? "soixante et onze" : "soixante-" + under100(n - 60);
        if (n < 90) return "quatre-vingt" + (n === 80 ? "s" : "-" + under100(n - 80));
        return "quatre-vingt-" + under100(n - 80);
    }

    function under1000(n: number): string {
        if (n === 0) return "";
        if (n < 100) return under100(n);
        const c = Math.floor(n / 100);
        const r = n % 100;
        return (c === 1 ? "cent" : units[c] + " cent") + (r ? " " + under100(r) : c > 1 ? "s" : "");
    }

    const intPart = Math.floor(Math.abs(n));
    const decPart = Math.round((Math.abs(n) - intPart) * 100);

    if (intPart === 0 && decPart === 0) return "Zéro Dirhams";

    let s = "";
    if (intPart >= 1000000) {
        const m = Math.floor(intPart / 1000000);
        s += (m === 1 ? "un million" : under1000(m) + " millions") + " ";
    }
    const rest = intPart % 1000000;
    if (rest >= 1000) {
        const k = Math.floor(rest / 1000);
        s += (k === 1 ? "mille" : under1000(k) + " mille") + " ";
    }
    const r = rest % 1000;
    if (r > 0) s += under1000(r) + " ";

    s = s.trim();
    s += " Dirham" + (intPart > 1 ? "s" : "");
    if (decPart > 0) s += " et " + under100(decPart) + " centime" + (decPart > 1 ? "s" : "");
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, "");

  // Limit to 10 digits
  const truncated = cleaned.slice(0, 10);

  // Group by 2 digits with space
  return truncated.replace(/(\d{2})(?=\d)/g, "$1 ");
}
