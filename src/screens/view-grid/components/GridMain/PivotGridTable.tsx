import { observer } from 'mobx-react-lite';
import { TOTAL } from '../../../../services/PivotDataService';
import type { PivotCell } from '../../../../stores';
import type { PivotData } from '../../../../stores/ViewStore';
import React from 'react';


/**
 * PivotGridTable component
 * Tableau HTML du pivot table
 * Affiche les données du tableau croisé dynamique
 */

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
      <table className="pivot-grid-table">
        <tbody>
          <tr>
            <td colSpan={columns.length + (showTotals ? 1 : 0) + 1} className="empty-message">
              No data to display. Add dimensions and measures to configure your pivot table.
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // Vérifier si on doit afficher les totaux
  const hasRowTotals = showTotals && rows.some(r => r.axeKey === TOTAL);
  const hasColTotals = showTotals && columns.some(c => c.axeKey === TOTAL);

  return (
    <div className="pivot-grid-wrapper">
      <table className="pivot-grid-table">
        {/* En-têtes */}
        <thead>
          <tr>
            {/* Cellule coin supérieure gauche vide */}
            <th className="corner-cell" />
            
            {/* En-têtes de colonnes */}
            {columns.map((col) => (
              <th key={col.axeKey} className="grid-cell header" colSpan={measures.length}>
                <div className="header-content">
                  <span className="header-label">{col.axeKey}</span>
                </div>
              </th>
            ))}
            
            {/* Colonne des totaux par ligne */}
            {showTotals && hasColTotals && (
              <th className="grid-cell header total" rowSpan={1}>
                <div className="header-content">
                  <span className="header-label">Total</span>
                </div>
              </th>
            )}
          </tr>
        </thead>
        
        {/* Corps du tableau */}
        <tbody>
          {rows.map((row) => {
            const isTotalRow = row.axeKey === TOTAL;
            
            return (
              <tr key={row.axeKey} className={`grid-row ${isTotalRow ? 'total' : ''}`}>
                {/* En-tête de ligne */}
                <th className={`grid-cell header row-header ${isTotalRow ? 'total' : ''}`}>
                  <div className="row-header-content">
                    <span className="row-header-label">{row.axeKey}</span>
                  </div>
                </th>
                
                {/* Cellules de données pour chaque mesure et chaque colonne */}
                {columns.map((col) => {
                  const isTotalCol = col.axeKey === TOTAL;
                  
                  return (
                    <React.Fragment key={`${row.axeKey}-${col.axeKey}`}>
                      {measures.map((measureId) => {
                        const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
                        const rowCells = cellMap?.get(row.axeKey);
                        const cell = rowCells?.get(col.axeKey);
                        
                        return (
                          <td 
                            key={`${row.axeKey}-${col.axeKey}-${measureId}`} 
                            className={`grid-cell ${isTotalRow || isTotalCol ? 'total' : ''}`}
                          >
                            <div className="cell-content">
                              {cell?.formattedValue || (cell?.value !== undefined ? String(cell.value) : '')}
                            </div>
                          </td>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                
                {/* Total par ligne (si ce n'est pas la ligne TOTAL elle-même) */}
                {showTotals && hasColTotals && !isTotalRow && (
                  <td className="grid-cell total">
                    <div className="cell-content">
                      {measures.map((measureId) => {
                        const cellMap = pivotCellByColKeyByRowKeyByMeasureId.get(measureId);
                        const rowCells = cellMap?.get(row.axeKey);
                        const totalCell = rowCells?.get(TOTAL);
                        return (
                          <span key={`${row.axeKey}-${TOTAL}-${measureId}`}>
                            {totalCell?.formattedValue || (totalCell?.value !== undefined ? String(totalCell.value) : '')}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                )}
                
                {/* Grand total pour la ligne TOTAL */}
                {showTotals && hasColTotals && isTotalRow && showGrandTotal && (
                  <td className="grid-cell total grand-total">
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
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
