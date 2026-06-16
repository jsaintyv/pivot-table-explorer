/**
 * PivotProject Serialization/Deserialization
 * 
 * Handles JSON serialization and deserialization of PivotProject with validation.
 * See /docs/models/serialization.md for detailed documentation.
 */

import type {
  PivotProject,
  SerializedPivotProject,
  DeserializationResult,
  ValidationError,
} from './types';

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialize a PivotProject to JSON string
 */
export function serializePivotProject(project: PivotProject): string {
  const wrapper: SerializedPivotProject = {
    version: '1.0',
    pivotProject: {
      ...project,
      // Convert Dates to ISO strings
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      dataSources: project.dataSources.map(ds => {
        if (ds.type === 'local') {
          return {
            ...ds,
            loadedAt: ds.loadedAt,
          };
        }
        return { ...ds };
      }),
      nodes: Object.fromEntries(
        Object.entries(project.nodes).map(([id, node]) => [
          id,
          {
            ...node,
            // Convert value if Date
            value: node.value instanceof Date ? node.value.toISOString() : node.value,
            metaData: Object.fromEntries(
              Object.entries(node.metaData).map(([k, v]) => [
                k,
                v instanceof Date ? v.toISOString() : v,
              ])
            ),
          },
        ])
      ),
      views: project.views.map(view => ({
        ...view,
        createdAt: view.createdAt,
        updatedAt: view.updatedAt,
      })),
    },
  };
  
  return JSON.stringify(wrapper, null, 2);
}

// ============================================================================
// DESERIALIZATION
// ============================================================================

/**
 * Deserialize a JSON string to PivotProject with validation
 */
export function deserializePivotProject(jsonString: string): DeserializationResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    return {
      errors: [
        {
          code: 'INVALID_JSON',
          path: '',
          message: `Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        },
      ],
    };
  }
  
  // Check basic structure
  if (!parsed?.version) {
    return {
      errors: [
        {
          code: 'MISSING_VERSION',
          path: '',
          message: 'Missing version field in root object',
          severity: 'error',
        },
      ],
    };
  }
  
  if (!parsed.pivotProject) {
    return {
      errors: [
        {
          code: 'MISSING_PIVOT_PROJECT',
          path: '',
          message: 'Missing pivotProject field in root object',
          severity: 'error',
        },
      ],
    };
  }
  
  const projectData = parsed.pivotProject;
  const errors: ValidationError[] = [];
  
  // Convert and validate Dates
  const project: any = {
    ...projectData,
    createdAt: new Date(projectData.createdAt).toISOString(),
    updatedAt: new Date(projectData.updatedAt).toISOString(),
    dataSources: projectData.dataSources?.map((ds: any) => {
      if (ds.type === 'local') {
        return {
          ...ds,
          loadedAt: new Date(ds.loadedAt).toISOString(),
        };
      }
      return { ...ds };
    }) || [],
    nodes: Object.fromEntries(
      Object.entries(projectData.nodes || {}).map(([id, node]: [string, any]) => [
        id,
        {
          ...node,
          value: convertValue(node.value),
          metaData: Object.fromEntries(
            Object.entries(node.metaData || {}).map(([k, v]) => [
              k,
              convertValue(v),
            ])
          ),
        },
      ])
    ),
    views: projectData.views?.map((view: any) => ({
      ...view,
      createdAt: new Date(view.createdAt).toISOString(),
      updatedAt: new Date(view.updatedAt).toISOString(),
    })) || [],
  };
  
  // Validate references
  const referenceErrors = validateReferences(project);
  errors.push(...referenceErrors);
  
  // Validate constraints
  const constraintErrors = validateConstraints(project);
  errors.push(...constraintErrors);
  
  // If there are fatal errors, don't return the project
  const fatalErrors = errors.filter(e => e.severity === 'error');
  if (fatalErrors.length > 0) {
    return { errors };
  }
  
  return {
    project: project as PivotProject,
    errors: errors.filter(e => e.severity === 'warning'),
  };
}

/**
 * Convert a JSON value to its TypeScript type
 */
function convertValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string') {
    // Check if it's an ISO 8601 date
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return value;
  }
  
  return value;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate reference integrity in the project
 */
function validateReferences(project: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const dataSourceIds = new Set(project.dataSources?.map((ds: any) => ds.id) || []);
  const dimensionIds = new Set(project.dimensions?.map((d: any) => d.id) || []);
  const nodeIds = new Set(Object.keys(project.nodes || {}));
  
  // Validate ColumnMappings
  project.dimensions?.forEach((dim: any, dimIndex: number) => {
    dim.columnMappings?.forEach((cm: any, cmIndex: number) => {
      if (!dataSourceIds.has(cm.dataSourceId)) {
        errors.push({
          code: 'INVALID_DATA_SOURCE_REFERENCE',
          path: `pivotProject.dimensions[${dimIndex}].columnMappings[${cmIndex}].dataSourceId`,
          message: `DataSource '${cm.dataSourceId}' not found`,
          severity: 'error',
        });
      }
      
      // Validate that columnIndex exists in the DataSource
      const ds = project.dataSources?.find((d: any) => d.id === cm.dataSourceId);
      if (ds && ds.type === 'local' && cm.columnIndex >= ds.columns?.length) {
        errors.push({
          code: 'INVALID_COLUMN_INDEX',
          path: `pivotProject.dimensions[${dimIndex}].columnMappings[${cmIndex}].columnIndex`,
          message: `Column index ${cm.columnIndex} out of range for DataSource '${cm.dataSourceId}'`,
          severity: 'error',
        });
      }
    });
  });
  
  // Validate rootNodes
  project.dimensions?.forEach((dim: any, dimIndex: number) => {
    dim.rootNodes?.forEach((nodeId: string) => {
      if (!nodeIds.has(nodeId)) {
        errors.push({
          code: 'INVALID_NODE_REFERENCE',
          path: `pivotProject.dimensions[${dimIndex}].rootNodes`,
          message: `Node '${nodeId}' not found`,
          severity: 'error',
        });
      }
    });
  });
  
  // Validate Nodes
  Object.entries(project.nodes || {}).forEach(([nodeId, node]: [string, any]) => {
    if (!dimensionIds.has(node.dimensionId)) {
      errors.push({
        code: 'INVALID_DIMENSION_REFERENCE',
        path: `pivotProject.nodes.${nodeId}.dimensionId`,
        message: `Dimension '${node.dimensionId}' not found`,
        severity: 'error',
      });
    }
    
    // Validate children
    node.children?.forEach((childId: string) => {
      if (!nodeIds.has(childId)) {
        errors.push({
          code: 'INVALID_CHILD_NODE_REFERENCE',
          path: `pivotProject.nodes.${nodeId}.children`,
          message: `Child node '${childId}' not found`,
          severity: 'error',
        });
      }
    });
    
    // Validate sourceIds
    node.sourceIds?.forEach((sourceId: string) => {
      if (!dataSourceIds.has(sourceId)) {
        errors.push({
          code: 'INVALID_SOURCE_REFERENCE',
          path: `pivotProject.nodes.${nodeId}.sourceIds`,
          message: `DataSource '${sourceId}' not found`,
          severity: 'warning', // Warning because Node could be manual
        });
      }
    });
  });
  
  // Validate Views
  project.views?.forEach((view: any, viewIndex: number) => {
    // Validate dimensions
    [...(view.rowDimensions || []), ...(view.columnDimensions || [])].forEach((dimId: string) => {
      if (!dimensionIds.has(dimId)) {
        errors.push({
          code: 'INVALID_DIMENSION_REFERENCE',
          path: `pivotProject.views[${viewIndex}].rowDimensions or columnDimensions`,
          message: `Dimension '${dimId}' not found`,
          severity: 'error',
        });
      }
    });
    
    // Validate filterDimensions
    view.filterDimensions?.forEach((fd: any, fdIndex: number) => {
      if (!dimensionIds.has(fd.dimensionId)) {
        errors.push({
          code: 'INVALID_DIMENSION_REFERENCE',
          path: `pivotProject.views[${viewIndex}].filterDimensions[${fdIndex}].dimensionId`,
          message: `Dimension '${fd.dimensionId}' not found`,
          severity: 'error',
        });
      }
      
      fd.selectedNodes?.forEach((nodeId: string) => {
        if (!nodeIds.has(nodeId)) {
          errors.push({
            code: 'INVALID_NODE_REFERENCE',
            path: `pivotProject.views[${viewIndex}].filterDimensions[${fdIndex}].selectedNodes`,
            message: `Node '${nodeId}' not found`,
            severity: 'error',
          });
        }
      });
    });
    
    // Validate measures
    view.measures?.forEach((measure: any, mIndex: number) => {
      if (measure.source.type === 'column') {
        if (!dataSourceIds.has(measure.source.dataSourceId)) {
          errors.push({
            code: 'INVALID_DATA_SOURCE_REFERENCE',
            path: `pivotProject.views[${viewIndex}].measures[${mIndex}].source.dataSourceId`,
            message: `DataSource '${measure.source.dataSourceId}' not found`,
            severity: 'error',
          });
        }
        
        const ds = project.dataSources?.find((d: any) => d.id === measure.source.dataSourceId);
        if (ds && ds.type === 'local' && measure.source.columnIndex >= ds.columns?.length) {
          errors.push({
            code: 'INVALID_COLUMN_INDEX',
            path: `pivotProject.views[${viewIndex}].measures[${mIndex}].source.columnIndex`,
            message: `Column index ${measure.source.columnIndex} out of range`,
            severity: 'error',
          });
        }
      }
    });
  });
  
  return errors;
}

/**
 * Validate business constraints
 */
function validateConstraints(project: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Validate uniqueness of node codes within each dimension
  const codesByDimension: Record<string, Set<string>> = {};
  Object.entries(project.nodes || {}).forEach(([nodeId, node]: [string, any]) => {
    if (!codesByDimension[node.dimensionId]) {
      codesByDimension[node.dimensionId] = new Set();
    }
    
    if (codesByDimension[node.dimensionId].has(node.code)) {
      errors.push({
        code: 'DUPLICATE_NODE_CODE',
        path: `pivotProject.nodes.${nodeId}.code`,
        message: `Duplicate node code '${node.code}' in dimension '${node.dimensionId}'`,
        severity: 'error',
      });
    }
    codesByDimension[node.dimensionId].add(node.code);
  });
  
  // Validate data types of Nodes
  project.dimensions?.forEach((dim: any) => {
    Object.entries(project.nodes || {}).forEach(([nodeId, node]: [string, any]) => {
      if (node.dimensionId === dim.id) {
        const expectedType = dim.dataType;
        const actualType = typeof node.value;
        
        // Handle Dates
        if (node.value instanceof Date) {
          if (expectedType !== 'date') {
            errors.push({
              code: 'TYPE_MISMATCH',
              path: `pivotProject.nodes.${nodeId}.value`,
              message: `Node value is Date but dimension expects '${expectedType}'`,
              severity: 'warning',
            });
          }
        } else if (actualType !== expectedType) {
          // Handle special cases (string numbers)
          if (!(expectedType === 'number' && actualType === 'string' && !isNaN(Number(node.value)))) {
            errors.push({
              code: 'TYPE_MISMATCH',
              path: `pivotProject.nodes.${nodeId}.value`,
              message: `Node value type '${actualType}' doesn't match dimension type '${expectedType}'`,
              severity: 'warning',
            });
          }
        }
      }
    });
  });
  
  return errors;
}

// ============================================================================
// FILE OPERATIONS (Browser)
// ============================================================================

/**
 * Save project to a file (browser download)
 */
export function saveProjectToFile(project: PivotProject, fileName?: string): void {
  const json = serializePivotProject(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `${project.name || 'pivot-project'}.pivot.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Load project from a File object (browser file picker)
 */
export async function loadProjectFromFile(file: File): Promise<DeserializationResult> {
  const text = await file.text();
  return deserializePivotProject(text);
}

/**
 * Load project from URL
 */
export async function loadProjectFromUrl(url: string): Promise<DeserializationResult> {
  const response = await fetch(url);
  const text = await response.text();
  return deserializePivotProject(text);
}
