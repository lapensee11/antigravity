/**
 * Convertit un montant numérique en mots français (pour chèques).
 * Ex: 1234.56 -> "mille deux cent trente-quatre dirhams et cinquante-six centimes"
 */
const UNITS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const TEENS = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function numberPartToWords(n: number, feminine = false): string {
  if (n === 0) return "";
  if (n < 10) {
    if (n === 1 && feminine) return "une";
    return UNITS[n];
  }
  if (n < 20) return TEENS[n - 10];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    let s: string;
    if (d === 7) s = "soixante-" + (u === 0 ? "dix" : u <= 6 ? TEENS[u] : "dix-" + (UNITS[u - 7] || "huit"));
    else if (d === 9) s = "quatre-vingt" + (u === 0 ? "s" : "-" + (u <= 9 ? UNITS[u] : TEENS[u - 10]));
    else if (d === 8 && u === 0) s = "quatre-vingts";
    else {
      s = TENS[d];
      if (u === 1 && (d === 8 || d === 2)) s += "-et-un";
      else if (u === 1 && d !== 8 && d !== 2) s += "-un";
      else if (u > 0) s += "-" + UNITS[u];
    }
    return s;
  }
  if (n < 200) return "cent" + (n === 100 ? "" : " " + numberPartToWords(n % 100, feminine));
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const r = n % 100;
    const cent = c === 1 ? "cent" : numberPartToWords(c) + " cent";
    return r === 0 ? (c === 1 ? "cent" : cent + "s") : cent + " " + numberPartToWords(r, feminine);
  }
  if (n < 2000) return "mille" + (n === 1000 ? "" : " " + numberPartToWords(n % 1000, feminine));
  if (n < 1000000) {
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    const mil = m === 1 ? "mille" : numberPartToWords(m) + " mille";
    return r === 0 ? mil : mil + " " + numberPartToWords(r, feminine);
  }
  if (n < 2000000) return "un million" + (n === 1000000 ? "" : " " + numberPartToWords(n % 1000000, feminine));
  if (n < 1000000000) {
    const m = Math.floor(n / 1000000);
    const r = n % 1000000;
    const mil = m === 1 ? "un million" : numberPartToWords(m) + " millions";
    return r === 0 ? mil : mil + " " + numberPartToWords(r, feminine);
  }
  return n.toLocaleString("fr-FR");
}

export function numberToFrenchWords(amount: number): string {
  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  const intStr = intPart === 0 ? "zéro" : numberPartToWords(intPart);
  const main = intStr + " dirham" + (intPart > 1 ? "s" : "");
  if (decPart === 0) return main;
  const decStr = numberPartToWords(decPart);
  return main + " et " + decStr + " centime" + (decPart > 1 ? "s" : "");
}
