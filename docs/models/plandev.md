# Plan de Développement - Migration vers PivotProject

## Objectif

Migrer le modèle actuel vers le nouveau modèle **PivotProject** avec :
- PivotProject comme racine
- DataSource (Local/Lazy)
- Dimension avec ColumnMappings et hiérarchie
- Node avec MetaData typée et support multi-source
- View avec mesures et calculs
- Sérialisation/desérialisation JSON complète

## État Actuel

### ✅ Déjà Implémenté

1. **Types TypeScript** (`/src/models/pivot-project/types.ts`)
   - Toutes les interfaces du modèle PivotProject
   - DataSource (LocalDataSource, LazyDataSource, BaseDataSource)
   - Dimension avec ColumnMappings, NodeSchema, SchemaField
   - Node avec MetaData typée, enfants, sourceIds
   - View avec Measures, FilterDimension, SortConfig, FormatOptions
   - SerializedPivotProject, ValidationError, DeserializationResult

2. **Sérialisation** (`/src/models/pivot-project/serialization.ts`)
   - serializePivotProject(project: PivotProject): string
   - deserializePivotProject(json: string): DeserializationResult
   - Validation complète des références et contraintes
   - Gestion des erreurs avec ValidationError[]

3. **Migration** (`/src/models/pivot-project/migration.ts`)
   - Utilitaires de migration depuis l'ancien modèle
   - createEmptyPivotProject(): PivotProject

4. **Exports** (`/src/models/pivot-project/index.ts`)
   - Export centralisé de tous les types et fonctions

5. **Tests** (`/src/models/pivot-project/test-case.ts` et `test-case.test.ts`)
   - 28 tests unitaires passant
   - Cas de test complet avec Customer.csv, Product.csv, Order.csv

6. **Store** (`/src/store/Store.ts`)
   - Migration complète vers PivotProject
   - Méthodes DataSource, Dimension, Node, View, Project

7. **Re-exports** (`/src/models/types.ts`)

8. **Screens** (MainScreen, AxeScreen, ViewGridScreen)

### ⏳ À Faire

1. **PivotGrid Component** (`/src/components/pivot-grid/`)
   - Adapter pour utiliser View configuration
   - Créer buildPivotFromView(project: PivotProject, view: View)
   - Modifier PivotGrid.tsx, PivotGridConfiguration.tsx, PivotGridTable.tsx

2. **Nettoyage du code legacy**

3. **Validation complète de l'intégration**

## Prochaines Étapes Prioritaires

### 🔴 Priorité Haute

1. **Refactorer ViewGridScreen**
   - **Problème** : Le composant est trop gros (583 lignes) et duplique la logique du Store
   - **Solution** : Le Store est le controller du MVC, donc ViewGridScreen doit utiliser directement les méthodes du Store
   - **Actions** :
     - Supprimer toutes les fonctions locales qui dupliquent la logique du Store :
       - `getNodesForDimension` → utiliser `store.getNodesByDimension()`
       - `getDimensionRootNodes` → utiliser `store.getRootNodes()`
       - `isDimensionUsed` → créer `store.isDimensionUsed()`
       - `getDimensionCategory` → créer `store.getDimensionCategory()`
       - `getDimensionValues` → créer `store.getDimensionValues()`
       - `getCurrentFilterValues` → créer `store.getFilterValues()`
       - `getFilterOptions` → créer `store.getFilterOptions()`
     - Déplacer la logique de gestion des vues (drag-drop, filters, measures) dans le Store
     - Garder ViewGridScreen comme une Vue pure (affichage uniquement)

2. **Mettre à jour PivotGrid Component**
   - Créer buildPivotFromView() dans le Store ou un service dédié
   - Adapter PivotGrid pour utiliser View au lieu de rowFields/columnFields/valueFields
   - Tester avec le cas de test (ProductId × CustomerId × SUM(Total) = 3125)

### 🟡 Priorité Moyenne

3. **Finaliser la sérialisation**
4. **Nettoyer le code legacy**

### 🟢 Priorité Basse

5. **Améliorer la documentation**

## Structure des Fichiers

```
src/
├── models/
│   ├── types.ts
│   └── pivot-project/
│       ├── types.ts
│       ├── serialization.ts
│       ├── migration.ts
│       ├── test-case.ts
│       ├── test-case.test.ts
│       └── index.ts
├── store/
│   └── Store.ts
└── components/pivot-grid/
    ├── PivotGrid.tsx              # ⏳ À mettre à jour
    ├── PivotGridConfiguration.tsx # ⏳ À mettre à jour
    └── PivotGridTable.tsx         # ⏳ À vérifier
```

## Cas de Test de Référence

Voir `/docs/models/test-case.md`

## Notes Techniques

1. **Les calculs se font dans les Views**
2. **Multi-source support** : Une Dimension peut être définie à partir de colonnes de plusieurs DataSources
3. **Typed MetaData** : Les MetaData des Nodes sont typées via NodeSchema
4. **Pas d'originalPath** : Champ retiré comme demandé
5. **Pas d'authentification** : Les LazyDataSource ne gèrent pas l'authentification
6. **Pas de chargement incrémental** : Les DataSources sont chargées en entier

## Principes Architecturaux (MVC)

- **Store = Controller** : Toutes les opérations de modification de données doivent être dans le Store
- **Screens = Views** : Les écrans doivent être légers et utiliser directement les méthodes du Store
- **Pas de duplication** : Aucune logique métier ne doit être recopiée dans les composants
- **Single Source of Truth** : Le Store contient toutes les données et la logique

## Méthodes à ajouter au Store

Pour supporter le refactoring de ViewGridScreen :
- `isDimensionUsed(dimensionId: string): boolean` - Vérifie si une dimension est utilisée dans row/column/filters/measures
- `getDimensionCategory(dimensionId: string): 'row' | 'column' | 'value' | null` - Retourne la catégorie d'une dimension
- `getDimensionValues(dimensionId: string): {code: string, value: any, metaData: any}[]` - Retourne toutes les valeurs d'une dimension
- `getFilterValues(dimensionId: string): string[]` - Retourne les nodes filtrés pour une dimension
- `getFilterOptions(dimensionId: string): {value: string, label: string}[]` - Retourne les options de filtre
- `addDimensionToView(viewId: string, dimensionId: string, category: 'row' | 'column' | 'value'): void` - Ajoute une dimension à une vue
- `removeDimensionFromView(viewId: string, dimensionId: string, category: 'row' | 'column' | 'value'): void` - Retire une dimension
- `addMeasureToView(viewId: string, measure: Measure): void` - Ajoute une mesure
- `removeMeasureFromView(viewId: string, measureId: string): void` - Retire une mesure
- `updateMeasureAggregation(viewId: string, measureId: string, aggregation: AggregationType): void` - Met à jour l'agrégation
- `buildPivotFromView(viewId: string): PivotData` - **Fonction clé** pour générer les données de pivot à partir d'une View
