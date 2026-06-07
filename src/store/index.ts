/**
 * Store Index
 * 
 * Re-exports everything from the store directory.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { store, useAppSelector, useAppDispatch } from './store';
 *   import { setData, loadPreset, resetAll } from './store';
 */

// Export store configuration
import { store } from './store';
import type { RootState, AppDispatch } from './store';

// Export hooks
import { useAppSelector, useAppDispatch } from './hooks';

export { store, useAppSelector, useAppDispatch };
export type { RootState, AppDispatch };

// Export slice actions and selectors
import {
  setData,
  setRowFields,
  setColumnFields,
  setValueFields,
  setAggregation,
  addRowField,
  addColumnField,
  addValueField,
  removeRowField,
  removeColumnField,
  removeValueField,
  toggleField,
  loadPreset,
  resetAll,
  clear,
  selectPivotState,
  selectRowFields,
  selectColumnFields,
  selectValueFields,
  selectAggregation,
  selectAvailableFields,
  selectData,
  initialState,
} from './pivotSlice';
import type { PivotState } from './pivotSlice';

export {
  setData,
  setRowFields,
  setColumnFields,
  setValueFields,
  setAggregation,
  addRowField,
  addColumnField,
  addValueField,
  removeRowField,
  removeColumnField,
  removeValueField,
  toggleField,
  loadPreset,
  resetAll,
  clear,
  selectPivotState,
  selectRowFields,
  selectColumnFields,
  selectValueFields,
  selectAggregation,
  selectAvailableFields,
  selectData,
  initialState,
};

export type { PivotState };
