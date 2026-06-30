/**
 * Dimension Editor Types
 * 
 * Type definitions specific to the Dimension Editor screen
 */

import type { 
  Dimension, 
  DataSource,
  ParentMappingType, 
  GenerationMappingType, 
  MappingType 
} from '../../models/pivot-project/types';

// ============================================================================
// EDITOR STATE TYPES
// ============================================================================

/**
 * Form state for the dimension editor
 */
export interface DimensionEditorState {
  dimension: Partial<Dimension>;
  dataSources: DataSource[];
  isLoading: boolean;
  errors: EditorError[];
  isDirty: boolean;
}

/**
 * Error type for form validation
 */
export interface EditorError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// DATA SOURCE OPTIONS
// ============================================================================

/**
 * Option type for data source selector
 */
export interface DataSourceOption {
  id: string;
  name: string;
  columns: DataColumnOption[];
}

/**
 * Option type for column selector
 */
export interface DataColumnOption {
  index: number;
  name: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
}

// ============================================================================
// MAPPING ITEM TYPES
// ============================================================================

/**
 * Extended column mapping for editor form
 */
export interface EditorColumnMapping {
  id: string;
  dataSourceId: string;
  columnIndex: number;
  columnName: string;
  mappingType: MappingType;
}

/**
 * Extended property mapping for editor form
 */
export interface EditorPropertyMapping {
  id: string;
  dataSourceId: string;
  columnIndex: number;
  columnName: string;
  propertyName: string;
}

// ============================================================================
// FORM PROPS TYPES
// ============================================================================

/**
 * Props for dimension identity form
 */
export interface DimensionIdentityFormProps {
  name: string;
  description: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  hierarchyMode: 'parent' | 'generation';
  errors: EditorError[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onDataTypeChange: (dataType: 'string' | 'number' | 'date' | 'boolean') => void;
  onHierarchyModeChange: (mode: 'parent' | 'generation') => void;
}

/**
 * Props for column mapping item
 */
export interface ColumnMappingItemProps {
  mapping: EditorColumnMapping;
  dataSources: DataSourceOption[];
  hierarchyMode: 'parent' | 'generation';
  onDataSourceChange: (dataSourceId: string) => void;
  onColumnChange: (columnIndex: number, columnName: string) => void;
  onMappingTypeChange: (mappingType: MappingType) => void;
  onRemove: () => void;
}

/**
 * Props for property mapping item
 */
export interface PropertyMappingItemProps {
  mapping: EditorPropertyMapping;
  dataSources: DataSourceOption[];
  onDataSourceChange: (dataSourceId: string) => void;
  onColumnChange: (columnIndex: number, columnName: string) => void;
  onPropertyNameChange: (propertyName: string) => void;
  onRemove: () => void;
}

/**
 * Props for hierarchy preview
 */
export interface HierarchyPreviewProps {
  hierarchyMode: 'parent' | 'generation';
  columnMappings: EditorColumnMapping[];
}

// ============================================================================
// HIERARCHY PREVIEW TYPES
// ============================================================================

/**
 * Node in the hierarchy preview tree
 */
export interface HierarchyPreviewNode {
  id: string;
  name: string;
  level: number;
  mappingType: string;
  children: HierarchyPreviewNode[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Get mapping type options based on hierarchy mode
 */
export type HierarchyModeMappingTypes = {
  parent: ParentMappingType[];
  generation: GenerationMappingType[];
};

/**
 * Available mapping types by mode
 */
export const MAPPING_TYPES_BY_MODE: HierarchyModeMappingTypes = {
  parent: ['code', 'parentCode', 'label', 'property'],
  generation: ['root', 'gen1', 'gen2', 'gen3', 'label', 'property']
};

/**
 * Display labels for mapping types
 */
export const MAPPING_TYPE_LABELS: Record<MappingType, string> = {
  code: 'Code',
  // Parent mode types
  parentCode: 'Parent Code',
  
  // Generation mode types
  root: 'Racine',
  gen1: 'Génération 1',
  gen2: 'Génération 2',
  gen3: 'Génération 3',
  
  // Common types
  label: 'Label',
  property: 'Property'
};
