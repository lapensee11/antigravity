/**
 * EXEMPLE D'UTILISATION DE L'IMPORT
 * 
 * Ce fichier montre comment utiliser la fonction d'import
 * pour importer des factures depuis une autre base de données.
 */

import { importInvoicesFromExternalDB, validateImportData, getSubFamilyIdByCode } from './import-service';

/**
 * Exemple 1: Import simple avec données complètes
 */
export async function exampleSimpleImport() {
    // Données à importer (format JSON)
    const importData = {
        // Étape 1: Fournisseurs
        tiers: [
            {
                code: "Frs-023",
                name: "Fournisseur ABC",
                type: "Fournisseur" as const,
                phone: "+33 1 23 45 67 89",
                email: "contact@abc.fr"
            },
            {
                code: "Frs-145",
                name: "Fournisseur XYZ",
                type: "Fournisseur" as const
            }
        ],

        // Étape 2: Articles
        articles: [
            {
                code: "PA011-01",
                name: "Farine T45",
                subFamilyId: "uuid-de-la-sous-famille", // ⚠️ Doit être un UUID valide
                unitPivot: "Kg",
                unitAchat: "Sac",
                unitProduction: "g",
                contenace: 25,
                coeffProd: 1000,
                vatRate: 20,
                lastPivotPrice: 5.5
            },
            {
                code: "FA021-03",
                name: "Beurre Doux",
                subFamilyId: "uuid-de-la-sous-famille",
                unitPivot: "Kg",
                unitAchat: "Carton",
                unitProduction: "g",
                contenace: 10,
                coeffProd: 1000,
                vatRate: 14,
                lastPivotPrice: 92
            }
        ],

        // Étape 3: Factures
        invoices: [
            {
                number: "BL-FRS-023-01-01",
                supplierCode: "Frs-023", // Code du fournisseur
                date: "2024-01-15",
                status: "Validated" as const,
                totalHT: 1000.00,
                totalTTC: 1200.00,
                totalVAT: 200.00,
                lines: [
                    {
                        articleCode: "PA011-01", // Code de l'article
                        articleName: "Farine T45",
                        quantity: 10,
                        unit: "Sac",
                        priceHT: 50.00,
                        discount: 0,
                        vatRate: 20,
                        totalTTC: 60.00
                    },
                    {
                        articleCode: "FA021-03",
                        articleName: "Beurre Doux",
                        quantity: 5,
                        unit: "Carton",
                        priceHT: 100.00,
                        discount: 5, // 5% de remise
                        vatRate: 14,
                        totalTTC: 133.00
                    }
                ],
                payments: [
                    {
                        date: "2024-01-20",
                        amount: 1200.00,
                        mode: "Virement" as const,
                        account: "Banque" as const,
                        reference: "VIR-2024-001"
                    }
                ]
            }
        ]
    };

    // Valider les données avant import
    const validation = await validateImportData(importData);
    if (!validation.valid) {
        console.error("Erreurs de validation:", validation.errors);
        return;
    }
    if (validation.warnings.length > 0) {
        console.warn("Avertissements:", validation.warnings);
    }

    // Importer les données
    const result = await importInvoicesFromExternalDB(importData, {
        skipDuplicates: true, // Ignorer les factures déjà existantes
        createMissingArticles: false, // Ne pas créer d'articles manquants
        batchSize: 100 // Traiter 100 factures à la fois
    });

    console.log("Résultat de l'import:", result);
}

/**
 * Exemple 2: Import avec résolution des codes de sous-famille
 */
export async function exampleImportWithSubFamilyMapping() {
    // Si vous avez les codes de sous-famille au lieu des UUIDs
    const subFamilyCodeToIdMap = new Map<string, string>();

    // Mapper les codes vers les UUIDs
    const subFamilyCodes = ["FA01", "FA02", "PA01", "PA02"];
    for (const code of subFamilyCodes) {
        const id = await getSubFamilyIdByCode(code);
        if (id) {
            subFamilyCodeToIdMap.set(code, id);
        }
    }

    // Utiliser la map pour convertir les codes en UUIDs
    const articles = [
        {
            code: "PA011-01",
            name: "Farine T45",
            subFamilyCode: "FA01", // Code au lieu d'UUID
            // ... autres champs
        }
    ].map(article => ({
        ...article,
        subFamilyId: subFamilyCodeToIdMap.get(article.subFamilyCode) || ""
    }));

    // Continuer avec l'import...
}

/**
 * Exemple 3: Import depuis un fichier JSON
 */
export async function exampleImportFromFile() {
    // Supposons que vous avez un fichier JSON
    // const fileContent = await fetch('/path/to/import-data.json').then(r => r.json());
    
    // Ou depuis un fichier local
    // const fs = require('fs');
    // const fileContent = JSON.parse(fs.readFileSync('import-data.json', 'utf8'));

    // Puis utiliser directement
    // const result = await importInvoicesFromExternalDB(fileContent);
}

/**
 * Exemple 4: Import progressif (tiers d'abord, puis articles, puis factures)
 */
export async function exampleProgressiveImport() {
    // Étape 1: Importer uniquement les fournisseurs
    const tierResult = await importInvoicesFromExternalDB({
        tiers: [
            { code: "Frs-023", name: "Fournisseur ABC", type: "Fournisseur" }
        ],
        invoices: []
    });

    // Étape 2: Importer les articles
    const articleResult = await importInvoicesFromExternalDB({
        articles: [
            {
                code: "PA011-01",
                name: "Farine T45",
                subFamilyId: "uuid",
                unitPivot: "Kg",
                unitAchat: "Sac",
                unitProduction: "g",
                contenace: 25,
                coeffProd: 1000,
                vatRate: 20
            }
        ],
        invoices: []
    });

    // Étape 3: Importer les factures
    const invoiceResult = await importInvoicesFromExternalDB({
        invoices: [
            {
                number: "BL-FRS-023-01-01",
                supplierCode: "Frs-023",
                date: "2024-01-15",
                status: "Validated",
                totalHT: 1000,
                totalTTC: 1200,
                lines: [
                    {
                        articleCode: "PA011-01",
                        articleName: "Farine T45",
                        quantity: 10,
                        unit: "Sac",
                        priceHT: 50,
                        discount: 0,
                        vatRate: 20,
                        totalTTC: 60
                    }
                ]
            }
        ]
    });
}
