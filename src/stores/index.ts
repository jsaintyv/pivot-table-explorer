/**
 * Stores Index
 * 
 * Re-exports the Store classes and types.
 * Use Store.getInstance() or ViewGridStore.getInstance() to access singleton instances.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { Store } from './stores';
 *   import { ViewGridStore } from './stores';
 *   import { Store, PivotProject, DataSource, Dimension, View } from './stores';
 */

export { Store } from './Store';
export { ViewGridStore } from './ViewGridStore';
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

