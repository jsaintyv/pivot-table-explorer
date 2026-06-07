/**
 * Pivot Table Slice
 * 
 * Redux slice for managing PivotGrid component state.
 * This slice handles configuration, field selections, and aggregation settings.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AggregationFunction } from '../models/types';

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

/**
 * Interface for the pivot table state
 */
export interface PivotState {
  // Selected fields for rows (Y-axis)
  rowFields: string[];
  
  // Selected fields for columns (X-axis)
  columnFields: string[];
  
  // Selected fields for values to aggregate
  valueFields: string[];
  
  // Selected aggregation function
  aggregation: AggregationFunction;
  
  // All available fields from the data (auto-detected)
  availableFields: string[];
  
  // The current data being displayed
  data: any[];
  
  // Source files
  sourceFiles: SourceFile[];
  
  // Dimensions
  dimensions: Dimension[];
  
  // Filters
  filters: FilterConfig[];
  
  // Saved views
  views: View[];
}

/**
 * Initial state for the pivot table
 */
const initialState: PivotState = {
  rowFields: [],
  columnFields: [],
  valueFields: [],
  aggregation: 'sum',
  availableFields: [],
  data: [],
  sourceFiles: [],
  dimensions: [],
  filters: [],
  views: [],
};

/**
 * Create the pivot slice with reducers
 */
export const pivotSlice = createSlice({
  name: 'pivot',
  initialState,
  reducers: {
    /**
     * Set the data to be pivoted
     */
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
      // Auto-detect available fields from the first item
      if (action.payload.length > 0) {
        state.availableFields = Object.keys(action.payload[0]);
      } else {
        state.availableFields = [];
      }
    },

    /**
     * Set row fields (Y-axis dimensions)
     */
    setRowFields: (state, action: PayloadAction<string[]>) => {
      state.rowFields = action.payload;
    },

    /**
     * Add a row field
     */
    addRowField: (state, action: PayloadAction<string>) => {
      const field = action.payload;
      if (!state.rowFields.includes(field) && 
          !state.columnFields.includes(field) && 
          !state.valueFields.includes(field)) {
        state.rowFields = [...state.rowFields, field];
      }
    },

    /**
     * Remove a row field
     */
    removeRowField: (state, action: PayloadAction<string>) => {
      state.rowFields = state.rowFields.filter(field => field !== action.payload);
    },

    /**
     * Set column fields (X-axis dimensions)
     */
    setColumnFields: (state, action: PayloadAction<string[]>) => {
      state.columnFields = action.payload;
    },

    /**
     * Add a column field
     */
    addColumnField: (state, action: PayloadAction<string>) => {
      const field = action.payload;
      if (!state.columnFields.includes(field) && 
          !state.rowFields.includes(field) && 
          !state.valueFields.includes(field)) {
        state.columnFields = [...state.columnFields, field];
      }
    },

    /**
     * Remove a column field
     */
    removeColumnField: (state, action: PayloadAction<string>) => {
      state.columnFields = state.columnFields.filter(field => field !== action.payload);
    },

    /**
     * Set value fields
     */
    setValueFields: (state, action: PayloadAction<string[]>) => {
      state.valueFields = action.payload;
    },

    /**
     * Add a value field
     */
    addValueField: (state, action: PayloadAction<string>) => {
      const field = action.payload;
      if (!state.valueFields.includes(field) && 
          !state.rowFields.includes(field) && 
          !state.columnFields.includes(field)) {
        state.valueFields = [...state.valueFields, field];
      }
    },

    /**
     * Remove a value field
     */
    removeValueField: (state, action: PayloadAction<string>) => {
      state.valueFields = state.valueFields.filter(field => field !== action.payload);
    },

    /**
     * Set aggregation function
     */
    setAggregation: (state, action: PayloadAction<AggregationFunction>) => {
      state.aggregation = action.payload;
    },

    /**
     * Toggle a field between categories or remove it
     */
    toggleField: (state, action: PayloadAction<{ field: string; category: 'row' | 'column' | 'value' }>) => {
      const { field, category } = action.payload;
      
      // Remove from all categories first
      state.rowFields = state.rowFields.filter(f => f !== field);
      state.columnFields = state.columnFields.filter(f => f !== field);
      state.valueFields = state.valueFields.filter(f => f !== field);
      
      // Add to the selected category if not already there
      if (category === 'row' && !state.rowFields.includes(field)) {
        state.rowFields = [...state.rowFields, field];
      } else if (category === 'column' && !state.columnFields.includes(field)) {
        state.columnFields = [...state.columnFields, field];
      } else if (category === 'value' && !state.valueFields.includes(field)) {
        state.valueFields = [...state.valueFields, field];
      }
    },

    /**
     * Reset all selections to initial state
     */
    resetAll: () => {
      return initialState;
    },

    /**
     * Load a preset configuration
     */
    loadPreset: (state, action: PayloadAction<{
      rowFields: string[];
      columnFields: string[];
      valueFields: string[];
      aggregation: AggregationFunction;
    }>) => {
      state.rowFields = action.payload.rowFields;
      state.columnFields = action.payload.columnFields;
      state.valueFields = action.payload.valueFields;
      state.aggregation = action.payload.aggregation;
    },

    /**
     * Clear all state
     */
    clear: () => {
      return initialState;
    },

    // Source file management
    /**
     * Add a source file
     */
    addSourceFile: (state, action: PayloadAction<SourceFile>) => {
      state.sourceFiles = [...state.sourceFiles, action.payload];
    },

    /**
     * Remove a source file
     */
    removeSourceFile: (state, action: PayloadAction<string>) => {
      state.sourceFiles = state.sourceFiles.filter(file => file.id !== action.payload);
      // Also remove dimensions associated with this source file
      state.dimensions = state.dimensions.filter(dim => dim.sourceFileId !== action.payload);
    },

    // Dimension management
    /**
     * Add a dimension
     */
    addDimension: (state, action: PayloadAction<Dimension>) => {
      state.dimensions = [...state.dimensions, action.payload];
    },

    /**
     * Remove a dimension
     */
    removeDimension: (state, action: PayloadAction<string>) => {
      state.dimensions = state.dimensions.filter(dim => dim.id !== action.payload);
    },

    /**
     * Update a dimension
     */
    updateDimension: (state, action: PayloadAction<Dimension>) => {
      const index = state.dimensions.findIndex(dim => dim.id === action.payload.id);
      if (index !== -1) {
        state.dimensions[index] = action.payload;
      }
    },

    // Filter management
    /**
     * Set filters
     */
    setFilters: (state, action: PayloadAction<FilterConfig[]>) => {
      state.filters = action.payload;
    },

    /**
     * Add or update a filter
     */
    setFilter: (state, action: PayloadAction<FilterConfig>) => {
      const index = state.filters.findIndex(f => f.dimensionId === action.payload.dimensionId);
      if (index !== -1) {
        state.filters[index] = action.payload;
      } else {
        state.filters = [...state.filters, action.payload];
      }
    },

    // View management
    /**
     * Add a view
     */
    addView: (state, action: PayloadAction<Omit<View, 'id'>>) => {
      const view: View = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.views = [...state.views, view];
    },

    /**
     * Remove a view
     */
    removeView: (state, action: PayloadAction<string>) => {
      state.views = state.views.filter(view => view.id !== action.payload);
    },

    /**
     * Load a view
     */
    loadView: (state, action: PayloadAction<string>) => {
      const view = state.views.find(v => v.id === action.payload);
      if (view) {
        state.rowFields = view.rowFields;
        state.columnFields = view.columnFields;
        state.valueFields = view.valueFields;
        state.aggregation = view.aggregation;
        state.filters = view.filters;
      }
    },
  },
});

// Export actions
export const {
  setData,
  setRowFields,
  addRowField,
  removeRowField,
  setColumnFields,
  addColumnField,
  removeColumnField,
  setValueFields,
  addValueField,
  removeValueField,
  setAggregation,
  toggleField,
  resetAll,
  loadPreset,
  clear,
  // Source file actions
  addSourceFile,
  removeSourceFile,
  // Dimension actions
  addDimension,
  removeDimension,
  updateDimension,
  // Filter actions
  setFilters,
  setFilter,
  // View actions
  addView,
  removeView,
  loadView,
} = pivotSlice.actions;

// Export the reducer
export default pivotSlice.reducer;

// Export the initial state
export { initialState };

// Export types
export type { SourceFile, Dimension, FilterConfig, View };

// Selectors
export const selectPivotState = (state: { pivot: PivotState }) => state.pivot;
export const selectRowFields = (state: { pivot: PivotState }) => state.pivot.rowFields;
export const selectColumnFields = (state: { pivot: PivotState }) => state.pivot.columnFields;
export const selectValueFields = (state: { pivot: PivotState }) => state.pivot.valueFields;
export const selectAggregation = (state: { pivot: PivotState }) => state.pivot.aggregation;
export const selectAvailableFields = (state: { pivot: PivotState }) => state.pivot.availableFields;
export const selectData = (state: { pivot: PivotState }) => state.pivot.data;
export const selectSourceFiles = (state: { pivot: PivotState }) => state.pivot.sourceFiles;
export const selectDimensions = (state: { pivot: PivotState }) => state.pivot.dimensions;
export const selectFilters = (state: { pivot: PivotState }) => state.pivot.filters;
export const selectViews = (state: { pivot: PivotState }) => state.pivot.views;
