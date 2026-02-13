# Guide d'Utilisation de la Pagination

## 📋 Vue d'ensemble

La pagination a été implémentée pour gérer efficacement les grandes quantités de données. Elle permet de charger uniquement les éléments nécessaires au lieu de tout charger en mémoire.

## 🎯 Paramètres de Pagination

### Paramètres disponibles

1. **`page`** (number) : Numéro de la page actuelle (commence à 0)
   - Exemple : `0` = première page, `1` = deuxième page

2. **`pageSize`** (number) : Nombre d'éléments par page
   - Valeurs recommandées : 25, 50, 100, 200
   - Par défaut : 50

3. **`filters`** (object, optionnel) : Filtres à appliquer
   - Pour les factures : `status`, `dateFrom`, `dateTo`, `supplierId`, `searchQuery`
   - Pour les articles : `subFamilyId`, `familyId`, `typeId`, `searchQuery`

## 🔧 Utilisation dans les Composants

### Exemple 1 : Factures avec Pagination

```typescript
import { useState } from "react";
import { useInvoicesPaginated } from "@/lib/hooks/use-data";
import { Pagination } from "@/components/ui/Pagination";

export function AchatsContent() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    
    // Charger les factures paginées
    const { data, isLoading } = useInvoicesPaginated({
        page,
        pageSize,
        filters: {
            status: "Validated", // Optionnel
            // dateFrom: "2024-01-01", // Optionnel
            // dateTo: "2024-12-31", // Optionnel
        }
    });
    
    const invoices = data?.invoices || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    return (
        <div>
            {/* Liste des factures */}
            {invoices.map(invoice => (
                <div key={invoice.id}>{invoice.number}</div>
            ))}
            
            {/* Contrôle de pagination */}
            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(0); // Reset à la première page
                }}
            />
        </div>
    );
}
```

### Exemple 2 : Articles avec Pagination et Filtres

```typescript
import { useState } from "react";
import { useArticlesPaginated } from "@/lib/hooks/use-data";
import { Pagination } from "@/components/ui/Pagination";

export function ArticlesContent() {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [selectedType, setSelectedType] = useState<"1" | "2" | "3" | "4">("1");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Charger les articles paginés avec filtres
    const { data, isLoading } = useArticlesPaginated({
        page,
        pageSize,
        filters: {
            typeId: selectedType,
            searchQuery: searchQuery || undefined,
        }
    });
    
    const articles = data?.articles || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    // Réinitialiser la page quand les filtres changent
    const handleFilterChange = (newType: string) => {
        setSelectedType(newType as any);
        setPage(0); // Reset à la première page
    };
    
    return (
        <div>
            {/* Filtres */}
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0); // Reset à la première page lors de la recherche
                }}
                placeholder="Rechercher..."
            />
            
            {/* Liste des articles */}
            {articles.map(article => (
                <div key={article.id}>{article.name}</div>
            ))}
            
            {/* Contrôle de pagination */}
            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(0);
                }}
            />
        </div>
    );
}
```

## 🎨 Composant Pagination

Le composant `Pagination` fournit une interface complète pour naviguer entre les pages :

### Props

- `page` : Page actuelle (0-indexed)
- `pageSize` : Nombre d'éléments par page
- `total` : Nombre total d'éléments
- `totalPages` : Nombre total de pages
- `onPageChange` : Callback quand la page change
- `onPageSizeChange` : Callback quand la taille de page change (optionnel)
- `pageSizeOptions` : Options de taille de page (défaut: [25, 50, 100, 200])
- `showPageSizeSelector` : Afficher le sélecteur de taille (défaut: true)
- `className` : Classes CSS supplémentaires

### Fonctionnalités

- ✅ Navigation première/dernière page
- ✅ Navigation page précédente/suivante
- ✅ Affichage intelligent des numéros de page (avec ellipses)
- ✅ Sélecteur de taille de page
- ✅ Affichage du nombre d'éléments (ex: "1-50 sur 1000")
- ✅ États désactivés pour les boutons non disponibles

## 📊 Gestion de l'État

### Hook personnalisé (optionnel)

Pour simplifier la gestion de l'état de pagination, vous pouvez créer un hook :

```typescript
import { useState } from "react";

export function usePagination(initialPageSize: number = 50) {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(initialPageSize);
    
    const reset = () => setPage(0);
    const nextPage = () => setPage(prev => prev + 1);
    const previousPage = () => setPage(prev => Math.max(0, prev - 1));
    const changePageSize = (newSize: number) => {
        setPageSize(newSize);
        setPage(0);
    };
    
    return {
        page,
        pageSize,
        setPage,
        nextPage,
        previousPage,
        changePageSize,
        reset
    };
}
```

## ⚡ Bonnes Pratiques

1. **Réinitialiser la page lors des changements de filtre**
   ```typescript
   const handleFilterChange = (newFilter) => {
       setFilters(newFilter);
       setPage(0); // Important !
   };
   ```

2. **Utiliser `placeholderData` pour une meilleure UX**
   - Les données précédentes restent visibles pendant le chargement
   - Évite les "sauts" visuels

3. **Taille de page adaptée**
   - 25-50 pour les listes denses
   - 50-100 pour les listes normales
   - 100-200 pour les listes simples

4. **Gérer le chargement**
   ```typescript
   if (isLoading) {
       return <div>Chargement...</div>;
   }
   ```

## 🔄 Migration depuis l'Ancien Code

### Avant (sans pagination)
```typescript
const { data: invoices = [] } = useInvoices();
```

### Après (avec pagination)
```typescript
const [page, setPage] = useState(0);
const { data } = useInvoicesPaginated({ page, pageSize: 50 });
const invoices = data?.invoices || [];
```

## 📝 Notes Importantes

- La pagination pour les articles charge d'abord tous les articles (pour la conversion des recettes), puis pagine. Pour de très grandes bases, considérez une refactorisation.
- Les filtres sont appliqués côté client pour l'instant. Pour de meilleures performances avec très grandes bases, considérez le filtrage côté IndexedDB.
- Le composant `Pagination` gère automatiquement l'affichage des ellipses pour les grandes listes de pages.
