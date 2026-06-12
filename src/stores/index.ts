/**
 * Stores Index
 * 
 * Re-exports the Store class and types.
 * Use Store.getInstance() to access the singleton instance.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { Store } from './stores';
 *   import { Store, PivotProject, DataSource, Dimension, View } from './stores';
 */

export { Store } from './Store';
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

