import { describe, it, expect } from 'vitest';
import { cellsGenerator, type CellsGeneratorParam, type CellGeneratorCallback } from '../helpers/CellGenerator';
import type { PivotAxeHierarchyNode } from '../../models/pivot-data/pivot-data';

/**
 * Cell position result type
 */
interface CellPosition {
  node: PivotAxeHierarchyNode;
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Helper to collect cells from the callback
 */
function collectCells(hierarchy: PivotAxeHierarchyNode[], params: CellsGeneratorParam): CellPosition[] {
  const cells: CellPosition[] = [];
  const callback: CellGeneratorCallback = (node, top, left, width, height) => {
    cells.push({ node, top, left, width, height });
  };
  cellsGenerator(hierarchy, params, callback);
  return cells;
}

/**
 * Test utilities for CellsGenerator
 */

describe('CellsGenerator', () => {
  const BASE_WIDTH = 120;
  const BASE_HEIGHT = 40;

  // ============================================================================
  // COLUMN MODE TESTS
  // ============================================================================
  
  describe('COLUMN mode', () => {

    it('should generate cells for a simple 1-level column hierarchy', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [
        { key: '2024', value: '2024', level: 0, dimensionId: 'year', leaf: true, children: [] },
        { key: '2025', value: '2025', level: 0, dimensionId: 'year', leaf: true, children: [] }
      ];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 0,
        startTop: 0,
        mode: 'COLUMN'
      };

      const cells = collectCells(hierarchy, params);

      expect(cells.length).toBe(2);
      
      // First cell: 2024 at (0, 0) with width=120, height=40
      expect(cells[0].node.key).toBe('2024');
      expect(cells[0].top).toBe(0);
      expect(cells[0].left).toBe(0);
      expect(cells[0].width).toBe(120);
      expect(cells[0].height).toBe(40);

      // Second cell: 2025 at (0, 120) with width=120, height=40
      expect(cells[1].node.key).toBe('2025');
      expect(cells[1].top).toBe(0);
      expect(cells[1].left).toBe(120);
      expect(cells[1].width).toBe(120);
      expect(cells[1].height).toBe(40);
    });

    it('should generate cells for a 2-level column hierarchy (Year -> Month)', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [
        {
          key: '2024',
          value: '2024',
          level: 0,
          dimensionId: 'year',
          leaf: false,
          children: [
            { key: '2024;1', value: '1', level: 1, dimensionId: 'month', leaf: true, children: [] },
            { key: '2024;2', value: '2', level: 1, dimensionId: 'month', leaf: true, children: [] }
          ]
        }
      ];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 0,
        startTop: 0,
        mode: 'COLUMN'
      };

      const cells = collectCells(hierarchy, params);

      expect(cells.length).toBe(3);
      
      // Year 2024: spans 2 months (width = 2 * 120 = 240), height = 40
      const year2024 = cells.find(c => c.node.key === '2024');
      expect(year2024).toBeDefined();
      expect(year2024!.top).toBe(0);
      expect(year2024!.left).toBe(0);
      expect(year2024!.width).toBe(240);
      expect(year2024!.height).toBe(40);

      // Month 1: at (40, 0) with width=120, height=40
      const month1 = cells.find(c => c.node.key === '2024;1');
      expect(month1).toBeDefined();
      expect(month1!.top).toBe(40);
      expect(month1!.left).toBe(0);
      expect(month1!.width).toBe(120);
      expect(month1!.height).toBe(40);

      // Month 2: at (40, 120) with width=120, height=40
      const month2 = cells.find(c => c.node.key === '2024;2');
      expect(month2).toBeDefined();
      expect(month2!.top).toBe(40);
      expect(month2!.left).toBe(120);
      expect(month2!.width).toBe(120);
      expect(month2!.height).toBe(40);
    });

    it('should handle non-zero start position', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [
        { key: 'A', value: 'A', level: 0, dimensionId: 'dim', leaf: true, children: [] }
      ];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 100,
        startTop: 50,
        mode: 'COLUMN'
      };

      const cells = collectCells(hierarchy, params);

      expect(cells.length).toBe(1);
      expect(cells[0].top).toBe(50);
      expect(cells[0].left).toBe(100);
    });
  });

  // ============================================================================
  // ROW MODE TESTS
  // ============================================================================
  
  describe('ROW mode', () => {

    it('should generate cells for a simple 1-level row hierarchy', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [
        { key: 'Shop A', value: 'Shop A', level: 0, dimensionId: 'customer', leaf: true, children: [] },
        { key: 'Shop B', value: 'Shop B', level: 0, dimensionId: 'customer', leaf: true, children: [] }
      ];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 0,
        startTop: 0,
        mode: 'ROW'
      };

      const cells = collectCells(hierarchy, params);

      expect(cells.length).toBe(2);
      
      // First cell: Shop A at (0, 0) with width=120, height=40
      expect(cells[0].node.key).toBe('Shop A');
      expect(cells[0].top).toBe(0);
      expect(cells[0].left).toBe(0);
      expect(cells[0].width).toBe(120);
      expect(cells[0].height).toBe(40);

      // Second cell: Shop B at (40, 0) with width=120, height=40
      expect(cells[1].node.key).toBe('Shop B');
      expect(cells[1].top).toBe(40);
      expect(cells[1].left).toBe(0);
      expect(cells[1].width).toBe(120);
      expect(cells[1].height).toBe(40);
    });

    it('should generate cells for a 2-level row hierarchy (Customer -> Product)', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [
        {
          key: 'Shop A',
          value: 'Shop A',
          level: 0,
          dimensionId: 'customer',
          leaf: false,
          children: [
            { key: 'Shop A;Tool A', value: 'Tool A', level: 1, dimensionId: 'product', leaf: true, children: [] },
            { key: 'Shop A;Tool B', value: 'Tool B', level: 1, dimensionId: 'product', leaf: true, children: [] }
          ]
        }
      ];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 0,
        startTop: 0,
        mode: 'ROW'
      };

      const cells = collectCells(hierarchy, params);

      expect(cells.length).toBe(3);
      
      // Customer Shop A: spans 2 products (height = 2 * 40 = 80), width = 120
      const shopA = cells.find(c => c.node.key === 'Shop A');
      expect(shopA).toBeDefined();
      expect(shopA!.top).toBe(0);
      expect(shopA!.left).toBe(0);
      expect(shopA!.width).toBe(120);
      expect(shopA!.height).toBe(80);

      // Product Tool A: at (0, 120) with width=120, height=40
      const toolA = cells.find(c => c.node.key === 'Shop A;Tool A');
      expect(toolA).toBeDefined();
      expect(toolA!.top).toBe(0);
      expect(toolA!.left).toBe(120);
      expect(toolA!.width).toBe(120);
      expect(toolA!.height).toBe(40);

      // Product Tool B: at (40, 120) with width=120, height=40
      const toolB = cells.find(c => c.node.key === 'Shop A;Tool B');
      expect(toolB).toBeDefined();
      expect(toolB!.top).toBe(40);
      expect(toolB!.left).toBe(120);
      expect(toolB!.width).toBe(120);
      expect(toolB!.height).toBe(40);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================
  
  describe('Edge cases', () => {

    it('should handle empty hierarchy', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 0,
        startTop: 0,
        mode: 'COLUMN'
      };

      const cells = collectCells(hierarchy, params);

      expect(cells.length).toBe(0);
    });

    it('should handle node with no children marked as non-leaf', () => {
      const hierarchy: PivotAxeHierarchyNode[] = [
        { key: 'A', value: 'A', level: 0, dimensionId: 'dim', leaf: false, children: [] }
      ];

      const params: CellsGeneratorParam = {
        baseCellWidth: BASE_WIDTH,
        baseCellHeight: BASE_HEIGHT,
        startLeft: 0,
        startTop: 0,
        mode: 'COLUMN'
      };

      const cells = collectCells(hierarchy, params);

      // Should still generate a cell with default span of 1
      expect(cells.length).toBe(1);
      expect(cells[0].width).toBe(120);
    });
  });
});
