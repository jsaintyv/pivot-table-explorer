/**
 * Pivot Data Model Types
 * 
 * This file contains types for pivot data structures including hierarchies.
 * Used by ViewStore and PivotDataService.
 */

// ============================================================================
// PIVOT CELL TYPES
// ============================================================================

/**
 * Represents a cell in the pivot grid
 */
export interface PivotCell {
  value: any;
  formattedValue?: string;
  rowAxeKey: string;
  colAxeKey: string;
  isTotal?: boolean;
}

/**
 * Map structure: MeasureId -> RowKey -> ColKey -> PivotCell
 */
export type PivotCellMap = Map<string, Map<string, Map<string, PivotCell>>>;

// ============================================================================
// AXE TYPES
// ============================================================================

/**
 * Represents a single axis point (flat structure)
 */
export interface PivotAxe {  
  axeKey: string;
}

// ============================================================================
// HIERARCHY TYPES
// ============================================================================

/**
 * Represents a node in the axis hierarchy
 * A hierarchy node can have children, forming a tree structure
 * that represents the dimensional hierarchy (e.g., Year -> Month -> Day)
 */
export interface PivotAxeHierarchyNode {
  /** Unique key for this node (e.g., "2024;1;Recalled") */
  key: string;
  
  /** Display value for this node (e.g., "2024", "1", "Recalled") */
  value: string;
  
  /** Level in the hierarchy (0 = root, 1 = child, etc.) */
  level: number;
  
  /** ID of the dimension this node belongs to (e.g., "Year", "Month", "Recalled") */
  dimensionId: string;
  
  /** Whether this is a leaf node (has no children) */
  leaf: boolean;
  
  /** Child nodes (for non-leaf nodes) */
  children?: PivotAxeHierarchyNode[];
}

/**
 * Represents a complete hierarchy for an axis (rows or columns)
 * This is a tree structure where each node can have children
 */
export type PivotAxeHierarchy = PivotAxeHierarchyNode[];

// ============================================================================
// PIVOT DATA TYPE
// ============================================================================

/**
 * Complete pivot data structure with support for hierarchical axes
 */
export interface PivotData {
  /** Flat list of row axes (for backward compatibility) */
  rows: PivotAxe[];
  
  /** Flat list of column axes (for backward compatibility) */
  columns: PivotAxe[];
  
  /** List of measure IDs */
  measures: string[];
  
  /** Hierarchical structure for row axes (Year -> Month -> Measure) */
  rowHierarchy?: PivotAxeHierarchy;
  
  /** Hierarchical structure for column axes */
  columnHierarchy?: PivotAxeHierarchy;
  
  /** Map of cells: MeasureId -> RowKey -> ColKey -> PivotCell */
  pivotCellByColKeyByRowKeyByMeasureId: PivotCellMap;
}

/**
 * Empty pivot data constant
 */
export const EMPTY_PIVOTDATA: PivotData = {
  rows: [],
  columns: [],
  measures: [],
  pivotCellByColKeyByRowKeyByMeasureId: new Map()
};

// ============================================================================
// ROW DATA AND TUPLE TYPES
// ============================================================================

/**
 * Represents a tuple of dimension values for rows or columns
 * Example: ["Paris", "2024"] for a column with dimension City=Paris and Year=2024
 */
export type Tuple = string[];

/**
 * Represents raw data for building pivot
 */
export interface RowData {
  measureId: string;
  tupleColumns: Tuple;
  tupleRows: Tuple;
  value: number;
}
