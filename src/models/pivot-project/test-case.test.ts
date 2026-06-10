/**
 * Test Case Unit Tests
 * 
 * Tests for the PivotProject model using the test case data.
 * See /docs/models/test-case.md for the test case specification.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializePivotProject,
  deserializePivotProject,
} from './serialization';
import {
  createTestPivotProject,
  validateTestPivotProject,
  EXPECTED_PIVOT_PRODUCT_CUSTOMER,
} from './test-case';
import type { PivotProject } from './types';

describe('PivotProject Test Case', () => {
  let project: PivotProject;

  beforeEach(() => {
    project = createTestPivotProject();
  });

  describe('Project Creation', () => {
    it('should create a project with correct structure', () => {
      expect(project.id).toBe('test-project-001');
      expect(project.name).toBe('Test Case - Customer Product Order');
      expect(project.description).toContain('Cas de test');
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should have 3 DataSources', () => {
      expect(project.dataSources).toHaveLength(3);
      expect(project.dataSources.map(ds => ds.id)).toContain('ds-customer');
      expect(project.dataSources.map(ds => ds.id)).toContain('ds-product');
      expect(project.dataSources.map(ds => ds.id)).toContain('ds-order');
    });

    it('should have 3 Dimensions', () => {
      expect(project.dimensions).toHaveLength(3);
      expect(project.dimensions.map(d => d.id)).toContain('dim-customer');
      expect(project.dimensions.map(d => d.id)).toContain('dim-product');
      expect(project.dimensions.map(d => d.id)).toContain('dim-order-date');
    });

    it('should have 10 Nodes', () => {
      expect(Object.keys(project.nodes)).toHaveLength(10);
    });
  });

  describe('DataSources', () => {
    it('Customer DataSource should have correct structure', () => {
      const customerDs = project.dataSources.find(ds => ds.id === 'ds-customer');
      expect(customerDs).toBeDefined();
      expect(customerDs?.type).toBe('local');
      expect(customerDs?.originalFormat).toBe('csv');
      expect(customerDs?.columns).toHaveLength(2);
      expect(customerDs?.columns[0].name).toBe('CustomerId');
      expect(customerDs?.columns[1].name).toBe('Label');
      expect(customerDs?.data).toHaveLength(3);
      expect(customerDs?.data[0]).toEqual(['1', 'Pierre']);
      expect(customerDs?.data[1]).toEqual(['2', 'Paul']);
      expect(customerDs?.data[2]).toEqual(['3', 'Jacque']);
    });

    it('Product DataSource should have correct structure', () => {
      const productDs = project.dataSources.find(ds => ds.id === 'ds-product');
      expect(productDs).toBeDefined();
      expect(productDs?.columns).toHaveLength(2);
      expect(productDs?.columns[0].name).toBe('ProductId');
      expect(productDs?.columns[1].name).toBe('Label');
      expect(productDs?.data[0]).toEqual(['1', 'Apple']);
      expect(productDs?.data[1]).toEqual(['2', 'Orange']);
      expect(productDs?.data[2]).toEqual(['3', 'Chocolate']);
    });

    it('Order DataSource should have correct structure', () => {
      const orderDs = project.dataSources.find(ds => ds.id === 'ds-order');
      expect(orderDs).toBeDefined();
      expect(orderDs?.columns).toHaveLength(7);
      expect(orderDs?.columns[0].name).toBe('OrderId');
      expect(orderDs?.columns[1].name).toBe('OrderDate');
      expect(orderDs?.columns[1].dataType).toBe('date');
      expect(orderDs?.columns[2].name).toBe('ProductId');
      expect(orderDs?.columns[3].name).toBe('CustomerId');
      expect(orderDs?.columns[4].name).toBe('Quantity');
      expect(orderDs?.columns[5].name).toBe('PriceUnit');
      expect(orderDs?.columns[6].name).toBe('Total');
      expect(orderDs?.data).toHaveLength(7);
    });
  });

  describe('Dimensions', () => {
    it('Customer dimension should have correct ColumnMappings', () => {
      const customerDim = project.dimensions.find(d => d.id === 'dim-customer');
      expect(customerDim).toBeDefined();
      expect(customerDim?.dataType).toBe('string');
      expect(customerDim?.columnMappings).toHaveLength(3);
      
      const mappings = customerDim?.columnMappings;
      expect(mappings?.[0]).toEqual({
        dataSourceId: 'ds-customer',
        columnIndex: 0,
        level: 0,
        name: 'CustomerId',
      });
      expect(mappings?.[1]).toEqual({
        dataSourceId: 'ds-customer',
        columnIndex: 1,
        level: 1,
        name: 'Label',
      });
      expect(mappings?.[2]).toEqual({
        dataSourceId: 'ds-order',
        columnIndex: 3,
        level: 0,
        name: 'CustomerId',
      });
    });

    it('Customer dimension should have NodeSchema with label field', () => {
      const customerDim = project.dimensions.find(d => d.id === 'dim-customer');
      expect(customerDim?.nodeSchema).toBeDefined();
      expect(customerDim?.nodeSchema?.fields).toHaveLength(1);
      expect(customerDim?.nodeSchema?.fields[0]).toEqual({
        name: 'label',
        type: 'string',
        required: true,
      });
    });

    it('Product dimension should have correct ColumnMappings', () => {
      const productDim = project.dimensions.find(d => d.id === 'dim-product');
      expect(productDim).toBeDefined();
      expect(productDim?.dataType).toBe('string');
      expect(productDim?.columnMappings).toHaveLength(3);
      
      const mappings = productDim?.columnMappings;
      expect(mappings?.[0]).toEqual({
        dataSourceId: 'ds-product',
        columnIndex: 0,
        level: 0,
        name: 'ProductId',
      });
      expect(mappings?.[1]).toEqual({
        dataSourceId: 'ds-product',
        columnIndex: 1,
        level: 1,
        name: 'Label',
      });
      expect(mappings?.[2]).toEqual({
        dataSourceId: 'ds-order',
        columnIndex: 2,
        level: 0,
        name: 'ProductId',
      });
    });

    it('OrderDate dimension should have correct ColumnMapping', () => {
      const orderDateDim = project.dimensions.find(d => d.id === 'dim-order-date');
      expect(orderDateDim).toBeDefined();
      expect(orderDateDim?.dataType).toBe('date');
      expect(orderDateDim?.columnMappings).toHaveLength(1);
      expect(orderDateDim?.columnMappings[0]).toEqual({
        dataSourceId: 'ds-order',
        columnIndex: 1,
        level: 0,
        name: 'OrderDate',
      });
    });
  });

  describe('Nodes', () => {
    it('should have 3 Customer nodes', () => {
      const customerNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-customer');
      expect(customerNodes).toHaveLength(3);
    });

    it('Customer nodes should have correct MetaData', () => {
      const customerNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-customer');
      
      const pierre = customerNodes.find(n => n.code === '1');
      const paul = customerNodes.find(n => n.code === '2');
      const jacque = customerNodes.find(n => n.code === '3');
      
      expect(pierre?.metaData.label).toBe('Pierre');
      expect(paul?.metaData.label).toBe('Paul');
      expect(jacque?.metaData.label).toBe('Jacque');
    });

    it('Customer nodes should reference both DataSources', () => {
      const customerNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-customer');
      
      customerNodes.forEach(node => {
        expect(node.sourceIds).toContain('ds-customer');
        expect(node.sourceIds).toContain('ds-order');
      });
    });

    it('should have 3 Product nodes', () => {
      const productNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-product');
      expect(productNodes).toHaveLength(3);
    });

    it('Product nodes should have correct MetaData', () => {
      const productNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-product');
      
      const apple = productNodes.find(n => n.code === '1');
      const orange = productNodes.find(n => n.code === '2');
      const chocolate = productNodes.find(n => n.code === '3');
      
      expect(apple?.metaData.label).toBe('Apple');
      expect(orange?.metaData.label).toBe('Orange');
      expect(chocolate?.metaData.label).toBe('Chocolate');
    });

    it('should have 4 OrderDate nodes', () => {
      const dateNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-order-date');
      expect(dateNodes).toHaveLength(4);
    });

    it('Date nodes should have Date values', () => {
      const dateNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-order-date');
      
      dateNodes.forEach(node => {
        expect(node.value).toBeInstanceOf(Date);
      });
    });

    it('Date nodes should only reference ds-order', () => {
      const dateNodes = Object.values(project.nodes)
        .filter(n => n.dimensionId === 'dim-order-date');
      
      dateNodes.forEach(node => {
        expect(node.sourceIds).toEqual(['ds-order']);
      });
    });
  });

  describe('Validation', () => {
    it('should pass validation', () => {
      const result = validateTestPivotProject(project);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const json = serializePivotProject(project);
      expect(json).toBeDefined();
      
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe('1.0');
      expect(parsed.pivotProject.id).toBe('test-project-001');
      expect(parsed.pivotProject.dataSources).toHaveLength(3);
      expect(parsed.pivotProject.dimensions).toHaveLength(3);
    });

    it('should deserialize back to a valid project', () => {
      const json = serializePivotProject(project);
      const result = deserializePivotProject(json);
      
      expect(result.errors).toHaveLength(0);
      expect(result.project).toBeDefined();
      
      const deserialized = result.project!;
      expect(deserialized.id).toBe('test-project-001');
      expect(deserialized.dataSources).toHaveLength(3);
      expect(deserialized.dimensions).toHaveLength(3);
      expect(Object.keys(deserialized.nodes)).toHaveLength(10);
    });

    it('should handle Date serialization/deserialization', () => {
      const json = serializePivotProject(project);
      const result = deserializePivotProject(json);
      
      const dateNodes = Object.values(result.project!.nodes)
        .filter(n => n.dimensionId === 'dim-order-date');
      
      dateNodes.forEach(node => {
        expect(node.value).toBeInstanceOf(Date);
      });
    });

    it('should validate structure on deserialization', () => {
      const json = serializePivotProject(project);
      const result = deserializePivotProject(json);
      
      expect(result.errors).toHaveLength(0);
      expect(result.project).toBeDefined();
      
      const validation = validateTestPivotProject(result.project!);
      expect(validation.valid).toBe(true);
    });
  });

  describe('Expected Pivot Results', () => {
    it('should have correct expected values defined', () => {
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['1-1']).toBe(1800);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['2-1']).toBe(50);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['1-2']).toBe(100);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['3-2']).toBe(900);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['2-3']).toBe(250);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['3-1']).toBe(25);
    });

    it('should have correct row totals', () => {
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['1-total']).toBe(1900);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['2-total']).toBe(300);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['3-total']).toBe(925);
    });

    it('should have correct column totals', () => {
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['total-1']).toBe(1875);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['total-2']).toBe(1000);
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['total-3']).toBe(250);
    });

    it('should have correct grand total', () => {
      expect(EXPECTED_PIVOT_PRODUCT_CUSTOMER['total-total']).toBe(3125);
    });
  });
});
