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
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
  },
  headerLogo: {
    width: 45,
    height: 45,
    objectFit: "contain",
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#047857",
    marginTop: 10,
    marginBottom: 5,
  },
  ingredientsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  ingredientsCol: {
    width: "66.66%",
  },
  imagesCol: {
    width: "33.33%",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginTop: -10,
  },
  imageStack: {
    width: 70,
    flexDirection: "column",
  },
  imageSquare: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    borderWidth: 2,
    borderColor: "#cbd5e1",
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
    alignItems: "flex-start",
    width: "100%",
  },
  stepNumber: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#d1fae5",
    borderWidth: 2,
    borderColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  stepNumberText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#047857",
  },
  stepContent: {
    flex: 1,
  },
  stepDesc: {
    fontSize: 9,
    color: "#334155",
    textAlign: "justify",
    lineHeight: 1.4,
  },
  stepDuration: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
  },
  stepsWrapper: {
    flex: 1,
    minHeight: 0,
    flexShrink: 1,
    maxHeight: 185,
    overflow: "hidden",
  },
  editDate: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 4,
    textAlign: "right",
  },
  bottomSection: {
    marginTop: "auto",
    flexShrink: 0,
  },
  bottomBlocks: {
    flexDirection: "row",
    gap: 8,
  },
  bottomBlock: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  bottomBlockTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#047857",
    marginBottom: 6,
    paddingBottom: 4,
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
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
  },
  nutritionGlucideZone: {
    backgroundColor: "#ffedd5",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 6,
    padding: 6,
  },
  zoneTitle: { fontSize: 7, fontWeight: "bold", color: "#0369a1", marginBottom: 4, textTransform: "uppercase" },
  zoneTitleGlucide: { fontSize: 7, fontWeight: "bold", color: "#c2410c", marginBottom: 4, textTransform: "uppercase" },
  nutritionLine: { flexDirection: "row", gap: 6, paddingVertical: 2, marginBottom: 1 },
  nutritionItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 4,
  },
  nutritionItemGlucide: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 4,
  },
  macroLabel: { fontSize: 7, color: "#0c4a6e" },
  macroValue: { fontSize: 6, fontWeight: "bold", color: "#0369a1" },
  glucideLabel: { fontSize: 7, color: "#9a3412" },
  glucideValue: { fontSize: 6, fontWeight: "bold", color: "#c2410c" },
  costBlock: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  bottomBlockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  bottomBlockLabel: { fontSize: 8, color: "#475569" },
  bottomBlockValue: { fontSize: 9, fontWeight: "bold", color: "#0f172a" },
  weighingsTable: { marginTop: 6 },
  weighingsHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#059669",
    paddingVertical: 2,
    marginBottom: 2,
  },
  weighingsHeaderCell: { fontSize: 7, fontWeight: "bold", color: "#047857", textTransform: "uppercase" },
  weighingsRow: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  weighingsCell: { fontSize: 8, color: "#334155" },
  weighingsColName: { flex: 1 },
  weighingsColPoids: { width: 45, textAlign: "right" },
});

export interface RecipePdfA5Data {
  name: string;
  familyName?: string;
  subFamilyName: string;
  yieldUnit: string;
  yieldQty: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  image1?: string;
  steps: { order: number; description: string; duration?: number }[];
  editDate?: string;
  nutrition?: {
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
  costing?: { costPerKg: number };
  weighings?: { name: string; weight: number; cost: number }[];
  allergens?: string[];
}

export function RecipePdfA5({ data }: { data: RecipePdfA5Data }) {
  const n = data.nutrition || {};
  const c = data.costing || { costPerKg: 0 };

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* En-tête : logo à gauche, titre à droite */}
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

        {/* Ingrédients (2/3) + Image (1/3) */}
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

        {/* Étapes — hauteur limitée pour garantir la visibilité des blocs du bas */}
        <View style={styles.stepsWrapper}>
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
        </View>

        {/* Section bas de page : Allergènes + Valeurs Nutritionnelles + Informations de Coût */}
        <View style={styles.bottomSection}>
          {data.allergens && data.allergens.length > 0 && (
            <View style={{ width: "100%", borderWidth: 2, borderColor: "#fbbf24", borderRadius: 8, backgroundColor: "#fffbeb", padding: 6, marginBottom: 8, flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: "#b45309", textTransform: "uppercase" }}>Allergènes</Text>
              <Text style={{ fontSize: 8, color: "#334155", marginLeft: 4 }}>{data.allergens.join(", ")}</Text>
            </View>
          )}

          {/* Blocs Valeurs Nutritionnelles + Informations de Coût (sans colonne Prix) */}
          <View style={styles.bottomBlocks}>
          {/* Valeurs Nutritionnelles */}
          <View style={[styles.bottomBlock, styles.nutritionBlock]}>
            <Text style={styles.bottomBlockTitle}>Valeurs Nutritionnelles (pour 100g)</Text>
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

          {/* Informations de Coût — tableau Nom + Poids uniquement (sans Prix, sans Coût/Kg) */}
          <View style={[styles.bottomBlock, styles.costBlock]}>
            <Text style={styles.bottomBlockTitle}>Informations de Coût</Text>
            <View style={styles.weighingsTable}>
              <View style={styles.weighingsHeader}>
                <Text style={[styles.weighingsHeaderCell, styles.weighingsColName]}>Nom</Text>
                <Text style={[styles.weighingsHeaderCell, styles.weighingsColPoids]}>Poids</Text>
              </View>
              {(data.weighings || []).map((w, i) => (
                <View key={i} style={styles.weighingsRow}>
                  <Text style={[styles.weighingsCell, styles.weighingsColName]}>{w.name}</Text>
                  <Text style={[styles.weighingsCell, styles.weighingsColPoids]}>{w.weight.toLocaleString("fr-FR")} g</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        </View>
      </Page>
    </Document>
  );
}
