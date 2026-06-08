/**
 * PivotGridTable Component
 * 
 * Renders the actual pivot table grid based on data and configuration.
 * Part of the MVC View layer.
 */

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { aggregationFunctions } from '../utils/aggregations';
import type {
  DataItem,
  Cell,
  PivotData,
  AggregationFunction,
  DimensionValues,
} from '../models/types';

interface PivotGridTableProps {
  data: DataItem[];
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
  aggregation: AggregationFunction;
}

export const PivotGridTable: React.FC<PivotGridTableProps> = observer(({
  data,
  rowFields,
  columnFields,
  valueFields,
  aggregation
}) => {
  // Generate pivot data
  const pivotData: PivotData = useMemo(() => {
    if (data.length === 0 || rowFields.length === 0 || columnFields.length === 0 || valueFields.length === 0) {
      return { rows: [], columns: [], grid: [] };
    }

    const aggregateFn = aggregationFunctions[aggregation] || aggregationFunctions.sum;

    // Collect all unique values for row and column dimensions
    const rowDimensionValues: DimensionValues = {};
    const columnDimensionValues: DimensionValues = {};

    // Build dimension value collections
    rowFields.forEach(field => {
      rowDimensionValues[field] = [...new Set(data.map(item => String(item[field] || '')))];
    });

    columnFields.forEach(field => {
      columnDimensionValues[field] = [...new Set(data.map(item => String(item[field] || '')))];
    });

    // Generate all row combinations
    const generateRowCombinations = (
      fields: string[], 
      index: number = 0, 
      current: string[] = []
    ): string[][] => {
      if (index === fields.length) {
        return [current];
      }
      const field = fields[index];
      const values = rowDimensionValues[field] || [];
      return values.flatMap(value => 
        generateRowCombinations(fields, index + 1, [...current, value])
      );
    };

    // Generate all column combinations
    const generateColumnCombinations = (
      fields: string[], 
      index: number = 0, 
      current: string[] = []
    ): string[][] => {
      if (index === fields.length) {
        return [current];
      }
      const field = fields[index];
      const values = columnDimensionValues[field] || [];
      return values.flatMap(value => 
        generateColumnCombinations(fields, index + 1, [...current, value])
      );
    };

    const rowCombinations = generateRowCombinations(rowFields);
    const columnCombinations = generateColumnCombinations(columnFields);

    // Create the pivot grid
    const grid: Cell[][] = [];

    // Header row
    const headerRow: Cell[] = [
      { 
        value: '', 
        isHeader: true, 
        rowSpan: rowFields.length > 0 ? rowFields.length : 1,
        colSpan: 1,
        isCorner: true 
      },
      ...rowFields.map(field => ({
        value: field,
        isHeader: true,
        rowSpan: 1,
        colSpan: 1,
        isRowLabel: true
      }))
    ];

    // Add column headers
    columnCombinations.forEach(colCombo => {
      const colHeader: Cell = {
        value: colCombo.join(' / '),
        isHeader: true,
        rowSpan: 1,
        colSpan: 1,
        isColumnLabel: true
      };
      headerRow.push(colHeader);
    });

    grid.push(headerRow);

    // Data rows
    rowCombinations.forEach((rowCombo) => {
      const row: Cell[] = [];

      // Row labels
      row.push({
        value: rowCombo.join(' / '),
        isHeader: true,
        rowSpan: 1,
        colSpan: 1,
        isRowLabel: true
      });

      // Row dimension values
      rowCombo.forEach(value => {
        row.push({
          value: value,
          isHeader: false,
          rowSpan: 1,
          colSpan: 1
        });
      });

      // Calculate values for each column combination
      columnCombinations.forEach(colCombo => {
        // Filter data that matches both row and column combinations
        const filteredData = data.filter(item => {
          // Check row fields
          const rowMatch = rowFields.every((field, i) => {
            return String(item[field] || '') === String(rowCombo[i] || '');
          });
          
          // Check column fields
          const columnMatch = columnFields.every((field, i) => {
            return String(item[field] || '') === String(colCombo[i] || '');
          });

          return rowMatch && columnMatch;
        });

        // Aggregate values for each value field
        const aggregatedValues = valueFields.map(valueField => {
          const values = filteredData.map(item => item[valueField]);
          return aggregateFn(values);
        });

        // For now, use the first value field or sum all
        const displayValue = valueFields.length === 1 
          ? aggregatedValues[0] 
          : aggregatedValues.reduce((a, b) => a + b, 0);

        row.push({
          value: displayValue,
          isHeader: false,
          rowSpan: 1,
          colSpan: 1,
          isDataCell: true
        });
      });

      grid.push(row);
    });

    return {
      rows: rowCombinations,
      columns: columnCombinations,
      grid
    };
  }, [data, rowFields, columnFields, valueFields, aggregation]);

  // Empty state
  if (pivotData.grid.length === 0) {
    return (
      <div className="empty-message">
        Select at least one field for Rows, Columns, and Values to generate the pivot table
      </div>
    );
  }

  return (
    <div className="pivot-table-wrapper">
      <table className="pivot-table">
        <tbody>
          {pivotData.grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td 
                  key={cellIndex}
                  className={`pivot-cell 
                    ${cell.isHeader ? 'header-cell' : 'data-cell'}
                    ${cell.isCorner ? 'corner-cell' : ''}
                    ${cell.isRowLabel ? 'row-label' : ''}
                    ${cell.isColumnLabel ? 'column-label' : ''}
                    ${cell.isDataCell ? 'value-cell' : ''}
                  `}
                  rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                  colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                  style={{
                    textAlign: cell.isHeader ? 'center' : 'right',
                    fontWeight: cell.isHeader ? 'bold' : 'normal'
                  }}
                >
                  {typeof cell.value === 'number' 
                    ? cell.value.toLocaleString()
                    : cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default PivotGridTable;
