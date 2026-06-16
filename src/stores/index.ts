/**
 * Stores Index
 * 
 * Re-exports the Store class, ViewStore, and types.
 * Use Store.getInstance() to access the singleton instance.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { Store } from './stores';
 *   import { Store, ViewStore, PivotProject, DataSource, Dimension, View } from './stores';
 */

export { Store } from './Store';
export { ViewStore } from './ViewStore';
export type { PivotData, PivotRow, PivotColumn, PivotCell } from './ViewStore';
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
  PivotFilterDimension,
  AggregationType,
  DataColumn,
  ValidationError,
} from './Store';

