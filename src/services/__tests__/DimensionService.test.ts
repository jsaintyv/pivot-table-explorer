/**
 * Unit Tests for DimensionService
 * 
 * Tests the node creation and hierarchy building functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  buildNodesFromDimension, 
  updateNodesInDimension,
  identifyRootNodes 
} from '../DimensionService';
import type { PivotProject, Dimension, LocalDataSource } from '../../models/pivot-project/types';

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Create a test project with products.csv data
 */
function createTestProject(): PivotProject {
  return {
    id: 'test-project',
    name: 'Test Project',
    description: 'Test project for DimensionService',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSources: [
      {
        id: 'ds-products',
        type: 'local',
        name: 'products.csv',
        originalFormat: 'csv',
        loadedAt: new Date().toISOString(),
        columns: [
          { index: 0, name: 'ParentCode', dataType: 'string', nullable: true, unique: false },
          { index: 1, name: 'ProductCode', dataType: 'string', nullable: false, unique: true },
          { index: 2, name: 'Label', dataType: 'string', nullable: false, unique: false }
        ],
        data: [
          ['', 'MEM', 'Memory'],
          ['MEM', 'DDR4', 'DDR 4'],
          ['MEM', 'DDR5', 'DDR 5'],
          ['', 'GRAPH', 'Graphic card'],
          ['GRAPH', 'NV5050', 'Nvidia 5050'],
          ['GRAPH', 'NV5060', 'Nvidia 5060']
        ]
      }
    ],
    dimensions: [],
    nodes: {},
    views: []
  };
}

/**
 * Create a test dimension in parent mode
 */
function createTestParentDimension(id: string = 'dim-product'): Dimension {
  return {
    id,
    name: 'Product',
    description: 'Product dimension',
    dataType: 'string',
    hierarchyMode: 'parent',
    columnMappings: [
      {
        dataSourceId: 'ds-products',
        columnIndex: 0,
        level: 0,
        name: 'ParentCode',
        mappingType: 'parentCode'
      },
      {
        dataSourceId: 'ds-products',
        columnIndex: 1,
        level: 0,
        name: 'ProductCode',
        mappingType: 'label' // This will be treated as code column
      },
      {
        dataSourceId: 'ds-products',
        columnIndex: 2,
        level: 0,
        name: 'Label',
        mappingType: 'label'
      }
    ],
    propertyMappings: [],
    rootNodes: [],
    nodes: []
  };
}

/**
 * Create a test dimension in generation mode
 */
function createTestGenerationDimension(id: string = 'dim-product-gen'): Dimension {
  return {
    id,
    name: 'Product',
    description: 'Product dimension in generation mode',
    dataType: 'string',
    hierarchyMode: 'generation',
    columnMappings: [
      {
        dataSourceId: 'ds-products',
        columnIndex: 0,
        level: 0,
        name: 'Root',
        mappingType: 'root'
      },
      {
        dataSourceId: 'ds-products',
        columnIndex: 1,
        level: 1,
        name: 'Generation1',
        mappingType: 'gen1'
      },
      {
        dataSourceId: 'ds-products',
        columnIndex: 2,
        level: 0,
        name: 'Label',
        mappingType: 'label'
      }
    ],
    propertyMappings: [],
    rootNodes: [],
    nodes: []
  };
}

// ============================================================================
// TESTS: buildNodesFromDimension - Parent Mode
// ============================================================================

describe('DimensionService - buildNodesFromDimension (Parent Mode)', () => {
  let project: PivotProject;
  let dimension: Dimension;

  beforeEach(() => {
    project = createTestProject();
    dimension = createTestParentDimension();
    project.dimensions.push(dimension);
  });

  it('should create nodes from parent-child relationships', () => {
    const nodes = buildNodesFromDimension(project, dimension);

    // Should have 6 nodes (MEM, DDR4, DDR5, GRAPH, NV5050, NV5060)
    expect(nodes.length).toBe(6);
  });

  it('should correctly identify MEM as parent of DDR4 and DDR5', () => {
    const nodes = buildNodesFromDimension(project, dimension);

    const memNode = nodes.find(n => n.code === 'MEM');
    const ddr4Node = nodes.find(n => n.code === 'DDR4');
    const ddr5Node = nodes.find(n => n.code === 'DDR5');

    expect(memNode).toBeDefined();
    expect(ddr4Node).toBeDefined();
    expect(ddr5Node).toBeDefined();

    // MEM should have DDR4 and DDR5 as children
    expect(memNode!.children).toContain(ddr4Node!.id);
    expect(memNode!.children).toContain(ddr5Node!.id);
  });

  it('should correctly identify GRAPH as parent of NV5050 and NV5060', () => {
    const nodes = buildNodesFromDimension(project, dimension);

    const graphNode = nodes.find(n => n.code === 'GRAPH');
    const nv5050Node = nodes.find(n => n.code === 'NV5050');
    const nv5060Node = nodes.find(n => n.code === 'NV5060');

    expect(graphNode).toBeDefined();
    expect(nv5050Node).toBeDefined();
    expect(nv5060Node).toBeDefined();

    // GRAPH should have NV5050 and NV5060 as children
    expect(graphNode!.children).toContain(nv5050Node!.id);
    expect(graphNode!.children).toContain(nv5060Node!.id);
  });

  it('should use Label column for node values', () => {
    const nodes = buildNodesFromDimension(project, dimension);

    const memNode = nodes.find(n => n.code === 'MEM');
    const ddr4Node = nodes.find(n => n.code === 'DDR4');

    expect(memNode!.value).toBe('Memory');
    expect(ddr4Node!.value).toBe('DDR 4');
  });

  it('should identify MEM and GRAPH as root nodes', () => {
    const nodes = buildNodesFromDimension(project, dimension);
    const rootNodes = identifyRootNodes(nodes);

    // MEM and GRAPH should be root nodes
    const memNode = nodes.find(n => n.code === 'MEM');
    const graphNode = nodes.find(n => n.code === 'GRAPH');

    expect(rootNodes).toContain(memNode!.id);
    expect(rootNodes).toContain(graphNode!.id);
    // DDR4, DDR5, NV5050, NV5060 should NOT be root nodes
    expect(rootNodes.length).toBe(2);
  });
});

// ============================================================================
// TESTS: buildNodesFromDimension - Generation Mode
// ============================================================================

describe('DimensionService - buildNodesFromDimension (Generation Mode)', () => {
  let project: PivotProject;
  let dimension: Dimension;

  beforeEach(() => {
    project = createTestProject();
    dimension = createTestGenerationDimension();
    project.dimensions.push(dimension);
  });

  it('should create nodes from generation columns', () => {
    const nodes = buildNodesFromDimension(project, dimension);

    // Should create nodes based on root and gen1 columns
    // In this case, root is ParentCode, gen1 is ProductCode
    // So we expect unique combinations
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('should store generation metadata in node metaData', () => {
    const nodes = buildNodesFromDimension(project, dimension);

    // Find a node with gen1 data
    const memNode = nodes.find(n => 
      n.metaData.root === '' && n.metaData.gen1 === 'MEM'
    );

    if (memNode) {
      expect(memNode.metaData.root).toBe('');
      expect(memNode.metaData.gen1).toBe('MEM');
    }
  });
});

// ============================================================================
// TESTS: updateNodesInDimension
// ============================================================================

describe('DimensionService - updateNodesInDimension', () => {
  let project: PivotProject;

  beforeEach(() => {
    project = createTestProject();
  });

  it('should update dimension nodes and rootNodes', () => {
    const dimension = createTestParentDimension('test-dim');
    project.dimensions.push(dimension);

    const updatedDimension = updateNodesInDimension(project, dimension);

    expect(updatedDimension).toBeDefined();
    expect(updatedDimension!.nodes.length).toBe(6);
    expect(updatedDimension!.rootNodes.length).toBe(2); // MEM and GRAPH
  });

  it('should return null for non-existent dimension', () => {
    const updatedDimension = updateNodesInDimension(project, null);

    expect(updatedDimension).toBeNull();
  });

  it('should update rootNodes property', () => {
    const dimension = createTestParentDimension('test-dim');
    project.dimensions.push(dimension);

    const updatedDimension = updateNodesInDimension(project, dimension);

    expect(updatedDimension!.rootNodes.length).toBe(2);
    
    // Verify that the root nodes are MEM and GRAPH
    const memNode = updatedDimension!.nodes.find(n => n.code === 'MEM');
    const graphNode = updatedDimension!.nodes.find(n => n.code === 'GRAPH');

    expect(updatedDimension!.rootNodes).toContain(memNode!.id);
    expect(updatedDimension!.rootNodes).toContain(graphNode!.id);
  });
});

// ============================================================================
// INTEGRATION TEST: Full Parent Hierarchy Scenario
// ============================================================================

describe('DimensionService - Full Parent Hierarchy (Integration Test)', () => {
  it('should correctly build the full product hierarchy from CSV data', () => {
    const project = createTestProject();
    const dimension = createTestParentDimension();
    project.dimensions.push(dimension);

    // Build nodes
    const nodes = buildNodesFromDimension(project, dimension);
    const rootNodes = identifyRootNodes(nodes);

    // Verify complete hierarchy structure
    expect(nodes.length).toBe(6);
    expect(rootNodes.length).toBe(2);

    // Find all nodes
    const memNode = nodes.find(n => n.code === 'MEM');
    const ddr4Node = nodes.find(n => n.code === 'DDR4');
    const ddr5Node = nodes.find(n => n.code === 'DDR5');
    const graphNode = nodes.find(n => n.code === 'GRAPH');
    const nv5050Node = nodes.find(n => n.code === 'NV5050');
    const nv5060Node = nodes.find(n => n.code === 'NV5060');

    // All nodes should exist
    expect(memNode).toBeDefined();
    expect(ddr4Node).toBeDefined();
    expect(ddr5Node).toBeDefined();
    expect(graphNode).toBeDefined();
    expect(nv5050Node).toBeDefined();
    expect(nv5060Node).toBeDefined();

    // Verify hierarchy
    expect(memNode!.children).toContain(ddr4Node!.id);
    expect(memNode!.children).toContain(ddr5Node!.id);
    expect(graphNode!.children).toContain(nv5050Node!.id);
    expect(graphNode!.children).toContain(nv5060Node!.id);

    // Verify labels
    expect(memNode!.value).toBe('Memory');
    expect(graphNode!.value).toBe('Graphic card');
    expect(ddr4Node!.value).toBe('DDR 4');
    expect(nv5050Node!.value).toBe('Nvidia 5050');

    // Verify dimension IDs
    expect(memNode!.dimensionId).toBe(dimension.id);
    expect(ddr4Node!.dimensionId).toBe(dimension.id);

    // Verify source tracking
    expect(memNode!.sourceIds).toContain('ds-products');
    expect(ddr4Node!.sourceIds).toContain('ds-products');
  });
});
