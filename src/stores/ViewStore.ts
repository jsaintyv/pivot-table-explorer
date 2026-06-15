/**
 * ViewStore - Store dédié à la gestion de la vue courante
 * 
 * MobX Store qui encapsule toute la logique spécifique à la vue active.
 * Ce store suit le principe Single Responsibility en séparant la gestion des vues
 * de la gestion du projet (Store principal).
 * 
 * In MVC:
 * - Model: La View active et sa configuration
 * - Controller: Les actions qui modifient la vue
 * - View: Les composants React qui observent ce store
 */

import { makeAutoObservable } from 'mobx';
import type {
  View,
  Measure,
  FilterDimension,
  AggregationType,
  Dimension,
  Node,
  PivotProject,
  DataSource,
} from '../models/pivot-project/types';

// Type minimal pour le rootStore afin d'éviter les dépendances circulaires
type MinimalStore = {
  pivotProject: PivotProject;
  activeViewId?: string;
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filters: { dimensionId: string; selectedValues: string[] }[];
  getDimension: (id: string) => Dimension | undefined;
  getDimensions: () => Dimension[];
  getNodesByDimension: (dimensionId: string) => Node[];
  getView: (id: string) => View | undefined;
  addView: (
    name: string,
    rowDimensions?: string[],
    columnDimensions?: string[],
    measures?: Measure[],
    description?: string,
    filterDimensions?: FilterDimension[],
    showTotals?: boolean,
    showGrandTotal?: boolean
  ) => string;
  updateView: (id: string, updates: Partial<View>) => void;
  removeView: (id: string) => void;
};

// ============================================================================
// PIVOT DATA TYPE (à définir plus précisément si nécessaire)
// ============================================================================

export interface PivotData {
  rows: PivotRow[];
  columns: PivotColumn[];
  data: PivotCell[][];
}

export interface PivotRow {
  key: string;
  label: string;
  level: number;
  dimensionId?: string;
  nodeId?: string;
}

export interface PivotColumn {
  key: string;
  label: string;
  level: number;
  dimensionId?: string;
  nodeId?: string;
}

export interface PivotCell {
  value: any;
  formattedValue?: string;
  rowKey: string;
  colKey: string;
  isTotal?: boolean;
}

// ============================================================================
// VIEW STORE CLASS
// ============================================================================

export class ViewStore {
  // Référence au store principal (pour accéder aux dimensions, nodes, dataSources, etc.)
  // Utilise MinimalStore pour éviter les dépendances circulaires avec Store
  private rootStore: MinimalStore;
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(rootStore: MinimalStore) {
    makeAutoObservable(this, {
      loadView: true,
      addDimensionToView: true,
      removeDimensionFromView: true,
      updateMeasureAggregation: true,
      addMeasureToView: true,
      removeMeasureFromView: true,
      setFilterForDimension: true,
      removeFilterForDimension: true,
      updateView: true,
      toggleDimensionInView: true,
      toggleFilterNode: true,
      updateActiveViewName: true,
    });
    this.rootStore = rootStore;
  }
  
  // ==========================================================================
  // VIEW SELECTION
  // ==========================================================================
  
  /**
   * Charge une vue et l'active
   * Synchronise aussi les propriétés legacy du Store principal
   */
  loadView(viewId: string): void {
    this.rootStore.activeViewId = viewId;
    this.syncLegacyProperties();
  }
  
  /**
   * Retourne la vue active
   */
  getActiveView(): View | undefined {
    if (!this.rootStore.activeViewId) return undefined;
    return this.rootStore.pivotProject.views.find(v => v.id === this.rootStore.activeViewId);
  }
  
  /**
   * Retourne toutes les vues du projet
   */
  getViews(): View[] {
    return this.rootStore.pivotProject.views;
  }
  
  /**
   * Retourne l'ID de la vue active
   */
  getActiveViewId(): string | undefined {
    return this.rootStore.activeViewId;
  }
  
  /**
   * Définir la vue active par ID
   */
  setActiveViewId(id: string | undefined): void {
    this.rootStore.activeViewId = id;
    this.syncLegacyProperties();
  }
  
  // ==========================================================================
  // VIEW MANAGEMENT
  // ==========================================================================
  
  /**
   * Crée une nouvelle vue
   */
  addView(
    name: string,
    rowDimensions?: string[],
    columnDimensions?: string[],
    measures?: Measure[],
    description?: string,
    filterDimensions?: FilterDimension[],
    showTotals?: boolean,
    showGrandTotal?: boolean
  ): string {
    return this.rootStore.addView(
      name,
      rowDimensions,
      columnDimensions,
      measures,
      description,
      filterDimensions,
      showTotals,
      showGrandTotal
    );
  }
  
  /**
   * Met à jour une vue existante
   */
  updateView(id: string, updates: Partial<View>): void {
    this.rootStore.updateView(id, updates);
    // Si on met à jour la vue active, synchroniser les legacy props
    if (id === this.rootStore.activeViewId) {
      this.syncLegacyProperties();
    }
  }
  
  /**
   * Supprime une vue
   */
  removeView(id: string): void {
    this.rootStore.removeView(id);
    // Si on supprime la vue active, la désactiver
    if (this.rootStore.activeViewId === id) {
      this.rootStore.activeViewId = undefined;
      this.clearLegacyProperties();
    }
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
    
    // Vérifier que la dimension n'est pas déjà dans une autre catégorie
    const currentCategory = this.getDimensionCategoryInView(dimensionId);
    if (currentCategory && currentCategory !== category) {
      // Retirer de la catégorie actuelle avant d'ajouter à la nouvelle
      // Note: 'filter' est géré séparément et n'est pas dans row/column/value
      if (currentCategory === 'row' || currentCategory === 'column' || currentCategory === 'value') {
        this.removeDimensionFromView(dimensionId, currentCategory);
      } else if (currentCategory === 'filter') {
        // Retirer du filtre
        this.removeFilterForDimension(dimensionId);
      }
    }
    
    if (category === 'row' && !view.rowDimensions.includes(dimensionId)) {
      view.rowDimensions = [...view.rowDimensions, dimensionId];
    } else if (category === 'column' && !view.columnDimensions.includes(dimensionId)) {
      view.columnDimensions = [...view.columnDimensions, dimensionId];
    } else if (category === 'value') {
      // Créer une nouvelle mesure pour cette dimension
      // Ne pas dupliquer si une mesure avec ce dimensionId existe déjà
      const existingMeasure = view.measures.find(m => m.id === dimensionId);
      if (!existingMeasure) {
        const measure: Measure = {
          id: dimensionId,  // Utiliser le dimensionId comme measureId pour simplifier
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
    this.updateViewTimestamp(view);
    this.syncLegacyProperties();
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
    this.syncLegacyProperties();
  }
  
  /**
   * Toggle une dimension entre catégories ou la retire
   */
  toggleDimensionInView(dimensionId: string, category: 'row' | 'column' | 'value' | null): void {
    const view = this.getActiveView();
    if (!view) return;
    
    const currentCategory = this.getDimensionCategoryInView(dimensionId);
    
    // Si on toggle vers null ou la même catégorie, retirer
    if (category === null || category === currentCategory) {
      if (currentCategory === 'row' || currentCategory === 'column' || currentCategory === 'value') {
        this.removeDimensionFromView(dimensionId, currentCategory);
      } else if (currentCategory === 'filter') {
        this.removeFilterForDimension(dimensionId);
      }
    } else if (currentCategory) {
      // Changer de catégorie
      if (currentCategory === 'row' || currentCategory === 'column' || currentCategory === 'value') {
        this.removeDimensionFromView(dimensionId, currentCategory);
      } else if (currentCategory === 'filter') {
        this.removeFilterForDimension(dimensionId);
      }
      this.addDimensionToView(dimensionId, category);
    } else {
      // Ajouter à la nouvelle catégorie
      this.addDimensionToView(dimensionId, category);
    }
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
      this.syncLegacyProperties();
    }
  }
  
  /**
   * Ajoute une mesure personnalisée à la vue active
   */
  addMeasureToView(measure: Measure): void {
    const view = this.getActiveView();
    if (!view) return;
    
    // Vérifier qu'il n'y a pas déjà une mesure avec le même ID
    if (!view.measures.some(m => m.id === measure.id)) {
      view.measures = [...view.measures, measure];
      this.updateViewTimestamp(view);
      this.syncLegacyProperties();
    }
  }
  
  /**
   * Retire une mesure de la vue active
   */
  removeMeasureFromView(measureId: string): void {
    const view = this.getActiveView();
    if (!view) return;
    
    view.measures = view.measures.filter(m => m.id !== measureId);
    this.updateViewTimestamp(view);
    this.syncLegacyProperties();
  }
  
  /**
   * Retourne une mesure par son ID
   */
  getMeasure(measureId: string): Measure | undefined {
    const view = this.getActiveView();
    if (!view) return undefined;
    return view.measures.find(m => m.id === measureId);
  }
  
  /**
   * Retourne toutes les mesures de la vue active
   */
  getMeasures(): Measure[] {
    const view = this.getActiveView();
    if (!view) return [];
    return view.measures;
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
   * Retourne le filtre pour une dimension
   */
  getFilterForDimension(dimensionId: string): FilterDimension | undefined {
    const view = this.getActiveView();
    if (!view) return undefined;
    return view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
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
    this.syncLegacyProperties();
  }
  
  /**
   * Supprime le filtre pour une dimension
   */
  removeFilterForDimension(dimensionId: string): void {
    const view = this.getActiveView();
    if (!view) return;
    
    view.filterDimensions = view.filterDimensions?.filter(fd => fd.dimensionId !== dimensionId);
    this.updateViewTimestamp(view);
    this.syncLegacyProperties();
  }
  
  /**
   * Active/Désactive un node dans le filtre d'une dimension
   */
  toggleFilterNode(dimensionId: string, nodeId: string): void {
    const view = this.getActiveView();
    if (!view) return;
    
    let filterDim = view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
    
    if (!filterDim) {
      // Créer un nouveau filtre avec ce node
      if (!view.filterDimensions) {
        view.filterDimensions = [];
      }
      filterDim = {
        dimensionId,
        selectedNodes: [nodeId],
        operator: 'include'
      };
      view.filterDimensions.push(filterDim);
    } else {
      // Toggle le node dans les selectedNodes
      if (filterDim.selectedNodes.includes(nodeId)) {
        filterDim.selectedNodes = filterDim.selectedNodes.filter(id => id !== nodeId);
      } else {
        filterDim.selectedNodes = [...filterDim.selectedNodes, nodeId];
      }
    }
    
    this.updateViewTimestamp(view);
    this.syncLegacyProperties();
  }
  
  // ==========================================================================
  // DIMENSION/MEASURE HELPERS
  // ==========================================================================
  
  /**
   * Retourne les dimensions utilisées dans la vue active
   */
  getUsedDimensions(): Dimension[] {
    const view = this.getActiveView();
    if (!view) return [];
    
    const dimensionIds = new Set<string>([
      ...view.rowDimensions,
      ...view.columnDimensions,
      ...view.measures.map(m => m.id),
      ...(view.filterDimensions?.map(fd => fd.dimensionId) || [])
    ]);
    
    return this.rootStore.getDimensions().filter(d => dimensionIds.has(d.id));
  }
  
  /**
   * Retourne les dimensions disponibles (non utilisées dans la vue active)
   */
  getAvailableDimensions(): Dimension[] {
    const usedDimensionIds = new Set<string>([
      ...(this.getActiveView()?.rowDimensions || []),
      ...(this.getActiveView()?.columnDimensions || []),
      ...(this.getActiveView()?.measures.map(m => m.id) || []),
      ...(this.getActiveView()?.filterDimensions?.map(fd => fd.dimensionId) || [])
    ]);
    
    return this.rootStore.getDimensions().filter(d => !usedDimensionIds.has(d.id));
  }
  
  /**
   * Retourne les dimensions utilisées comme lignes
   */
  getRowDimensions(): Dimension[] {
    const view = this.getActiveView();
    if (!view) return [];
    return view.rowDimensions
      .map(id => this.rootStore.getDimension(id))
      .filter(Boolean) as Dimension[];
  }
  
  /**
   * Retourne les dimensions utilisées comme colonnes
   */
  getColumnDimensions(): Dimension[] {
    const view = this.getActiveView();
    if (!view) return [];
    return view.columnDimensions
      .map(id => this.rootStore.getDimension(id))
      .filter(Boolean) as Dimension[];
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
    
    // Pour l'instant, retourner une structure vide
    // La logique complète sera implémentée dans une prochaine étape
    return {
      rows: [],
      columns: [],
      data: []
    };
  }
  
  // ==========================================================================
  // LEGACY COMPATIBILITY
  // ==========================================================================
  
  /**
   * Synchronise les propriétés legacy de Store pour compatibilité avec l'ancien code
   * Appelé automatiquement après loadView() ou toute modification de la vue
   */
  private syncLegacyProperties(): void {
    const view = this.getActiveView();
    if (!view) {
      this.clearLegacyProperties();
      return;
    }
    
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
   * Efface les propriétés legacy
   */
  private clearLegacyProperties(): void {
    this.rootStore.rowFields = [];
    this.rootStore.columnFields = [];
    this.rootStore.valueFields = [];
    this.rootStore.aggregation = 'sum';
    this.rootStore.filters = [];
  }
  
  /**
   * Met à jour les timestamps de la vue
   */
  private updateViewTimestamp(view: View): void {
    view.updatedAt = new Date().toISOString();
    this.rootStore.pivotProject.updatedAt = new Date().toISOString();
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  /**
   * Retourne le nom de la vue active
   */
  getActiveViewName(): string | undefined {
    return this.getActiveView()?.name;
  }
  
  /**
   * Met à jour le nom de la vue active
   */
  updateActiveViewName(name: string): void {
    const view = this.getActiveView();
    if (view) {
      view.name = name;
      this.updateViewTimestamp(view);
    }
  }
  
  /**
   * Vérifie si une vue avec un nom existe déjà
   */
  viewNameExists(name: string, excludeId?: string): boolean {
    return this.rootStore.pivotProject.views.some(
      v => v.name === name && v.id !== excludeId
    );
  }
}
