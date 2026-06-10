/**
 * Migration utilities from old model to PivotProject
 * 
 * Provides migration path from the existing Store model to the new PivotProject model.
 */

import type {
  PivotProject,
  LocalDataSource,
  Dimension,
  Node,
  View as NewView,
  DataColumn,
} from './types';

// Import old types for migration
// These types match the old Store model
interface OldSourceFile {
  id: string;
  name: string;
  columns: string[];
}

interface OldDimension {
  id: string;
  name: string;
  sourceFileId: string;
  columnName: string;
}

interface OldFilterConfig {
  dimensionId: string;
  selectedValues: string[];
}

interface OldView {
  id: string;
  name: string;
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
  aggregation: string;
  filters: OldFilterConfig[];
}

interface OldStoreState {
  sourceFiles: OldSourceFile[];
  dimensions: OldDimension[];
  views: OldView[];
  data: any[];
  availableFields: string[];
}

/**
 * Convert old SourceFile to LocalDataSource
 */
function convertSourceFileToDataSource(oldSourceFile: OldSourceFile, data?: any[]): LocalDataSource {
  // Generate default columns
  const columns: DataColumn[] = oldSourceFile.columns?.map((name: string, index: number) => ({
    index,
    name,
    dataType: 'unknown' as const,
    nullable: true,
    unique: false,
  })) || [];
  
  // Detect data types from data if available
  if (data && data.length > 0) {
    const firstRow = data[0];
    columns.forEach((col, idx) => {
      const value = firstRow[idx];
      if (value !== undefined && value !== null) {
        const detectedType = detectType(value);
        col.dataType = detectedType;
        col.nullable = false;
        // Check uniqueness in all data
        const values = data.map(row => row[idx]);
        col.unique = new Set(values).size === values.length;
      }
    });
  }
  
  return {
    id: oldSourceFile.id || `ds-${Date.now()}`,
    name: oldSourceFile.name || 'Untitled',
    type: 'local',
    originalFormat: 'csv' as const,
    loadedAt: new Date().toISOString(),
    columns,
    data: data || [],
  };
}

/**
 * Detect the type of a value
 */
function detectType(value: any): 'string' | 'number' | 'date' | 'boolean' | 'unknown' {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  
  if (typeof value === 'number') {
    return 'number';
  }
  
  if (typeof value === 'string') {
    // Check if it's a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
    // Check if it's a number
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return 'number';
    }
    return 'string';
  }
  
  if (value instanceof Date) {
    return 'date';
  }
  
  return 'unknown';
}

/**
 * Convert old Dimension to new Dimension
 */
function convertOldDimensionToDimension(oldDim: OldDimension, dataSourceId: string): Dimension {
  return {
    id: oldDim.id || `dim-${Date.now()}`,
    name: oldDim.name || 'Untitled',
    description: undefined,
    dataType: 'string' as const, // Default, should be detected from data
    columnMappings: [
      {
        dataSourceId,
        columnIndex: 0, // Will need to be mapped correctly
        level: 0,
        name: oldDim.columnName,
      },
    ],
    rootNodes: [], // Will be populated after Node creation
    nodeSchema: undefined,
  };
}

/**
 * Convert old View to new View
 */
function convertOldViewToView(oldView: OldView): NewView {
  const measures = oldView.valueFields?.map((field: string, index: number) => ({
    id: `measure-${index}`,
    name: field,
    source: { type: 'column' as const, dataSourceId: '', columnIndex: 0 },
    aggregation: (oldView.aggregation || 'sum') as any,
    format: undefined,
    visible: true,
  })) || [];
  
  return {
    id: oldView.id || `view-${Date.now()}`,
    name: oldView.name || 'Untitled',
    description: undefined,
    rowDimensions: oldView.rowFields || [],
    columnDimensions: oldView.columnFields || [],
    filterDimensions: oldView.filters?.map((f: any) => ({
      dimensionId: f.dimensionId,
      selectedNodes: f.selectedValues,
      operator: 'include' as const,
    })),
    measures,
    showTotals: true,
    showGrandTotal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Migrate from old store state to PivotProject
 */
export function migrateFromOldStore(oldStore: OldStoreState): PivotProject {
  const project: PivotProject = {
    id: `project-migrated-${Date.now()}`,
    name: 'Migrated Project',
    description: 'Project migrated from old format',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSources: [],
    dimensions: [],
    nodes: {},
    views: [],
  };
  
  // Migrate sourceFiles
  project.dataSources = oldStore.sourceFiles.map(sf =>
    convertSourceFileToDataSource(sf, oldStore.data)
  );
  
  // Migrate dimensions
  const dataSourceId = project.dataSources[0]?.id || '';
  project.dimensions = oldStore.dimensions.map(oldDim =>
    convertOldDimensionToDimension(oldDim, dataSourceId)
  );
  
  // Create basic Nodes for each dimension
  // This is a minimal migration - Nodes should be populated from actual data
  project.dimensions.forEach(dim => {
    // Create a root node by default
    const nodeId = `node-${dim.id}-root`;
    project.nodes[nodeId] = {
      id: nodeId,
      dimensionId: dim.id,
      code: dim.name.toUpperCase().replace(/\s+/g, '_'),
      value: dim.name,
      metaData: {},
      children: [],
      sourceIds: [dataSourceId],
    };
    dim.rootNodes.push(nodeId);
  });
  
  // Migrate views
  project.views = oldStore.views.map(convertOldViewToView);
  
  return project;
}

/**
 * Create a new empty PivotProject
 */
export function createEmptyPivotProject(name?: string): PivotProject {
  return {
    id: `project-${Date.now()}`,
    name: name || 'Untitled Project',
    description: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSources: [],
    dimensions: [],
    nodes: {},
    views: [],
  };
}
