/**
 * Store Index
 * 
 * Re-exports everything from the MobX store.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { store } from './store';
 *   import { Store, PivotProject, DataSource, Dimension, View } from './store';
 */

export { Store, store } from './Store';
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

