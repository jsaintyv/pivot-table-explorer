import { observer } from 'mobx-react-lite';
import type { PivotRow, PivotColumn, PivotCell } from '../../../../stores';

/**
 * PivotGridTable component
 * Tableau HTML du pivot table
 * Affiche les données du tableau croisé dynamique
 */

interface PivotGridTableProps {
  rows: PivotRow[];
  columns: PivotColumn[];
  data: PivotCell[][];
  showTotals?: boolean;
  showGrandTotal?: boolean;
}

export const PivotGridTable = observer(({
  rows,
  columns,
  data,
  showTotals = false,
  showGrandTotal = false,
}: PivotGridTableProps) => {
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

  // Calculer les totaux par ligne (dernière colonne)
  const rowTotals: (PivotCell | null)[] = rows.map((_, rowIndex) => {
    const rowData = data[rowIndex];
    if (!rowData || rowData.length === 0) return null;
    
    // Pour l'instant, on fait une somme simple des valeurs numériques
    const sum = rowData.reduce((acc, cell) => {
      const numericValue = typeof cell.value === 'number' ? cell.value : 0;
      return acc + numericValue;
    }, 0);
    
    return {
      value: sum,
      formattedValue: sum.toString(),
      rowKey: rows[rowIndex].key,
      colKey: 'total',
      isTotal: true,
    };
  });

  // Calculer les totaux par colonne (dernière ligne)
  const columnTotals: PivotCell[] = columns.map((col, colIndex) => {
    let sum = 0;
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const cell = data[rowIndex]?.[colIndex];
      const numericValue = typeof cell?.value === 'number' ? cell.value : 0;
      sum += numericValue;
    }
    
    return {
      value: sum,
      formattedValue: sum.toString(),
      rowKey: 'total',
      colKey: col.key,
      isTotal: true,
    };
  });

  // Calculer le grand total (si les deux options sont activées)
  const grandTotal: PivotCell | null = showGrandTotal && showTotals
    ? {
        value: columnTotals.reduce((acc, cell) => acc + (typeof cell.value === 'number' ? cell.value : 0), 0),
        formattedValue: columnTotals.reduce((acc, cell) => acc + (typeof cell.value === 'number' ? cell.value : 0), 0).toString(),
        rowKey: 'total',
        colKey: 'total',
        isTotal: true,
      }
    : null;

  return (
    <div className="pivot-grid-wrapper">
      <table className="pivot-grid-table">
        {/* En-têtes */}
        <thead>
          <tr>
            {/* Cellule coin supérieure gauche vide */}
            <th className="corner-cell" rowSpan={1} />
            
            {/* En-têtes de colonnes */}
            {columns.map((col) => (
              <th key={col.key} className="grid-cell header">
                <div className="header-content">
                  <span className="header-label">{col.label}</span>
                </div>
              </th>
            ))}
            
            {/* Colonne des totaux par ligne */}
            {showTotals && (
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
          {data.map((row, rowIndex) => (
            <tr key={rows[rowIndex].key} className="grid-row">
              {/* En-tête de ligne */}
              <th className="grid-cell header row-header">
                <div className="row-header-content">
                  <span className="row-header-label">{rows[rowIndex].label}</span>
                </div>
              </th>
              
              {/* Cellules de données */}
              {row.map((cell, colIndex) => (
                <td key={`${rows[rowIndex].key}-${columns[colIndex].key}`} className="grid-cell">
                  <div className="cell-content">
                    {cell.formattedValue || cell.value}
                  </div>
                </td>
              ))}
              
              {/* Total par ligne */}
              {showTotals && rowTotals[rowIndex] && (
                <td className="grid-cell total">
                  <div className="cell-content">
                    {rowTotals[rowIndex]?.formattedValue || rowTotals[rowIndex]?.value}
                  </div>
                </td>
              )}
            </tr>
          ))}
          
          {/* Ligne des totaux par colonne */}
          {showTotals && (
            <tr className="grid-row total">
              <th className="grid-cell header row-header total">
                <div className="row-header-content">
                  <span className="row-header-label">Total</span>
                </div>
              </th>
              
              {columnTotals.map((cell, colIndex) => (
                <td key={`total-${columns[colIndex].key}`} className="grid-cell total">
                  <div className="cell-content">
                    {cell.formattedValue || cell.value}
                  </div>
                </td>
              ))}
              
              {/* Grand total */}
              {showGrandTotal && grandTotal && (
                <td className="grid-cell total grand-total">
                  <div className="cell-content">
                    {grandTotal.formattedValue || grandTotal.value}
                  </div>
                </td>
              )}
            </tr>
          )}
          
          {/* Ligne du grand total seul (si pas de showTotals mais showGrandTotal) */}
          {showGrandTotal && !showTotals && (
            <tr className="grid-row grand-total">
              <th className="grid-cell header row-header grand-total">
                <div className="row-header-content">
                  <span className="row-header-label">Grand Total</span>
                </div>
              </th>
              
              {columnTotals.map((cell, colIndex) => (
                <td key={`grand-total-${columns[colIndex].key}`} className="grid-cell grand-total">
                  <div className="cell-content">
                    {cell.formattedValue || cell.value}
                  </div>
                </td>
              ))}
              
              <td className="grid-cell grand-total">
                <div className="cell-content">
                  {columnTotals.reduce((acc, cell) => acc + (typeof cell.value === 'number' ? cell.value : 0), 0)}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
