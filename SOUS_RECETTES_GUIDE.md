# Guide : Utilisation des Sous-Recettes comme Ingrédients

## Vue d'ensemble

Les sous-recettes permettent d'utiliser une recette complète comme ingrédient dans une autre recette. Cela est utile pour créer des recettes complexes qui réutilisent des préparations de base.

**Exemple** : Une recette "Pizza Margherita" peut utiliser la sous-recette "Pâte à Pizza" comme ingrédient, au lieu de lister tous les ingrédients de la pâte individuellement.

## Approche Recommandée : Sous-Recettes comme Articles de Type Production

### Concept

**Les sous-recettes sont créées comme des Articles de type "Production" (FP)** avec :
- La même famille et sous-famille que la recette originale
- Un prix pivot calculé automatiquement à partir du coût de la recette
- Un flag pour les identifier comme sous-recettes

### Avantages de cette Approche

✅ **Simplicité** : Réutilise l'infrastructure existante (Articles)  
✅ **Pas de modification de structure** : Les ingrédients continuent de référencer des articles  
✅ **Cohérence** : Les sous-recettes apparaissent naturellement dans le sélecteur d'ingrédients  
✅ **Gestion unifiée** : Les sous-recettes peuvent être gérées comme des articles normaux  

## État Actuel du Système

Actuellement, le système ne supporte **pas encore** directement les sous-recettes. Les ingrédients ne peuvent référencer que des **articles** (matières premières).

### Structure Actuelle

```typescript
interface Ingredient {
    id: string;
    articleId: string;  // ✅ Peut référencer un article normal OU une sous-recette (article de type Production)
    name: string;
    quantity: number;
    unit: string;
    cost: number;
}
```

## Comment Implémenter les Sous-Recettes

### Étape 1 : Ajouter un Flag pour Identifier les Sous-Recettes

Modifier `lib/types.ts` pour ajouter des champs optionnels dans `Article` :

```typescript
interface Article {
    // ... champs existants
    isSubRecipe?: boolean;  // Nouveau : true si c'est une sous-recette
    linkedRecipeId?: string;  // Nouveau : ID de la recette liée (si c'est une sous-recette)
}
```

### Étape 2 : Créer Automatiquement un Article lors de la Création d'une Sous-Recette

Quand une recette est marquée comme "sous-recette", créer automatiquement un article correspondant :

```typescript
async function createSubRecipeArticle(recipe: Recipe): Promise<Article> {
    // Calculer le coût de la recette
    const recipeCost = calculateRecipeCost(recipe);
    const costPerUnit = recipeCost / recipe.yield;
    
    // Créer l'article correspondant
    const article: Article = {
        id: `SR-${recipe.id}`,  // Préfixe "SR-" pour Sous-Recette
        name: recipe.name,
        code: `SR-${recipe.code || recipe.id}`,
        subFamilyId: recipe.subFamilyId,  // Même sous-famille que la recette
        unitPivot: recipe.yieldUnit,
        unitAchat: recipe.yieldUnit,
        unitProduction: recipe.yieldUnit,
        contenace: 1,
        coeffProd: 1,
        lastPivotPrice: costPerUnit,  // Prix calculé à partir du coût de la recette
        vatRate: 20,
        isSubRecipe: true,  // Flag pour identifier comme sous-recette
        linkedRecipeId: recipe.id  // Lien vers la recette originale
    };
    
    await db.articles.put(article);
    return article;
}
```

### Étape 3 : Modifier le Filtre des Articles dans le Sélecteur d'Ingrédients

Modifier `getFilteredArticles` dans `components/production/ProductionContent.tsx` pour inclure les articles de type Production (sous-recettes) :

```typescript
const getFilteredArticles = (search: string) => {
    const rawMaterialCodes = ["FA01", "FA02", "FA03", "FA04", "FA05", "FA06"];
    const productionFamilyCode = "FP01";  // Code de la famille Production
    
    return articles.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        const subFam = initialSubFamilies.find(sf => sf.id === a.subFamilyId);
        if (!subFam) return false;

        const fam = initialFamilies.find(f => f.id === subFam.familyId);
        if (!fam) return false;
        
        // Inclure les matières premières (codes FA01-FA06) ET les sous-recettes (famille Production)
        const isRawMaterial = rawMaterialCodes.includes(fam.code);
        const isSubRecipe = a.isSubRecipe === true || fam.code === productionFamilyCode;
        
        return isRawMaterial || isSubRecipe;
    });
};
```

### Étape 4 : Mettre à Jour l'Affichage dans le Sélecteur d'Ingrédients

Modifier l'affichage dans le dropdown pour différencier visuellement les sous-recettes :

```typescript
{getFilteredArticles(ing.name).map((article, sIdx) => {
    const isSubRecipe = article.isSubRecipe === true;
    
    return (
        <div
            key={article.id}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpdateIngredientFromSearch(idx, article);
            }}
            className={cn(
                "px-3 py-2 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group",
                searchFocusIndex === sIdx ? "bg-emerald-100" : "hover:bg-emerald-50",
                isSubRecipe && "bg-blue-50 border-l-2 border-l-blue-400"  // Style différent pour sous-recettes
            )}
        >
            <div className="flex items-center gap-2">
                {isSubRecipe && <ChefHat className="w-3 h-3 text-blue-600" />}  {/* Icône pour sous-recette */}
                <span className={cn(
                    "font-bold text-xs truncate mr-2",
                    searchFocusIndex === sIdx ? "text-emerald-800" : "text-slate-700 group-hover:text-emerald-700",
                    isSubRecipe && "text-blue-800"
                )}>
                    {article.name}
                    {isSubRecipe && <span className="text-[9px] text-blue-600 ml-1">(Sous-Recette)</span>}
                </span>
            </div>
            <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
                searchFocusIndex === sIdx ? "bg-emerald-200 text-emerald-700" : "text-slate-400 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600",
                isSubRecipe && "bg-blue-100 text-blue-700"
            )}>
                {article.unitProduction || article.unitPivot}
            </span>
        </div>
    );
})}
```

### Étape 5 : Calculer le Coût d'une Sous-Recette

Le coût d'une sous-recette est déjà calculé et stocké dans `lastPivotPrice` de l'article. Il doit être mis à jour automatiquement quand la recette est modifiée :

```typescript
async function updateSubRecipePrice(recipeId: string) {
    const recipe = await db.recipes.get(recipeId);
    if (!recipe) return;
    
    // Trouver l'article sous-recette correspondant
    const subRecipeArticle = await db.articles
        .where('linkedRecipeId')
        .equals(recipeId)
        .first();
    
    if (!subRecipeArticle) return;
    
    // Recalculer le coût de la recette
    const recipeCost = calculateRecipeCost(recipe);
    const costPerUnit = recipeCost / recipe.yield;
    
    // Mettre à jour le prix pivot de l'article
    subRecipeArticle.lastPivotPrice = costPerUnit;
    await db.articles.put(subRecipeArticle);
}
```

### Étape 6 : Mettre à Jour le Calcul des Coûts

Le calcul des coûts fonctionne automatiquement car les sous-recettes sont des articles avec un `lastPivotPrice` :

```typescript
const calculateRecipeCost = (recipe: Recipe): Costing => {
    let totalCost = 0;
    
    recipe.ingredients.forEach(ingredient => {
        // Trouver l'article (normal ou sous-recette)
        const article = articles.find(a => a.id === ingredient.articleId);
        if (article) {
            // Le coût est calculé normalement à partir du prix pivot
            const cost = calculateCostFromUnit(article, ingredient.quantity, ingredient.unit);
            totalCost += cost;
        }
    });
    
    // ... reste du calcul
};
```

**Note** : Le coût des sous-recettes est déjà inclus dans leur `lastPivotPrice`, donc le calcul est transparent.

### Étape 7 : Prévenir les Références Circulaires

Vérifier avant de créer une sous-recette qu'elle ne crée pas de référence circulaire :

```typescript
async function canCreateSubRecipe(recipeId: string, targetRecipeId: string): Promise<boolean> {
    // Une recette ne peut pas être sa propre sous-recette
    if (recipeId === targetRecipeId) return false;
    
    // Vérifier si la recette cible utilise déjà cette recette (directement ou indirectement)
    const targetRecipe = await db.recipes.get(targetRecipeId);
    if (!targetRecipe) return false;
    
    const visited = new Set<string>();
    const checkRecursive = async (currentRecipeId: string): Promise<boolean> => {
        if (visited.has(currentRecipeId)) return false;
        visited.add(currentRecipeId);
        
        const recipe = await db.recipes.get(currentRecipeId);
        if (!recipe) return false;
        
        // Vérifier si cette recette utilise la recette d'origine comme sous-recette
        for (const ing of recipe.ingredients || []) {
            const article = await db.articles.get(ing.articleId);
            if (article?.isSubRecipe && article.linkedRecipeId === recipeId) {
                return true;  // Référence circulaire détectée
            }
            
            // Vérifier récursivement
            if (article?.isSubRecipe && article.linkedRecipeId) {
                if (await checkRecursive(article.linkedRecipeId)) {
                    return true;
                }
            }
        }
        
        return false;
    };
    
    return !(await checkRecursive(targetRecipeId));
}
```

## Interface Utilisateur Recommandée

### Dans la Liste des Ingrédients

**Pas besoin de bouton séparé !** Les sous-recettes apparaissent automatiquement dans le sélecteur d'articles avec un style visuel différent :

```
🔍 Recherche d'ingrédient...
   ├─ 🥖 Farine T55 (Article) - 1kg
   ├─ 🥛 Lait Entier (Article) - 1L
   ├─ 👨‍🍳 Pâte à Pizza (Sous-Recette) - 500g  ← Style bleu, icône chef
   └─ 👨‍🍳 Sauce Tomate (Sous-Recette) - 250ml  ← Style bleu, icône chef
```

### Lors de la Création d'une Recette comme Sous-Recette

1. **Option dans le formulaire de création** : Cocher "Utiliser comme sous-recette"
2. **Création automatique** : Un article correspondant est créé automatiquement
3. **Mise à jour automatique** : Le prix de l'article est mis à jour quand la recette change

### Affichage dans la Liste des Ingrédients

Les sous-recettes sont visuellement différenciées :

```
┌─────────────────────────────────────────────────┐
│ Ingrédient          │ Qté │ Unité │ Coût       │
├─────────────────────────────────────────────────┤
│ 🥖 Farine T55       │ 500 │ g     │ 5.00 DH    │
│ 👨‍🍳 Pâte à Pizza    │ 500 │ g     │ 25.50 DH   │ ← Fond bleu clair
│ 🥛 Lait Entier      │ 200 │ ml    │ 2.00 DH    │
└─────────────────────────────────────────────────┘
```

### Dans le Module Articles

Les sous-recettes apparaissent dans la liste des articles avec un badge :

```
Articles de Production
├─ Pâte à Pizza [SOUS-RECETTE] ← Badge bleu
├─ Sauce Tomate [SOUS-RECETTE] ← Badge bleu
└─ ...
```

## Migration des Données Existantes

Si vous avez déjà des recettes qui utilisent des "sous-recettes" de manière informelle, créer les articles correspondants :

```typescript
async function migrateSubRecipes() {
    const recipes = await db.recipes.toArray();
    const articles = await db.articles.toArray();
    
    for (const recipe of recipes) {
        // Vérifier si cette recette est utilisée comme ingrédient dans d'autres recettes
        const isUsedAsIngredient = recipes.some(r => 
            r.id !== recipe.id && 
            r.ingredients.some(ing => {
                // Chercher un article avec le même nom
                const article = articles.find(a => a.name === ing.name);
                return article?.name === recipe.name;
            })
        );
        
        if (isUsedAsIngredient) {
            // Créer l'article sous-recette correspondant
            await createSubRecipeArticle(recipe);
        }
    }
}
```

## Faut-il Différencier les Recettes des Sous-Recettes ?

### Réponse : **Oui, mais uniquement au niveau de l'affichage et de la gestion**

**Différences fonctionnelles :**
- ✅ **Recettes normales** : Produits finis destinés à la vente
- ✅ **Sous-recettes** : Préparations intermédiaires utilisées dans d'autres recettes

**Différences techniques :**
- Les sous-recettes créent automatiquement un article correspondant
- Les sous-recettes apparaissent dans le sélecteur d'ingrédients avec un style différent
- Les sous-recettes peuvent avoir un badge visuel dans la liste des articles

**Pas de différence dans la structure :**
- Les deux sont stockées dans la table `recipes`
- Les deux ont la même structure de données
- Les deux peuvent être gérées de la même manière

### Recommandation : Ajouter un Champ Optionnel

Ajouter un champ `isSubRecipe` dans `Recipe` pour faciliter la gestion :

```typescript
interface Recipe {
    // ... champs existants
    isSubRecipe?: boolean;  // Optionnel : true si c'est une sous-recette
}
```

Cela permet de :
- Filtrer les recettes dans l'interface
- Afficher des listes séparées si nécessaire
- Appliquer des règles différentes (ex: les sous-recettes ne peuvent pas être vendues directement)

## Avantages des Sous-Recettes

1. **Réutilisabilité** : Une préparation de base peut être utilisée dans plusieurs recettes
2. **Maintenance** : Modifier une sous-recette met à jour automatiquement toutes les recettes qui l'utilisent
3. **Clarté** : Les recettes complexes sont plus lisibles
4. **Calculs précis** : Le coût est calculé automatiquement à partir de la sous-recette

## Limitations et Considérations

1. **Références circulaires** : Doit être prévenu et détecté
2. **Performance** : Le calcul récursif peut être coûteux pour des hiérarchies profondes
3. **Modifications** : Modifier une sous-recette affecte toutes les recettes qui l'utilisent
4. **Unités** : Les conversions d'unités peuvent être complexes

## Exemple Concret

### Recette : Pizza Margherita

**Ingrédients :**
- 1 portion de Pâte à Pizza (Sous-Recette) - 500g
- 100g de Mozzarella (Article)
- 50ml de Sauce Tomate (Sous-Recette)
- 5g de Basilic (Article)

**Sous-Recette : Pâte à Pizza** (créée comme Article)
- ID: `SR-pate-pizza-001`
- Nom: "Pâte à Pizza"
- Prix pivot: 25.50 DH (calculé à partir du coût de la recette)
- Unité: 500g

**Sous-Recette : Sauce Tomate** (créée comme Article)
- ID: `SR-sauce-tomate-001`
- Nom: "Sauce Tomate"
- Prix pivot: 12.00 DH (calculé à partir du coût de la recette)
- Unité: 250ml

Le coût de la Pizza Margherita sera calculé en additionnant :
- Le coût de la Pâte à Pizza (25.50 DH pour 500g)
- Le coût de la Mozzarella
- Le coût de la Sauce Tomate (12.00 DH pour 250ml)
- Le coût du Basilic
