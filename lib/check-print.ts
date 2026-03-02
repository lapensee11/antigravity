/**
 * Impression du chèque : détection de l'environnement (web / Tauri, OS) et ouverture
 * du dialogue d'impression avec le contenu du chèque (comme Cmd+P).
 * - Web : fenêtre dédiée avec le chèque en HTML + window.print().
 * - Tauri macOS : PDF enregistré dans BAKO + open -p (panneau d'impression système).
 * - Tauri autre OS : même approche HTML + print que le web.
 */

import type { CheckPdfData, CheckPosition } from "./check-pdf";

const defaults = {
  amountNumbers: { left: 105, top: 18, fontSize: 8 },
  amountLetters: { left: 10, top: 32, fontSize: 8 },
  ordre: { left: 10, top: 12, fontSize: 8 },
  lieu: { left: 10, top: 52, fontSize: 8 },
  date: { left: 105, top: 52, fontSize: 8 },
};

function buildCheckHtml(data: CheckPdfData): string {
  const pos = { ...defaults, ...data.positions };
  const intPart = Math.floor(data.amount);
  const decPart = Math.round((data.amount - intPart) * 100);
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const amountStr = `${intStr},${decPart.toString().padStart(2, "0")} DH`;

  const style = (p: CheckPosition) =>
    `position:absolute;left:${p.left}mm;top:${p.top}mm;font-size:${p.fontSize ?? 8}pt;font-family:Helvetica,sans-serif;margin:0;padding:0;`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Chèque</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    @media print {
      @page { size: 175mm 80mm; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .check-page { box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <div class="check-page" style="width:175mm;height:80mm;position:relative;background:#fff;">
    <div style="${style(pos.amountNumbers!)}font-weight:bold;">${escapeHtml(amountStr)}</div>
    <div style="${style(pos.amountLetters!)}max-width:105mm;line-height:1.2;word-wrap:break-word;">${escapeHtml(data.amountLetters)}</div>
    <div style="${style(pos.ordre!)}">${escapeHtml(data.ordre)}</div>
    <div style="${style(pos.lieu!)}">${escapeHtml(data.lieu)}</div>
    <div style="${style(pos.date!)}">${escapeHtml(data.date)}</div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = s;
    return div.innerHTML;
  }
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Détection : tourne dans l'app Tauri (natif). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Détection : macOS (Intel ou Apple Silicon M1/M2/M3...). */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform === "MacIntel" || navigator.userAgent.includes("Mac");
}

/** Détection : processeur Apple Silicon (ARM64). */
export function isMacArm64(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return navigator.platform === "MacIntel" && (ua.includes("aarch64") || ua.includes("ARM") || (navigator as any).deviceMemory != null);
}

/**
 * Ouvre le dialogue d'impression système avec le chèque (valeurs données).
 * Utilise un iframe caché (web + Tauri) pour que print() fonctionne dans le webview.
 */
export async function printCheck(data: CheckPdfData): Promise<void> {
  const html = buildCheckHtml(data);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "position:fixed;left:-9999px;top:0;width:175mm;height:80mm;border:none;");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    alert("Impossible d'afficher le dialogue d'impression.");
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    try {
      if (iframe.parentNode) document.body.removeChild(iframe);
    } catch (_) {}
  };

  const printWindow = iframe.contentWindow;
  if (!printWindow) {
    cleanup();
    return;
  }

  const doPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch (e) {
      console.error("Erreur print chèque:", e);
      cleanup();
    }
  };

  printWindow.addEventListener("afterprint", cleanup);
  setTimeout(cleanup, 60000);

  if (iframe.contentDocument?.readyState === "complete") {
    doPrint();
  } else {
    iframe.addEventListener("load", doPrint);
    setTimeout(doPrint, 500);
  }
}
