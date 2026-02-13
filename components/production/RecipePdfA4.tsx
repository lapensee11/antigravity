"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#047857",
    marginTop: 16,
    marginBottom: 8,
  },
  ingredientsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  ingredientsCol: {
    width: "66.66%",
  },
  imagesCol: {
    width: "33.33%",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  imageStack: {
    width: 130,
    flexDirection: "column",
  },
  imageSquare: {
    width: 130,
    height: 130,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  imageSquareTop: {
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d1fae5",
    borderWidth: 2,
    borderColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#047857",
  },
  stepContent: {
    flex: 1,
  },
  stepDesc: {
    fontSize: 11,
    color: "#334155",
    textAlign: "justify",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  stepDuration: {
    fontSize: 9,
    color: "#64748b",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  grid2col: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  grid2colItem: {
    width: "48%",
  },
  bottomBlocks: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
  },
  bottomBlock: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  bottomBlockTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#047857",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
  },
  nutritionBlock: {
    borderColor: "#94a3b8",
    backgroundColor: "#f8fafc",
  },
  nutritionMacroZone: {
    backgroundColor: "#e0f2fe",
    borderWidth: 1,
    borderColor: "#7dd3fc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  nutritionGlucideZone: {
    backgroundColor: "#ffedd5",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 8,
    padding: 12,
  },
  zoneTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  zoneTitleGlucide: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#c2410c",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  costBlock: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  bottomBlockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  nutritionLine: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 3,
    marginBottom: 2,
  },
  nutritionItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 4,
  },
  nutritionItemGlucide: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 4,
  },
  bottomBlockLabel: {
    fontSize: 9,
    color: "#475569",
  },
  bottomBlockValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  macroLabel: { fontSize: 9, color: "#0c4a6e" },
  macroValue: { fontSize: 10, fontWeight: "bold", color: "#0369a1" },
  glucideLabel: { fontSize: 9, color: "#9a3412" },
  glucideValue: { fontSize: 10, fontWeight: "bold", color: "#c2410c" },
});

export interface RecipePdfData {
  name: string;
  subFamilyName: string;
  yieldUnit: string;
  yieldQty: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  image1?: string;
  image2?: string;
  steps: { order: number; description: string; duration?: number }[];
  nutrition: {
    calories?: number;
    water?: number;
    protein?: number;
    fat?: number;
    minerals?: number;
    carbs?: number;
    sugars?: number;
    fiber?: number;
    glycemicIndex?: number;
    glycemicLoad?: number;
  };
  costing: {
    materialCost: number;
    totalCost: number;
    totalWeight: number;
    weightAfterLoss: number;
    costPerKg: number;
    lossRate: number;
  };
}

export function RecipePdfA4({ data }: { data: RecipePdfData }) {
  const n = data.nutrition;
  const c = data.costing;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <Text style={styles.title}>{data.name}</Text>
        <View style={styles.subtitle}>
          <Text>{data.subFamilyName} • Rendement: {data.yieldQty} {data.yieldUnit}</Text>
        </View>

        {/* Ingrédients (2/3) + Images (1/3) superposées */}
        <Text style={styles.sectionTitle}>Ingrédients</Text>
        <View style={styles.ingredientsRow}>
          <View style={styles.ingredientsCol}>
            {data.ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <Text>{ing.name}</Text>
                <Text style={{ fontWeight: "bold" }}>{ing.quantity.toLocaleString("fr-FR")} {ing.unit}</Text>
              </View>
            ))}
          </View>
          <View style={styles.imagesCol}>
            <View style={styles.imageStack}>
              {data.image1 ? (
                <Image src={data.image1} style={[styles.imageSquare, styles.imageSquareTop]} />
              ) : (
                <View style={[styles.imageSquare, styles.imageSquareTop]} />
              )}
              {data.image2 ? (
                <Image src={data.image2} style={styles.imageSquare} />
              ) : (
                <View style={styles.imageSquare} />
              )}
            </View>
          </View>
        </View>

        {/* Étapes - texte justifié */}
        <Text style={styles.sectionTitle}>Étapes de Préparation</Text>
        {data.steps.map((step, i) => (
          <View key={i} style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.order || i + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepDesc}>{step.description}</Text>
              {(step.duration || 0) > 0 && (
                <Text style={styles.stepDuration}>{step.duration} minutes</Text>
              )}
            </View>
          </View>
        ))}

        {/* Blocs Nutrition + Coût côte à côte en bas */}
        <View style={styles.bottomBlocks}>
          {/* Valeurs Nutritionnelles */}
          <View style={[styles.bottomBlock, styles.nutritionBlock]}>
            <Text style={styles.bottomBlockTitle}>Valeurs Nutritionnelles (pour 100g)</Text>
            {/* Zone 1 — Bleu ciel : Énergie, Eau, Protéines, Lipides, Minéraux */}
            <View style={styles.nutritionMacroZone}>
              <Text style={styles.zoneTitle}>Énergie & macros</Text>
              <View style={styles.nutritionLine}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.macroLabel}>Énergie</Text>
                  <Text style={styles.macroValue}>{n.calories || 0} Kcal</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.macroLabel}>Eau</Text>
                  <Text style={styles.macroValue}>{n.water || 0} %</Text>
                </View>
              </View>
              <View style={styles.nutritionLine}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.macroLabel}>Prot.</Text>
                  <Text style={styles.macroValue}>{n.protein || 0} g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.macroLabel}>Lip</Text>
                  <Text style={styles.macroValue}>{n.fat || 0} g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.macroLabel}>Min.</Text>
                  <Text style={styles.macroValue}>{n.minerals || 0} g</Text>
                </View>
              </View>
            </View>
            {/* Zone 2 — Saumon : Glucides et dérivés */}
            <View style={styles.nutritionGlucideZone}>
              <Text style={styles.zoneTitleGlucide}>Glucides & index glycémique</Text>
              <View style={styles.nutritionLine}>
                <View style={styles.nutritionItemGlucide}>
                  <Text style={styles.glucideLabel}>Glu.</Text>
                  <Text style={styles.glucideValue}>{n.carbs || 0} g</Text>
                </View>
                <View style={styles.nutritionItemGlucide}>
                  <Text style={styles.glucideLabel}>Suc.</Text>
                  <Text style={styles.glucideValue}>{n.sugars || 0} g</Text>
                </View>
                <View style={styles.nutritionItemGlucide}>
                  <Text style={styles.glucideLabel}>Fib.</Text>
                  <Text style={styles.glucideValue}>{n.fiber || 0} g</Text>
                </View>
              </View>
              <View style={styles.nutritionLine}>
                <View style={styles.nutritionItemGlucide}>
                  <Text style={styles.glucideLabel}>IG</Text>
                  <Text style={styles.glucideValue}>{n.glycemicIndex ?? "-"}</Text>
                </View>
                <View style={styles.nutritionItemGlucide}>
                  <Text style={styles.glucideLabel}>CG</Text>
                  <Text style={styles.glucideValue}>{n.glycemicLoad ?? "-"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Informations de Coût */}
          <View style={[styles.bottomBlock, styles.costBlock]}>
            <Text style={styles.bottomBlockTitle}>Informations de Coût</Text>
            <View style={styles.bottomBlockRow}>
              <Text style={styles.bottomBlockLabel}>Coût Matière</Text>
              <Text style={styles.bottomBlockValue}>{c.materialCost.toFixed(2)} Dh</Text>
            </View>
            <View style={styles.bottomBlockRow}>
              <Text style={styles.bottomBlockLabel}>Coût Total</Text>
              <Text style={styles.bottomBlockValue}>{c.totalCost.toFixed(2)} Dh</Text>
            </View>
            <View style={styles.bottomBlockRow}>
              <Text style={styles.bottomBlockLabel}>Poids Brut</Text>
              <Text style={styles.bottomBlockValue}>{c.totalWeight.toLocaleString("fr-FR")} g</Text>
            </View>
            <View style={styles.bottomBlockRow}>
              <Text style={styles.bottomBlockLabel}>Poids Net</Text>
              <Text style={styles.bottomBlockValue}>{c.weightAfterLoss.toLocaleString("fr-FR")} g</Text>
            </View>
            <View style={styles.bottomBlockRow}>
              <Text style={styles.bottomBlockLabel}>Coût / Kg</Text>
              <Text style={styles.bottomBlockValue}>{c.costPerKg.toFixed(2)} Dh</Text>
            </View>
            <View style={[styles.bottomBlockRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.bottomBlockLabel}>Taux de Perte</Text>
              <Text style={styles.bottomBlockValue}>{c.lossRate} %</Text>
            </View>
          </View>
        </View>
        </Page>
    </Document>
  );
}
