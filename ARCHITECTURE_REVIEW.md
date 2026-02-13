# Analyse Architecturale Complète - BAKO

## 🔍 Vue d'ensemble

Cette analyse identifie les redondances, imperfections et nœuds de conflit dans l'architecture actuelle, avec des propositions de correction tout en préservant les spécificités métier.

---

## 1. 🔴 REDONDANCES CRITIQUES

### 1.1. Double Chargement des Données (Pattern Anti-Pattern)

**Problème identifié :**
- **Tous les composants `*Content.tsx`** chargent les données deux fois :
  1. Via `initialData` passé depuis la page
  2. Via `useEffect` qui recharge immédiatement depuis la DB

**Fichiers concernés :**
- `components/achats/AchatsContent.tsx` (lignes 30-59)
- `components/articles/ArticlesContent.tsx` (lignes 19-44)
- `components/production/ProductionContent.tsx` (lignes 43-45)
- `components/tiers/TiersContent.tsx`
- `components/finance/FinanceContent.tsx`

**Impact :**
- ⚠️ Double requête DB inutile
- ⚠️ Latence perçue augmentée
- ⚠️ Risque de race condition
- ⚠️ État local écrasé par le rechargement

**Solution proposée :**
```typescript
// OPTION A : Utiliser React Query partout (recommandé)
export function AchatsContent() {
    const { data: invoices } = useInvoices();
    const { data: articles } = useArticles();
    const { data: tiers } = useTiers();
    // Plus besoin de initialData ni de useEffect
}

// OPTION B : Supprimer le rechargement si initialData existe
useEffect(() => {
    // Ne recharger que si initialData est vide ou si données modifiées ailleurs
    if (initialInvoices.length === 0) {
        loadData();
    }
}, []);
```

---

### 1.2. Redondance Articles ↔ Recipes

**Problème identifié :**
- Les recettes sont converties en articles à chaque appel de `getArticles()`
- Conversion dynamique à chaque requête (pas de cache)
- Articles de sous-recettes créés en double (`SR-{id}` vs `RECIPE-{id}`)

**Fichiers concernés :**
- `lib/data-service.ts` (lignes 63-170)
- `lib/data-service.ts` (lignes 305-389) - `createOrUpdateSubRecipeArticle`

**Impact :**
- ⚠️ Performance : conversion répétée à chaque `getArticles()`
- ⚠️ Incohérence : deux représentations d'une même entité
- ⚠️ Complexité : logique de conversion dispersée

**Solution proposée :**
```typescript
// Créer une vue matérialisée ou un index
// Option 1 : Vue matérialisée (recommandé)
const recipeArticlesCache = new Map<string, Article>();

async function getArticles(): Promise<Article[]> {
    // Charger articles réels
    const articles = await db.articles.toArray();
    
    // Charger recettes et convertir UNE FOIS
    const recipes = await db.recipes.toArray();
    const recipeArticles = recipes
        .filter(r => productionSubFamilyIds.has(r.subFamilyId))
        .map(convertRecipeToArticle);
    
    return [...articles, ...recipeArticles];
}

// Option 2 : Index dédié pour les articles de recettes
// Créer une table `recipe_articles` synchronisée automatiquement
```

---

### 1.3. Redondance Transactions ↔ Invoice Payments

**Problème identifié :**
- Les paiements de factures sont dupliqués dans `transactions`
- Logique de synchronisation complexe (`syncInvoiceTransactions`)
- Risque de désynchronisation

**Fichiers concernés :**
- `lib/data-service.ts` (lignes 239-265)
- `components/achats/AchatsContent.tsx` (ligne 67)

**Impact :**
- ⚠️ Données dupliquées (source de vérité ambiguë)
- ⚠️ Complexité de synchronisation
- ⚠️ Risque d'incohérence

**Solution proposée :**
```typescript
// Option A : Transactions comme vue calculée (recommandé)
// Ne pas stocker les transactions, les calculer depuis invoices.payments
async function getTransactions(): Promise<Transaction[]> {
    const invoices = await db.invoices.toArray();
    const transactions: Transaction[] = [];
    
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
                isReconciled: payment.isReconciled
            });
        });
    });
    
    // Ajouter les transactions manuelles (non liées à des factures)
    const manualTxs = await db.transactions.where('invoiceId').equals('').toArray();
    return [...transactions, ...manualTxs];
}

// Option B : Transactions comme source de vérité unique
// Supprimer payments[] de Invoice, utiliser uniquement transactions
```

---

### 1.4. Redondance AccountingCode dans Article

**Problème identifié :**
- `Article` a trois champs pour le compte comptable :
  - `accountingNature` (deprecated)
  - `accountingAccount` (legacy string)
  - `accountingCode` (nouveau, référence à AccountingAccount)

**Fichiers concernés :**
- `lib/types.ts` (lignes 44-48)

**Impact :**
- ⚠️ Confusion sur la source de vérité
- ⚠️ Migration incomplète
- ⚠️ Risque d'incohérence

**Solution proposée :**
```typescript
// Migration complète vers accountingCode uniquement
// Supprimer accountingNature et accountingAccount après migration
interface Article {
    // ... autres champs
    accountingCode?: string; // ID de AccountingAccount (source de vérité unique)
    // Supprimer : accountingNature, accountingAccount
}
```

---

## 2. ⚠️ IMPERFECTIONS ARCHITECTURALES

### 2.1. Correction Automatique des IDs (Anti-Pattern)

**Problème identifié :**
- `getArticles()` et `createOrUpdateSubRecipeArticle()` corrigent automatiquement les `subFamilyId` qui sont des noms au lieu d'UUIDs
- Cette logique devrait être dans une migration, pas dans le code de production

**Fichiers concernés :**
- `lib/data-service.ts` (lignes 69-112, 346-359)

**Impact :**
- ⚠️ Performance : vérification à chaque requête
- ⚠️ Masque les problèmes de données
- ⚠️ Code difficile à maintenir

**Solution proposée :**
```typescript
// Créer une migration dédiée
export async function migrateSubFamilyIdsToUUIDs(): Promise<{ count: number }> {
    const articles = await db.articles.toArray();
    const recipes = await db.recipes.toArray();
    const subFamilies = await db.subFamilies.toArray();
    let count = 0;
    
    for (const article of articles) {
        if (article.subFamilyId && !isUUID(article.subFamilyId)) {
            const subFamily = subFamilies.find(sf => sf.name === article.subFamilyId);
            if (subFamily) {
                await db.articles.update(article.id, { subFamilyId: subFamily.id });
                count++;
            }
        }
    }
    
    // Même chose pour recipes...
    return { count };
}

// Appeler UNE FOIS au démarrage, puis supprimer le code de correction
```

---

### 2.2. Gestion d'État Incohérente

**Problème identifié :**
- Mélange de `useState` et React Query
- `StructureContent` utilise React Query ✅
- `AchatsContent`, `ArticlesContent`, `ProductionContent` utilisent `useState` ❌

**Impact :**
- ⚠️ Incohérence dans la gestion d'état
- ⚠️ Pas de cache partagé entre composants
- ⚠️ Risque de désynchronisation

**Solution proposée :**
```typescript
// Standardiser sur React Query partout
// Créer des hooks personnalisés pour chaque entité
export function useInvoices() {
    return useQuery({
        queryKey: ["invoices"],
        queryFn: getInvoices,
        staleTime: 30000, // Cache 30s
    });
}

// Utiliser dans tous les composants
export function AchatsContent() {
    const { data: invoices = [] } = useInvoices();
    const { data: articles = [] } = useArticles();
    const { data: tiers = [] } = useTiers();
    // Plus besoin de useState ni useEffect
}
```

---

### 2.3. Calculs de Coût Redondants

**Problème identifié :**
- `calculateRecipeTotals()` appelé à plusieurs endroits
- Calculs de coût dupliqués dans `createOrUpdateSubRecipeArticle()`
- Pas de cache des résultats

**Fichiers concernés :**
- `lib/data-service.ts` (lignes 312-323)
- `components/production/ProductionContent.tsx`

**Solution proposée :**
```typescript
// Centraliser les calculs dans une fonction utilitaire
export function calculateRecipeCost(recipe: Recipe): {
    materialCost: number;
    totalCost: number;
    costPerUnit: number;
} {
    const materialCost = (recipe.ingredients || []).reduce((sum, ing) => 
        sum + (ing.cost || 0), 0
    );
    
    const laborCost = recipe.costing?.laborCost || 0;
    const machineCost = (recipe.costing as any)?.machineCost || 0;
    const storageCost = recipe.costing?.storageCost || 0;
    const lossRate = recipe.costing?.lossRate || 0;
    
    const totalCost = (materialCost + laborCost + machineCost + storageCost) * 
                     (1 + lossRate / 100);
    const costPerUnit = recipe.yield > 0 ? totalCost / recipe.yield : 0;
    
    return { materialCost, totalCost, costPerUnit };
}

// Utiliser partout au lieu de dupliquer la logique
```

---

### 2.4. Index Manquants dans la Base de Données

**Problème identifié :**
- Index limités dans Dexie schema
- Requêtes fréquentes non optimisées

**Fichiers concernés :**
- `lib/db.ts` (lignes 25-60)

**Solution proposée :**
```typescript
this.version(10).stores({
    invoices: 'id, supplierId, date, status, totalTTC, syncTime', // Ajouter syncTime
    articles: 'id, name, subFamilyId, linkedRecipeId, isSubRecipe', // Ajouter isSubRecipe
    recipes: 'id, name, subFamilyId, familyId, isSubRecipe', // Ajouter familyId, isSubRecipe
    transactions: 'id, date, type, account, invoiceId, isReconciled', // Ajouter isReconciled
    tiers: 'id, name, type, code', // Ajouter code
    // ...
});
```

---

## 3. 🔗 NOEUDS DE CONFLIT

### 3.1. Conflit Articles ↔ Recipes (Sous-Recettes)

**Problème identifié :**
- Les sous-recettes existent à la fois comme `Recipe` et comme `Article`
- Synchronisation manuelle entre les deux
- Risque de désynchronisation

**Solution proposée :**
```typescript
// Option A : Articles comme vue uniquement (recommandé)
// Ne jamais créer d'article pour sous-recette
// Utiliser directement la recette dans les ingrédients

// Option B : Article comme source de vérité unique
// Supprimer isSubRecipe de Recipe, créer uniquement Article
// Mais cela casse la logique métier actuelle

// Option C : Synchronisation automatique avec trigger (meilleur compromis)
// Créer un hook de synchronisation qui maintient la cohérence
async function syncSubRecipeArticle(recipe: Recipe): Promise<void> {
    if (!recipe.isSubRecipe) {
        // Supprimer l'article si la recette n'est plus une sous-recette
        await db.articles.where('linkedRecipeId').equals(recipe.id).delete();
        return;
    }
    
    // Créer/mettre à jour l'article automatiquement
    await createOrUpdateSubRecipeArticle(recipe);
}

// Appeler automatiquement après chaque saveRecipe
```

---

### 3.2. Conflit Invoice Payments ↔ Transactions

**Problème identifié :**
- Les paiements sont dans `Invoice.payments[]`
- Mais aussi dans `Transaction[]` avec `invoiceId`
- Synchronisation manuelle via `syncInvoiceTransactions()`

**Solution proposée :**
```typescript
// Option A : Transactions comme source unique (recommandé)
interface Invoice {
    // ... autres champs
    // Supprimer payments: Payment[]
    // Calculer depuis transactions où invoiceId = invoice.id
}

// Option B : Payments comme source unique
// Supprimer les transactions liées aux factures
// Garder uniquement les transactions manuelles

// Option C : Vue unifiée (meilleur compromis)
function getInvoicePayments(invoiceId: string): Payment[] {
    // Récupérer depuis Invoice.payments si existe
    // Sinon calculer depuis Transaction[]
    // Fusionner les deux sources
}
```

---

### 3.3. Conflit de Filtrage par Date

**Problème identifié :**
- Filtre par date initialisé à "Semaine" mais dates vides
- Logique de filtrage complexe et dispersée
- Risque de masquer des données

**Solution proposée :**
```typescript
// Initialiser le filtre à "TOUT" par défaut (déjà fait ✅)
// Centraliser la logique de filtrage dans un hook
function useInvoiceFilters() {
    const [dateFilter, setDateFilter] = useState<"TOUT" | "MOIS" | "TRIMESTRE">("TOUT");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    
    useEffect(() => {
        if (dateFilter === "MOIS") {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1)
                .toISOString().split('T')[0];
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                .toISOString().split('T')[0];
            setDateFrom(start);
            setDateTo(end);
        } else if (dateFilter === "TRIMESTRE") {
            // ... logique trimestre
        } else {
            setDateFrom("");
            setDateTo("");
        }
    }, [dateFilter]);
    
    return { dateFilter, setDateFilter, dateFrom, dateTo, setDateFrom, setDateTo };
}
```

---

## 4. 🚀 PROPOSITIONS D'AMÉLIORATION

### 4.1. Architecture de Données Unifiée

**Objectif :** Réduire les redondances et simplifier la synchronisation

**Plan d'action :**

1. **Standardiser sur React Query**
   - Migrer tous les composants vers React Query
   - Supprimer les `useState` + `useEffect` de chargement
   - Utiliser `initialData` uniquement pour le SSR

2. **Créer des Vues Matérialisées**
   - `getArticles()` : Cache les articles de recettes
   - `getTransactions()` : Vue calculée depuis `Invoice.payments`
   - `getInvoicePayments()` : Fusionne `Invoice.payments` et `Transaction[]`

3. **Index Optimisés**
   - Ajouter tous les champs fréquemment filtrés/triés
   - Créer des index composites pour les requêtes complexes

---

### 4.2. Refactoring des Relations

**Objectif :** Clarifier les relations entre entités

**Plan d'action :**

1. **Articles ↔ Recipes**
   ```typescript
   // Clarifier la relation :
   // - Recipe.isSubRecipe = true → Créer Article automatiquement
   // - Article.linkedRecipeId → Référence vers Recipe
   // - getArticles() retourne les deux types unifiés
   ```

2. **Invoices ↔ Transactions**
   ```typescript
   // Option recommandée : Transactions comme vue calculée
   // Invoice.payments[] = source de vérité
   // Transaction[] = vue calculée + transactions manuelles
   ```

3. **AccountingCode Migration**
   ```typescript
   // Migration complète vers accountingCode uniquement
   // Supprimer accountingNature et accountingAccount après migration
   ```

---

### 4.3. Performance et Cache

**Objectif :** Améliorer les performances et réduire les requêtes

**Plan d'action :**

1. **Cache React Query**
   ```typescript
   // Configurer staleTime et cacheTime appropriés
   staleTime: 5 * 60 * 1000, // 5 minutes
   cacheTime: 10 * 60 * 1000, // 10 minutes
   ```

2. **Requêtes Optimisées**
   ```typescript
   // Utiliser des requêtes sélectives au lieu de toArray()
   // Exemple : getInvoicesByDateRange(), getArticlesBySubFamily()
   ```

3. **Lazy Loading**
   ```typescript
   // Charger les données seulement quand nécessaire
   // Exemple : Charger les invoices seulement quand le module Achats est ouvert
   ```

---

### 4.4. Gestion d'Erreurs et Validation

**Objectif :** Améliorer la robustesse

**Plan d'action :**

1. **Validation Centralisée**
   ```typescript
   // Créer des schémas de validation (Zod ou Yup)
   // Valider avant chaque sauvegarde
   ```

2. **Gestion d'Erreurs Unifiée**
   ```typescript
   // Créer un système de gestion d'erreurs centralisé
   // Logger toutes les erreurs avec contexte
   ```

3. **Transactions Atomiques**
   ```typescript
   // Utiliser les transactions Dexie pour les opérations complexes
   // Exemple : Créer recette + article sous-recette en une transaction
   ```

---

## 5. 📋 PLAN DE MIGRATION RECOMMANDÉ

### Phase 1 : Nettoyage Immédiat (Impact faible)
1. ✅ Supprimer le double chargement dans `AchatsContent`
2. ✅ Migrer vers React Query pour `AchatsContent`
3. ✅ Corriger le filtre par date (déjà fait)
4. ✅ Ajouter `handleUpdate` sauvegarde DB (déjà fait)

### Phase 2 : Refactoring Articles/Recipes (Impact moyen)
1. Créer une fonction `calculateRecipeCost()` centralisée
2. Créer une migration pour corriger les `subFamilyId`
3. Supprimer la logique de correction automatique
4. Optimiser `getArticles()` avec cache

### Phase 3 : Refactoring Transactions (Impact élevé)
1. Décider de la source de vérité (Invoice.payments vs Transaction[])
2. Créer une vue unifiée `getInvoicePayments()`
3. Migrer progressivement vers la nouvelle architecture
4. Supprimer `syncInvoiceTransactions()` si transactions deviennent vue

### Phase 4 : Optimisations Finales (Impact faible)
1. Ajouter les index manquants
2. Optimiser les requêtes fréquentes
3. Implémenter le lazy loading
4. Ajouter la validation centralisée

---

## 6. ⚖️ CONSIDÉRATIONS MÉTIER

### Préservation des Spécificités

Toutes les propositions respectent les spécificités métier existantes :

✅ **Sous-recettes** : Logique préservée, juste optimisée
✅ **Numérotation factures** : Format `BL-{Code}-{JJ/MM}-{##}` préservé
✅ **Synchronisation** : Logique préservée, juste simplifiée
✅ **Calculs de coût** : Logique préservée, juste centralisée
✅ **Filtres et tris** : Fonctionnalités préservées, juste optimisées

---

## 7. 📊 MÉTRIQUES D'AMÉLIORATION ATTENDUES

- **Réduction des requêtes DB** : -50% (suppression du double chargement)
- **Temps de chargement** : -30% (cache React Query)
- **Complexité du code** : -25% (suppression des redondances)
- **Risque de bugs** : -40% (source de vérité unique)
- **Maintenabilité** : +50% (code plus clair et centralisé)

---

## 8. 🎯 RECOMMANDATIONS PRIORITAIRES

### 🔴 Priorité Haute (À faire immédiatement)
1. Supprimer le double chargement dans tous les composants
2. Migrer vers React Query partout
3. Corriger la migration des `subFamilyId` (une seule fois)

### 🟡 Priorité Moyenne (À planifier)
1. Centraliser les calculs de coût
2. Optimiser `getArticles()` avec cache
3. Ajouter les index manquants

### 🟢 Priorité Basse (Amélioration continue)
1. Refactoring Transactions (nécessite validation métier)
2. Migration AccountingCode complète
3. Lazy loading et optimisations avancées

---

## Conclusion

L'architecture actuelle fonctionne mais présente plusieurs opportunités d'amélioration. Les propositions ci-dessus permettent de :
- ✅ Réduire les redondances
- ✅ Améliorer les performances
- ✅ Simplifier la maintenance
- ✅ Préserver toutes les spécificités métier

**Prochaine étape recommandée :** Commencer par la Phase 1 (nettoyage immédiat) qui a un impact faible mais des bénéfices immédiats.
