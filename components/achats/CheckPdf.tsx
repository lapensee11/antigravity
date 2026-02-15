"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const MM_TO_PT = 2.834645669; // 1 mm ≈ 2.83 pt

export interface CheckPosition {
  left: number;  // mm (converted to pt in PDF)
  top: number;   // mm
  fontSize?: number;
}

export interface CheckPdfData {
  amount: number;
  amountLetters: string;
  lieu: string;
  date: string;
  positions?: {
    amountNumbers?: CheckPosition;
    amountLetters?: CheckPosition;
    lieu?: CheckPosition;
    date?: CheckPosition;
  };
}

// Page 175x80 mm ≈ 496x227 pt
const PAGE_W = 496;
const PAGE_H = 227;

const defaultPositions = {
  amountNumbers: { left: 120, top: 25, fontSize: 12 },
  amountLetters: { left: 15, top: 45, fontSize: 10 },
  lieu: { left: 15, top: 65, fontSize: 10 },
  date: { left: 120, top: 65, fontSize: 10 },
};

const styles = StyleSheet.create({
  page: {
    width: PAGE_W,
    height: PAGE_H,
    padding: 0,
    fontFamily: "Helvetica",
  },
  field: {
    position: "absolute",
  },
});

function mmToPt(mm: number) {
  return Math.round(mm * MM_TO_PT);
}

export function CheckPdf({ data }: { data: CheckPdfData }) {
  const pos = { ...defaultPositions, ...data.positions };
  const amountStr = data.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Document>
      <Page size={[PAGE_W, PAGE_H]} style={styles.page}>
        <View style={[styles.field, { left: mmToPt(pos.amountNumbers!.left), top: mmToPt(pos.amountNumbers!.top) }]}>
          <Text style={{ fontSize: pos.amountNumbers!.fontSize || 12, fontWeight: "bold" }}>
            {amountStr} DH
          </Text>
        </View>
        <View style={[styles.field, { left: mmToPt(pos.amountLetters!.left), top: mmToPt(pos.amountLetters!.top), width: mmToPt(140) }]}>
          <Text style={{ fontSize: pos.amountLetters!.fontSize || 10 }}>{data.amountLetters}</Text>
        </View>
        <View style={[styles.field, { left: mmToPt(pos.lieu!.left), top: mmToPt(pos.lieu!.top) }]}>
          <Text style={{ fontSize: pos.lieu!.fontSize || 10 }}>Lieu : {data.lieu}</Text>
        </View>
        <View style={[styles.field, { left: mmToPt(pos.date!.left), top: mmToPt(pos.date!.top) }]}>
          <Text style={{ fontSize: pos.date!.fontSize || 10 }}>{data.date}</Text>
        </View>
      </Page>
    </Document>
  );
}
