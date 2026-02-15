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
    padding: 28,
    fontSize: 11,
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
  },
  headerLogo: {
    width: 67,
    height: 67,
    objectFit: "contain",
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "right",
  },
  editDate: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 6,
    textAlign: "right",
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
    marginTop: -16,
  },
  imageStack: {
    width: 100,
    flexDirection: "column",
  },
  imageSquare: {
    width: 100,
    height: 100,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    borderWidth: 2,
    borderColor: "#cbd5e1",
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
    alignItems: "flex-start",
    width: "100%",
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#d1fae5",
    borderWidth: 2,
    borderColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepNumberText: {
    fontSize: 8,
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
    gap: 12,
    marginTop: "auto",
    flexShrink: 0,
  },
  bottomBlock: {
    flex: 1,
    padding: 12,
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
  weighingsTable: {
    marginTop: 8,
  },
  weighingsHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingVertical: 4,
    marginBottom: 4,
  },
  weighingsHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#047857",
    textTransform: "uppercase",
  },
  weighingsRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  weighingsCell: {
    fontSize: 10,
    color: "#334155",
  },
  weighingsColName: { flex: 0.5, maxWidth: 90 },
  weighingsColPoids: { width: 55, textAlign: "right" },
  weighingsColPrix: { width: 60, textAlign: "right", marginLeft: 16 },
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
  macroValue: { fontSize: 8, fontWeight: "bold", color: "#0369a1" },
  glucideLabel: { fontSize: 9, color: "#9a3412" },
  glucideValue: { fontSize: 8, fontWeight: "bold", color: "#c2410c" },
});

export interface RecipePdfData {
  name: string;
  familyName?: string;
  subFamilyName: string;
  yieldUnit: string;
  yieldQty: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  image1?: string;
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
    costPerKg: number;
  };
  weighings: { name: string; weight: number; cost: number }[];
  editDate?: string;
  allergens?: string[];
}

export function RecipePdfA4({ data }: { data: RecipePdfData }) {
  const n = data.nutrition;
  const c = data.costing;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête : logo à gauche, titre à droite, au-dessus de la ligne verte */}
        <View style={styles.headerRow}>
          <Image src="/logo-boujniba.png" style={styles.headerLogo} />
          <View style={styles.headerTitleBlock}>
            <Text style={styles.title}>{data.name}</Text>
            {(data.familyName || data.subFamilyName) && (
              <Text style={styles.subtitle}>
                {[data.familyName, data.subFamilyName].filter(Boolean).join(" — ")}
              </Text>
            )}
            {data.editDate && (
              <Text style={styles.editDate}>Édité le {data.editDate}</Text>
            )}
          </View>
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
                <Image src={data.image1} style={styles.imageSquare} />
              ) : (
                <View style={styles.imageSquare} />
              )}
            </View>
          </View>
        </View>

        {/* Étapes - toute la largeur */}
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Étapes de Préparation</Text>
          {data.steps.map((step, i) => (
          <View key={i} style={styles.stepContainer}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.order || i + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          </View>
        ))}
        </View>

        {/* Ligne Allergènes — encadrement pleine largeur au-dessus des 2 grids */}
        {data.allergens && data.allergens.length > 0 && (
          <View style={{ width: "100%", borderWidth: 2, borderColor: "#fbbf24", borderRadius: 12, backgroundColor: "#fffbeb", padding: 12, marginBottom: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#b45309", textTransform: "uppercase", letterSpacing: 1 }}>Allergènes</Text>
            <Text style={{ fontSize: 10, color: "#334155", marginLeft: 6 }}>{data.allergens.join(", ")}</Text>
          </View>
        )}

        {/* Blocs Valeurs Nutritionnelles + Informations de Coût */}
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

          {/* Informations de Coût + Pesées */}
          <View style={[styles.bottomBlock, styles.costBlock]}>
            <Text style={styles.bottomBlockTitle}>Informations de Coût</Text>
            <View style={[styles.bottomBlockRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.bottomBlockLabel}>Coût / Kg</Text>
              <Text style={styles.bottomBlockValue}>{c.costPerKg.toFixed(2)} Dh</Text>
            </View>
            <View style={styles.weighingsTable}>
              <View style={styles.weighingsHeader}>
                <Text style={[styles.weighingsHeaderCell, styles.weighingsColName]}>Nom</Text>
                <Text style={[styles.weighingsHeaderCell, styles.weighingsColPoids]}>Poids</Text>
                <Text style={[styles.weighingsHeaderCell, styles.weighingsColPrix]}>Prix</Text>
              </View>
              {(data.weighings || []).map((w, i) => (
                <View key={i} style={styles.weighingsRow}>
                  <Text style={[styles.weighingsCell, styles.weighingsColName]}>{w.name}</Text>
                  <Text style={[styles.weighingsCell, styles.weighingsColPoids]}>{w.weight.toLocaleString("fr-FR")} g</Text>
                  <Text style={[styles.weighingsCell, styles.weighingsColPrix, { fontWeight: "bold" }]}>{w.cost.toFixed(2)} Dh</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        </Page>
    </Document>
  );
}
