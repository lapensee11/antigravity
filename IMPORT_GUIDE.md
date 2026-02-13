# Guide d'Import en Masse des Factures d'Achat

## Clés de Correspondance

### Identifiants Métier (Codes)
- **Fournisseurs (Tiers)** : `code` (ex: "Frs-023", "Frs-145")
- **Articles** : `code` (ex: "PA011-01", "FA021-03")
- **Factures** : `number` (ex: "BL-FRS-01-01", "FAC-2024-001")

## Ordre d'Import (CRITIQUE)

### 1. **Tiers (Fournisseurs)** - PRIORITÉ 1
**Clé de correspondance** : `code`

**Données requises** :
```typescript
{
  code: string;        // "Frs-023" - CLÉ PRIMAIRE
  name: string;         // Nom du fournisseur
  type: "Fournisseur";  // Doit être "Fournisseur"
  // Optionnel : phone, email, address, etc.
}
```

**Logique** :
- Si `code` existe → mettre à jour
- Si `code` n'existe pas → créer avec nouvel ID

### 2. **Articles** - PRIORITÉ 2
**Clé de correspondance** : `code`

**Données requises** :
```typescript
{
  code: string;           // "PA011-01" - CLÉ PRIMAIRE
  name: string;            // Nom de l'article
  subFamilyId: string;     // UUID de la sous-famille (doit exister)
  unitPivot: string;       // "Kg", "L", etc.
  unitAchat: string;       // Unité d'achat
  unitProduction: string;  // Unité de production
  contenace: number;       // Contenance
  coeffProd: number;       // Coefficient de production
  vatRate: number;         // Taux TVA (ex: 20)
  // Optionnel : lastPivotPrice, accountingCode, etc.
}
```

**Logique** :
- Si `code` existe → mettre à jour (sauf si article lié à recette)
- Si `code` n'existe pas → créer avec nouvel ID
- ⚠️ **Important** : `subFamilyId` doit être un UUID valide de votre base

### 3. **Factures** - PRIORITÉ 3
**Clé de correspondance** : `number` (optionnel, pour éviter doublons)

**Données requises** :
```typescript
{
  number: string;          // "BL-FRS-01-01" - pour détecter doublons
  supplierCode: string;   // Code fournisseur (ex: "Frs-023")
  date: string;            // "2024-01-15" (format ISO)
  status: "Draft" | "Validated" | "Synced";
  
  // Totaux
  totalHT: number;
  totalTTC: number;
  totalVAT?: number;
  totalRemise?: number;
  rounding?: number;
  
  // Lignes (voir étape 4)
  lines: InvoiceLine[];
  
  // Paiements (optionnel)
  payments?: Payment[];
}
```

**Logique** :
- Résoudre `supplierId` via `supplierCode` → chercher Tier par `code`
- Si `number` existe → option : skip ou mettre à jour
- Générer nouvel ID pour la facture

### 4. **Lignes de Facture** - PRIORITÉ 4
**Clé de correspondance** : `articleCode` dans chaque ligne

**Données requises** :
```typescript
{
  articleCode: string;     // Code article (ex: "PA011-01")
  articleName: string;     // Nom (backup si code non trouvé)
  quantity: number;
  unit: string;           // Unité d'achat
  priceHT: number;
  discount: number;        // % de remise
  vatRate: number;         // Taux TVA
  totalTTC: number;        // Total TTC de la ligne
  details?: string;        // Détails optionnels
}
```

**Logique** :
- Résoudre `articleId` via `articleCode` → chercher Article par `code`
- Si article non trouvé → option : créer article minimal ou ignorer la ligne
- Générer nouvel ID pour chaque ligne

## Format de Données d'Import (JSON)

```json
{
  "tiers": [
    {
      "code": "Frs-023",
      "name": "Fournisseur ABC",
      "type": "Fournisseur",
      "phone": "+33 1 23 45 67 89",
      "email": "contact@abc.fr"
    }
  ],
  "articles": [
    {
      "code": "PA011-01",
      "name": "Farine T45",
      "subFamilyId": "uuid-de-la-sous-famille",
      "unitPivot": "Kg",
      "unitAchat": "Sac",
      "unitProduction": "g",
      "contenace": 25,
      "coeffProd": 1000,
      "vatRate": 20
    }
  ],
  "invoices": [
    {
      "number": "BL-FRS-023-01-01",
      "supplierCode": "Frs-023",
      "date": "2024-01-15",
      "status": "Validated",
      "totalHT": 1000.00,
      "totalTTC": 1200.00,
      "totalVAT": 200.00,
      "lines": [
        {
          "articleCode": "PA011-01",
          "articleName": "Farine T45",
          "quantity": 10,
          "unit": "Sac",
          "priceHT": 50.00,
          "discount": 0,
          "vatRate": 20,
          "totalTTC": 60.00
        }
      ],
      "payments": [
        {
          "date": "2024-01-20",
          "amount": 1200.00,
          "mode": "Virement",
          "account": "Banque",
          "reference": "VIR-2024-001"
        }
      ]
    }
  ]
}
```

## Points d'Attention

1. **SubFamilyId** : Doit être un UUID valide de votre base. Si vous avez les codes de sous-famille, il faudra les mapper vers les UUIDs.

2. **Articles liés à recettes** : Les articles avec `linkedRecipeId` ou `isSubRecipe: true` sont gérés automatiquement. Ne les importez pas manuellement.

3. **Doublons** : 
   - Factures : Vérifier par `number` avant import
   - Articles : Vérifier par `code` avant import
   - Tiers : Vérifier par `code` avant import

4. **Validation** :
   - Tous les `supplierCode` doivent avoir un Tier correspondant
   - Tous les `articleCode` doivent avoir un Article correspondant (ou être créés)
   - Les `subFamilyId` doivent être valides

5. **Performance** : Pour de gros volumes, importer par lots (ex: 100 factures à la fois)

## Fonction d'Import

Voir `lib/import-service.ts` pour la fonction `importInvoicesFromExternalDB()` qui gère automatiquement :
- Résolution des codes vers IDs
- Création des entités manquantes
- Validation des données
- Gestion des erreurs
