import React, { useMemo, useEffect } from 'react';
import type {
  DataItem,
  Cell,
  PivotData,
  AggregationFunction,
  PivotGridProps,
  DimensionValues,
} from '../models/types';
import { aggregationFunctions } from '../utils/aggregations';
import {
  useAppSelector,
  useAppDispatch,
  selectRowFields,
  selectColumnFields,
  selectValueFields,
  selectAggregation,
  selectAvailableFields,
  selectData,
  setRowFields,
  setColumnFields,
  setValueFields,
  setAggregation,
  setData,
  resetAll,
} from '../store';

/**
 * PivotGrid Component - A pivot table component for data exploration
 * Inspired by Excel pivot tables
 * 
 * Now using Redux for state management instead of local useState.
 * All configuration state (rowFields, columnFields, valueFields, aggregation) is stored in Redux.
 */
const PivotGrid: React.FC<PivotGridProps> = ({
  data: externalData = [],
  defaultRowFields = [],
  defaultColumnFields = [],
  defaultValueFields = [],
  defaultAggregation = 'sum'
}) => {
  // Get state from Redux store
  const dispatch = useAppDispatch();
  const rowFields = useAppSelector(selectRowFields);
  const columnFields = useAppSelector(selectColumnFields);
  const valueFields = useAppSelector(selectValueFields);
  const aggregation = useAppSelector(selectAggregation);
  const availableFields = useAppSelector(selectAvailableFields);
  const reduxData = useAppSelector(selectData);

  // Track if we've initialized from props to avoid re-initializing
  const initializedRef = React.useRef(false);

  // Use external data if provided, otherwise use Redux data
  const displayData = externalData.length > 0 ? externalData : reduxData;

  // Initialize Redux state with default props if empty (only once)
  useEffect(() => {
    // Only initialize once to avoid resetting when state becomes empty
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Only initialize if Redux state is empty and we have default props
    if (rowFields.length === 0 && defaultRowFields.length > 0) {
      dispatch(setRowFields(defaultRowFields));
    }
    if (columnFields.length === 0 && defaultColumnFields.length > 0) {
      dispatch(setColumnFields(defaultColumnFields));
    }
    if (valueFields.length === 0 && defaultValueFields.length > 0) {
      dispatch(setValueFields(defaultValueFields));
    }
    if (aggregation === 'sum' && defaultAggregation !== 'sum') {
      dispatch(setAggregation(defaultAggregation));
    }
    // If we have external data, set it in Redux
    if (externalData.length > 0 && reduxData.length === 0) {
      dispatch(setData(externalData));
    }
  }, [dispatch, rowFields.length, columnFields.length, valueFields.length, aggregation, defaultRowFields, defaultColumnFields, defaultValueFields, defaultAggregation, externalData, reduxData]);

  // Get all available field names from data (fallback if Redux availableFields is empty)
  const allFields: string[] = useMemo(() => {
    if (availableFields.length > 0) return availableFields;
    if (displayData.length === 0) return [];
    return Object.keys(displayData[0]);
  }, [availableFields, displayData]);

  // Generate pivot data
  const pivotData: PivotData = useMemo(() => {
    if (displayData.length === 0 || rowFields.length === 0 || columnFields.length === 0 || valueFields.length === 0) {
      return { rows: [], columns: [], grid: [] };
    }

    const aggregateFn = aggregationFunctions[aggregation] || aggregationFunctions.sum;

    // Collect all unique values for row and column dimensions
    const rowDimensionValues: DimensionValues = {};
    const columnDimensionValues: DimensionValues = {};

    // Build dimension value collections
    rowFields.forEach(field => {
      rowDimensionValues[field] = [...new Set(displayData.map(item => String(item[field] || '')))];
    });

    columnFields.forEach(field => {
      columnDimensionValues[field] = [...new Set(displayData.map(item => String(item[field] || '')))];
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
        const filteredData = displayData.filter(item => {
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
  }, [displayData, rowFields, columnFields, valueFields, aggregation, availableFields]);

  // Handle field selection changes - dispatch Redux actions
  const handleRowFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      // Add field to row fields
      dispatch(setRowFields([...rowFields, field]));
    } else {
      // Remove field from row fields
      dispatch(setRowFields(rowFields.filter(f => f !== field)));
    }
  };

  const handleColumnFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      dispatch(setColumnFields([...columnFields, field]));
    } else {
      dispatch(setColumnFields(columnFields.filter(f => f !== field)));
    }
  };

  const handleValueFieldChange = (field: string, isChecked: boolean) => {
    if (isChecked) {
      dispatch(setValueFields([...valueFields, field]));
    } else {
      dispatch(setValueFields(valueFields.filter(f => f !== field)));
    }
  };

  const handleAggregationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setAggregation(e.target.value as AggregationFunction));
  };

  // Reset all selections
  const handleReset = () => {
    dispatch(resetAll());
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
        
        {displayData.length === 0 ? (
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
