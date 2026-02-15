import { jsPDF } from "jspdf";
import { ClientInvoice } from "./types";
import { Tier } from "./types";
import { formatIce, formatDateJjMmAaaa, numberToFrenchWords } from "./utils";

export function generateClientInvoicePdf(invoice: ClientInvoice, client?: Tier | null): Blob {
    const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a5",
    });

    const marginV = 5;
    const marginH = 10;
    const pageW = 148;
    const contentW = pageW - 2 * marginH;
    let y = marginV;

    // En-tête 4cm pour le logo pré-imprimé (40mm total)
    y += 35;

    // Séparateur élégant
    doc.setDrawColor(100, 100, 120);
    doc.setLineWidth(0.5);
    doc.line(marginH, y, marginH + contentW, y);
    y += 2;
    doc.setDrawColor(180, 180, 200);
    doc.setLineWidth(0.2);
    doc.line(marginH, y, marginH + contentW, y);
    y += 10;

    // 2 blocs côte à côte
    const leftX = marginH;
    const rightX = marginH + contentW / 2 + 5;

    // Bloc gauche : N° Facture, Date
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("N° Facture", leftX, y);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.number || "-", leftX, y + 5);
    doc.setFont("helvetica", "bold");
    doc.text("Date", leftX, y + 14);
    doc.setFont("helvetica", "normal");
    doc.text(formatDateJjMmAaaa(invoice.date), leftX, y + 19);

    // Bloc droit : Client, ICE
    doc.setFont("helvetica", "bold");
    doc.text("Client", rightX, y);
    doc.setFont("helvetica", "normal");
    doc.text(client?.name || "-", rightX, y + 5);
    doc.setFont("helvetica", "bold");
    doc.text("ICE", rightX, y + 14);
    doc.setFont("helvetica", "normal");
    doc.text(client?.ice ? formatIce(client.ice) : "-", rightX, y + 19);

    y += 28;

    // Séparateur élégant en dessous des blocs Facture et Client
    doc.setDrawColor(100, 100, 120);
    doc.setLineWidth(0.5);
    doc.line(marginH, y, marginH + contentW, y);
    y += 2;
    doc.setDrawColor(180, 180, 200);
    doc.setLineWidth(0.2);
    doc.line(marginH, y, marginH + contentW, y);
    y += 8;

    // Lignes de facture : Qté, Désignation (réduit), PU HT, TVA, Total TTC
    const colW = [12, 35, 22, 12, 23];
    const headers = ["Qté", "Désignation", "PU HT", "TVA", "Total TTC"];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let x = marginH;
    for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x, y);
        x += colW[i];
    }
    y += 5;

    doc.setDrawColor(200, 200, 200);
    doc.line(marginH, y, marginH + contentW, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const puHt = (line: { qty?: number; totalHt?: number }) =>
        (line.qty && line.qty > 0 && line.totalHt != null) ? line.totalHt / line.qty : 0;

    const lines = invoice.lines || [];
    const minRows = 3;
    const displayLines = lines.length >= minRows ? lines : [...lines, ...Array(minRows - lines.length).fill(null)];

    for (const line of displayLines) {
        if (y > 260) {
            doc.addPage("a5");
            y = marginV;
        }
        x = marginH;
        doc.text(line ? String(line.qty || 0) : "", x, y);
        x += colW[0];
        doc.text(line ? (line.designation || "-").substring(0, 25) : "", x, y);
        x += colW[1];
        doc.text(line ? (puHt(line)).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "", x, y);
        x += colW[2];
        doc.text(line ? String(line.tauxTva ?? 20) + "%" : "", x, y);
        x += colW[3];
        doc.text(line ? (line.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "", x, y);
        y += 6;
    }

    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(marginH, y, marginH + contentW, y);
    y += 10;

    // Bloc Totaux à droite
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const totX = marginH + contentW - 60;
    doc.text("Total HT :", totX, y);
    doc.text(`${(invoice.totalHt || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH`, marginH + contentW - 20, y);
    y += 6;
    doc.text("Total TTC :", totX, y);
    doc.text(`${(invoice.totalTtc || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH`, marginH + contentW - 20, y);
    y += 10;

    // Arrêté la présente facture...
    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);
    const ttcAmount = invoice.totalTtc || 0;
    const amountWords = numberToFrenchWords(ttcAmount);
    const arreteText = "Arrêté la présente facture à la somme de TTC : " + amountWords;
    const split = doc.splitTextToSize(arreteText, contentW - 10);
    doc.text(split, marginH, y);

    // ICE en bas de page à 1,5cm du bas, à droite
    const pageH = 210;
    const footerY = pageH - 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("ICE : 001539075.0000.66", marginH + contentW, footerY, { align: "right" });

    return doc.output("blob");
}
