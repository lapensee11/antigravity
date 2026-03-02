# Guide d'Import Excel des Factures d'Achat

## Important : Pas besoin des ID internes

L'import utilise les **codes métier** (pas les UUID/ID internes) :
- **Facture** → `number` (ex: "BL-FRS-023-01-01") — identifiant unique métier
- **Fournisseur** → `code` (ex: "Frs-023")
- **Article** → `code` (ex: "PA011-01")

Les ID de facture et de lignes sont **générés automatiquement** lors de l'import. Vous devez simplement assurer la **liaison facture ↔ lignes** via le numéro de facture.

---

## Liaison Facture ↔ Lignes : Comment ne rien rater

### Principe de liaison
Chaque ligne de facture doit être rattachée à sa facture par le **même numéro de facture** (`number`).  
**Une facture = un numéro unique**. Toutes les lignes partageant ce numéro appartiennent à cette facture.

### En Excel : Format recommandé (une feuille par type)

| Feuille | Clé de liaison | Rôle |
|---------|----------------|------|
| **Tiers** | `code` | Fournisseurs (référencés par `supplierCode` dans Factures) |
| **Articles** | `code` | Articles (référencés par `articleCode` dans Lignes) |
| **Factures** | `number` | En-têtes des factures |
| **Lignes** | `invoiceNumber` | Détail des lignes — **chaque ligne a le `number` de sa facture** |

La liaison Facture ↔ Lignes se fait via la colonne **`invoiceNumber`** (ou `number`) dans la feuille Lignes : elle doit contenir exactement le même numéro que la facture concernée.

---

## 1. Feuille TIERS (Fournisseurs)

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `code` | Oui | Code unique du fournisseur (clé) | Frs-023 |
| `name` | Oui | Nom du fournisseur | Fournisseur ABC |
| `type` | Oui | Doit être "Fournisseur" | Fournisseur |
| `phone` | Non | Téléphone | +33 1 23 45 67 89 |
| `email` | Non | Email | contact@abc.fr |
| `address` | Non | Adresse | 12 rue des Fleurs |
| `city` | Non | Ville | Paris |

---

## 2. Feuille ARTICLES

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `code` | Oui | Code unique de l'article (clé) | PA011-01 |
| `name` | Oui | Désignation | Farine T45 |
| `subFamilyId` | Oui | UUID de la sous-famille (voir ci-dessous) | uuid-... |
| `unitPivot` | Oui | Unité pivot | Kg |
| `unitAchat` | Oui | Unité d'achat | Sac |
| `unitProduction` | Oui | Unité de production | g |
| `contenace` | Oui | Contenance (nombre) | 25 |
| `coeffProd` | Oui | Coefficient de production | 1000 |
| `vatRate` | Oui | Taux TVA (%) | 20 |
| `lastPivotPrice` | Non | Dernier prix pivot | 0.85 |

**Note sur `subFamilyId`** : C’est un UUID de la base BAKO. Si vous n’avez que des codes de sous-famille, il faudra un mapping code → UUID avant import (voir `getSubFamilyIdByCode()` dans `lib/import-service.ts`).

---

## 3. Feuille FACTURES (en-têtes)

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `number` | Oui | Numéro de facture (unique, clé de liaison) | BL-FRS-023-01-01 |
| `supplierCode` | Oui | Code du fournisseur (doit exister dans Tiers) | Frs-023 |
| `date` | Oui | Date ISO (AAAA-MM-JJ) | 2024-01-15 |
| `status` | Oui | Draft, Validated, Synced ou Modified | Validated |
| `totalHT` | Oui | Total HT | 1000.00 |
| `totalTTC` | Oui | Total TTC | 1200.00 |
| `totalVAT` | Non | Total TVA | 200.00 |
| `totalRemise` | Non | Total remise | 0 |
| `rounding` | Non | Arrondi | 0 |
| `deposit` | Non | Acompte | 0 |
| `balanceDue` | Non | Solde dû | 1200.00 |
| `comment` | Non | Commentaire | |

---

## 4. Feuille LIGNES (détail par ligne)

**Chaque ligne est rattachée à sa facture par `invoiceNumber` = `number` de la facture.**

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `invoiceNumber` | Oui | Numéro de la facture à laquelle appartient la ligne | BL-FRS-023-01-01 |
| `articleCode` | Oui | Code article (doit exister dans Articles) | PA011-01 |
| `articleName` | Oui | Désignation (secours si article non trouvé) | Farine T45 |
| `quantity` | Oui | Quantité | 10 |
| `unit` | Oui | Unité | Sac |
| `priceHT` | Oui | Prix unitaire HT | 50.00 |
| `discount` | Oui | Remise (%) | 0 |
| `vatRate` | Oui | Taux TVA (%) | 20 |
| `totalTTC` | Oui | Total TTC de la ligne | 600.00 |
| `details` | Non | Détails | |

---

## 5. Feuille PAIEMENTS (optionnelle)

| Colonne | Obligatoire | Description | Exemple |
|---------|-------------|-------------|---------|
| `invoiceNumber` | Oui | Numéro de la facture | BL-FRS-023-01-01 |
| `date` | Oui | Date du paiement (AAAA-MM-JJ) | 2024-01-20 |
| `amount` | Oui | Montant | 1200.00 |
| `mode` | Oui | Virement, Espèces, Chèques ou Prélèvement | Virement |
| `account` | Oui | Banque, Caisse ou Coffre | Banque |
| `reference` | Non | Référence (ex. N° chèque) | VIR-2024-001 |

---

## Checklist pour ne rien rater

### Avant export / saisie
- [ ] Chaque facture a un **numéro unique** (`number`)
- [ ] Chaque fournisseur a un **code unique** dans Tiers
- [ ] Chaque article a un **code unique** dans Articles
- [ ] Les codes fournisseurs des factures existent dans Tiers
- [ ] Les codes articles des lignes existent dans Articles

### Liaison Facture ↔ Lignes
- [ ] Chaque ligne de la feuille Lignes a une colonne `invoiceNumber` (ou équivalent) avec le **numéro exact** de la facture
- [ ] Pas d’espace en trop, pas de différence de casse (ex: "BL-FRS-023-01-01" partout)
- [ ] Vérification : pour chaque `number` dans Factures, il existe au moins une ligne dans Lignes avec le même `invoiceNumber`

### Contrôles de cohérence
- [ ] Somme des `totalTTC` des lignes d’une facture ≈ `totalTTC` de la facture (tolérance d’arrondi)
- [ ] Dates au format ISO (AAAA-MM-JJ)
- [ ] Montants avec point décimal (ex: 1200.00)

---

## Conversion Excel → JSON pour l’import

L’import actuel attend un objet JSON avec cette structure :

```json
{
  "tiers": [ { "code": "...", "name": "...", "type": "Fournisseur", ... } ],
  "articles": [ { "code": "...", "name": "...", "subFamilyId": "uuid-...", ... } ],
  "invoices": [
    {
      "number": "BL-FRS-023-01-01",
      "supplierCode": "Frs-023",
      "date": "2024-01-15",
      "status": "Validated",
      "totalHT": 1000,
      "totalTTC": 1200,
      "lines": [
        {
          "articleCode": "PA011-01",
          "articleName": "Farine T45",
          "quantity": 10,
          "unit": "Sac",
          "priceHT": 50,
          "discount": 0,
          "vatRate": 20,
          "totalTTC": 600
        }
      ],
      "payments": [
        {
          "date": "2024-01-20",
          "amount": 1200,
          "mode": "Virement",
          "account": "Banque"
        }
      ]
    }
  ]
}
```

Pour passer d’Excel à ce JSON :
1. Lire les feuilles Tiers, Articles, Factures, Lignes, Paiements
2. Pour chaque facture, regrouper les lignes où `invoiceNumber` = `number` de la facture
3. Pour chaque facture, regrouper les paiements où `invoiceNumber` = `number` de la facture
4. Construire le tableau `invoices` avec `lines` et `payments` imbriqués

Un script ou outil de conversion (Node.js, Python, etc.) peut automatiser ces étapes à partir de vos fichiers Excel.

---

## Résumé : ID et liaison

| Donnée | Clé utilisée | Génération des ID |
|--------|--------------|-------------------|
| Facture | `number` | ID généré à l’import (`inv_xxx`) |
| Lignes | `invoiceNumber` = `number` de la facture | ID généré pour chaque ligne (`line_xxx`) |
| Fournisseur | `code` | Résolution vers ID existant ou création |
| Article | `code` | Résolution vers ID existant ou création |

**En pratique** : ne pas gérer les ID. Utiliser uniquement les codes métier et la colonne `invoiceNumber` dans les lignes pour les rattacher aux factures.
