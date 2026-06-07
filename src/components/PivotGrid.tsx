import React, { useState, useMemo } from 'react';
import type {
  DataItem,
  Cell,
  PivotData,
  AggregationFunction,
  PivotGridProps,
  DimensionValues,
} from '../models/types';
import { aggregationFunctions } from '../utils/aggregations';

/**
 * PivotGrid Component - A pivot table component for data exploration
 * Inspired by Excel pivot tables
 */
const PivotGrid: React.FC<PivotGridProps> = ({
  data,
  defaultRowFields = [],
  defaultColumnFields = [],
  defaultValueFields = [],
  defaultAggregation = 'sum'
}) => {
  

  // State for pivot configuration
  const [rowFields, setRowFields] = useState<string[]>(defaultRowFields);
  const [columnFields, setColumnFields] = useState<string[]>(defaultColumnFields);
  const [valueFields, setValueFields] = useState<string[]>(defaultValueFields);
  const [aggregation, setAggregation] = useState<AggregationFunction>(defaultAggregation);

  // Get all available field names from data
  const allFields: string[] = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

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

  // Handle field selection changes
  const handleRowFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      setRowFields([...rowFields, field]);
    } else {
      setRowFields(rowFields.filter(f => f !== field));
    }
  };

  const handleColumnFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      setColumnFields([...columnFields, field]);
    } else {
      setColumnFields(columnFields.filter(f => f !== field));
    }
  };

  const handleValueFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      setValueFields([...valueFields, field]);
    } else {
      setValueFields(valueFields.filter(f => f !== field));
    }
  };

  const handleAggregationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAggregation(e.target.value as AggregationFunction);
  };

  // Reset all selections
  const handleReset = () => {
    setRowFields([]);
    setColumnFields([]);
    setValueFields([]);
    setAggregation('sum');
  };

  return (
    <div className="pivot-grid-container">
      <h2>Pivot Table Explorer</h2>
      
      {/* Configuration Panel */}
      <div className="pivot-configuration">
        <div className="config-section">
          <h3>Row Fields (Y-Axis)</h3>
          <div className="field-checkboxes">
            {allFields.map(field => (
              <label key={`row-${field}`} className="field-checkbox">
                <input
                  type="checkbox"
                  checked={rowFields.includes(field)}
                  onChange={(e) => handleRowFieldChange(field, e.target.checked)}
                  disabled={columnFields.includes(field) || valueFields.includes(field)}
                />
                {field}
              </label>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>Column Fields (X-Axis)</h3>
          <div className="field-checkboxes">
            {allFields.map(field => (
              <label key={`col-${field}`} className="field-checkbox">
                <input
                  type="checkbox"
                  checked={columnFields.includes(field)}
                  onChange={(e) => handleColumnFieldChange(field, e.target.checked)}
                  disabled={rowFields.includes(field) || valueFields.includes(field)}
                />
                {field}
              </label>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>Value Fields</h3>
          <div className="field-checkboxes">
            {allFields.map(field => (
              <label key={`val-${field}`} className="field-checkbox">
                <input
                  type="checkbox"
                  checked={valueFields.includes(field)}
                  onChange={(e) => handleValueFieldChange(field, e.target.checked)}
                  disabled={rowFields.includes(field) || columnFields.includes(field)}
                />
                {field}
              </label>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>Aggregation Function</h3>
          <select 
            value={aggregation} 
            onChange={handleAggregationChange}
            className="aggregation-select"
          >
            {Object.keys(aggregationFunctions).map(agg => (
              <option key={agg} value={agg}>
                {agg.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleReset} className="reset-button">
          Reset All
        </button>
      </div>

      {/* Pivot Table Display */}
      <div className="pivot-table-container">
        <h3>Pivot Table Result</h3>
        
        {data.length === 0 ? (
          <div className="empty-message">No data available</div>
        ) : (
          <>
            {pivotData.grid.length === 0 ? (
              <div className="empty-message">
                Select at least one field for Rows, Columns, and Values to generate the pivot table
              </div>
            ) : (
              <div className="pivot-table-wrapper">
                <table className="pivot-table">
                  <tbody>
                    {pivotData.grid.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td 
                            key={cellIndex}
                            className={`pivot-cell $
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
            )}
          </>
        )}
      </div>

      {/* Summary */}
      <div className="pivot-summary">
        <p>
          <strong>Configuration:</strong> 
          {rowFields.length > 0 && `Rows: ${rowFields.join(', ')} | `}
          {columnFields.length > 0 && `Columns: ${columnFields.join(', ')} | `}
          {valueFields.length > 0 && `Values: ${valueFields.join(', ')} | `}
          Aggregation: {aggregation.toUpperCase()}
        </p>
        <p>
          <strong>Total Rows:</strong> {pivotData.rows.length} | 
          <strong>Total Columns:</strong> {pivotData.columns.length}
        </p>
      </div>
    </div>
  );
};

export default PivotGrid;
