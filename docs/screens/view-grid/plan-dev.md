# Plan de Développement - View Grid Screen

## Objectif

Implémenter l'écran **View Grid Screen** qui permet aux utilisateurs de :
- Configurer les dimensions en lignes et colonnes du pivot
- Ajouter/supprimer des champs de valeurs (mesures)
- Appliquer des filtres par dimension
- Configurer les agrégations (Sum, Average, Count, Min, Max)
- Visualiser le tableau croisé dynamique généré
- Sauvegarder des configurations de vue

> **Référence** : [screen.md](./screen.md) - Spécification fonctionnelle
> **Référence** : [design.html](./design.html) - Maquette visuelle interactive

## État Actuel

### ✅ Déjà Implémenté

1. **Structure de base** (`/src/screens/view-grid/`)
   - `ViewGridScreen.tsx` - Squelette vide avec observer (MVC View)
   - `ViewGridScreen.css` - Styles de base
   - `index.ts` - Export du composant

2. **Routing**
   - Navigation depuis MainScreen (`/view-grid`)
   - Intégration dans `App.tsx`

3. **Store** (`/src/stores/Store.ts`)
   - Gestion des **Views** : `addView()`, `updateView()`, `getView()`, `getViews()`, `loadView()`, `removeView()`
   - Gestion des **Measures** via View (intégration legacy)
   - Gestion des **Dimensions** : `getDimension()`, `getDimensions()`
   - Gestion des **Nodes** : `getNodesByDimension()`, `getRootNodes()`
   - Propriétés legacy : `rowFields`, `columnFields`, `valueFields`, `aggregation`, `filters`

4. **Modèle** (`/src/models/pivot-project/types.ts`)
   - `View` interface avec `rowDimensions`, `columnDimensions`, `filterDimensions`, `measures`
   - `Measure` interface avec `aggregation`, `source`, `format`
   - `FilterDimension` interface avec `dimensionId`, `selectedNodes`, `operator`
   - `AggregationType` : sum, average, count, min, max, first, last

5. **CSS Classes** (décrites dans [screen.md](./screen.md))
   - Tous les classes CSS de référence sont documentées

### ⚠️ Partiellement Implémenté

1. **PivotGrid Component** (`/src/components/pivot-grid/`)
   - Existe mais utilise l'ancien modèle (rowFields/columnFields/valueFields)
   - Doit être adapté pour utiliser la configuration **View**

### ❌ À Implémenter

1. **Composants de Configuration Sidebar (20%)**
   - `AvailableDimensionsList` - Liste des dimensions disponibles (drag-drop)
   - `SelectedDimensionsBadges` - Badges cliquables pour configuration
   - `FiltersConfiguration` - Contrôles multi-sélect pour chaque dimension

2. **Composants Header**
   - `ViewHeader` - Sélecteurs de dimensions lignes/colonnes/champs valeurs
   - `DimensionConfigLine` - Ligne de configuration avec label + bouton (+)
   - `AddDimensionModal` - Modal pour ajouter des dimensions
   - `AggregationModal` - Modal pour configurer l'agrégation
   - `ViewNameInput` - Champ de nom de vue + bouton Save

3. **Composants Main Grid (80%)**
   - Intégration de `PivotGrid` avec la configuration View active
   - `PivotGridTable` - Tableau HTML du pivot (à adapter)

4. **Action Bar**
   - Bouton "Back to Main screen"
   - Bouton "Apply Configuration"

5. **Fonction clé dans Store**
   - `buildPivotFromView(viewId: string)` - Générer les données du pivot à partir d'une View

6. **Responsive Design**
   - Adaptation pour écrans < 1024px (sidebar → top)

7. **Logique métier manquantes dans Store**
   - Méthodes pour gérer les dimensions dans une vue
   - Méthodes pour gérer les mesures dans une vue
   - Méthodes pour gérer les filtres dans une vue

---

## Prochaines Étapes Prioritaires

### 🔴 Priorité Haute

#### 0. **Créer un ViewStore dédié pour la gestion de la vue courante**

**Problème** : Les méthodes liées à la gestion de la vue active sont actuellement dans `Store.ts`, qui devient trop gros et mélange plusieurs responsabilités (projet, dimensions, vues).

**Solution** : Créer un **ViewStore** dédié qui encapsule toute la logique spécifique à la vue courante, suivant le principe **Single Responsibility**.

**Nouvelle structure** :
```
src/stores/
├── Store.ts                  # Store principal (projet, dataSources, dimensions, nodes)
├── ViewStore.ts              # NOUVEAU: Store dédié à la vue courante
└── contexts/
    ├── StoreContext.tsx      # Contexte pour Store
    └── ViewStoreContext.tsx  # NOUVEAU: Contexte pour ViewStore
```

**Méthodes à déplacer de Store.ts vers ViewStore.ts** :

```typescript
// src/stores/ViewStore.ts
import { makeAutoObservable, action, computed } from 'mobx';
import type {
  View,
  Measure,
  FilterDimension,
  AggregationType,
  Dimension,
  Node
} from '../models/pivot-project/types';
import { Store } from './Store';

export class ViewStore {
  // Référence au store principal
  private rootStore: Store;
  
  // État local
  activeViewId?: string;
  
  constructor(rootStore: Store) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }
  
  // ==========================================================================
  // VIEW SELECTION
  // ==========================================================================
  
  /**
   * Charge une vue et l'active
   */
  loadView(viewId: string): void {
    this.activeViewId = viewId;
    this.syncLegacyProperties();
  }
  
  /**
   * Retourne la vue active
   */
  getActiveView(): View | undefined {
    if (!this.activeViewId) return undefined;
    return this.rootStore.pivotProject.views.find(v => v.id === this.activeViewId);
  }
  
  /**
   * Retourne toutes les vues
   */
  getViews(): View[] {
    return this.rootStore.pivotProject.views;
  }
  
  // ==========================================================================
  // DIMENSION MANAGEMENT IN VIEW
  // ==========================================================================
  
  /**
   * Vérifie si une dimension est utilisée dans la vue active
   */
  isDimensionUsedInView(dimensionId: string): boolean {
    const view = this.getActiveView();
    if (!view) return false;
    return view.rowDimensions.includes(dimensionId) ||
           view.columnDimensions.includes(dimensionId) ||
           view.filterDimensions?.some(fd => fd.dimensionId === dimensionId) ||
           view.measures.some(m => m.id === dimensionId);
  }
  
  /**
   * Retourne la catégorie d'une dimension dans la vue active
   */
  getDimensionCategoryInView(dimensionId: string): 'row' | 'column' | 'value' | 'filter' | null {
    const view = this.getActiveView();
    if (!view) return null;
    if (view.rowDimensions.includes(dimensionId)) return 'row';
    if (view.columnDimensions.includes(dimensionId)) return 'column';
    if (view.filterDimensions?.some(fd => fd.dimensionId === dimensionId)) return 'filter';
    if (view.measures.some(m => m.id === dimensionId)) return 'value';
    return null;
  }
  
  /**
   * Ajoute une dimension à la vue active dans une catégorie
   */
  addDimensionToView(dimensionId: string, category: 'row' | 'column' | 'value'): void {
    const view = this.getActiveView();
    if (!view) return;
    
    const dim = this.rootStore.getDimension(dimensionId);
    if (!dim) return;
    
    if (category === 'row' && !view.rowDimensions.includes(dimensionId)) {
      view.rowDimensions = [...view.rowDimensions, dimensionId];
    } else if (category === 'column' && !view.columnDimensions.includes(dimensionId)) {
      view.columnDimensions = [...view.columnDimensions, dimensionId];
    } else if (category === 'value') {
      // Créer une nouvelle mesure pour cette dimension
      const measure: Measure = {
        id: `measure-${Date.now()}`,
        name: dim.name,
        source: {
          type: 'column',
          dataSourceId: dim.columnMappings[0]?.dataSourceId || '',
          columnIndex: dim.columnMappings[0]?.columnIndex || 0
        },
        aggregation: 'sum',
        visible: true
      };
      view.measures = [...view.measures, measure];
    }
    this.updateViewTimestamp(view);
  }
  
  /**
   * Retire une dimension de la vue active
   */
  removeDimensionFromView(dimensionId: string, category: 'row' | 'column' | 'value'): void {
    const view = this.getActiveView();
    if (!view) return;
    
    if (category === 'row') {
      view.rowDimensions = view.rowDimensions.filter(id => id !== dimensionId);
    } else if (category === 'column') {
      view.columnDimensions = view.columnDimensions.filter(id => id !== dimensionId);
    } else if (category === 'value') {
      view.measures = view.measures.filter(m => m.id !== dimensionId);
    }
    
    // Retirer aussi des filtres si présent
    view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== dimensionId);
    
    this.updateViewTimestamp(view);
  }
  
  // ==========================================================================
  // MEASURE MANAGEMENT
  // ==========================================================================
  
  /**
   * Met à jour l'agrégation d'une mesure
   */
  updateMeasureAggregation(measureId: string, aggregation: AggregationType): void {
    const view = this.getActiveView();
    if (!view) return;
    
    const measure = view.measures.find(m => m.id === measureId);
    if (measure) {
      measure.aggregation = aggregation;
      this.updateViewTimestamp(view);
    }
  }
  
  /**
   * Ajoute une mesure à la vue active
   */
  addMeasureToView(measure: Measure): void {
    const view = this.getActiveView();
    if (!view) return;
    
    view.measures = [...view.measures, measure];
    this.updateViewTimestamp(view);
  }
  
  /**
   * Retire une mesure de la vue active
   */
  removeMeasureFromView(measureId: string): void {
    const view = this.getActiveView();
    if (!view) return;
    
    view.measures = view.measures.filter(m => m.id !== measureId);
    this.updateViewTimestamp(view);
  }
  
  // ==========================================================================
  // FILTER MANAGEMENT
  // ==========================================================================
  
  /**
   * Retourne toutes les valeurs (nodes) d'une dimension
   */
  getDimensionValues(dimensionId: string): {code: string, value: any, nodeId: string}[] {
    const nodes = this.rootStore.getNodesByDimension(dimensionId);
    return nodes.map(node => ({
      code: node.code,
      value: node.value,
      nodeId: node.id
    }));
  }
  
  /**
   * Retourne les options de filtre pour une dimension
   */
  getFilterOptions(dimensionId: string): {value: string, label: string}[] {
    const values = this.getDimensionValues(dimensionId);
    return values.map(v => ({ value: v.nodeId, label: String(v.value) }));
  }
  
  /**
   * Retourne les valeurs filtrées pour une dimension dans la vue active
   */
  getFilterValuesForDimension(dimensionId: string): string[] {
    const view = this.getActiveView();
    if (!view) return [];
    
    const filterDim = view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
    if (!filterDim) return [];
    
    return filterDim.selectedNodes;
  }
  
  /**
   * Configure le filtre pour une dimension
   */
  setFilterForDimension(dimensionId: string, selectedNodeIds: string[], operator: 'include' | 'exclude' = 'include'): void {
    const view = this.getActiveView();
    if (!view) return;
    
    let filterDim = view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
    
    if (!filterDim) {
      // Créer un nouveau filtre
      if (!view.filterDimensions) {
        view.filterDimensions = [];
      }
      filterDim = {
        dimensionId,
        selectedNodes: selectedNodeIds,
        operator
      };
      view.filterDimensions.push(filterDim);
    } else {
      // Mettre à jour existant
      filterDim.selectedNodes = selectedNodeIds;
      filterDim.operator = operator;
    }
    
    this.updateViewTimestamp(view);
  }
  
  /**
   * Supprime le filtre pour une dimension
   */
  removeFilterForDimension(dimensionId: string): void {
    const view = this.getActiveView();
    if (!view) return;
    
    view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== dimensionId);
    this.updateViewTimestamp(view);
  }
  
  // ==========================================================================
  // PIVOT DATA GENERATION
  // ==========================================================================
  
  /**
   * Génère les données du pivot à partir de la vue active
   * **FONCTION CLÉ** pour ViewGridScreen
   */
  buildPivotFromView(viewId?: string): PivotData {
    const view = viewId ? this.rootStore.getView(viewId) : this.getActiveView();
    if (!view) {
      return { rows: [], columns: [], data: [] };
    }
    
    // Logique à implémenter :
    // 1. Récupérer les données des DataSources via rootStore
    // 2. Appliquer les filtres (filterDimensions)
    // 3. Grouper par rowDimensions
    // 4. Grouper par columnDimensions
    // 5. Calculer les mesures avec leurs agrégations
    // 6. Générer la structure de données pour le tableau
    
    return {
      rows: [],      // Hierarchie des lignes
      columns: [],   // Hierarchie des colonnes
      data: []       // Données du tableau croisé
    };
  }
  
  // ==========================================================================
  // LEGACY COMPATIBILITY
  // ==========================================================================
  
  /**
   * Synchronise les propriétés legacy de Store pour compatibilité
   * Appelé automatiquement après loadView()
   */
  private syncLegacyProperties(): void {
    const view = this.getActiveView();
    if (!view) return;
    
    this.rootStore.rowFields = view.rowDimensions;
    this.rootStore.columnFields = view.columnDimensions;
    this.rootStore.valueFields = view.measures.map(m => m.id);
    if (view.measures.length > 0) {
      this.rootStore.aggregation = view.measures[0].aggregation as 'sum' | 'avg' | 'count' | 'min' | 'max';
    }
    this.rootStore.filters = view.filterDimensions?.map(fd => ({
      dimensionId: fd.dimensionId,
      selectedValues: fd.selectedNodes
    })) || [];
  }
  
  /**
   * Met à jour les timestamps de la vue
   */
  private updateViewTimestamp(view: View): void {
    view.updatedAt = new Date().toISOString();
    this.rootStore.pivotProject.updatedAt = new Date().toISOString();
  }
  
  // ==========================================================================
  // GETTERS / SETTERS
  // ==========================================================================
  
  get activeViewId(): string | undefined {
    return this.activeViewId;
  }
  
  set activeViewId(id: string | undefined) {
    this.activeViewId = id;
  }
}
```

**Intégration avec Store** :

```typescript
// src/stores/Store.ts - Modifier pour inclure ViewStore
import { ViewStore } from './ViewStore';

export class Store {
  // Ajouter une instance de ViewStore
  viewStore: ViewStore;
  
  constructor() {
    makeObservable(this, { ... });
    this.pivotProject = PivotProjectService.createEmptyPivotProject();
    this.viewStore = new ViewStore(this);  // Initialiser ViewStore
  }
  
  // Déléguer les appels à ViewStore pour la compatibilité
  getActiveView(): View | undefined {
    return this.viewStore.getActiveView();
  }
  
  getViews(): View[] {
    return this.viewStore.getViews();
  }
  
  loadView(id: string): void {
    this.viewStore.loadView(id);
  }
  
  // ... déléguer les autres méthodes liées à la vue
}
```

**Contexte React** :

```typescript
// src/stores/contexts/ViewStoreContext.tsx
import { createContext, useContext } from 'react';
import { ViewStore } from '../ViewStore';

const ViewStoreContext = createContext<ViewStore | null>(null);

export const ViewStoreProvider = ViewStoreContext.Provider;

export function useViewStore(): ViewStore {
  const store = useContext(ViewStoreContext);
  if (!store) {
    throw new Error('useViewStore must be used within a ViewStoreProvider');
  }
  return store;
}
```

**Utilisation dans ViewGridScreen** :

```typescript
// src/screens/view-grid/ViewGridScreen.tsx
import { useViewStore } from '../../stores/contexts/ViewStoreContext';
import { useStore } from '../../stores/contexts/StoreContext';

function ViewGridScreenComponent() {
  const navigate = useNavigate();
  const store = useStore();           // Pour accéder aux dimensions, nodes, etc.
  const viewStore = useViewStore();   // Pour tout ce qui concerne la vue courante
  
  const activeView = viewStore.getActiveView();
  const dimensions = store.getDimensions();
  
  // Utiliser viewStore pour toutes les opérations liées à la vue
  const handleAddDimension = (dimId: string, category: 'row' | 'column' | 'value') => {
    viewStore.addDimensionToView(dimId, category);
  };
  
  // ...
}
```

**Avantages de cette architecture** :
- ✅ **Single Responsibility** : ViewStore gère uniquement la vue courante
- ✅ **Store principal allégé** : Moins de complexité dans Store.ts
- ✅ **Meilleure maintenabilité** : Code plus modulaire et plus facile à tester
- ✅ **Réutilisable** : ViewStore peut être utilisé par d'autres écrans
- ✅ **Compatibilité** : Conservation des propriétés legacy pour la transition

**Fichiers à modifier/réorganiser** :
- Créer : `src/stores/ViewStore.ts`
- Créer : `src/stores/contexts/ViewStoreContext.tsx`
- Modifier : `src/stores/Store.ts` (supprimer les méthodes déplacées, ajouter viewStore)
- Modifier : `src/App.tsx` ou `src/main.tsx` (fournir ViewStoreContext)

#### 1. **Créer les méthodes manquantes dans Store**

**Problème** : Le Store ne contient pas toutes les méthodes nécessaires pour supporter ViewGridScreen.

**Solution** : Ajouter les méthodes suivantes dans `Store.ts` :

```typescript
// === Méthodes pour ViewGridScreen ===

/**
 * Vérifie si une dimension est utilisée dans la vue active
 */
isDimensionUsedInView(dimensionId: string): boolean {
  const view = this.getActiveView();
  if (!view) return false;
  return view.rowDimensions.includes(dimensionId) ||
         view.columnDimensions.includes(dimensionId) ||
         view.filterDimensions?.some(fd => fd.dimensionId === dimensionId) ||
         view.measures.some(m => m.id === dimensionId);
}

/**
 * Retourne la catégorie d'une dimension dans la vue active
 */
getDimensionCategoryInView(dimensionId: string): 'row' | 'column' | 'value' | 'filter' | null {
  const view = this.getActiveView();
  if (!view) return null;
  if (view.rowDimensions.includes(dimensionId)) return 'row';
  if (view.columnDimensions.includes(dimensionId)) return 'column';
  if (view.filterDimensions?.some(fd => fd.dimensionId === dimensionId)) return 'filter';
  if (view.measures.some(m => m.id === dimensionId)) return 'value';
  return null;
}

/**
 * Retourne toutes les valeurs (nodes) d'une dimension
 */
getDimensionValues(dimensionId: string): {code: string, value: any, nodeId: string}[] {
  const nodes = this.getNodesByDimension(dimensionId);
  return nodes.map(node => ({
    code: node.code,
    value: node.value,
    nodeId: node.id
  }));
}

/**
 * Retourne les valeurs filtrées pour une dimension dans la vue active
 */
getFilterValuesForDimension(dimensionId: string): string[] {
  const view = this.getActiveView();
  if (!view) return [];
  
  const filterDim = view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
  if (!filterDim) return [];
  
  return filterDim.selectedNodes;
}

/**
 * Retourne les options de filtre pour une dimension
 */
getFilterOptions(dimensionId: string): {value: string, label: string}[] {
  const values = this.getDimensionValues(dimensionId);
  return values.map(v => ({ value: v.nodeId, label: String(v.value) }));
}

/**
 * Ajoute une dimension à la vue active dans une catégorie
 */
addDimensionToActiveView(dimensionId: string, category: 'row' | 'column' | 'value'): void {
  const view = this.getActiveView();
  if (!view) return;
  
  if (category === 'row' && !view.rowDimensions.includes(dimensionId)) {
    view.rowDimensions = [...view.rowDimensions, dimensionId];
  } else if (category === 'column' && !view.columnDimensions.includes(dimensionId)) {
    view.columnDimensions = [...view.columnDimensions, dimensionId];
  } else if (category === 'value') {
    // Créer une nouvelle mesure pour cette dimension
    const dim = this.getDimension(dimensionId);
    if (dim) {
      const measure: Measure = {
        id: `measure-${Date.now()}`,
        name: dim.name,
        source: {
          type: 'column',
          dataSourceId: dim.columnMappings[0]?.dataSourceId || '',
          columnIndex: dim.columnMappings[0]?.columnIndex || 0
        },
        aggregation: 'sum',
        visible: true
      };
      view.measures = [...view.measures, measure];
    }
  }
  view.updatedAt = new Date().toISOString();
  this.pivotProject.updatedAt = new Date().toISOString();
}

/**
 * Retire une dimension de la vue active
 */
removeDimensionFromActiveView(dimensionId: string, category: 'row' | 'column' | 'value'): void {
  const view = this.getActiveView();
  if (!view) return;
  
  if (category === 'row') {
    view.rowDimensions = view.rowDimensions.filter(id => id !== dimensionId);
  } else if (category === 'column') {
    view.columnDimensions = view.columnDimensions.filter(id => id !== dimensionId);
  } else if (category === 'value') {
    view.measures = view.measures.filter(m => m.id !== dimensionId);
  }
  
  // Retirer aussi des filtres si présent
  view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== dimensionId);
  
  view.updatedAt = new Date().toISOString();
  this.pivotProject.updatedAt = new Date().toISOString();
}

/**
 * Met à jour l'agrégation d'une mesure
 */
updateMeasureAggregation(measureId: string, aggregation: AggregationType): void {
  const view = this.getActiveView();
  if (!view) return;
  
  const measure = view.measures.find(m => m.id === measureId);
  if (measure) {
    measure.aggregation = aggregation;
    view.updatedAt = new Date().toISOString();
    this.pivotProject.updatedAt = new Date().toISOString();
  }
}

/**
 * Configure le filtre pour une dimension
 */
setFilterForDimension(dimensionId: string, selectedNodeIds: string[], operator: 'include' | 'exclude' = 'include'): void {
  const view = this.getActiveView();
  if (!view) return;
  
  let filterDim = view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
  
  if (!filterDim) {
    // Créer un nouveau filtre
    if (!view.filterDimensions) {
      view.filterDimensions = [];
    }
    filterDim = {
      dimensionId,
      selectedNodes: selectedNodeIds,
      operator
    };
    view.filterDimensions.push(filterDim);
  } else {
    // Mettre à jour existant
    filterDim.selectedNodes = selectedNodeIds;
    filterDim.operator = operator;
  }
  
  view.updatedAt = new Date().toISOString();
  this.pivotProject.updatedAt = new Date().toISOString();
}

/**
 * Supprime le filtre pour une dimension
 */
removeFilterForDimension(dimensionId: string): void {
  const view = this.getActiveView();
  if (!view) return;
  
  view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== dimensionId);
  view.updatedAt = new Date().toISOString();
  this.pivotProject.updatedAt = new Date().toISOString();
}

/**
 * Charge une vue et l'active
 */
loadAndActivateView(viewId: string): void {
  this.loadView(viewId);
  // Synchroniser les propriétés legacy pour compatibilité
  const view = this.getView(viewId);
  if (view) {
    this.rowFields = view.rowDimensions;
    this.columnFields = view.columnDimensions;
    this.valueFields = view.measures.map(m => m.id);
    if (view.measures.length > 0) {
      this.aggregation = view.measures[0].aggregation as 'sum' | 'avg' | 'count' | 'min' | 'max';
    }
    this.filters = view.filterDimensions?.map(fd => ({
      dimensionId: fd.dimensionId,
      selectedValues: fd.selectedNodes
    })) || [];
  }
}

/**
 * Génère les données du pivot à partir de la vue active
 * **FONCTION CLÉ** pour ViewGridScreen
 */
buildPivotFromView(viewId?: string): PivotData {
  const view = viewId ? this.getView(viewId) : this.getActiveView();
  if (!view) {
    return { rows: [], columns: [], data: [] };
  }
  
  // Logique à implémenter :
  // 1. Récupérer les données des DataSources
  // 2. Appliquer les filtres (filterDimensions)
  // 3. Grouper par rowDimensions
  // 4. Grouper par columnDimensions
  // 5. Calculer les mesures avec leurs agrégations
  // 6. Générer la structure de données pour le tableau
  
  // Retourner :
  return {
    rows: [],      // Hierarchie des lignes
    columns: [],   // Hierarchie des colonnes
    data: []       // Données du tableau croisé
  };
}
```

#### 2. **Refactorer ViewGridScreen**

**Problème** : Le composant est vide (21 lignes seulement).

**Solution** : Implémenter le composant avec la structure suivante :

```
src/screens/view-grid/
├── ViewGridScreen.tsx          # Composant principal (View)
├── ViewGridScreen.css         # Styles
├── index.ts                   # Export
├── components/                # Sous-composants
│   ├── ViewHeader/            # Header avec sélecteurs
│   │   ├── ViewHeader.tsx
│   │   ├── ViewHeader.css
│   │   └── index.ts
│   ├── ConfigSidebar/         # Sidebar 20%
│   │   ├── ConfigSidebar.tsx
│   │   ├── ConfigSidebar.css
│   │   └── index.ts
│   │   ├── AvailableDimensionsList.tsx
│   │   ├── SelectedDimensionsBadges.tsx
│   │   └── FiltersConfiguration.tsx
│   ├── GridMain/              # Zone grid 80%
│   │   ├── GridMain.tsx
│   │   ├── GridMain.css
│   │   └── index.ts
│   ├── ActionBar/             # Barre d'actions
│   │   ├── ActionBar.tsx
│   │   ├── ActionBar.css
│   │   └── index.ts
│   └── modals/                # Modals
│       ├── AddDimensionModal.tsx
│       ├── AggregationModal.tsx
│       └── modal.css
└── hooks/                     # Hooks personnalisés
    └── useViewGrid.ts         # Logique partagée
```

**Structure de ViewGridScreen.tsx** :

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/contexts/StoreContext';
import './ViewGridScreen.css';
import { ViewHeader } from './components/ViewHeader';
import { ConfigSidebar } from './components/ConfigSidebar';
import { GridMain } from './components/GridMain';
import { ActionBar } from './components/ActionBar';
import { AddDimensionModal } from './components/modals/AddDimensionModal';
import { AggregationModal } from './components/modals/AggregationModal';

function ViewGridScreenComponent() {
  const navigate = useNavigate();
  const store = useStore();
  
  // État local pour les modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTarget, setAddModalTarget] = useState<'rows' | 'columns' | 'values'>('rows');
  const [isAggregationModalOpen, setIsAggregationModalOpen] = useState(false);
  const [aggregationDimension, setAggregationDimension] = useState<string | null>(null);
  const [aggregationMeasure, setAggregationMeasure] = useState<string | null>(null);
  
  // Charger la première vue par défaut au montage
  useEffect(() => {
    const views = store.getViews();
    if (views.length > 0 && !store.activeViewId) {
      store.loadAndActivateView(views[0].id);
    }
  }, []);
  
  // Gestion de la vue active
  const activeView = store.getActiveView();
  
  // Handlers pour les modals
  const openAddModal = (target: 'rows' | 'columns' | 'values') => {
    setAddModalTarget(target);
    setIsAddModalOpen(true);
  };
  
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };
  
  const openAggregationModal = (dimensionId: string, measureId: string) => {
    setAggregationDimension(dimensionId);
    setAggregationMeasure(measureId);
    setIsAggregationModalOpen(true);
  };
  
  const closeAggregationModal = () => {
    setIsAggregationModalOpen(false);
    setAggregationDimension(null);
    setAggregationMeasure(null);
  };
  
  // Handler pour appliquer la configuration
  const handleApplyConfiguration = () => {
    // Le PivotGrid se met à jour automatiquement via observer
    // car il utilise store.buildPivotFromView()
  };
  
  // Handler pour retourner à l'écran principal
  const handleBackToMain = () => {
    navigate('/');
  };
  
  if (!activeView) {
    return (
      <div className="view-grid-screen">
        <p>Aucune vue disponible. Créez une vue dans l'écran principal.</p>
        <button onClick={handleBackToMain}>Retour à l'écran principal</button>
      </div>
    );
  }
  
  return (
    <div className="view-grid-screen">
      {/* Header avec sélecteurs de dimensions */}
      <ViewHeader
        rowDimensions={activeView.rowDimensions}
        columnDimensions={activeView.columnDimensions}
        valueMeasures={activeView.measures}
        onAddDimension={openAddModal}
        onConfigureAggregation={openAggregationModal}
        viewName={activeView.name}
        onSaveView={(name) => {
          const updatedView = { ...activeView, name };
          store.updateView(activeView.id, updatedView);
        }}
      />
      
      {/* Layout principal */}
      <div className="screen-layout">
        {/* Sidebar - 20% */}
        <ConfigSidebar
          dimensions={store.getDimensions()}
          activeView={activeView}
          onAddToView={(dimId, category) => store.addDimensionToActiveView(dimId, category)}
          onRemoveFromView={(dimId, category) => store.removeDimensionFromActiveView(dimId, category)}
          onSetFilter={(dimId, nodeIds) => store.setFilterForDimension(dimId, nodeIds)}
          onConfigureAggregation={openAggregationModal}
        />
        
        {/* Zone Grid - 80% */}
        <GridMain
          view={activeView}
          pivotData={store.buildPivotFromView()}
        />
      </div>
      
      {/* Barre d'actions */}
      <ActionBar
        onBack={handleBackToMain}
        onApply={handleApplyConfiguration}
      />
      
      {/* Modals */}
      {isAddModalOpen && (
        <AddDimensionModal
          dimensions={store.getDimensions()}
          target={addModalTarget}
          onClose={closeAddModal}
          onApply={(selectedDimIds) => {
            selectedDimIds.forEach(dimId => {
              store.addDimensionToActiveView(dimId, addModalTarget);
            });
            closeAddModal();
          }}
        />
      )}
      
      {isAggregationModalOpen && aggregationMeasure && (
        <AggregationModal
          measure={activeView.measures.find(m => m.id === aggregationMeasure)}
          onClose={closeAggregationModal}
          onApply={(aggregation) => {
            store.updateMeasureAggregation(aggregationMeasure, aggregation);
            closeAggregationModal();
          }}
        />
      )}
    </div>
  );
}

export default observer(ViewGridScreenComponent);
```

#### 3. **Adapter PivotGrid Component**

**Problème** : Le composant PivotGrid utilise l'ancien modèle (rowFields/columnFields/valueFields).

**Solution** : Créer un wrapper ou adapter PivotGrid pour utiliser View configuration :

```typescript
// src/components/pivot-grid/PivotGridContainer.tsx
import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/StoreContext';
import PivotGrid from './PivotGrid';

export const PivotGridContainer = observer(() => {
  const store = useStore();
  const activeView = store.getActiveView();
  
  if (!activeView) {
    return <div>No active view</div>;
  }
  
  // Convertir View configuration vers l'ancien format pour compatibilité
  const rowFields = activeView.rowDimensions;
  const columnFields = activeView.columnDimensions;
  const valueFields = activeView.measures.map(m => m.id);
  const aggregation = activeView.measures[0]?.aggregation || 'sum';
  
  // Filtres : convertir FilterDimension vers le format legacy
  const filters = activeView.filterDimensions?.map(fd => ({
    dimensionId: fd.dimensionId,
    selectedValues: fd.selectedNodes
  })) || [];
  
  return (
    <PivotGrid
      data={store.data}
      rowFields={rowFields}
      columnFields={columnFields}
      valueFields={valueFields}
      aggregation={aggregation}
      filters={filters}
    />
  );
});
```

**À long terme** : Refactorer PivotGrid pour accepter directement une View et générer le tableau à partir de `store.buildPivotFromView()`.

### 🟡 Priorité Moyenne

#### 4. **Implémenter les sous-composants**

**a. ViewHeader** (`/src/screens/view-grid/components/ViewHeader/`)

```typescript
// ViewHeader.tsx
interface ViewHeaderProps {
  rowDimensions: string[];
  columnDimensions: string[];
  valueMeasures: Measure[];
  onAddDimension: (target: 'rows' | 'columns' | 'values') => void;
  onConfigureAggregation: (dimensionId: string, measureId: string) => void;
  viewName: string;
  onSaveView: (name: string) => void;
}

export function ViewHeader({
  rowDimensions,
  columnDimensions,
  valueMeasures,
  onAddDimension,
  onConfigureAggregation,
  viewName,
  onSaveView
}: ViewHeaderProps) {
  const [editName, setEditName] = useState(viewName);
  
  return (
    <div className="view-header">
      <div className="dimension-header">
        <div className="dimension-config-line">
          <span className="config-label">Row dimensions:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => onAddDimension('rows')}
          >
            +
          </button>
          <div className="current-selections">
            {rowDimensions.map(dimId => (
              <span 
                key={dimId} 
                className="selected-badge"
                onClick={() => onConfigureAggregation(dimId, '')}
              >
                {store.getDimension(dimId)?.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="dimension-config-line">
          <span className="config-label">Column dimensions:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => onAddDimension('columns')}
          >
            +
          </button>
          <div className="current-selections">
            {columnDimensions.map(dimId => (
              <span key={dimId} className="selected-badge">
                {store.getDimension(dimId)?.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="dimension-config-line">
          <span className="config-label">Value fields:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => onAddDimension('values')}
          >
            +
          </button>
          <div className="current-selections">
            {valueMeasures.map(measure => (
              <span 
                key={measure.id} 
                className="selected-badge"
                onClick={() => onConfigureAggregation('', measure.id)}
              >
                {measure.name}
                <span className="agg-indicator">
                  {measure.aggregation}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="view-name">
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="View name"
        />
        <button onClick={() => onSaveView(editName)}>
          Save View
        </button>
      </div>
    </div>
  );
}
```

**b. ConfigSidebar** (`/src/screens/view-grid/components/ConfigSidebar/`)

```typescript
// ConfigSidebar.tsx
interface ConfigSidebarProps {
  dimensions: Dimension[];
  activeView: View;
  onAddToView: (dimensionId: string, category: 'row' | 'column' | 'value') => void;
  onRemoveFromView: (dimensionId: string, category: 'row' | 'column' | 'value') => void;
  onSetFilter: (dimensionId: string, nodeIds: string[]) => void;
  onConfigureAggregation: (dimensionId: string, measureId: string) => void;
}

export function ConfigSidebar({
  dimensions,
  activeView,
  onAddToView,
  onRemoveFromView,
  onSetFilter,
  onConfigureAggregation
}: ConfigSidebarProps) {
  const store = useStore();
  
  // Dimensions utilisées dans la vue
  const usedDimensionIds = [
    ...activeView.rowDimensions,
    ...activeView.columnDimensions,
    ...activeView.measures.map(m => m.id),
    ...(activeView.filterDimensions?.map(fd => fd.dimensionId) || [])
  ];
  
  // Dimensions disponibles (non utilisées)
  const availableDimensions = dimensions.filter(
    d => !usedDimensionIds.includes(d.id)
  );
  
  return (
    <aside className="config-sidebar">
      {/* Available Dimensions */}
      <div className="config-section">
        <h3>📋 Available Dimensions</h3>
        <div className="available-dimensions">
          <div className="dimension-list">
            {availableDimensions.map(dim => (
              <div 
                key={dim.id}
                className="dimension-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', dim.id);
                }}
                onClick={() => onAddToView(dim.id, 'row')}
              >
                {dim.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Selected Dimensions */}
      <div className="config-section">
        <h3>🎯 Selected Dimensions</h3>
        <div className="selected-dimensions">
          {/* Dimensions en lignes */}
          {activeView.rowDimensions.map(dimId => {
            const dim = store.getDimension(dimId);
            return (
              <div 
                key={dimId} 
                className="dimension-badge-full"
                onClick={() => onConfigureAggregation(dimId, '')}
              >
                <span className="dimension-name">{dim?.name}</span>
                <span className="dimension-type">Row</span>
              </div>
            );
          })}
          
          {/* Dimensions en colonnes */}
          {activeView.columnDimensions.map(dimId => {
            const dim = store.getDimension(dimId);
            return (
              <div 
                key={dimId} 
                className="dimension-badge-full"
                onClick={() => onConfigureAggregation(dimId, '')}
              >
                <span className="dimension-name">{dim?.name}</span>
                <span className="dimension-type">Column</span>
              </div>
            );
          })}
          
          {/* Mesures */}
          {activeView.measures.map(measure => (
            <div 
              key={measure.id} 
              className="dimension-badge-full"
              onClick={() => onConfigureAggregation('', measure.id)}
            >
              <span className="dimension-name">{measure.name}</span>
              <span className="agg-indicator">{measure.aggregation}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Filters */}
      <div className="config-section">
        <h3>🔍 Filters</h3>
        <div className="filters-list">
          {activeView.filterDimensions?.map(filterDim => {
            const dim = store.getDimension(filterDim.dimensionId);
            const options = store.getFilterOptions(filterDim.dimensionId);
            
            return (
              <div key={filterDim.dimensionId} className="filter-group">
                <h4>{dim?.name}</h4>
                <select
                  className="filter-select"
                  multiple
                  value={filterDim.selectedNodes}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions)
                      .map(opt => opt.value);
                    onSetFilter(filterDim.dimensionId, selected);
                  }}
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          
          {/* Ajouter des filtres pour les dimensions utilisées */}
          {[...activeView.rowDimensions, ...activeView.columnDimensions].map(dimId => {
            const dim = store.getDimension(dimId);
            const hasFilter = activeView.filterDimensions?.some(
              fd => fd.dimensionId === dimId
            );
            
            if (!hasFilter) {
              return (
                <div key={dimId} className="filter-group">
                  <h4>{dim?.name}</h4>
                  <select
                    className="filter-select"
                    multiple
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions)
                        .map(opt => opt.value);
                      onSetFilter(dimId, selected);
                    }}
                  >
                    {store.getFilterOptions(dimId).map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </aside>
  );
}
```

**c. GridMain** (`/src/screens/view-grid/components/GridMain/`)

```typescript
// GridMain.tsx
interface GridMainProps {
  view: View;
  pivotData: PivotData;
}

export function GridMain({ view, pivotData }: GridMainProps) {
  return (
    <main className="grid-main">
      <div className="pivot-grid-container">
        {/* Utiliser le futur composant PivotGrid ou un tableau temporaire */}
        <PivotGridTable
          rows={pivotData.rows}
          columns={pivotData.columns}
          data={pivotData.data}
          showTotals={view.showTotals}
          showGrandTotal={view.showGrandTotal}
        />
      </div>
    </main>
  );
}

// PivotGridTable.tsx - Tableau HTML du pivot
interface PivotGridTableProps {
  rows: any[];
  columns: any[];
  data: any[][];
  showTotals: boolean;
  showGrandTotal: boolean;
}

export function PivotGridTable({
  rows,
  columns,
  data,
  showTotals,
  showGrandTotal
}: PivotGridTableProps) {
  // Logique de rendu du tableau
  // ...
  return (
    <table className="pivot-grid-table">
      {/* En-têtes */}
      <thead>
        <tr>
          <th className="corner-cell"></th>
          {columns.map(col => (
            <th key={col.key} className="grid-cell header">
              {col.label}
            </th>
          ))}
          {showTotals && (
            <th className="grid-cell header total">Total</th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="grid-row">
            <th className="grid-cell header">
              {rows[rowIndex]?.label}
            </th>
            {row.map((cell, colIndex) => (
              <td key={colIndex} className="grid-cell">
                {cell.value}
              </td>
            ))}
            {showTotals && (
              <td className="grid-cell total">
                {row[row.length]?.value || ''}
              </td>
            )}
          </tr>
        ))}
        {showGrandTotal && (
          <tr className="grid-row total">
            <th className="grid-cell header total">Total</th>
            {data[0]?.map((_, colIndex) => (
              <td key={colIndex} className="grid-cell total">
                {/* Calculer le total général */}
              </td>
            ))}
            {showTotals && (
              <td className="grid-cell total"></td>
            )}
          </tr>
        )}
      </tbody>
    </table>
  );
}
```

**d. ActionBar** (`/src/screens/view-grid/components/ActionBar/`)

```typescript
// ActionBar.tsx
interface ActionBarProps {
  onBack: () => void;
  onApply: () => void;
}

export function ActionBar({ onBack, onApply }: ActionBarProps) {
  return (
    <div className="view-actions">
      <button className="btn-secondary" onClick={onBack}>
        Back to Main screen
      </button>
      <button className="btn-primary" onClick={onApply}>
        Apply Configuration
      </button>
    </div>
  );
}
```

**e. Modals** (`/src/screens/view-grid/components/modals/`)

```typescript
// AddDimensionModal.tsx
interface AddDimensionModalProps {
  dimensions: Dimension[];
  target: 'rows' | 'columns' | 'values';
  onClose: () => void;
  onApply: (selectedDimIds: string[]) => void;
}

export function AddDimensionModal({
  dimensions,
  target,
  onClose,
  onApply
}: AddDimensionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleCheckboxChange = (dimId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, dimId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== dimId));
    }
  };
  
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            Select {target === 'rows' ? 'Row' : target === 'columns' ? 'Column' : 'Value'} Dimensions
          </h3>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="dimension-list-modal">
          {dimensions.map(dim => (
            <div 
              key={dim.id} 
              className="dimension-item-modal"
              onClick={() => {
                const newSelected = selectedIds.includes(dim.id)
                  ? selectedIds.filter(id => id !== dim.id)
                  : [...selectedIds, dim.id];
                setSelectedIds(newSelected);
              }}
            >
              <input
                type="checkbox"
                id={`modal-dim-${dim.id}`}
                checked={selectedIds.includes(dim.id)}
                onChange={(e) => handleCheckboxChange(dim.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <label htmlFor={`modal-dim-${dim.id}`}>{dim.name}</label>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-apply-modal" 
            onClick={() => onApply(selectedIds)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// AggregationModal.tsx
interface AggregationModalProps {
  measure: Measure | null;
  onClose: () => void;
  onApply: (aggregation: AggregationType) => void;
}

export function AggregationModal({ measure, onClose, onApply }: AggregationModalProps) {
  const [selectedAgg, setSelectedAgg] = useState<AggregationType>('sum');
  
  const aggregationOptions: AggregationType[] = [
    'sum', 'average', 'count', 'min', 'max', 'first', 'last'
  ];
  
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="agg-modal-content">
        <div className="agg-modal-header">
          <h3>Select Aggregation</h3>
        </div>
        
        <div className="agg-options">
          {aggregationOptions.map(agg => (
            <div 
              key={agg} 
              className="agg-option"
              onClick={() => setSelectedAgg(agg)}
            >
              <input
                type="radio"
                id={`agg-${agg}`}
                name="aggregation"
                value={agg}
                checked={selectedAgg === agg}
                onChange={() => setSelectedAgg(agg)}
              />
              <label htmlFor={`agg-${agg}`}>
                {agg.charAt(0).toUpperCase() + agg.slice(1)}
              </label>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-apply-modal" 
            onClick={() => onApply(selectedAgg)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 🟢 Priorité Basse

#### 5. **Améliorations UI/UX**

- Animation des modals (opacity, translateY)
- Drag & Drop pour déposer les dimensions dans les zones (row/column/value)
- Tooltips sur les badges pour afficher plus d'informations
- Feedback visuel lors de l'application des filtres
- Validation des noms de vue (unique, non vide)

#### 6. **Optimisation des performances**

- Virtualisation du tableau pour les grands jeux de données
- Mémoïsation des calculs coûteux
- Optimisation du re-rendu avec `React.memo`

#### 7. **Tests**

- Tests unitaires pour les composants
- Tests d'intégration pour ViewGridScreen
- Tests E2E pour les scénarios utilisateur

---

## Structure des Fichiers Finale

```
src/
├── screens/
│   └── view-grid/
│       ├── ViewGridScreen.tsx          # Composant principal
│       ├── ViewGridScreen.css         # Styles principaux
│       ├── index.ts                   # Export
│       ├── components/
│       │   ├── ViewHeader/
│       │   │   ├── ViewHeader.tsx
│       │   │   ├── ViewHeader.css
│       │   │   └── index.ts
│       │   ├── ConfigSidebar/
│       │   │   ├── ConfigSidebar.tsx
│       │   │   ├── ConfigSidebar.css
│       │   │   ├── AvailableDimensionsList.tsx
│       │   │   ├── SelectedDimensionsBadges.tsx
│       │   │   ├── FiltersConfiguration.tsx
│       │   │   └── index.ts
│       │   ├── GridMain/
│       │   │   ├── GridMain.tsx
│       │   │   ├── GridMain.css
│       │   │   ├── PivotGridTable.tsx
│       │   │   └── index.ts
│       │   ├── ActionBar/
│       │   │   ├── ActionBar.tsx
│       │   │   ├── ActionBar.css
│       │   │   └── index.ts
│       │   └── modals/
│       │       ├── AddDimensionModal.tsx
│       │       ├── AggregationModal.tsx
│       │       └── modal.css
│       └── hooks/
│           └── useViewGrid.ts
└── stores/
    └── Store.ts                      # Avec nouvelles méthodes

components/
└── pivot-grid/
    ├── PivotGrid.tsx              # À adapter
    ├── PivotGridConfiguration.tsx # À adapter
    └── PivotGridTable.tsx         # À adapter
```

---

## Cas de Test de Référence

Voir [screen.md](./screen.md) pour les scénarios Gherkin.

## Notes Techniques

1. **Pattern MVC**
   - **Store = Controller** : Toutes les opérations de modification sont dans le Store
   - **ViewGridScreen = View** : Composant léger qui observe le Store
   - **Pas de duplication** : Aucune logique métier dans les composants

2. **Gestion d'état**
   - État global : Store (MobX)
   - État local : useState pour les modals, inputs, etc.
   - Synchronisation : observer() pour les re-rendus automatiques

3. **Navigation**
   - Utiliser `useNavigate()` de react-router-dom
   - Routes définies dans `App.tsx`

4. **Styles**
   - Utiliser les classes CSS documentées dans [screen.md](./screen.md)
   - S'inspirer de [design.html](./design.html) pour le design visuel

5. **Responsive**
   - Media query à 1024px pour passer en mode mobile
   - Sidebar → Top, width 100%

---

## Principes Architecturaux (MVC)

- **Store = Controller** : Toutes les opérations de modification de données doivent être dans le Store
- **Screens = Views** : Les écrans doivent être légers et utiliser directement les méthodes du Store
- **Pas de duplication** : Aucune logique métier ne doit être recopiée dans les composants
- **Single Source of Truth** : Le Store contient toutes les données et la logique
- **Observer Pattern** : Les composants s'abonnent aux changements du Store via `observer()`

---

## Questions Ouvertes

1. Faut-il supporter le drag-drop entre Available Dimensions et les zones cibles ?
2. Faut-il implémenter un système de "favorites" pour les vues ?
3. Faut-il ajouter un bouton pour dupliquer une vue existante ?
4. Comment gérer les conflits de noms lors de la sauvegarde d'une vue ?
5. Faut-il implémenter un historique des modifications (undo/redo) ?

---

## Checklist de Validation

- [ ] Navigation vers ViewGridScreen fonctionne
- [ ] Header affiche correctement les dimensions sélectionnées
- [ ] Sidebar affiche les dimensions disponibles et sélectionnées
- [ ] Modals s'ouvrent et se ferment correctement
- [ ] Ajout de dimensions dans row/column/value fonctionne
- [ ] Configuration de l'agrégation fonctionne
- [ ] Filtres s'appliquent et mettent à jour le tableau
- [ ] Bouton Apply Configuration fonctionne
- [ ] Bouton Back retourne à MainScreen
- [ ] Sauvegarde du nom de vue fonctionne
- [ ] Design responsive fonctionne (< 1024px)
- [ ] Tous les tests passent
