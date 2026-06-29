import { observer } from 'mobx-react-lite';
import { TOTAL } from '../../../../services/PivotDataService';
import type { PivotData, PivotAxeHierarchy, PivotAxeHierarchyNode } from '../../../../models/pivot-data/pivot-data';
import React from 'react';
import { hierarchyCellsGenerator, type CellsGeneratorParam, type CellGeneratorCallback, getLeafNodesFromHierarchy, getHierarchyMaxDepth } from '../../../../services/helpers/HierarchyCellGenerator';


/**
 * PivotGridTable component
 * Grille virtualisée avec des div positionnées en absolute
 * Affiche les données du tableau croisé dynamique avec optimisation des performances
 */

// Dimensions fixes pour toutes les cellules
const CELL_WIDTH = 120;
const CELL_HEIGHT = 40;
// Buffer pour le rendering window (garantit un scroll fluide)
const SCROLL_BUFFER = 5;

// Styles communs pour les cellules
const commonCellStyles = {
  border: '1px solid #e0e0e0',
  boxSizing: 'border-box' as const,
  fontSize: '14px',
  overflow: 'hidden',
  cursor: 'pointer' as const,
};

// Style de surbrillance pour ligne/colonne survolée
const hoverHighlightStyle = {
  backgroundColor: '#e3f2fd',
  zIndex: 1,
};

const hoverHighlightStyleHeader = {
  backgroundColor: '#e3f2fd'  
};

// Styles for header cells with hierarchy levels
const getHeaderCellStyles = (level: number) => {
  const baseStyles = {
    ...commonCellStyles,
    backgroundColor: '#f5f5f5',
    borderTop: '2px solid #d0d0d0',
    fontWeight: 600,
    color: '#333',
  };
  
  // Different background for different levels
  const backgrounds = ['#f5f5f5', '#e8e8e8', '#dddddd', '#d0d0d0'];
  if (level < backgrounds.length) {
    baseStyles.backgroundColor = backgrounds[level];
  }
  
  return baseStyles;
};

const getRowHeaderCellStyles = (level: number) => {
  const baseStyles = {
    ...commonCellStyles,
    backgroundColor: '#f5f5f5',
    borderLeft: '2px solid #d0d0d0',
    fontWeight: 600,
    color: '#333',
  };
  
  // Different background for different levels
  const backgrounds = ['#f5f5f5', '#e8e8e8', '#dddddd', '#d0d0d0'];
  if (level < backgrounds.length) {
    baseStyles.backgroundColor = backgrounds[level];
  }
  
  return baseStyles;
};

const dataCellStyles = {
  ...commonCellStyles,
  backgroundColor: '#ffffff',
  textAlign: 'right' as const,
};

const totalCellStyles = {
  ...commonCellStyles,
  backgroundColor: '#e8f5e8',
  fontWeight: 600,
  borderRight: '2px solid #a0d0a0',
};

const grandTotalCellStyles = {
  ...commonCellStyles,
  backgroundColor: '#d4edda',
  fontWeight: 700,
  border: '2px solid #80c080',
};

const cornerCellStyles = {
  ...commonCellStyles,
  backgroundColor: '#f5f5f5',
  borderLeft: '2px solid #d0d0d0',
  borderTop: '2px solid #d0d0d0',
  textAlign: 'center' as const,
};

const headerTotalCellStyles = {
  ...getHeaderCellStyles(0),
  backgroundColor: '#e8f5e8',
  borderLeft: '2px solid #a0d0a0',
  fontWeight: 700,
};

const rowHeaderTotalCellStyles = {
  ...getRowHeaderCellStyles(0),
  backgroundColor: '#e8f5e8',
  borderBottom: '2px solid #a0d0a0',
};

interface PivotGridTableProps {
  pivotData: PivotData;
  showTotals?: boolean;
  showGrandTotal?: boolean;
}



export const PivotGridTable = observer(({
  pivotData,
  showTotals = false,
  showGrandTotal = false,
}: PivotGridTableProps) => {  
  // All hooks must be called unconditionally at the start, before any early returns
  // Référence pour le conteneur de scroll
  const containerRef = React.useRef<HTMLDivElement>(null);
  // In fact , we will use containerRef current position but keep those useState for component refresh
  const [scrollLeftTmp, setScrollLeftTmp] = React.useState(0);
  const [scrollTopTmp, setScrollTopTmp] = React.useState(0);

  // État pour la cellule survolée (highlight de la ligne et colonne)
  const [hoveredCell, setHoveredCell] = React.useState<{ rowKey: string; colKey: string } | null>(null);

  // Destructure after all hooks to ensure consistent hook order
  const {rows, columns, measures, pivotCellByColKeyByRowKeyByMeasureId, rowHierarchy, columnHierarchy} = pivotData;

  console.log("Redraw PivotGridTable Scroll:", scrollLeftTmp, scrollTopTmp, " Client size:", containerRef.current?.clientWidth, containerRef.current?.clientHeight, "Grid size:", rows.length, columns.length);

  // scrollLeftTmp is not useful. But we need to read it to force refreshing  
  const scrollLeft = (scrollLeftTmp == containerRef.current?.scrollLeft ? scrollLeftTmp : containerRef.current?.scrollLeft) || 0;
  const scrollTop = (scrollTopTmp == containerRef.current?.scrollTop ? scrollTopTmp : containerRef.current?.scrollTop) || 0;

  // Vérifier si on doit afficher les totaux
  const hasRowTotals = showTotals && rows.some(r => r.axeKey === TOTAL);
  const hasColTotals = showTotals && columns.some(c => c.axeKey === TOTAL);

  // Get leaf nodes from hierarchies
  const columnLeafNodes = React.useMemo(() => {
    return columnHierarchy ? getLeafNodesFromHierarchy(columnHierarchy) : [];
  }, [columnHierarchy]);

  const rowLeafNodes = React.useMemo(() => {
    return rowHierarchy ? getLeafNodesFromHierarchy(rowHierarchy) : [];
  }, [rowHierarchy]);

  // Calculer les dimensions de la grille basées sur les hiérarchies
  const dataColCount = columnLeafNodes.length;
  const dataRowCount = rowLeafNodes.length;
  const totalColCount = hasColTotals ? 1 : 0;
  const totalRowCount = hasRowTotals ? 1 : 0;

  // Calculate the total width and height based on hierarchies
  // For column headers: we need space for the hierarchy depth
  const columnHierarchyDepth = columnHierarchy ? getHierarchyMaxDepth(columnHierarchy) : 1;
  const rowHierarchyDepth = rowHierarchy ? getHierarchyMaxDepth(rowHierarchy) : 1;
  
  // The header area height is hierarchy depth * CELL_HEIGHT
  const columnHeaderHeight = columnHierarchyDepth * CELL_HEIGHT;
  // The row header area width is hierarchy depth * CELL_WIDTH
  const rowHeaderWidth = rowHierarchyDepth * CELL_WIDTH;

  const gridTotalWidth = rowHeaderWidth + (dataColCount + totalColCount) * CELL_WIDTH;
  const gridTotalHeight = columnHeaderHeight + (dataRowCount + totalRowCount) * CELL_HEIGHT;
  
  // Calculer les cellules visibles avec buffer
  // For columns: we need to calculate which column leaf nodes are visible
  const startCol = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - SCROLL_BUFFER);
  const endCol = Math.min(
    dataColCount + totalColCount,
    Math.ceil((scrollLeft + (containerRef.current?.clientWidth ?? 600)) / CELL_WIDTH) + SCROLL_BUFFER
  );

  const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - SCROLL_BUFFER);
  const endRow = Math.min(
    dataRowCount + totalRowCount,
    Math.ceil((scrollTop + (containerRef.current?.clientHeight ?? 600)) / CELL_HEIGHT) + SCROLL_BUFFER
  );
  
  const headerTop = scrollTop;
  const headerLeft = scrollLeft;

  // Écouter les événements de scroll et de resize
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Utiliser requestAnimationFrame pour éviter trop de re-renders      
      // Utiliser requestAnimationFrame pour éviter trop de re-renders
      requestAnimationFrame(() => {
        setScrollLeftTmp(container.scrollLeft);
        setScrollTopTmp(container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll);    

    // Initialisation
    handleScroll();
    

    return () => {
      container.removeEventListener('scroll', handleScroll);      
    };
  }, []);

  // Vérifie si une cellule doit être surlignée
  const isCellHighlighted = React.useCallback((rowKey: string, colKey: string): boolean => {
    if (!hoveredCell) return false;
    return rowKey === hoveredCell.rowKey || colKey === hoveredCell.colKey;
  }, [hoveredCell]);

  // ==========================================================================
  // HIERARCHY HEADER RENDERING
  // ==========================================================================

  /**
   * Render column hierarchy headers using cellsGenerator
   */
  const renderColumnHierarchyHeaders = React.useCallback((): React.ReactNode[] => {
    if (!columnHierarchy || columnHierarchy.length === 0) {
      return [];
    }

    const cells: React.ReactNode[] = [];
    
    const params: CellsGeneratorParam = {
      baseCellWidth: CELL_WIDTH,
      baseCellHeight: CELL_HEIGHT,
      startLeft: rowHeaderWidth,
      startTop: scrollTop,
      mode: 'COLUMN'
    };

    const callback: CellGeneratorCallback = (node, top, left, width, height) => {
      const isHighlighted = isCellHighlighted('', node.key);
      const style = {
        position: 'absolute' as const,
        left: left,
        top: top,
        width: width,
        height: height,
        ...getHeaderCellStyles(node.level),
        ...(isHighlighted ? hoverHighlightStyleHeader : {}),
        zIndex: 10,
      };

      cells.push(
        <div
          key={`hc-${left}-${top}`}
          className={`grid-cell header column-header hierarchy-level-${node.level}`}
          style={style}
          onMouseEnter={() => setHoveredCell({ rowKey: '', colKey: node.key })}
          onMouseLeave={() => setHoveredCell(null)}
        >
          <div className="header-content">
            <span className="header-label">{node.value}</span>
          </div>
        </div>
      );
    };

    hierarchyCellsGenerator(columnHierarchy, params, callback);
    return cells;
  }, [scrollLeft, scrollTop, columnHierarchy, rowHeaderWidth, isCellHighlighted]);

  /**
   * Render row hierarchy headers using cellsGenerator
   */
  const renderRowHierarchyHeaders = React.useCallback((): React.ReactNode[] => {
    if (!rowHierarchy || rowHierarchy.length === 0) {
      return [];
    }

    const cells: React.ReactNode[] = [];
    
    const params: CellsGeneratorParam = {
      baseCellWidth: CELL_WIDTH,
      baseCellHeight: CELL_HEIGHT,
      startLeft: scrollLeft,
      startTop: columnHeaderHeight,
      mode: 'ROW'
    };

    const callback: CellGeneratorCallback = (node, top, left, width, height) => {
      const isHighlighted = isCellHighlighted(node.key, '');
      const style = {
        position: 'absolute' as const,
        left: left,
        top: top,
        width: width,
        height: height,
        ...getRowHeaderCellStyles(node.level),
        ...(isHighlighted ? hoverHighlightStyleHeader : {}),
        zIndex: 9,
      };

      cells.push(
        <div
          key={`hr-${left}-${top}`}
          className={`grid-cell header row-header hierarchy-level-${node.level}`}
          style={style}
          onMouseEnter={() => setHoveredCell({ rowKey: node.key, colKey: '' })}
          onMouseLeave={() => setHoveredCell(null)}
        >
          <div className="row-header-content">
            <span className="row-header-label">{node.value}</span>
          </div>
        </div>
      );
    };

    hierarchyCellsGenerator(rowHierarchy, params, callback);
    return cells;
  }, [scrollLeft, scrollTop, rowHierarchy, columnHeaderHeight, isCellHighlighted]);

  // ==========================================================================
  // DATA CELL RENDERING
  // ==========================================================================

  /**
   * Get the column leaf node at a specific index
   */
  const getColumnLeafNode = React.useCallback((index: number): PivotAxeHierarchyNode | null => {
    if (!columnLeafNodes || index < 0 || index >= columnLeafNodes.length) {
      return null;
    }
    return columnLeafNodes[index];
  }, [columnLeafNodes]);

  /**
   * Get the row leaf node at a specific index
   */
  const getRowLeafNode = React.useCallback((index: number): PivotAxeHierarchyNode | null => {
    if (!rowLeafNodes || index < 0 || index >= rowLeafNodes.length) {
      return null;
    }
    return rowLeafNodes[index];
  }, [rowLeafNodes]);

  /**
   * Render a data cell at a specific position
   */
  const renderDataCell = React.useCallback((rowIdx: number, colIdx: number): React.ReactNode => {
    const rowNode = getRowLeafNode(rowIdx);
    const colNode = getColumnLeafNode(colIdx);
    
    if (!rowNode || !colNode) {
      return null;
    }

    const rowKey = rowNode.key;
    const colKey = colNode.key;
    
    // Get the measure ID from the column node key
    // Column node keys are like "2024;1;Recalled" where "Recalled" is the measure id
    const colKeyParts = colKey.split(';');
    const measureId = colKeyParts[colKeyParts.length - 1];
    
    // Get the actual column key without the measure (for backward compatibility)
    const actualColKey = colKeyParts.length > 1 ? colKeyParts.slice(0, -1).join(';') : colKey;
    
    const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
    const rowCells = cellMap?.get(rowKey);
    const cell = rowCells?.get(actualColKey) || rowCells?.get(colKey);
    
    const value = cell?.formattedValue || (cell?.value !== undefined ? String(cell.value) : '');
    
    const x = rowHeaderWidth + colIdx * CELL_WIDTH;
    const y = columnHeaderHeight + rowIdx * CELL_HEIGHT;
    
    const isTotal = cell?.isTotal || false;
    const cellStyle = isTotal ? totalCellStyles : dataCellStyles;
    const isHighlighted = isCellHighlighted(rowKey, colKey);

    const style = {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      ...cellStyle,
      ...(isHighlighted ? hoverHighlightStyle : {}),
    };

    const key = rowKey + ":" + colKey;
    return (
      <div
        key={key}
        data-testid={key}
        className={`grid-cell ${isTotal ? 'total' : ''}`}
        style={style}
        onMouseEnter={() => setHoveredCell({ rowKey, colKey })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div className="cell-content">
          {value}
        </div>
      </div>
    );
  }, [getRowLeafNode, getColumnLeafNode, pivotCellByColKeyByRowKeyByMeasureId, rowHeaderWidth, columnHeaderHeight, isCellHighlighted]);

  /**
   * Render total cells for rows (row totals column)
   */
  const renderRowTotalCells = React.useCallback((): React.ReactNode[] => {
    if (!hasColTotals || !rowLeafNodes) {
      return [];
    }

    const cells: React.ReactNode[] = [];
    
    for (let rowIdx = 0; rowIdx < rowLeafNodes.length; rowIdx++) {
      const rowNode = rowLeafNodes[rowIdx];
      const rowKey = rowNode.key;
      
      const x = rowHeaderWidth + dataColCount * CELL_WIDTH;
      const y = columnHeaderHeight + rowIdx * CELL_HEIGHT;
      
      const isHighlighted = isCellHighlighted(rowKey, TOTAL);
      
      // Aggregate all measures for this row
      const values: (string | number)[] = [];
      for (const measureId of measures) {
        const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
        const rowCells = cellMap?.get(rowKey);
        const totalCell = rowCells?.get(TOTAL);
        if (totalCell) {
          values.push(totalCell.formattedValue || totalCell.value);
        }
      }
      
      const style = {
        position: 'absolute' as const,
        left: x,
        top: y,
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        ...totalCellStyles,
        ...(isHighlighted ? hoverHighlightStyle : {}),
      };

      const testId = `${rowKey}:${TOTAL}`;
      cells.push(
        <div
          key={`row-total-${x}-${y}`}
          className="grid-cell total"
          data-testid={testId}
          style={style}
          onMouseEnter={() => setHoveredCell({ rowKey, colKey: TOTAL })}
          onMouseLeave={() => setHoveredCell(null)}
        >
          <div className="cell-content">
            {values.join(' / ')}
          </div>
        </div>
      );
    }
    
    return cells;
  }, [hasColTotals, rowLeafNodes, dataColCount, columnHeaderHeight, rowHeaderWidth, isCellHighlighted, measures, pivotCellByColKeyByRowKeyByMeasureId]);

  /**
   * Render total cells for columns (column totals row)
   */
  const renderColumnTotalCells = React.useCallback((): React.ReactNode[] => {
    if (!hasRowTotals || !columnLeafNodes) {
      return [];
    }

    const cells: React.ReactNode[] = [];
    
    for (let colIdx = 0; colIdx < columnLeafNodes.length; colIdx++) {
      const colNode = columnLeafNodes[colIdx];
      const colKeyParts = colNode.key.split(';');
      const measureId = colKeyParts[colKeyParts.length - 1];
      const actualColKey = colKeyParts.length > 1 ? colKeyParts.slice(0, -1).join(';') : colNode.key;
      
      const x = rowHeaderWidth + colIdx * CELL_WIDTH;
      const y = columnHeaderHeight + dataRowCount * CELL_HEIGHT;
      
      const isHighlighted = isCellHighlighted(TOTAL, actualColKey);
      
      const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
      const rowCells = cellMap?.get(TOTAL);
      const cell = rowCells?.get(actualColKey);
      
      const value = cell?.formattedValue || (cell?.value !== undefined ? String(cell.value) : '');
      
      const style = {
        position: 'absolute' as const,
        left: x,
        top: y,
        width: CELL_WIDTH,
        height: CELL_HEIGHT,
        ...totalCellStyles,
        ...(isHighlighted ? hoverHighlightStyle : {}),
      };

      const testId = `${TOTAL}:${colNode.key}`;
      cells.push(
        <div
          key={`total-${x}-${y}`}
          className="grid-cell total"
          data-testid={testId}
          style={style}
          onMouseEnter={() => setHoveredCell({ rowKey: TOTAL, colKey: actualColKey })}
          onMouseLeave={() => setHoveredCell(null)}
        >
          <div className="cell-content">
            {value}
          </div>
        </div>
      );
    }
    
    return cells;
  }, [hasRowTotals, columnLeafNodes, dataRowCount, columnHeaderHeight, rowHeaderWidth, isCellHighlighted, pivotCellByColKeyByRowKeyByMeasureId]);

  /**
   * Render grand total cell
   */
  const renderGrandTotalCell = React.useCallback((): React.ReactNode | null => {
    if (!hasRowTotals || !hasColTotals || !showGrandTotal) {
      return null;
    }

    const x = rowHeaderWidth + dataColCount * CELL_WIDTH;
    const y = columnHeaderHeight + dataRowCount * CELL_HEIGHT;
    
    const isHighlighted = isCellHighlighted(TOTAL, TOTAL);
    
    const values: (string | number)[] = [];
    for (const measureId of measures) {
      const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
      const rowCells = cellMap?.get(TOTAL);
      const grandTotalCell = rowCells?.get(TOTAL);
      if (grandTotalCell) {
        values.push(grandTotalCell.formattedValue || grandTotalCell.value);
      }
    }
    
    const style = {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      ...grandTotalCellStyles,
      ...(isHighlighted ? hoverHighlightStyle : {}),
    };

    return (
      <div
        key="grand-total"
        className="grid-cell total grand-total"
        data-testid="__GRAND_TOTAL__"
        style={style}
        onMouseEnter={() => setHoveredCell({ rowKey: TOTAL, colKey: TOTAL })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div className="cell-content">
          {values.join(' / ')}
        </div>
      </div>
    );
  }, [hasRowTotals, hasColTotals, showGrandTotal, dataColCount, dataRowCount, columnHeaderHeight, rowHeaderWidth, isCellHighlighted, measures, pivotCellByColKeyByRowKeyByMeasureId]);

  // ==========================================================================
  // CORNER CELL
  // ==========================================================================

  /**
   * Render the corner cell (top-left)
   */
  const renderCornerCell = React.useCallback((): React.ReactNode => {
    const style = {
      position: 'absolute' as const,
      left: scrollLeft,
      top: scrollTop,
      width: rowHeaderWidth,
      height: columnHeaderHeight,
      ...cornerCellStyles,
      zIndex: 12,
    };

    return (
      <div
        key="corner"
        className="corner-cell"
        style={style}
      />
    );
  }, [scrollLeft, scrollTop, rowHeaderWidth, columnHeaderHeight]);

  // Générer toutes les cellules visibles
  const visibleCells = React.useMemo(() => {
    const cells: React.ReactNode[] = [];

    // Corner cell
    cells.push(renderCornerCell());

    // Column hierarchy headers
    cells.push(...renderColumnHierarchyHeaders());

    // Row hierarchy headers
    cells.push(...renderRowHierarchyHeaders());

    // Data cells (only visible ones)
    const startRowForLoop = Math.max(0, startRow);
    const endRowForLoop = Math.min(dataRowCount, endRow);
    const startColForLoop = Math.max(0, startCol);
    const endColForLoop = Math.min(dataColCount, endCol);

    for (let rowIdx = startRowForLoop; rowIdx < endRowForLoop; rowIdx++) {
      for (let colIdx = startColForLoop; colIdx < endColForLoop; colIdx++) {
        const cell = renderDataCell(rowIdx, colIdx);
        if (cell) {
          cells.push(cell);
        }
      }
    }

    // Row total cells
    cells.push(...renderRowTotalCells());

    // Column total cells
    cells.push(...renderColumnTotalCells());

    // Grand total cell
    const grandTotal = renderGrandTotalCell();
    if (grandTotal) {
      cells.push(grandTotal);
    }

    return cells;
  }, [
    startRow, endRow, startCol, endCol,
    dataRowCount, dataColCount,
    renderCornerCell,
    renderColumnHierarchyHeaders,
    renderRowHierarchyHeaders,
    renderDataCell,
    renderRowTotalCells,
    renderColumnTotalCells,
    renderGrandTotalCell
  ]);

  // Si aucune donnée, afficher un message
  // Note: This check must come AFTER all hooks
  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="pivot-grid-table">
        <div className="empty-message" style={{ padding: '20px' }}>
          No data to display. Add dimensions and measures to configure your pivot table.
        </div>
      </div>
    );
  }

  // If no hierarchies, fall back to legacy rendering
  if (!rowHierarchy || !columnHierarchy) {
    return (
      <div className="pivot-grid-table">
        <div className="empty-message" style={{ padding: '20px' }}>
          Hierarchy data not available. Please ensure the pivot data includes hierarchies.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="pivot-grid-wrapper"
      style={{
        overflow: 'auto',
        position: 'relative',
        width: '100%',
        height: '100%'
      }}            
    >
      <div style={{
        position: 'relative',
        width: gridTotalWidth,
        height: gridTotalHeight
      }}>
        {visibleCells}
      </div>
    </div>
  );
});
