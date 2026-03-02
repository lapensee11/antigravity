# Analyse de Performance - Croissance de la Base de Données

## 📊 État Actuel

Pour connaître la taille actuelle de votre base de données, exécutez dans la console du navigateur :

```javascript
import { printDatabaseSizeReport } from '@/lib/db-size-checker';
await printDatabaseSizeReport();
```

## ⚠️ Problèmes Identifiés avec la Croissance

### 1. **Chargement Complet en Mémoire** 🔴 CRITIQUE

**Problème actuel :**
- Toutes les fonctions utilisent `.toArray()` qui charge **TOUTES** les données en mémoire
- Exemples : `getInvoices()`, `getArticles()`, `getTiers()`, etc.
- Avec 1000x plus de données, cela peut charger plusieurs Go en RAM

**Impact :**
- ❌ Ralentissement du navigateur
- ❌ Consommation mémoire excessive
- ❌ Risque de crash sur appareils mobiles
- ❌ Temps de chargement initial très long

**Fichiers concernés :**
- `lib/data-service.ts` : Toutes les fonctions `get*()` utilisent `.toArray()`
- `lib/hooks/use-data.ts` : React Query cache tout en mémoire

### 2. **Pas de Pagination** 🔴 CRITIQUE

**Problème actuel :**
- Aucune pagination dans les listes
- Toutes les factures/articles sont chargés d'un coup
- Avec 100k factures, la liste sera très lente

**Impact :**
- ❌ Rendu initial très lent
- ❌ Scroll laggy
- ❌ Filtrage/recherche lente

### 3. **React Query Cache** 🟡 ATTENTION

**Problème actuel :**
- React Query garde toutes les données en cache mémoire
- Pas de limite de cache configurée
- Avec 1000x plus de données, le cache peut dépasser plusieurs Go

**Impact :**
- ❌ Consommation mémoire excessive
- ❌ Performance dégradée

### 4. **IndexedDB Limites** 🟢 OK

**Bonnes nouvelles :**
- IndexedDB peut gérer **plusieurs Go** de données (jusqu'à ~50% de l'espace disque)
- Les index sont bien configurés
- Les requêtes avec index restent rapides même avec beaucoup de données

## 🎯 Solutions Recommandées

### Phase 1 : Pagination (Priorité 1) ⚡

**Implémenter la pagination pour les grandes tables :**

```typescript
// Nouvelle fonction paginée
export async function getInvoicesPaginated(
    page: number = 0,
    pageSize: number = 50,
    filters?: { status?: string; dateFrom?: string; dateTo?: string }
): Promise<{ invoices: Invoice[]; total: number; hasMore: boolean }> {
    let query = db.invoices.orderBy('date').reverse();
    
    // Appliquer les filtres
    if (filters?.status) {
        query = query.filter(inv => inv.status === filters.status);
    }
    
    // Pagination
    const offset = page * pageSize;
    const invoices = await query.offset(offset).limit(pageSize).toArray();
    const total = await query.count();
    
    return {
        invoices,
        total,
        hasMore: offset + invoices.length < total
    };
}
```

**Nouveau hook React Query :**
```typescript
export function useInvoicesPaginated(page: number, pageSize: number = 50) {
    return useQuery({
        queryKey: ["invoices", "paginated", page, pageSize],
        queryFn: () => getInvoicesPaginated(page, pageSize),
        keepPreviousData: true, // Garde les données précédentes pendant le chargement
    });
}
```

### Phase 2 : Lazy Loading (Priorité 2) ⚡

**Charger uniquement ce qui est visible :**

```typescript
// Pour les listes avec virtual scrolling
export async function getInvoicesRange(
    startIndex: number,
    endIndex: number
): Promise<Invoice[]> {
    return await db.invoices
        .orderBy('date')
        .reverse()
        .offset(startIndex)
        .limit(endIndex - startIndex)
        .toArray();
}
```

### Phase 3 : Filtrage Côté IndexedDB (Priorité 3) ⚡

**Utiliser les index pour filtrer avant de charger :**

```typescript
// Au lieu de charger tout puis filtrer
export async function getInvoicesByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return await db.invoices
        .where('status')
        .equals(status)
        .toArray(); // Utilise l'index, beaucoup plus rapide
}
```

### Phase 4 : Cache Management (Priorité 4) ⚡

**Configurer React Query avec des limites :**

```typescript
// Dans votre QueryClientProvider
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            // Limiter la taille du cache
            refetchOnWindowFocus: false,
        },
    },
});
```

### Phase 5 : Archivage (Priorité 5) 📦

**Pour les données très anciennes :**

```typescript
// Archiver les factures de plus de 2 ans
export async function archiveOldInvoices(olderThan: Date): Promise<number> {
    const oldInvoices = await db.invoices
        .where('date')
        .below(olderThan.toISOString())
        .toArray();
    
    // Exporter vers un fichier JSON
    // Supprimer de la base principale
    // Garder seulement les métadonnées (totaux, dates)
    
    return oldInvoices.length;
}
```

## 📈 Projections de Taille

### Scénario Actuel (Base de référence)
- Factures : ~100-1000
- Articles : ~100-500
- Taille estimée : **1-5 MB**

### Scénario 100x (Quelques semaines)
- Factures : ~10,000-100,000
"- Articles : ~10,000-50,000
"- Taille estimée : **100-500 MB**

**Problèmes attendus :**
- ⚠️ Chargement initial lent (5-10 secondes)
- ⚠️ Ralentissement des listes
- ⚠️ Consommation mémoire élevée (500 MB - 1 GB)

**Solutions nécessaires :**
- ✅ Pagination obligatoire
- ✅ Lazy loading recommandé

### Scénario 1000x (Quelques mois)
- Factures : ~100,000-1,000,000
- Articles : ~100,000-500,000
- Taille estimée : **1-5 GB**

**Problèmes attendus :**
- 🔴 Chargement initial très lent (30+ secondes)
- 🔴 Crash possible sur appareils mobiles
- 🔴 IndexedDB peut ralentir significativement

**Solutions nécessaires :**
- ✅ Pagination obligatoire
- ✅ Lazy loading obligatoire
- ✅ Archivage des données anciennes
- ✅ Filtrage côté IndexedDB uniquement
- ✅ Virtual scrolling pour les listes

## 🚀 Plan d'Action Recommandé

### Immédiat (Avant 100x)
1. ✅ Implémenter la pagination pour `getInvoices()`
2. ✅ Implémenter la pagination pour `getArticles()`
3. ✅ Ajouter des hooks paginés dans React Query

### Court terme (Avant 1000x)
4. ✅ Implémenter le lazy loading pour les listes
5. ✅ Configurer le cache management de React Query
6. ✅ Optimiser les requêtes avec les index

### Long terme (Après 1000x)
7. ✅ Système d'archivage automatique
8. ✅ Virtual scrolling pour toutes les grandes listes
9. ✅ Compression des données si nécessaire

## 📝 Checklist de Migration

- [ ] Créer `getInvoicesPaginated()` dans `data-service.ts`
- [ ] Créer `useInvoicesPaginated()` dans `use-data.ts`
- [ ] Modifier `AchatsContent.tsx` pour utiliser la pagination
- [ ] Créer `getArticlesPaginated()` dans `data-service.ts`
- [ ] Modifier `ArticlesContent.tsx` pour utiliser la pagination
- [ ] Configurer React Query avec cache limits
- [ ] Tester avec des volumes importants (10k+ factures)
- [ ] Implémenter virtual scrolling si nécessaire

## 🔍 Monitoring

Utilisez `printDatabaseSizeReport()` régulièrement pour surveiller :
- Taille totale de la base
- Taille par table
- Nombre d'enregistrements par table
- Avertissements automatiques
