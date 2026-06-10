/**
 * Test Case Implementation
 * 
 * Concrete implementation of the test case described in /docs/models/test-case.md
 * This can be used to validate the PivotProject model functionality.
 */

import type {
  PivotProject,
  LocalDataSource,
  Dimension,
  Node,
  DataColumn,
} from './types';

/**
 * Creates the Customer.csv LocalDataSource
 */
function createCustomerDataSource(): LocalDataSource {
  return {
    id: 'ds-customer',
    name: 'Customer',
    type: 'local',
    originalFormat: 'csv',
    loadedAt: new Date().toISOString(),
    columns: [
      { index: 0, name: 'CustomerId', dataType: 'string', nullable: false, unique: true },
      { index: 1, name: 'Label', dataType: 'string', nullable: false, unique: false },
    ],
    data: [
      ['1', 'Pierre'],
      ['2', 'Paul'],
      ['3', 'Jacque'],
    ],
  };
}

/**
 * Creates the Product.csv LocalDataSource
 */
function createProductDataSource(): LocalDataSource {
  return {
    id: 'ds-product',
    name: 'Product',
    type: 'local',
    originalFormat: 'csv',
    loadedAt: new Date().toISOString(),
    columns: [
      { index: 0, name: 'ProductId', dataType: 'string', nullable: false, unique: true },
      { index: 1, name: 'Label', dataType: 'string', nullable: false, unique: false },
    ],
    data: [
      ['1', 'Apple'],
      ['2', 'Orange'],
      ['3', 'Chocolate'],
    ],
  };
}

/**
 * Creates the Order.csv LocalDataSource
 */
function createOrderDataSource(): LocalDataSource {
  return {
    id: 'ds-order',
    name: 'Order',
    type: 'local',
    originalFormat: 'csv',
    loadedAt: new Date().toISOString(),
    columns: [
      { index: 0, name: 'OrderId', dataType: 'string', nullable: false, unique: false },
      { index: 1, name: 'OrderDate', dataType: 'date', nullable: false, unique: false },
      { index: 2, name: 'ProductId', dataType: 'string', nullable: false, unique: false },
      { index: 3, name: 'CustomerId', dataType: 'string', nullable: false, unique: false },
      { index: 4, name: 'Quantity', dataType: 'number', nullable: false, unique: false },
      { index: 5, name: 'PriceUnit', dataType: 'number', nullable: false, unique: false },
      { index: 6, name: 'Total', dataType: 'number', nullable: false, unique: false },
    ],
    data: [
      ['1', '2026-06-10', '1', '1', '100', '10', '1000'],
      ['1', '2026-06-10', '2', '1', '10', '5', '50'],
      ['2', '2026-05-10', '1', '2', '5', '20', '100'],
      ['2', '2026-05-10', '3', '2', '30', '30', '900'],
      ['3', '2025-04-01', '2', '3', '50', '50', '250'],
      ['4', '2025-12-01', '1', '1', '80', '10', '800'],
      ['4', '2025-12-01', '3', '1', '5', '5', '25'],
    ],
  };
}

/**
 * Creates the Customer dimension
 */
function createCustomerDimension(): Dimension {
  return {
    id: 'dim-customer',
    name: 'Customer',
    description: 'Identifiant client avec son libellé',
    dataType: 'string',
    columnMappings: [
      { dataSourceId: 'ds-customer', columnIndex: 0, level: 0, name: 'CustomerId' },
      { dataSourceId: 'ds-customer', columnIndex: 1, level: 1, name: 'Label' },
      { dataSourceId: 'ds-order', columnIndex: 3, level: 0, name: 'CustomerId' },
    ],
    rootNodes: [],
    nodeSchema: {
      fields: [
        { name: 'label', type: 'string', required: true },
      ],
    },
  };
}

/**
 * Creates the Product dimension
 */
function createProductDimension(): Dimension {
  return {
    id: 'dim-product',
    name: 'Product',
    description: 'Identifiant produit avec son libellé',
    dataType: 'string',
    columnMappings: [
      { dataSourceId: 'ds-product', columnIndex: 0, level: 0, name: 'ProductId' },
      { dataSourceId: 'ds-product', columnIndex: 1, level: 1, name: 'Label' },
      { dataSourceId: 'ds-order', columnIndex: 2, level: 0, name: 'ProductId' },
    ],
    rootNodes: [],
    nodeSchema: {
      fields: [
        { name: 'label', type: 'string', required: true },
      ],
    },
  };
}

/**
 * Creates the Order Date dimension
 */
function createOrderDateDimension(): Dimension {
  return {
    id: 'dim-order-date',
    name: 'Order Date',
    description: 'Date de commande',
    dataType: 'date',
    columnMappings: [
      { dataSourceId: 'ds-order', columnIndex: 1, level: 0, name: 'OrderDate' },
    ],
    rootNodes: [],
  };
}

/**
 * Creates Customer nodes
 */
function createCustomerNodes(): Record<string, Node> {
  return {
    'node-customer-1': {
      id: 'node-customer-1',
      dimensionId: 'dim-customer',
      code: '1',
      value: '1',
      metaData: { label: 'Pierre' },
      children: [],
      sourceIds: ['ds-customer', 'ds-order'],
    },
    'node-customer-2': {
      id: 'node-customer-2',
      dimensionId: 'dim-customer',
      code: '2',
      value: '2',
      metaData: { label: 'Paul' },
      children: [],
      sourceIds: ['ds-customer', 'ds-order'],
    },
    'node-customer-3': {
      id: 'node-customer-3',
      dimensionId: 'dim-customer',
      code: '3',
      value: '3',
      metaData: { label: 'Jacque' },
      children: [],
      sourceIds: ['ds-customer', 'ds-order'],
    },
  };
}

/**
 * Creates Product nodes
 */
function createProductNodes(): Record<string, Node> {
  return {
    'node-product-1': {
      id: 'node-product-1',
      dimensionId: 'dim-product',
      code: '1',
      value: '1',
      metaData: { label: 'Apple' },
      children: [],
      sourceIds: ['ds-product', 'ds-order'],
    },
    'node-product-2': {
      id: 'node-product-2',
      dimensionId: 'dim-product',
      code: '2',
      value: '2',
      metaData: { label: 'Orange' },
      children: [],
      sourceIds: ['ds-product', 'ds-order'],
    },
    'node-product-3': {
      id: 'node-product-3',
      dimensionId: 'dim-product',
      code: '3',
      value: '3',
      metaData: { label: 'Chocolate' },
      children: [],
      sourceIds: ['ds-product', 'ds-order'],
    },
  };
}

/**
 * Creates OrderDate nodes
 */
function createOrderDateNodes(): Record<string, Node> {
  return {
    'node-date-2025-04-01': {
      id: 'node-date-2025-04-01',
      dimensionId: 'dim-order-date',
      code: '2025-04-01',
      value: new Date('2025-04-01T00:00:00Z'),
      metaData: {},
      children: [],
      sourceIds: ['ds-order'],
    },
    'node-date-2025-12-01': {
      id: 'node-date-2025-12-01',
      dimensionId: 'dim-order-date',
      code: '2025-12-01',
      value: new Date('2025-12-01T00:00:00Z'),
      metaData: {},
      children: [],
      sourceIds: ['ds-order'],
    },
    'node-date-2026-05-10': {
      id: 'node-date-2026-05-10',
      dimensionId: 'dim-order-date',
      code: '2026-05-10',
      value: new Date('2026-05-10T00:00:00Z'),
      metaData: {},
      children: [],
      sourceIds: ['ds-order'],
    },
    'node-date-2026-06-10': {
      id: 'node-date-2026-06-10',
      dimensionId: 'dim-order-date',
      code: '2026-06-10',
      value: new Date('2026-06-10T00:00:00Z'),
      metaData: {},
      children: [],
      sourceIds: ['ds-order'],
    },
  };
}

/**
 * Creates the complete test PivotProject
 * This is the reference implementation of the test case
 */
export function createTestPivotProject(): PivotProject {
  const now = new Date().toISOString();
  
  const customerDim = createCustomerDimension();
  const productDim = createProductDimension();
  const orderDateDim = createOrderDateDimension();
  
  const customerNodes = createCustomerNodes();
  const productNodes = createProductNodes();
  const orderDateNodes = createOrderDateNodes();
  
  // Set root nodes for dimensions
  customerDim.rootNodes = Object.keys(customerNodes);
  productDim.rootNodes = Object.keys(productNodes);
  orderDateDim.rootNodes = Object.keys(orderDateNodes);
  
  return {
    id: 'test-project-001',
    name: 'Test Case - Customer Product Order',
    description: 'Cas de test pour valider le modèle PivotProject',
    createdAt: now,
    updatedAt: now,
    dataSources: [
      createCustomerDataSource(),
      createProductDataSource(),
      createOrderDataSource(),
    ],
    dimensions: [
      customerDim,
      productDim,
      orderDateDim,
    ],
    nodes: {
      ...customerNodes,
      ...productNodes,
      ...orderDateNodes,
    },
    views: [],
  };
}

/**
 * Expected pivot results for validation
 * ProductId (rows) x CustomerId (columns) x SUM(Total)
 */
export const EXPECTED_PIVOT_PRODUCT_CUSTOMER = {
  // Row: ProductId, Column: CustomerId, Value: SUM(Total)
  '1-1': 1800,  // Apple x Pierre = 1000 + 800
  '2-1': 50,    // Orange x Pierre = 50
  '1-2': 100,   // Apple x Paul = 100
  '3-2': 900,   // Chocolate x Paul = 900
  '2-3': 250,   // Orange x Jacque = 250
  '3-1': 25,    // Chocolate x Pierre = 25
  
  // Row totals
  '1-total': 1900,  // Apple total
  '2-total': 300,   // Orange total
  '3-total': 925,   // Chocolate total
  
  // Column totals
  'total-1': 1875, // Pierre total
  'total-2': 1000, // Paul total
  'total-3': 250,  // Jacque total
  
  // Grand total
  'total-total': 3125,
};

/**
 * Validation function for the test case
 */
export function validateTestPivotProject(project: PivotProject): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check DataSources
  if (project.dataSources.length !== 3) {
    errors.push(`Expected 3 DataSources, got ${project.dataSources.length}`);
  }
  
  const dsIds = project.dataSources.map(ds => ds.id);
  if (!dsIds.includes('ds-customer')) {
    errors.push("Missing ds-customer DataSource");
  }
  if (!dsIds.includes('ds-product')) {
    errors.push("Missing ds-product DataSource");
  }
  if (!dsIds.includes('ds-order')) {
    errors.push("Missing ds-order DataSource");
  }
  
  // Check Dimensions
  if (project.dimensions.length !== 3) {
    errors.push(`Expected 3 Dimensions, got ${project.dimensions.length}`);
  }
  
  const dimIds = project.dimensions.map(d => d.id);
  if (!dimIds.includes('dim-customer')) {
    errors.push("Missing dim-customer Dimension");
  }
  if (!dimIds.includes('dim-product')) {
    errors.push("Missing dim-product Dimension");
  }
  if (!dimIds.includes('dim-order-date')) {
    errors.push("Missing dim-order-date Dimension");
  }
  
  // Check Customer dimension
  const customerDim = project.dimensions.find(d => d.id === 'dim-customer');
  if (customerDim) {
    if (customerDim.dataType !== 'string') {
      errors.push("Customer dimension should have dataType 'string'");
    }
    if (customerDim.columnMappings.length !== 3) {
      errors.push(`Customer dimension should have 3 columnMappings, got ${customerDim.columnMappings.length}`);
    }
    if (customerDim.nodeSchema?.fields.length !== 1) {
      errors.push("Customer dimension should have 1 schema field (label)");
    }
  }
  
  // Check Product dimension
  const productDim = project.dimensions.find(d => d.id === 'dim-product');
  if (productDim) {
    if (productDim.dataType !== 'string') {
      errors.push("Product dimension should have dataType 'string'");
    }
    if (productDim.columnMappings.length !== 3) {
      errors.push(`Product dimension should have 3 columnMappings, got ${productDim.columnMappings.length}`);
    }
  }
  
  // Check OrderDate dimension
  const orderDateDim = project.dimensions.find(d => d.id === 'dim-order-date');
  if (orderDateDim) {
    if (orderDateDim.dataType !== 'date') {
      errors.push("OrderDate dimension should have dataType 'date'");
    }
    if (orderDateDim.columnMappings.length !== 1) {
      errors.push(`OrderDate dimension should have 1 columnMapping, got ${orderDateDim.columnMappings.length}`);
    }
  }
  
  // Check Nodes
  if (Object.keys(project.nodes).length !== 10) {
    errors.push(`Expected 10 Nodes (3 Customer + 3 Product + 4 Date), got ${Object.keys(project.nodes).length}`);
  }
  
  // Check Customer Nodes
  const customerNodes = Object.values(project.nodes).filter(n => n.dimensionId === 'dim-customer');
  if (customerNodes.length !== 3) {
    errors.push(`Expected 3 Customer Nodes, got ${customerNodes.length}`);
  } else {
    customerNodes.forEach(node => {
      if (!node.metaData.label) {
        errors.push(`Customer Node ${node.id} missing label in metaData`);
      }
      if (node.sourceIds.length !== 2) {
        warnings.push(`Customer Node ${node.id} should have 2 sourceIds (ds-customer, ds-order)`);
      }
    });
  }
  
  // Check Product Nodes
  const productNodes = Object.values(project.nodes).filter(n => n.dimensionId === 'dim-product');
  if (productNodes.length !== 3) {
    errors.push(`Expected 3 Product Nodes, got ${productNodes.length}`);
  } else {
    productNodes.forEach(node => {
      if (!node.metaData.label) {
        errors.push(`Product Node ${node.id} missing label in metaData`);
      }
      if (node.sourceIds.length !== 2) {
        warnings.push(`Product Node ${node.id} should have 2 sourceIds (ds-product, ds-order)`);
      }
    });
  }
  
  // Check Date Nodes
  const dateNodes = Object.values(project.nodes).filter(n => n.dimensionId === 'dim-order-date');
  if (dateNodes.length !== 4) {
    errors.push(`Expected 4 Date Nodes, got ${dateNodes.length}`);
  } else {
    dateNodes.forEach(node => {
      if (!(node.value instanceof Date)) {
        errors.push(`Date Node ${node.id} value should be a Date object`);
      }
      if (node.sourceIds.length !== 1 || !node.sourceIds.includes('ds-order')) {
        warnings.push(`Date Node ${node.id} should have sourceId 'ds-order'`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default createTestPivotProject;
