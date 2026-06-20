/**
 * Stores Index
 * 
 * Re-exports the Store class, ViewStore, ToastStore, and types.
 * Use Store.getInstance() to access the singleton instance.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { Store } from './stores';
 *   import { Store, ViewStore, ToastStore, PivotProject, DataSource, Dimension, View } from './stores';
 */

export { Store } from './Store';
export { ViewStore } from './ViewStore';
export { ToastStore } from './ToastStore';
export type { PivotData, PivotCell, RowData, Tuple, PivotAxe, PivotCellMap } from './ViewStore';
export type { ToastMessage } from './ToastStore';
export type {
  PivotProject,
  DataSource,
  LocalDataSource,
  LazyDataSource,
  Dimension,
  ColumnMapping,
  Node,
  MetaData,
  NodeSchema,
  View,
  Measure,
  AggregationType,
  DataColumn,
  ValidationError,
  FilterDimension,
} from './Store';

