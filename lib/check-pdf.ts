import { jsPDF } from "jspdf";

export interface CheckPosition {
  left: number;
  top: number;
  fontSize?: number;
}

export interface CheckPdfData {
  amount: number;
  amountLetters: string;
  ordre: string;
  lieu: string;
  date: string;
  positions?: {
    amountNumbers?: CheckPosition;
    amountLetters?: CheckPosition;
    ordre?: CheckPosition;
    lieu?: CheckPosition;
    date?: CheckPosition;
  };
}

const defaults = {
  amountNumbers: { left: 105, top: 18, fontSize: 8 },
  amountLetters: { left: 10, top: 32, fontSize: 8 },
  ordre: { left: 10, top: 12, fontSize: 8 },
  lieu: { left: 10, top: 52, fontSize: 8 },
  date: { left: 105, top: 52, fontSize: 8 },
};

export function generateCheckPdf(data: CheckPdfData): Blob {
  const pos = { ...defaults, ...data.positions };
  // Page chèque : 175 mm largeur × 80 mm hauteur (paysage)
  const doc = new jsPDF({
    orientation: "l",
    unit: "mm",
    format: [175, 80],
  });

  // Format manuel : espace pour les milliers (évite caractères Unicode mal rendus en PDF)
  const intPart = Math.floor(data.amount);
  const decPart = Math.round((data.amount - intPart) * 100);
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const amountStr = `${intStr},${decPart.toString().padStart(2, "0")}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.min(pos.amountNumbers!.fontSize || 8, 12));
  doc.text(`${amountStr} DH`, pos.amountNumbers!.left, pos.amountNumbers!.top);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(Math.min(pos.amountLetters!.fontSize || 8, 12));
  const lines = doc.splitTextToSize(data.amountLetters, 105);
  doc.text(lines, pos.amountLetters!.left, pos.amountLetters!.top);

  doc.setFontSize(Math.min(pos.ordre!.fontSize || 8, 12));
  doc.text(data.ordre, pos.ordre!.left, pos.ordre!.top);

  doc.setFontSize(Math.min(pos.lieu!.fontSize || 8, 12));
  doc.text(data.lieu, pos.lieu!.left, pos.lieu!.top);

  doc.text(data.date, pos.date!.left, pos.date!.top);

  return doc.output("blob");
}
