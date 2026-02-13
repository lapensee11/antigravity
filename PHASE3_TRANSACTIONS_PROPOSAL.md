# Proposition de Refactoring - Transactions

## 🔍 Problème Identifié

Actuellement, il y a une **redondance** entre :
- `Invoice.payments[]` : Les paiements stockés dans les factures
- `Transaction[]` : Les transactions financières (dont certaines sont générées depuis les paiements)

### Situation Actuelle

1. **Les paiements sont dans `Invoice.payments[]`**
   - Chaque facture contient un tableau de paiements
   - Format : `{ id, date, amount, mode, account, reference, note }`

2. **Les transactions sont dans `Transaction[]`**
   - Certaines transactions sont générées depuis `Invoice.payments[]` via `syncInvoiceTransactions()`
   - Format : `{ id, date, label, amount, type, category, account, invoiceId, tier, pieceNumber, mode, isReconciled }`

3. **Synchronisation manuelle**
   - `syncInvoiceTransactions()` doit être appelée pour synchroniser
   - Risque de désynchronisation
   - Complexité de maintenance

## 🎯 Options de Refactoring

### Option A : Transactions comme Vue Calculée (Recommandé) ⭐

**Principe :** Les transactions liées aux factures sont calculées depuis `Invoice.payments[]`, pas stockées.

**Avantages :**
- ✅ Source de vérité unique : `Invoice.payments[]`
- ✅ Pas de désynchronisation possible
- ✅ Code plus simple
- ✅ Moins de stockage

**Inconvénients :**
- ⚠️ Calcul à chaque requête (mais peut être caché)
- ⚠️ Requiert une migration des données existantes

**Implémentation :**
```typescript
// Transactions liées aux factures = vue calculée
async function getTransactions(): Promise<Transaction[]> {
    const invoices = await db.invoices.toArray();
    const transactions: Transaction[] = [];
    
    // Calculer depuis Invoice.payments[]
    invoices.forEach(inv => {
        inv.payments?.forEach(payment => {
            transactions.push({
                id: `tx_${inv.id}_${payment.id}`,
                date: payment.date,
                label: `Achat: ${inv.number}`,
                amount: payment.amount,
                type: "Depense",
                category: "Achat",
                account: payment.account,
                invoiceId: inv.id,
                tier: suppliers.find(s => s.id === inv.supplierId)?.name,
                pieceNumber: payment.reference,
                mode: payment.mode,
                isReconciled: payment.isReconciled || false
            });
        });
    });
    
    // Ajouter les transactions manuelles (non liées à des factures)
    const manualTxs = await db.transactions
        .where('invoiceId')
        .equals('')
        .toArray();
    
    return [...transactions, ...manualTxs];
}

// Supprimer syncInvoiceTransactions()
// Les transactions sont toujours à jour automatiquement
```

---

### Option B : Payments comme Source Unique

**Principe :** Supprimer `Invoice.payments[]`, utiliser uniquement `Transaction[]` avec `invoiceId`.

**Avantages :**
- ✅ Source de vérité unique : `Transaction[]`
- ✅ Plus flexible pour les requêtes

**Inconvénients :**
- ⚠️ Changement majeur de structure
- ⚠️ Requiert migration importante
- ⚠️ Perte de la structure de paiements dans les factures

**Implémentation :**
```typescript
// Supprimer payments[] de Invoice
interface Invoice {
    // ... autres champs
    // payments: Payment[]; // SUPPRIMÉ
}

// Récupérer les paiements depuis Transaction[]
function getInvoicePayments(invoiceId: string): Payment[] {
    const transactions = await db.transactions
        .where('invoiceId')
        .equals(invoiceId)
        .toArray();
    
    return transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        mode: tx.mode,
        account: tx.account,
        reference: tx.pieceNumber,
        note: tx.label
    }));
}
```

---

### Option C : Vue Unifiée (Compromis)

**Principe :** Garder les deux, mais créer une vue unifiée qui fusionne les deux sources.

**Avantages :**
- ✅ Pas de migration nécessaire
- ✅ Compatible avec l'existant

**Inconvénients :**
- ⚠️ Toujours deux sources de vérité
- ⚠️ Complexité maintenue

**Implémentation :**
```typescript
// Fusionner Invoice.payments[] et Transaction[]
function getInvoicePayments(invoiceId: string): Payment[] {
    const invoice = await db.invoices.get(invoiceId);
    const transactions = await db.transactions
        .where('invoiceId')
        .equals(invoiceId)
        .toArray();
    
    // Priorité : Invoice.payments[] si existe, sinon Transaction[]
    if (invoice?.payments && invoice.payments.length > 0) {
        return invoice.payments;
    }
    
    // Convertir Transaction[] en Payment[]
    return transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        mode: tx.mode,
        account: tx.account,
        reference: tx.pieceNumber,
        note: tx.label
    }));
}
```

---

## 📋 Recommandation

**Option A (Transactions comme Vue Calculée)** est recommandée car :
1. Simplifie l'architecture
2. Élimine les risques de désynchronisation
3. Réduit la complexité du code
4. Performance acceptable avec cache

## 🚀 Plan d'Implémentation (Option A)

### Étape 1 : Créer la vue calculée
- Modifier `getTransactions()` pour calculer depuis `Invoice.payments[]`
- Garder les transactions manuelles dans `Transaction[]`

### Étape 2 : Migrer les données existantes
- Créer une migration qui :
  - Lit toutes les transactions avec `invoiceId`
  - Vérifie qu'elles correspondent à `Invoice.payments[]`
  - Supprime les doublons

### Étape 3 : Supprimer `syncInvoiceTransactions()`
- Remplacer tous les appels par des invalidations de cache
- Supprimer la fonction

### Étape 4 : Tests
- Vérifier que toutes les transactions sont visibles
- Vérifier que les paiements sont correctement synchronisés

## ❓ Questions pour Validation Métier

1. **Les transactions liées aux factures doivent-elles être modifiables indépendamment des paiements ?**
   - Si NON → Option A est parfaite
   - Si OUI → Option C ou garder l'actuel

2. **Y a-t-il des transactions manuelles qui ne sont pas liées à des factures ?**
   - Si OUI → Il faut garder `Transaction[]` pour celles-ci
   - Si NON → Option B pourrait être envisagée

3. **Les transactions doivent-elles être historiques (ne pas changer même si la facture change) ?**
   - Si OUI → Option C ou garder l'actuel
   - Si NON → Option A est parfaite

## ⚠️ Impact

- **Option A** : Impact moyen (migration nécessaire, mais simplifie le code)
- **Option B** : Impact élevé (changement majeur de structure)
- **Option C** : Impact faible (ajout de code, pas de suppression)

---

**En attente de validation métier pour procéder au refactoring.**
