/**
 * DimensionService
 * 
 * Service dedicated to dimension operations, including node creation and hierarchy building
 */

import type {
  PivotProject,
  Dimension,
  LocalDataSource,
  Node,
  ColumnMapping,
  MappingType,
} from '../models/pivot-project/types';

// ============================================================================
// NODE CREATION
// ============================================================================

/**
 * Row data extracted from a data source for node creation
 */
interface SourceRowData {
  code: string;
  parentCode: string | null;
  label: string;
  dataSourceId: string;
  metaData: Record<string, any>;
}

/**
 * Build nodes for a dimension based on its column mappings and data sources
 * 
 * This method reads data from all data sources that have mappings for this dimension
 * and creates nodes with proper hierarchy relationships.
 * 
 * For parent mode:
 * - Uses parentCode column to establish parent-child relationships
 * - Each node's parent is identified by matching parentCode values
 * 
 * For generation mode:
 * - Each generation level column defines a level in the hierarchy
 * - Nodes are created at the appropriate depth based on column mappings
 * 
 * @param project - The pivot project containing data sources and dimensions
 * @param dimension - The dimension to build nodes for
 * @returns Array of Node objects with proper hierarchy structure
 */
export function buildNodesFromDimension(
  project: PivotProject,
  dimension: Dimension
): Node[] {
  const nodes: Node[] = [];
  const nodeIdMap: Map<string, string> = new Map(); // code -> nodeId
  const childrenMap: Map<string, string[]> = new Map(); // parentCode -> child node IDs
  
  const localDataSources = project.dataSources.filter(
    (ds): ds is LocalDataSource => ds.type === 'local'
  );
  
  const mode = dimension.hierarchyMode || 'generation';
    
  if (mode === 'parent') {
    // Parent mode: build hierarchy from parent code relationships
    return buildNodesFromParentMode(dimension, localDataSources);
  } else {
    // Generation mode: build hierarchy from fixed generation levels
    return buildNodesFromGenerationMode(dimension, localDataSources);
  }
}

// ============================================================================
// PARENT MODE
// ============================================================================

/**
 * Build nodes for a dimension in parent mode
 */
function buildNodesFromParentMode(
  dimension: Dimension,
  dataSources: LocalDataSource[]
): Node[] {   
  const nodes: Node[] = [];
  const nodeByCode: Map<string, Node> = new Map();
  
  // Find mappings for this dimension
  // In parent mode:
  // - parentCode mappings identify the parent column
  // - The first non-parentCode mapping is the code column (node identifier)
  // - label mappings provide display names
  const parentCodeMappings = dimension.columnMappings.filter(
    m => m.mappingType === 'parentCode'
  );
  
  const nonParentCodeMappings = dimension.columnMappings.filter(
    m => m.mappingType !== 'parentCode'
  );
  
  // Use the first non-parentCode mapping as the code column
  // This is the column that contains the unique node identifiers
  const codeMappings = nonParentCodeMappings.length > 0 ? [nonParentCodeMappings[0]] : [];
  
  // Label mappings provide display names
  // Exclude the code mapping if it's also marked as label
  const labelMappings = dimension.columnMappings.filter(
    m => m.mappingType === 'label' && m !== nonParentCodeMappings[0]
  );
  
  // For each data source with mappings for this dimension
  for (const ds of dataSources) {
    const dsParentCodeMapping = parentCodeMappings.find(
      m => m.dataSourceId === ds.id
    );
    const dsCodeMapping = codeMappings.find(
      m => m.dataSourceId === ds.id
    );
    const dsLabelMapping = labelMappings.find(
      m => m.dataSourceId === ds.id
    );
    
    // Skip data sources without code mapping
    if (!dsCodeMapping) continue;
    
    const parentCodeColIndex = dsParentCodeMapping?.columnIndex ?? -1;
    const codeColIndex = dsCodeMapping.columnIndex;
    const labelColIndex = dsLabelMapping?.columnIndex ?? -1;
    
    // Process each row of data
    for (const row of ds.data) {
      const code = codeColIndex >= 0 && codeColIndex < row.length
        ? String(row[codeColIndex] || '')
        : '';
      
      if (!code) continue;
      
      const parentCode = parentCodeColIndex >= 0 && parentCodeColIndex < row.length
        ? String(row[parentCodeColIndex] || '')
        : null;
      
      // Try to get label from label column, otherwise use code
      let label = code;
      if (labelColIndex >= 0 && labelColIndex < row.length) {
        const labelValue = String(row[labelColIndex] || '');
        if (labelValue) {
          label = labelValue;
        }
      }
      
      const nodeId = `node-${dimension.id}-${code}`;
      
      // Create or update node
      let node = nodeByCode.get(code);
      if (!node) {
        node = {
          id: nodeId,
          dimensionId: dimension.id,
          code,
          value: label,
          metaData: {},
          children: [],
          sourceIds: [ds.id]
        };
        nodeByCode.set(code, node);
        nodes.push(node);
      } else {
        // Add data source to node's source IDs
        if (!node.sourceIds.includes(ds.id)) {
          node.sourceIds.push(ds.id);
        }
      }
      
      // Store parent code in metadata for later use
      if (parentCode !== null && parentCode !== '') {
        node.metaData.parentCode = parentCode;
      }
    }
  }
  
  // Now establish parent-child relationships
  // Build a map from code to node for quick lookup
  for (const node of nodes) {
    const parentCode = node.metaData.parentCode as string | undefined;
    
    if (parentCode && parentCode !== '') {
      // Find parent node
      const parentNode = nodeByCode.get(parentCode);
      if (parentNode) {
        // Add this node as child of parent
        if (!parentNode.children.includes(node.id)) {
          parentNode.children.push(node.id);
        }
      }
    }
  }
  
  console.log('[buildNodesFromParentMode] Created nodes:', nodes.length, nodes.map(n => ({ id: n.id, code: n.code, value: n.value, children: n.children })));
  
  return nodes;
}

// ============================================================================
// GENERATION MODE
// ============================================================================

/**
 * Build nodes for a dimension in generation mode
 */
function buildNodesFromGenerationMode(
  dimension: Dimension,
  dataSources: LocalDataSource[]
): Node[] {
  const nodes: Node[] = [];
  const nodeByCode: Map<string, Node> = new Map();

  if(! dimension.columnMappings) {
    return nodes;
  }
  
  // Find mappings for each generation level
  const rootMappings = dimension.columnMappings.filter(
    m => m.mappingType === 'root' || m.level === 0
  );
  const gen1Mappings = dimension.columnMappings.filter(
    m => m.mappingType === 'gen1' || m.level === 1
  );
  const gen2Mappings = dimension.columnMappings.filter(
    m => m.mappingType === 'gen2' || m.level === 2
  );
  const gen3Mappings = dimension.columnMappings.filter(
    m => m.mappingType === 'gen3' || m.level === 3
  );
  const labelMappings = dimension.columnMappings.filter(
    m => m.mappingType === 'label'
  );
  
  // For each data source with mappings for this dimension
  for (const ds of dataSources) {
    const dsRootMapping = rootMappings.find(m => m.dataSourceId === ds.id) || 
                         gen1Mappings.find(m => m.dataSourceId === ds.id);
    const dsGen1Mapping = gen1Mappings.find(m => m.dataSourceId === ds.id);
    const dsGen2Mapping = gen2Mappings.find(m => m.dataSourceId === ds.id);
    const dsGen3Mapping = gen3Mappings.find(m => m.dataSourceId === ds.id);
    const dsLabelMapping = labelMappings.find(m => m.dataSourceId === ds.id);
    
    // Determine which column is the main code column
    // In generation mode, typically gen1 or root is the code
    const codeMapping = dsGen1Mapping || dsRootMapping;
    if (!codeMapping) continue;
    
    const codeColIndex = codeMapping.columnIndex;
    const rootColIndex = dsRootMapping?.columnIndex ?? -1;
    const gen2ColIndex = dsGen2Mapping?.columnIndex ?? -1;
    const gen3ColIndex = dsGen3Mapping?.columnIndex ?? -1;
    const labelColIndex = dsLabelMapping?.columnIndex ?? -1;
    
    // Process each row of data
    for (const row of ds.data) {
      const code = codeColIndex >= 0 && codeColIndex < row.length
        ? String(row[codeColIndex] || '')
        : '';
      
      if (!code) continue;
      
      const rootVal = rootColIndex >= 0 && rootColIndex < row.length
        ? String(row[rootColIndex] || '')
        : '';
      const gen2Val = gen2ColIndex >= 0 && gen2ColIndex < row.length
        ? String(row[gen2ColIndex] || '')
        : '';
      const gen3Val = gen3ColIndex >= 0 && gen3ColIndex < row.length
        ? String(row[gen3ColIndex] || '')
        : '';
      const label = labelColIndex >= 0 && labelColIndex < row.length
        ? String(row[labelColIndex] || '')
        : code;
      
      // Create a unique code for this node
      // In generation mode, the full code might be rootVal:gen2Val:gen3Val:code
      const fullCode = rootVal ? `${rootVal}:${code}` : code;
      const nodeId = `node-${dimension.id}-${fullCode}`;
      
      // Create node
      let node = nodeByCode.get(fullCode);
      if (!node) {
        node = {
          id: nodeId,
          dimensionId: dimension.id,
          code: fullCode,
          value: label,
          metaData: {
            root: rootVal || '',
            gen1: code,
            gen2: gen2Val || '',
            gen3: gen3Val || ''
          },
          children: [],
          sourceIds: []
        };
        nodeByCode.set(fullCode, node);
        nodes.push(node);
      }
      
      // Add data source to node's source IDs
      if (!node.sourceIds.includes(ds.id)) {
        node.sourceIds.push(ds.id);
      }
    }
  }
  
  return nodes;
}

// ============================================================================
// UPDATE DIMENSION NODES
// ============================================================================

/**
 * Update the nodes in a dimension based on data from data sources
 * 
 * This is the main public method that should be called when a dimension's
 * column mappings change, or when data sources are updated.
 * 
 * @param project - The pivot project to update
 * @param dimensionId - The ID of the dimension to update
 * @returns The updated dimension with nodes populated
 */
export function updateNodesInDimension(
  project: PivotProject,
  dimension: Dimension
): Dimension | null {
  if (!dimension) return null;
  
  // Build nodes from data sources
  const nodes = buildNodesFromDimension(project, dimension);
  
  // Update the dimension   
  dimension.nodes = nodes;
  
  // Identify root nodes (nodes with no parent or parent not found)
  // For now, we'll identify root nodes as those that appear in the hierarchy
  // without a parent reference
  const rootNodeIds = identifyRootNodes(dimension, nodes);
  dimension.rootNodes = rootNodeIds;  
  
  return dimension;
}

/**
 * Identify root nodes in a dimension's hierarchy
 */
export function identifyRootNodes(dimension: Dimension, nodes: Node[]): string[] {
  const mode = dimension.hierarchyMode || 'generation';
  
  if (mode === 'parent') {
    // In parent mode, root nodes are those that:
    // 1. Have no parentCode mapping, or
    // 2. Have an empty or null parentCode value
    return nodes
      .filter(node => {
        // Check if any node has this node as its child
        const isChild = nodes.some(n => n.children.includes(node.id));
        return !isChild;
      })
      .map(node => node.id);
  } else {
    // In generation mode, root nodes are typically at level 0
    // For now, return all nodes that don't have a parent
    return nodes
      .filter(node => {
        const isChild = nodes.some(n => n.children.includes(node.id));
        return !isChild;
      })
      .map(node => node.id);
  }
}

export function getDefaultMappingType(mode: 'parent' | 'generation'): MappingType {
    return mode === 'parent' ? 'parentCode' : 'root';
}


export function getId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getMappingId() {
  return `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// EXPORT
// ============================================================================

export const DimensionService = {
  buildNodesFromDimension,
  updateNodesInDimension,
  identifyRootNodes,
  getDefaultMappingType,
  getId,
  getMappingId
};
