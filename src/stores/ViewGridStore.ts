/**
 * ViewGridStore
 * 
 * Controller in MVC Pattern for ViewGrid screen
 * Singleton MobX store that manages view configuration state
 * 
 * In MVC:
 * - Model: View, Dimension, Measure, FilterDimension from pivot-project types
 * - Controller: Action methods that modify the state
 * - View: React components that observe and render the state
 * 
 * This store coordinates with the main Store to manage view-specific state
 */

import { makeAutoObservable, runInAction } from 'mobx';
import type {
  View,
  Dimension,
  Node,
  Measure,
  AggregationType,
  DataSource,
  LocalDataSource,
  FilterDimension,
} from '../models/pivot-project/types';
import { Store } from './Store';
import { ViewGridService } from '../services/ViewGridService';

// Type for dimension category selection
export type DimensionCategory = 'row' | 'column' | 'value';

// Type for selected dimensions state
export interface ViewGridState {
  viewName: string;
  selectedDimensions: {
    rows: string[];
    columns: string[];
    values: string[];
  };
  activeViewId: string | null;
  isModalOpen: boolean;
  modalType: 'rows' | 'columns' | 'values' | 'aggregation' | null;
  selectedDimensionForAggregation: string | null;
  aggregationModalMeasureId: string | null;
}

export class ViewGridStore {
  // STATE: Observable state
  state: ViewGridState;

  // Reference to services
  private viewGridService: ViewGridService;

  // Reference to main store (for coordination)
  private mainStore: Store;

  // Singleton instance
  private static instance: ViewGridStore | null = null;

  private constructor() {
    this.viewGridService = new ViewGridService();
    this.mainStore = Store.getInstance();
    
    this.state = {
      viewName: '',
      selectedDimensions: {
        rows: [],
        columns: [],
        values: [],
      },
      activeViewId: null,
      isModalOpen: false,
      modalType: null,
      selectedDimensionForAggregation: null,
      aggregationModalMeasureId: null,
    };

    makeAutoObservable(this, {
      state: true,
      // Computed
      activeView: true,
      dimensions: true,
      availableDimensions: true,
      dimensionMap: true,
      rowDimensionIds: true,
      columnDimensionIds: true,
      measures: true,
      filterDimensions: true,
      dataSources: true,
      // Actions
      initialize: false,
      setActiveView: false,
      setViewName: false,
      addDimension: false,
      removeDimension: false,
      updateMeasureAggregation: false,
      updateFilter: false,
      saveView: false,
      reset: false,
      // Modal actions
      openModal: false,
      closeModal: false,
      setSelectedDimensionForAggregation: false,
      setAggregationModalMeasureId: false,
    });
  }

  /**
   * Singleton accessor
   */
  public static getInstance(): ViewGridStore {
    if (!ViewGridStore.instance) {
      ViewGridStore.instance = new ViewGridStore();
    }
    return ViewGridStore.instance;
  }

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  /**
   * Get the active view from main store
   */
  get activeView(): View | undefined {
    return this.mainStore.getActiveView();
  }

  /**
   * Get all dimensions from main store
   */
  get dimensions(): Dimension[] {
    return this.mainStore.getDimensions();
  }

  /**
   * Get all data sources from main store
   */
  get dataSources(): DataSource[] {
    return this.mainStore.pivotProject.dataSources;
  }

  /**
   * Get local data sources only
   */
  get localDataSources(): LocalDataSource[] {
    return this.mainStore.getLocalDataSources();
  }

  /**
   * Get all views from main store
   */
  get views(): View[] {
    return this.mainStore.getViews();
  }

  /**
   * Get dimension map for quick lookup
   */
  get dimensionMap(): Record<string, Dimension> {
    const map: Record<string, Dimension> = {};
    this.dimensions.forEach(dim => {
      map[dim.id] = dim;
    });
    return map;
  }

  /**
   * Get row dimension IDs from active view
   */
  get rowDimensionIds(): string[] {
    return this.activeView?.rowDimensions || [];
  }

  /**
   * Get column dimension IDs from active view
   */
  get columnDimensionIds(): string[] {
    return this.activeView?.columnDimensions || [];
  }

  /**
   * Get measures from active view
   */
  get measures(): Measure[] {
    return this.activeView?.measures || [];
  }

  /**
   * Get filter dimensions from active view
   */
  get filterDimensions(): FilterDimension[] {
    return this.activeView?.filterDimensions || [];
  }

  /**
   * Get available dimensions (not used in any category)
   */
  get availableDimensions(): { id: string; name: string; dataType: string }[] {
    const usedIds = new Set([
      ...this.rowDimensionIds,
      ...this.columnDimensionIds,
    ]);
    
    return this.dimensions
      .filter(dim => !usedIds.has(dim.id))
      .map(dim => ({
        id: dim.id,
        name: dim.name,
        dataType: dim.dataType,
      }));
  }

  // ==========================================================================
  // ACTIONS
  // ==========================================================================

  /**
   * Initialize the store with current state
   */
  initialize(): void {
    const activeView = this.activeView;
    if (activeView) {
      runInAction(() => {
        this.state = {
          ...this.state,
          viewName: activeView.name,
          selectedDimensions: {
            rows: activeView.rowDimensions || [],
            columns: activeView.columnDimensions || [],
            values: activeView.measures.map(m => m.id) || [],
          },
          activeViewId: activeView.id,
        };
      });
    }
  }

  /**
   * Set the active view
   */
  setActiveView(viewId: string | null, viewName: string = ''): void {
    runInAction(() => {
      this.state = {
        ...this.state,
        activeViewId: viewId,
        viewName,
      };
    });
  }

  /**
   * Update view name
   */
  setViewName(name: string): void {
    runInAction(() => {
      this.state.viewName = name;
    });
  }

  /**
   * Add a dimension to a category
   */
  addDimension(dimensionId: string, category: DimensionCategory): void {
    runInAction(() => {
      if (!this.state.selectedDimensions[category].includes(dimensionId)) {
        this.state.selectedDimensions = {
          ...this.state.selectedDimensions,
          [category]: [...this.state.selectedDimensions[category], dimensionId],
        };
      }
    });
  }

  /**
   * Remove a dimension from a category
   */
  removeDimension(dimensionId: string, category: DimensionCategory): void {
    runInAction(() => {
      this.state.selectedDimensions = {
        ...this.state.selectedDimensions,
        [category]: this.state.selectedDimensions[category].filter(id => id !== dimensionId),
      };
    });
  }

  /**
   * Update aggregation function for a measure
   */
  updateMeasureAggregation(measureId: string, aggregation: AggregationType): void {
    runInAction(() => {
      const activeView = this.activeView;
      if (activeView) {
        const updatedView = this.viewGridService.updateMeasureAggregation(
          activeView,
          measureId,
          aggregation
        );
        this.mainStore.updateView(activeView.id, updatedView);
      }
    });
  }

  /**
   * Update filter for a dimension
   */
  updateFilter(dimensionId: string, selectedNodeIds: string[]): void {
    runInAction(() => {
      const activeView = this.activeView;
      if (activeView) {
        const updatedView = this.viewGridService.updateFilterDimension(
          activeView,
          dimensionId,
          selectedNodeIds
        );
        this.mainStore.updateView(activeView.id, updatedView);
      }
    });
  }

  /**
   * Save the current configuration as a view
   */
  saveView(): string | null {
    const activeView = this.activeView;
    if (!activeView || !this.state.viewName.trim()) return null;

    runInAction(() => {
      const updatedView = this.viewGridService.updateViewName(
        activeView,
        this.state.viewName.trim()
      );
      this.mainStore.updateView(activeView.id, updatedView);
      this.state.viewName = '';
    });

    return activeView.id;
  }

  /**
   * Reset all selections
   */
  reset(): void {
    runInAction(() => {
      this.state = {
        ...this.state,
        viewName: '',
        selectedDimensions: { rows: [], columns: [], values: [] },
      };
    });
  }

  // ==========================================================================
  // MODAL ACTIONS
  // ==========================================================================

  /**
   * Open a modal
   */
  openModal(modalType: 'rows' | 'columns' | 'values' | 'aggregation'): void {
    runInAction(() => {
      this.state = {
        ...this.state,
        isModalOpen: true,
        modalType,
      };
    });
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    runInAction(() => {
      this.state = {
        ...this.state,
        isModalOpen: false,
        modalType: null,
        selectedDimensionForAggregation: null,
        aggregationModalMeasureId: null,
      };
    });
  }

  /**
   * Set measure ID for aggregation modal
   */
  setAggregationModalMeasureId(measureId: string | null): void {
    runInAction(() => {
      this.state.aggregationModalMeasureId = measureId;
    });
  }

  /**
   * Set dimension for aggregation modal
   */
  setSelectedDimensionForAggregation(dimensionId: string | null): void {
    runInAction(() => {
      this.state.selectedDimensionForAggregation = dimensionId;
    });
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Check if a dimension is used in any category
   */
  isDimensionUsed(dimensionId: string): boolean {
    return (
      this.rowDimensionIds.includes(dimensionId) ||
      this.columnDimensionIds.includes(dimensionId)
    );
  }

  /**
   * Get nodes by dimension ID
   */
  getNodesByDimension(dimensionId: string): Node[] {
    return this.mainStore.getNodesByDimension(dimensionId);
  }

  /**
   * Get filter options for a dimension
   */
  getFilterOptions(dimensionId: string): { value: string; label: string }[] {
    const nodes = this.getNodesByDimension(dimensionId);
    return nodes.map(node => ({
      value: node.id,
      label: node.metaData?.label ? String(node.metaData.label) : String(node.value),
    }));
  }

  /**
   * Get current filter values for a dimension
   */
  getCurrentFilterValues(dimensionId: string): string[] {
    const filter = this.filterDimensions.find(f => f.dimensionId === dimensionId);
    return filter ? filter.selectedNodes : [];
  }

  /**
   * Get available numeric columns for measures
   */
  getNumericColumns(): { dataSourceId: string; columnIndex: number; name: string }[] {
    return this.viewGridService.getNumericColumns(this.dataSources);
  }

  /**
   * Build a measure from a numeric column
   */
  buildMeasureFromColumn(
    columnName: string,
    dataSourceId: string,
    columnIndex: number,
    aggregation: AggregationType = 'sum'
  ): Measure {
    return this.viewGridService.buildMeasureFromColumn(
      columnName,
      dataSourceId,
      columnIndex,
      aggregation
    );
  }
}
