/**
 * Store - Controller in MVC Pattern
 * 
 * MobX Store that acts as the Controller, managing state (Model) and actions.
 * This is the central state management for the Pivot Table Explorer application.
 * 
 * In MVC:
 * - Model: The state properties (sourceFiles, dimensions, views, etc.)
 * - Controller: The action methods that modify the state
 * - View: React components that observe and render the state
 */

import { makeAutoObservable } from 'mobx';
import type { AggregationFunction } from '../models/types';

// ============================================================================
// MODEL INTERFACES (State types)
// ============================================================================

/**
 * Interface for a source file
 */
export interface SourceFile {
  id: string;
  name: string;
  columns: string[];
}

/**
 * Interface for a dimension
 */
export interface Dimension {
  id: string;
  name: string;
  sourceFileId: string;
  columnName: string;
}

/**
 * Interface for filter configuration
 */
export interface FilterConfig {
  dimensionId: string;
  selectedValues: string[];
}

/**
 * Interface for a view (saved configuration)
 */
export interface View {
  id: string;
  name: string;
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
  aggregation: AggregationFunction;
  filters: FilterConfig[];
}

// ============================================================================
// STORE CLASS (Controller + Model)
// ============================================================================

export class Store {
  // MODEL: State properties
  
  // Selected fields for rows (Y-axis)
  rowFields: string[] = [];
  
  // Selected fields for columns (X-axis)
  columnFields: string[] = [];
  
  // Selected fields for values to aggregate
  valueFields: string[] = [];
  
  // Selected aggregation function
  aggregation: AggregationFunction = 'sum';
  
  // All available fields from the data (auto-detected)
  availableFields: string[] = [];
  
  // The current data being displayed
  data: any[] = [];
  
  // Source files
  sourceFiles: SourceFile[] = [];
  
  // Dimensions
  dimensions: Dimension[] = [];
  
  // Filters
  filters: FilterConfig[] = [];
  
  // Saved views
  views: View[] = [];

  constructor() {
    // Make all properties observable and actions computable
    makeAutoObservable(this);
  }

  // ==========================================================================
  // DATA ACTIONS (Controller methods)
  // ==========================================================================

  /**
   * Set the data to be pivoted
   */
  setData(data: any[]) {
    this.data = data;
    // Auto-detect available fields from the first item
    if (data.length > 0) {
      this.availableFields = Object.keys(data[0]);
    } else {
      this.availableFields = [];
    }
  }

  /**
   * Set row fields (Y-axis dimensions)
   */
  setRowFields(fields: string[]) {
    this.rowFields = fields;
  }

  /**
   * Add a row field
   */
  addRowField(field: string) {
    if (!this.rowFields.includes(field) && 
        !this.columnFields.includes(field) && 
        !this.valueFields.includes(field)) {
      this.rowFields = [...this.rowFields, field];
    }
  }

  /**
   * Remove a row field
   */
  removeRowField(field: string) {
    this.rowFields = this.rowFields.filter(f => f !== field);
  }

  /**
   * Set column fields (X-axis dimensions)
   */
  setColumnFields(fields: string[]) {
    this.columnFields = fields;
  }

  /**
   * Add a column field
   */
  addColumnField(field: string) {
    if (!this.columnFields.includes(field) && 
        !this.rowFields.includes(field) && 
        !this.valueFields.includes(field)) {
      this.columnFields = [...this.columnFields, field];
    }
  }

  /**
   * Remove a column field
   */
  removeColumnField(field: string) {
    this.columnFields = this.columnFields.filter(f => f !== field);
  }

  /**
   * Set value fields
   */
  setValueFields(fields: string[]) {
    this.valueFields = fields;
  }

  /**
   * Add a value field
   */
  addValueField(field: string) {
    if (!this.valueFields.includes(field) && 
        !this.rowFields.includes(field) && 
        !this.columnFields.includes(field)) {
      this.valueFields = [...this.valueFields, field];
    }
  }

  /**
   * Remove a value field
   */
  removeValueField(field: string) {
    this.valueFields = this.valueFields.filter(f => f !== field);
  }

  /**
   * Set aggregation function
   */
  setAggregation(aggregation: AggregationFunction) {
    this.aggregation = aggregation;
  }

  /**
   * Toggle a field between categories or remove it
   */
  toggleField(field: string, category: 'row' | 'column' | 'value') {
    // Remove from all categories first
    this.rowFields = this.rowFields.filter(f => f !== field);
    this.columnFields = this.columnFields.filter(f => f !== field);
    this.valueFields = this.valueFields.filter(f => f !== field);
    
    // Add to the selected category if not already there
    if (category === 'row' && !this.rowFields.includes(field)) {
      this.rowFields = [...this.rowFields, field];
    } else if (category === 'column' && !this.columnFields.includes(field)) {
      this.columnFields = [...this.columnFields, field];
    } else if (category === 'value' && !this.valueFields.includes(field)) {
      this.valueFields = [...this.valueFields, field];
    }
  }

  /**
   * Reset all selections to initial state
   */
  resetAll() {
    this.rowFields = [];
    this.columnFields = [];
    this.valueFields = [];
    this.aggregation = 'sum';
    this.availableFields = [];
    this.data = [];
    this.filters = [];
  }

  /**
   * Load a preset configuration
   */
  loadPreset(config: {
    rowFields: string[];
    columnFields: string[];
    valueFields: string[];
    aggregation: AggregationFunction;
  }) {
    this.rowFields = config.rowFields;
    this.columnFields = config.columnFields;
    this.valueFields = config.valueFields;
    this.aggregation = config.aggregation;
  }

  /**
   * Clear all state
   */
  clear() {
    this.resetAll();
    this.sourceFiles = [];
    this.dimensions = [];
    this.views = [];
  }

  // ==========================================================================
  // SOURCE FILE ACTIONS (Controller methods)
  // ==========================================================================

  /**
   * Add a source file
   */
  addSourceFile(sourceFile: SourceFile) {
    this.sourceFiles = [...this.sourceFiles, sourceFile];
  }

  /**
   * Remove a source file
   */
  removeSourceFile(id: string) {
    this.sourceFiles = this.sourceFiles.filter(file => file.id !== id);
    // Also remove dimensions associated with this source file
    this.dimensions = this.dimensions.filter(dim => dim.sourceFileId !== id);
  }

  // ==========================================================================
  // DIMENSION ACTIONS (Controller methods)
  // ==========================================================================

  /**
   * Add a dimension
   */
  addDimension(dimension: Dimension) {
    this.dimensions = [...this.dimensions, dimension];
  }

  /**
   * Remove a dimension
   */
  removeDimension(id: string) {
    this.dimensions = this.dimensions.filter(dim => dim.id !== id);
  }

  /**
   * Update a dimension
   */
  updateDimension(dimension: Dimension) {
    const index = this.dimensions.findIndex(dim => dim.id === dimension.id);
    if (index !== -1) {
      this.dimensions[index] = dimension;
    }
  }

  // ==========================================================================
  // FILTER ACTIONS (Controller methods)
  // ==========================================================================

  /**
   * Set filters
   */
  setFilters(filters: FilterConfig[]) {
    this.filters = filters;
  }

  /**
   * Add or update a filter
   */
  setFilter(filter: FilterConfig) {
    const index = this.filters.findIndex(f => f.dimensionId === filter.dimensionId);
    if (index !== -1) {
      this.filters[index] = filter;
    } else {
      this.filters = [...this.filters, filter];
    }
  }

  // ==========================================================================
  // VIEW ACTIONS (Controller methods)
  // ==========================================================================

  /**
   * Add a view
   */
  addView(viewData: Omit<View, 'id'>) {
    const view: View = {
      ...viewData,
      id: Date.now().toString(),
    };
    this.views = [...this.views, view];
  }

  /**
   * Remove a view
   */
  removeView(id: string) {
    this.views = this.views.filter(view => view.id !== id);
  }

  /**
   * Load a view
   */
  loadView(id: string) {
    const view = this.views.find(v => v.id === id);
    if (view) {
      this.rowFields = view.rowFields;
      this.columnFields = view.columnFields;
      this.valueFields = view.valueFields;
      this.aggregation = view.aggregation;
      this.filters = view.filters;
    }
  }

  // ==========================================================================
  // COMPUTED PROPERTIES / SELECTORS (Derived state)
  // ==========================================================================

  /**
   * Get the current pivot state as a single object
   */
  get pivotState() {
    return {
      rowFields: this.rowFields,
      columnFields: this.columnFields,
      valueFields: this.valueFields,
      aggregation: this.aggregation,
      availableFields: this.availableFields,
      data: this.data,
      sourceFiles: this.sourceFiles,
      dimensions: this.dimensions,
      filters: this.filters,
      views: this.views,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton store instance to be used throughout the application
 * This is the Controller in the MVC pattern
 */
export const store = new Store();

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Interfaces are already exported above, just export the imported type
export type { AggregationFunction };
