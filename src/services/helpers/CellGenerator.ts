/**
 * Cell Generator Helper
 * 
 * Utility for generating cell positions from hierarchy data.
 * Used to validate rendering behavior before integration with React components.
 */

import type { PivotAxeHierarchy, PivotAxeHierarchyNode } from "../../models/pivot-data/pivot-data";

/**
 * Parameters for cell generation
 */
export interface CellsGeneratorParam {
  baseCellWidth: number;
  baseCellHeight: number;
  startLeft: number;
  startTop: number;
  mode: 'ROW' | 'COLUMN';
}

/**
 * Callback type for cell generation
 * Receives position and dimensions for each hierarchy node
 */
export type CellGeneratorCallback = (
  node: PivotAxeHierarchyNode,
  top: number,
  left: number,
  width: number,
  height: number
) => void;

/**
 * Calculates the total span (number of leaf nodes) in a hierarchy
 * Used to determine width for column headers or height for row headers
 */
function countLeafNodes(node: PivotAxeHierarchyNode): number {
  if (node.leaf) {
    return 1;
  }
  
  let count = 0;
  if (node.children) {
    for (const child of node.children) {
      count += countLeafNodes(child);
    }
  }
  return count > 0 ? count : 1;
}

/**
 * Recursively generates cell positions for a hierarchy
 * 
 * For COLUMN mode:
 * - Root nodes flow horizontally (left increases, top stays same)
 * - Each node spans all its leaf children horizontally
 * - Height = baseCellHeight for all nodes
 * - Children are positioned below their parent (top = parent.top + baseCellHeight)
 * - Children flow horizontally within their parent's bounds
 * 
 * For ROW mode:
 * - Root nodes flow vertically (top increases, left stays same)
 * - Each node spans all its leaf children vertically
 * - Width = baseCellWidth for all nodes
 * - Children are positioned to the right of their parent (left = parent.left + baseCellWidth)
 * - Children flow vertically within their parent's bounds
 * 
 * @param hierarchy The hierarchy to generate cells for
 * @param params Generation parameters
 * @param callback Function called for each node with its position and dimensions
 */
export function cellsGenerator(
  hierarchy: PivotAxeHierarchy,
  params: CellsGeneratorParam,
  callback: CellGeneratorCallback
): void {
  const { baseCellWidth, baseCellHeight, startLeft, startTop, mode } = params;
  
  if (mode === 'COLUMN') {
    // For COLUMN mode: root nodes flow horizontally
    let currentLeft = startLeft;
    for (const node of hierarchy) {
      const span = countLeafNodes(node);
      const width = span * baseCellWidth;
      const height = baseCellHeight;
      
      callback(node, startTop, currentLeft, width, height);
      
      // Position children below this node, flowing horizontally
      if (node.children && node.children.length > 0) {
        generateChildrenColumn(node.children, startTop + baseCellHeight, currentLeft, baseCellWidth, baseCellHeight, callback);
      }
      
      currentLeft += width;
    }
  } else {
    // For ROW mode: root nodes flow vertically
    let currentTop = startTop;
    for (const node of hierarchy) {
      const span = countLeafNodes(node);
      const width = baseCellWidth;
      const height = span * baseCellHeight;
      
      callback(node, currentTop, startLeft, width, height);
      
      // Position children to the right of this node, flowing vertically
      if (node.children && node.children.length > 0) {
        generateChildrenRow(node.children, currentTop, startLeft + baseCellWidth, baseCellWidth, baseCellHeight, callback);
      }
      
      currentTop += height;
    }
  }
}

/**
 * Generates cells for children in COLUMN mode
 * Children flow horizontally (same top, increasing left)
 */
function generateChildrenColumn(
  children: PivotAxeHierarchyNode[],
  top: number,
  startLeft: number,
  baseCellWidth: number,
  baseCellHeight: number,
  callback: CellGeneratorCallback
): void {
  let currentLeft = startLeft;
  for (const child of children) {
    const span = countLeafNodes(child);
    const width = span * baseCellWidth;
    const height = baseCellHeight;
    
    callback(child, top, currentLeft, width, height);
    
    // Recursively generate grandchildren
    if (child.children && child.children.length > 0) {
      generateChildrenColumn(child.children, top + baseCellHeight, currentLeft, baseCellWidth, baseCellHeight, callback);
    }
    
    currentLeft += width;
  }
}

/**
 * Generates cells for children in ROW mode
 * Children flow vertically (same left, increasing top)
 */
function generateChildrenRow(
  children: PivotAxeHierarchyNode[],
  startTop: number,
  left: number,
  baseCellWidth: number,
  baseCellHeight: number,
  callback: CellGeneratorCallback
): void {
  let currentTop = startTop;
  for (const child of children) {
    const span = countLeafNodes(child);
    const width = baseCellWidth;
    const height = span * baseCellHeight;
    
    callback(child, currentTop, left, width, height);
    
    // Recursively generate grandchildren
    if (child.children && child.children.length > 0) {
      generateChildrenRow(child.children, currentTop, left + baseCellWidth, baseCellWidth, baseCellHeight, callback);
    }
    
    currentTop += height;
  }
}
