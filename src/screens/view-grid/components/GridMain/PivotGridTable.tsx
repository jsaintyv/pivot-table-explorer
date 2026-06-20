import { observer } from 'mobx-react-lite';
import { TOTAL } from '../../../../services/PivotDataService';
import type { PivotCell } from '../../../../stores';
import type { PivotData } from '../../../../stores/ViewStore';
import React from 'react';


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

const headerCellStyles = {
  ...commonCellStyles,
  backgroundColor: '#f5f5f5',
  borderTop: '2px solid #d0d0d0',
  fontWeight: 600,
  color: '#333',
};

const rowHeaderCellStyles = {
  ...commonCellStyles,
  backgroundColor: '#f5f5f5',
  borderLeft: '2px solid #d0d0d0',
  fontWeight: 600,
  color: '#333',
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
  ...headerCellStyles,
  backgroundColor: '#e8f5e8',
  borderLeft: '2px solid #a0d0a0',
  fontWeight: 700,
};

const rowHeaderTotalCellStyles = {
  ...rowHeaderCellStyles,
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
  const {rows, columns, measures, pivotCellByColKeyByRowKeyByMeasureId} = pivotData;

  // Si aucune donnée, afficher un message
  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="pivot-grid-table">
        <div className="empty-message" style={{ padding: '20px' }}>
          No data to display. Add dimensions and measures to configure your pivot table.
        </div>
      </div>
    );
  }

  // Vérifier si on doit afficher les totaux
  const hasRowTotals = showTotals && rows.some(r => r.axeKey === TOTAL);
  const hasColTotals = showTotals && columns.some(c => c.axeKey === TOTAL);

  // Calculer les dimensions de la grille
  const dataColCount = columns.length * measures.length;
  const totalColCount = hasColTotals ? 1 : 0;
  const totalRowCount = hasRowTotals ? 1 : 0;

  const gridTotalWidth = (1 + dataColCount + totalColCount) * CELL_WIDTH;
  const gridTotalHeight = (1 + rows.length + totalRowCount) * CELL_HEIGHT;

  // Référence pour le conteneur de scroll
  const containerRef = React.useRef<HTMLDivElement>(null);

  // État pour le scroll et la taille du viewport
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportWidth, setViewportWidth] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);

  // État pour la cellule survolée (highlight de la ligne et colonne)
  const [hoveredCell, setHoveredCell] = React.useState<{ rowIdx: number; colIdx: number } | null>(null);

  // Calculer les cellules visibles avec buffer
  const startCol = Math.max(0, Math.floor(scrollLeft / CELL_WIDTH) - SCROLL_BUFFER);
  const endCol = Math.min(
    dataColCount + totalColCount,
    Math.ceil((scrollLeft + viewportWidth) / CELL_WIDTH) + SCROLL_BUFFER
  );

  const startRow = Math.max(0, Math.floor(scrollTop / CELL_HEIGHT) - SCROLL_BUFFER);
  const endRow = Math.min(
    rows.length + totalRowCount,
    Math.ceil((scrollTop + viewportHeight) / CELL_HEIGHT) + SCROLL_BUFFER
  );
  
  const headerTop = scrollTop;
  const headerLeft = scrollLeft;

  // Écouter les événements de scroll et de resize
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Utiliser requestAnimationFrame pour éviter trop de re-renders
      requestAnimationFrame(() => {
        setScrollLeft(container.scrollLeft);
        setScrollTop(container.scrollTop);
      });
    };

    const handleResize = () => {
      setViewportWidth(container.clientWidth);
      setViewportHeight(container.clientHeight);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Initialisation
    handleScroll();
    handleResize();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fonction pour obtenir le label d'une colonne de données
  const getColumnLabel = React.useCallback((colIdx: number): string => {
    if (colIdx === 0) return '';
    const dataColIndex = colIdx - 1;
    if (dataColIndex < 0 || dataColIndex >= dataColCount) {
      return hasColTotals && colIdx === dataColCount + 1 ? 'Total' : '';
    }
    const colGroupIndex = Math.floor(dataColIndex / measures.length);
    return columns[colGroupIndex]?.axeKey || '';
  }, [columns, measures.length, dataColCount, hasColTotals]);

  // Fonction pour gérer le survol des cellules
  const handleCellMouseEnter = React.useCallback((rowIdx: number, colIdx: number) => {
    setHoveredCell({ rowIdx, colIdx });
  }, []);

  const handleCellMouseLeave = React.useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Vérifie si une cellule doit être surlignée
  const isCellHighlighted = React.useCallback((rowIdx: number, colIdx: number): boolean => {
    if (!hoveredCell) return false;
    return rowIdx === hoveredCell.rowIdx || colIdx === hoveredCell.colIdx;
  }, [hoveredCell]);

  // Rendre une cellule individuelle
  const renderCell = React.useCallback((rowIdx: number, colIdx: number, headerTop: number, headerLeft: number): React.ReactNode => {
    const isColumnHeader = rowIdx === 0;
    const isRowHeader = colIdx === 0;
    const isTotalRow = rowIdx > rows.length && hasRowTotals;
    const isTotalCol = colIdx > dataColCount && hasColTotals;

    const x = colIdx * CELL_WIDTH;
    const y = rowIdx * CELL_HEIGHT;

    // Style de base pour positionnement
    const baseStyle = {
      position: 'absolute' as const,
      left: x,
      top: y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
    };

    // Cellule coin (0, 0)
    if (isColumnHeader && isRowHeader) {
      baseStyle.top = headerTop;
      baseStyle.left = headerLeft;
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);
      return (
        <div
          key={`corner-${rowIdx}-${colIdx}`}
          className="corner-cell"
          style={{ 
            ...baseStyle, 
            ...cornerCellStyles,
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        />
      );
    }

    // En-tête de colonne (ligne 0, colonnes de données)
    if (isColumnHeader && colIdx > 0 && colIdx <= dataColCount) {
      const colLabel = getColumnLabel(colIdx);
      baseStyle.top = headerTop;
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);
      return (
        <div
          key={`col-header-${rowIdx}-${colIdx}`}
          className="grid-cell header column-header"
          style={{ 
            ...baseStyle, 
            ...(isHighlighted ? hoverHighlightStyleHeader : {}),
            ...headerCellStyles            
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="header-content">
            <span className="header-label">{colLabel}</span>
          </div>
        </div>
      );
    }

    // En-tête de la colonne Total (ligne 0)
    if (isRowHeader && hasColTotals && colIdx === dataColCount + 1) {
      baseStyle.left = headerLeft;
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);
      return (
        <div
          key={`total-col-header-${rowIdx}-${colIdx}`}
          className="grid-cell header row-header total"
          style={{ 
            ...baseStyle, 
            ...headerTotalCellStyles,
            ...(isHighlighted ? hoverHighlightStyleHeader : {}),            
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="header-content">
            <span className="header-label">Total</span>
          </div>
        </div>
      );
    }

    // En-tête de ligne (colonne 0, lignes de données)
    if (colIdx === 0 && rowIdx > 0) {
      const rowLabel = rowIdx <= rows.length 
        ? rows[rowIdx - 1].axeKey 
        : hasRowTotals ? 'Total' : '';
      
      const cellStyle = isTotalRow ? rowHeaderTotalCellStyles : rowHeaderCellStyles;
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);

      baseStyle.left = headerLeft;
      
      return (
        <div
          key={`row-header-${rowIdx}-${colIdx}`}
          className={`grid-cell header row-header ${isTotalRow ? 'total' : ''}`}
          style={{ 
            ...baseStyle, 
            ...cellStyle,
            ...(isHighlighted ? hoverHighlightStyleHeader : {})
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="row-header-content">
            <span className="row-header-label">{rowLabel}</span>
          </div>
        </div>
      );
    }

    // Cellule de donnée (corps)
    if (rowIdx > 0 && rowIdx <= rows.length && colIdx > 0 && colIdx <= dataColCount) {
      const rowKey = rows[rowIdx - 1].axeKey;
      const dataColIndex = colIdx - 1;
      const colGroupIndex = Math.floor(dataColIndex / measures.length);
      const measureIndex = dataColIndex % measures.length;
      const measureId = measures[measureIndex];
      const colKey = columns[colGroupIndex].axeKey;

      const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
      const rowCells = cellMap?.get(rowKey);
      const cell = rowCells?.get(colKey);
      const value = cell?.formattedValue || (cell?.value !== undefined ? String(cell.value) : '');

      const isTotal = isTotalRow || colKey === TOTAL;
      const cellStyle = isTotal ? totalCellStyles : dataCellStyles;
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);

      return (
        <div
          key={`data-${rowIdx}-${colIdx}-${measureId}`}
          className={`grid-cell ${isTotal ? 'total' : ''}`}
          style={{ 
            ...baseStyle, 
            ...cellStyle,
            ...(isHighlighted ? hoverHighlightStyle : {})
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="cell-content">
            {value}
          </div>
        </div>
      );
    }

    // Total par ligne (colonne Total, lignes de données sauf la ligne Total)
    if (rowIdx > 0 && rowIdx <= rows.length && hasColTotals && colIdx === dataColCount + 1 && !isTotalRow) {
      const rowKey = rows[rowIdx - 1].axeKey;
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);
      
      return (
        <div
          key={`row-total-${rowIdx}-${colIdx}`}
          className="grid-cell total"
          style={{ 
            ...baseStyle, 
            ...totalCellStyles,
            ...(isHighlighted ? hoverHighlightStyle : {})
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="cell-content">
            {measures.map((measureId) => {
              const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
              const rowCells = cellMap?.get(rowKey);
              const totalCell = rowCells?.get(TOTAL);
              return (
                <span key={`${rowKey}-${TOTAL}-${measureId}`}>
                  {totalCell?.formattedValue || (totalCell?.value !== undefined ? String(totalCell.value) : '')}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    // Ligne Total (toutes colonnes de données)
    if (hasRowTotals && rowIdx === rows.length + 1 && colIdx > 0 && colIdx <= dataColCount) {
      const dataColIndex = colIdx - 1;
      const colGroupIndex = Math.floor(dataColIndex / measures.length);
      const measureIndex = dataColIndex % measures.length;
      const measureId = measures[measureIndex];
      const colKey = columns[colGroupIndex].axeKey;

      const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
      const rowCells = cellMap?.get(TOTAL);
      const cell = rowCells?.get(colKey);
      const value = cell?.formattedValue || (cell?.value !== undefined ? String(cell.value) : '');
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);

      return (
        <div
          key={`total-row-data-${rowIdx}-${colIdx}-${measureId}`}
          className="grid-cell total"
          style={{ 
            ...baseStyle, 
            ...totalCellStyles,
            ...(isHighlighted ? hoverHighlightStyle : {})
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="cell-content">
            {value}
          </div>
        </div>
      );
    }

    // Grand total (intersection ligne Total x colonne Total)
    if (hasRowTotals && hasColTotals && showGrandTotal && 
        rowIdx === rows.length + 1 && colIdx === dataColCount + 1) {
      const isHighlighted = isCellHighlighted(rowIdx, colIdx);
      
      return (
        <div
          key={`grand-total-${rowIdx}-${colIdx}`}
          className="grid-cell total grand-total"
          style={{ 
            ...baseStyle, 
            ...grandTotalCellStyles,
            ...(isHighlighted ? hoverHighlightStyle : {})
          }}
          onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
          onMouseLeave={handleCellMouseLeave}
        >
          <div className="cell-content">
            {measures.map((measureId) => {
              const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
              const rowCells = cellMap?.get(TOTAL);
              const grandTotalCell = rowCells?.get(TOTAL);
              return (
                <span key={`${TOTAL}-${TOTAL}-${measureId}`}>
                  {grandTotalCell?.formattedValue || (grandTotalCell?.value !== undefined ? String(grandTotalCell.value) : '')}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }, [rows, columns, measures, pivotCellByColKeyByRowKeyByMeasureId, dataColCount, hasRowTotals, hasColTotals, showGrandTotal, getColumnLabel, hoveredCell, handleCellMouseEnter, handleCellMouseLeave, isCellHighlighted]);

  // Générer les cellules visibles
  const visibleCells = React.useMemo(() => {
    const cells: React.ReactNode[] = [];


    const cell = renderCell(0, 0, headerTop, headerLeft);
    if (cell) {
      cells.push(cell);
    }

    const startRowForLoop = Math.max(1, startRow);
    const startColForLoop = Math.max(1, startCol);


    for (let rowIdx = startRowForLoop; rowIdx <= endRow; rowIdx++) {
      const cell = renderCell(rowIdx, 0, headerTop, headerLeft);
        if (cell) {
          cells.push(cell);
        }
    }

    for (let colIdx = startColForLoop; colIdx <= endCol; colIdx++) {
       const cell = renderCell(0, colIdx, headerTop, headerLeft);
        if (cell) {
          cells.push(cell);
        }
    }
    
    for (let rowIdx = startRowForLoop; rowIdx <= endRow; rowIdx++) {
      for (let colIdx = startColForLoop; colIdx <= endCol; colIdx++) {
        const cell = renderCell(rowIdx, colIdx, headerTop, headerLeft);
        if (cell) {
          cells.push(cell);
        }
      }
    }
    
    return cells;
  }, [startRow, endRow, startCol, endCol, headerTop, headerLeft , renderCell]);

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
      onMouseLeave={handleCellMouseLeave}
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
