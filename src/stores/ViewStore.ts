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

import { action, makeAutoObservable, makeObservable, observable } from 'mobx';
import type {
  View,
  Measure,
  FilterDimension,
  AggregationType,
  Dimension,
  Node,
  PivotProject,
  LocalDataSource,
} from '../models/pivot-project/types';
import type { Store } from '.';
import { PivotProjectService } from '../services/PivotProjectService';
import { PivotDataService, type PivotDataServiceSuppliers, TOTAL } from '../services/PivotDataService';


// ============================================================================
// PIVOT DATA TYPE (à définir plus précisément si nécessaire)
// ============================================================================

export type PivotCellMap = Map<string, Map<string, Map<string, PivotCell>>>;

export interface PivotData {
  rows: PivotAxe[];
  columns: PivotAxe[];
  measures: string[];
  pivotCellByColKeyByRowKeyByMeasureId: PivotCellMap;
}

export const EMPTY_PIVOTDATA: PivotData = {
  rows: [], columns:[], measures:[], pivotCellByColKeyByRowKeyByMeasureId: new Map()
}

export interface PivotAxe {  
  axeKey: string;
}

export interface PivotCell {
  value: any;
  formattedValue?: string;
  rowAxeKey: string;
  colAxeKey: string;
  isTotal?: boolean;
}

// ============================================================================
// ROW DATA AND TUPLE TYPES
// ============================================================================

/**
 * Représente un tuple de dimensions pour les colonnes ou les lignes
 * Ex: ["Paris", "2024"] pour une colonne avec dimension Ville=Paris et Année=2024
 */
export type Tuple = string[];

/**
 * Représente une donnée de ligne pour la construction du pivot
 */
export interface RowData {
  measureId: string;
  tupleColumns: Tuple;
  tupleRows: Tuple;
  value: number;
}

export type ModalType = 'row' | 'column' | 'value' ;

// ============================================================================
// VIEW STORE CLASS
// ============================================================================

export class ViewStore {
  // Référence au store principal (pour accéder aux dimensions, nodes, dataSources, etc.)  
  public rootStore: Store;



  // 
  public allDimensions : Dimension[] = [];

  // Current view
  public activeViewId : string = "";
  public pivotData ?: PivotData;
  public rowDimensions : Dimension[] = [];
  public colDimensions : Dimension[] = [];
  public measures : Measure[] =  [];
  public filters: FilterDimension[] = [];

  // 
  public showAddModal: boolean = false;
  public addModalTarget: ModalType = 'row';

  public currentMeasureId: string = "";
  public showAggregationModal: boolean = false;
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(rootStore: Store) {
    makeObservable(this, {      
      allDimensions: observable.ref,
      activeViewId: observable.ref,
      pivotData: observable.ref,
      rowDimensions: observable.ref,
      colDimensions: observable.ref,
      filters: observable.ref,
      measures: observable.ref,
      showAddModal: observable.ref,      
      showAggregationModal: observable.ref,
      openModal: action,
      addDimensionToView: action,
      openAggregationModal: action,      
      closeAggregationModal: action,
      setFilterForDimension: action,
      clearFilter: action,
      loadView: action,
      refresh: action,
      updateName: action
    });
    this.rootStore = rootStore;
  }

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  get activeView(): View | undefined {
    if (!this.rootStore.activeViewId) return undefined;
    return this.rootStore.pivotProject.views.find(v => v.id === this.rootStore.activeViewId);
  }
 
  get usedDimensionIds(): Set<string> {
    const view = this.activeView;
    if (!view) return new Set();
    return new Set<string>([
      ...(this.rowDimensions || []).map(d => d.id),
      ...(this.colDimensions || []).map(d => d.id),
      ...view.measures.map(m => m.id)      
    ]);
  }

  get usedDimensions(): Dimension[] {
    const dimensionIds = this.usedDimensionIds;
    return this.rootStore.getDimensions().filter(d => dimensionIds.has(d.id));
  }

  get availableDimensions(): Dimension[] {
    return this.rootStore.getDimensions().filter(d => !this.usedDimensionIds.has(d.id));
  }

  updateName(name: string) {
    if(this.activeView) {
      this.activeView.name = name;  
    }
    
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
    this.refresh();
  }

  refresh() {    
    let view = this.getActiveView();
    if(! view) {
      this.colDimensions = [];
      this.rowDimensions = [];
      this.measures = [];
      this.pivotData = undefined;
      this.allDimensions = [];
      this.filters = [];
    } else {
      this.allDimensions = this.rootStore.getDimensions();
      this.colDimensions =  view.columnDimensions.map(i => this.rootStore.getDimension(i)).filter(d => d) as Dimension[];
      this.rowDimensions =  view.rowDimensions.map(i => this.rootStore.getDimension(i)).filter(d => d) as Dimension[];
      this.measures = view.measures;
      this.filters = view.filterDimensions || [];
      this.pivotData = this.buildPivotFromView();
    }    
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
  
  openModal(type: ModalType) {
    this.showAddModal = true;
    this.addModalTarget = type;
  }

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
    this.refresh();

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
    this.refresh();
  }
    
  // ==========================================================================
  // MEASURE MANAGEMENT
  // ==========================================================================
  
  /**
   * Met à jour l'agrégation d'une mesure
   */
  updateMeasureAggregation(aggregation: AggregationType): void {
    const view = this.getActiveView();
    if (!view) return;
    
    
    const measure = view.measures.find(m => m.id === this.currentMeasureId);
    if (measure) {
      measure.aggregation = aggregation;
      this.updateViewTimestamp(view);
      this.syncLegacyProperties();
      this.refresh();
    }
    this.closeAggregationModal();
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
      this.refresh();
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
    this.refresh();
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

  openAggregationModal(measureId : string) {
    this.currentMeasureId = measureId;
    this.showAggregationModal = true;
  }

  closeAggregationModal() {
    this.showAggregationModal = false;
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
    let dimension = this.rootStore.getDimension(dimensionId);

    if (!filterDim) {
      // Créer un nouveau filtre
      if (!view.filterDimensions) {
        view.filterDimensions = [];
      }
      filterDim = {
        dimensionId,
        selectedNodes: selectedNodeIds,// dimension?.nodes.filter(n => selectedNodeIds.indexOf(n.id) >= 0).map(n => n.code) || [],
        operator
      };
      view.filterDimensions.push(filterDim);
    } else {
      // Mettre à jour existant
      filterDim.selectedNodes = [...selectedNodeIds]; // dimension?.nodes.filter(n => selectedNodeIds.indexOf(n.id) >= 0).map(n => n.code) || [];
      filterDim.operator = operator;
    }

    view.filterDimensions = [...view.filterDimensions || []];    
    this.filters = view.filterDimensions;
      
    this.updateViewTimestamp(view);
    this.syncLegacyProperties();
    this.refresh();
  }

  clearFilter(dimensionId: string) {
    const view = this.getActiveView();
    if (!view) return;
        
    let filterDim = view.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
    if(filterDim)  {
      view.filterDimensions = view.filterDimensions?.filter(f => f != filterDim);          
      this.filters = view.filterDimensions || [];
      this.updateViewTimestamp(view);
      this.syncLegacyProperties();
      this.refresh();
    }
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
   * 
   * Délègue à PivotDataService pour la construction des données
   */
  buildPivotFromView(): PivotData {    
    var start=  new Date().valueOf();
    // Créer les suppliers pour PivotDataService
    const suppliers: PivotDataServiceSuppliers = {
      getView: () => this.getActiveView(),
      getLocalDataSources: () => this.rootStore.pivotProject.dataSources.filter(
        (ds): ds is LocalDataSource => ds.type === 'local'
      ),
      getDimension: (dimensionId: string) => this.rootStore.getDimension(dimensionId),
      getDimensions: () => this.rootStore.getDimensions()
    };
    
    // Construire les données pivot (les totaux sont gérés par view.showTotals et view.showGrandTotal)
    var result = PivotDataService.buildPivotData(suppliers);
    console.log("Generate pivotData", (new Date().valueOf() - start), "ms");
    return result;
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
