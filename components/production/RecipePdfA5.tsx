"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#047857",
    marginTop: 12,
    marginBottom: 6,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#d1fae5",
    borderWidth: 2,
    borderColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#047857",
  },
  stepContent: {
    flex: 1,
  },
  stepDesc: {
    fontSize: 10,
    color: "#334155",
    textAlign: "justify",
    lineHeight: 1.4,
    marginBottom: 2,
  },
  stepDuration: {
    fontSize: 8,
    color: "#64748b",
  },
});

export interface RecipePdfA5Data {
  name: string;
  subFamilyName: string;
  yieldUnit: string;
  yieldQty: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: { order: number; description: string; duration?: number }[];
}

export function RecipePdfA5({ data }: { data: RecipePdfA5Data }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <Text style={styles.title}>{data.name}</Text>
        <View style={styles.subtitle}>
          <Text>{data.subFamilyName} • {data.yieldQty} {data.yieldUnit}</Text>
        </View>

        <Text style={styles.sectionTitle}>Ingrédients</Text>
        {data.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredientRow}>
            <Text>{ing.name}</Text>
            <Text style={{ fontWeight: "bold" }}>{ing.quantity.toLocaleString("fr-FR")} {ing.unit}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Préparation</Text>
        {data.steps.map((step, i) => (
          <View key={i} style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.order || i + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepDesc}>{step.description}</Text>
              {(step.duration || 0) > 0 && (
                <Text style={styles.stepDuration}>{step.duration} min</Text>
              )}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
