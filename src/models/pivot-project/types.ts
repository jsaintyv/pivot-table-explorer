/**
 * PivotProject Model Types
 * 
 * This file contains all TypeScript interfaces and types for the PivotProject model.
 * See /docs/models/ for detailed documentation.
 */

// ============================================================================
// PIVOT PROJECT CORE TYPES
// ============================================================================

/**
 * Main project container
 */
export interface PivotProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  dataSources: DataSource[];
  dimensions: Dimension[];
  nodes: Record<string, Node>; // Node ID -> Node
  views: View[];
}

// ============================================================================
// DATA SOURCE TYPES
// ============================================================================

/**
 * Base type for all data sources
 */
export type DataSource = LocalDataSource | LazyDataSource;

/**
 * Common fields for all data sources
 */
export interface BaseDataSource {
  id: string;
  name: string;
  type: 'local' | 'lazy';
}

/**
 * Data that has been loaded from CSV or Excel and is embedded in the project
 */
export interface LocalDataSource extends BaseDataSource {
  type: 'local';
  originalFormat: 'csv' | 'excel';
  loadedAt: string; // ISO 8601
  columns: DataColumn[];
  data: any[][]; // Row-major: array of rows, each row is array of values
}

/**
 * Data accessible via JSON-API (fetched on demand)
 */
export interface LazyDataSource extends BaseDataSource {
  type: 'lazy';
  apiUrl: string;
  endpoint?: string;
  parameters?: Record<string, any>;
  dataSchema?: any;
  columns: DataColumn[];
}

/**
 * Metadata about a column in a data source
 */
export interface DataColumn {
  index: number;
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  nullable: boolean;
  unique: boolean;
}

// ============================================================================
// DIMENSION TYPES
// ============================================================================

/**
 * Logical grouping of related values (Nodes)
 */
export interface Dimension {
  id: string;
  name: string;
  description?: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  hierarchyMode?: 'parent' | 'generation'; // Optional for backward compatibility
  columnMappings: ColumnMapping[];
  propertyMappings?: PropertyMapping[]; // Optional for backward compatibility
  rootNodes: string[]; // IDs of root nodes in this dimension's hierarchy
  nodeSchema?: NodeSchema;
  nodes: Node[]; // All nodes in this dimension
}


/**
 * Maps a dimension to columns in data sources
 */
export interface ColumnMapping {
  id: string,
  dataSourceId: string;
  columnIndex: number;
  level: number; // 0 = root, 1 = child, etc. (for backward compatibility)  
  name?: string; // Optional custom name for this level
  mappingType?: ParentMappingType | GenerationMappingType; // Optional for backward compatibility
}

/**
 * Property mapping for dimension metadata
 */
export interface PropertyMapping {
  id: string;
  dataSourceId: string;
  columnIndex: number;
  propertyName: string;
  propertyType: 'string' | 'number' | 'boolean' | 'color' | 'date';
}

// Mapping types for parent mode
export type ParentMappingType = 'code' | 'parentCode' | 'label' | 'property';

// Mapping types for generation mode
export type GenerationMappingType = 'root' | 'gen1' | 'gen2' | 'gen3' | 'label' | 'property';

// Union type for all mapping types
export type MappingType = ParentMappingType | GenerationMappingType;

/**
 * Schema for Node metadata in a dimension
 */
export interface NodeSchema {
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'date';
  required: boolean;
  defaultValue?: any;
}

// ============================================================================
// NODE TYPES
// ============================================================================

/**
 * A specific value within a dimension
 */
export interface Node {
  id: string; // Global unique identifier
  dimensionId: string; // ID of the dimension this node belongs to
  code: string; // Unique code within the dimension
  value: string | number | Date | boolean; // The actual value
  metaData: MetaData; // Typed metadata
  children: string[]; // IDs of child nodes
  sourceIds: string[]; // IDs of DataSources this node originates from
}

/**
 * Typed metadata for a node
 * Keys are field names from the dimension's NodeSchema
 */
export type MetaData = Record<string, string | number | boolean | Date | null>;

// ============================================================================
// VIEW TYPES
// ============================================================================

/**
 * A pivot table configuration (cross-tabulation)
 */
export interface View {
  id: string;
  name: string;
  description?: string;
  
  // Axes
  rowDimensions: string[]; // Dimension IDs for row axis
  columnDimensions: string[]; // Dimension IDs for column axis
  filterDimensions?: FilterDimension[];
  
  // Data
  measures: Measure[];
  
  // Display
  showTotals: boolean;
  showGrandTotal: boolean;
  sortOrder?: SortConfig[];
  formatOptions?: FormatOptions;
  
  // State
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Filter configuration for a dimension
 */
export interface FilterDimension {
  dimensionId: string;
  selectedNodes: string[]; // Array of Node IDs to include/exclude
  operator: 'include' | 'exclude';
}

/**
 * A metric to display in the pivot table
 */
export interface Measure {
  id: string;
  name: string;
  source: MeasureSource;
  aggregation: AggregationType;
  format?: string; // Format string (e.g., "€#,##0.00", "0.00%")
  visible: boolean;
}

/**
 * Where the measure data comes from
 */
export type MeasureSource = {
   type: 'column' | 'calculated';
   dataSourceId: string; 
   columnIndex: number ;
   expression?: string;
}

/**
 * How to aggregate values
 */
export type AggregationType = 
  | 'sum'
  | 'average'
  | 'count'
  | 'min'
  | 'max'
  | 'first'
  | 'last';

/**
 * Sorting configuration
 */
export interface SortConfig {
  dimensionId: string;
  direction: 'asc' | 'desc';
  mode: 'byValue' | 'byCode' | 'byName' | 'custom';
  measureId?: string; // For sorting by measure value
}

/**
 * Number/date formatting options
 */
export interface FormatOptions {
  numberFormat?: string;
  dateFormat?: string;
  showZeros?: boolean;
  showNulls?: boolean;
  decimalSeparator?: string;
  thousandSeparator?: string;
}

// ============================================================================
// SERIALIZATION TYPES
// ============================================================================

/**
 * Root wrapper for serialized PivotProject
 */
export interface SerializedPivotProject {
  version: string; // Schema version (e.g., "1.0")
  pivotProject: PivotProject;
}

/**
 * Validation error for deserialization
 */
export interface ValidationError {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Result of deserialization
 */
export interface DeserializationResult {
  project?: PivotProject;
  errors: ValidationError[];
}
