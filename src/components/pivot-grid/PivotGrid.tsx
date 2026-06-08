import { useMemo, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import type {
  DataItem,
  Cell,
  PivotData,
  AggregationFunction,
  PivotGridProps,
  DimensionValues,
} from '../../models/types';
import { aggregationFunctions } from '../../utils/aggregations';
import { store } from '../../store';

/**
 * PivotGrid Component - A pivot table component for data exploration
 * Inspired by Excel pivot tables
 * 
 * Now using MobX for state management in MVC pattern.
 * Store acts as Controller, managing state (Model) and actions.
 * All configuration state (rowFields, columnFields, valueFields, aggregation) is stored in MobX Store.
 * 
 * This component is split into smaller sub-components for better maintainability:
 * - PivotGridConfiguration: Configuration panel with field selectors
 * - PivotGridTable: The actual pivot table display
 * - PivotGridSummary: Summary of current configuration
 */
import PivotGridConfiguration from './PivotGridConfiguration';
import PivotGridTable from './PivotGridTable';
import PivotGridSummary from './PivotGridSummary';

const PivotGrid: React.FC<PivotGridProps> = observer(function PivotGrid({
  data: externalData = [],
  defaultRowFields = [],
  defaultColumnFields = [],
  defaultValueFields = [],
  defaultAggregation = 'sum'
}) {
  // Get state from MobX store
  const {
    rowFields,
    columnFields,
    valueFields,
    aggregation,
    availableFields,
    data: reduxData
  } = store;

  // Track if we've initialized from props to avoid re-initializing
  const initializedRef = useRef(false);

  // Use external data if provided, otherwise use MobX store data
  const displayData = externalData.length > 0 ? externalData : reduxData;

  // Initialize MobX store state with default props if empty (only once)
  useEffect(() => {
    // Only initialize once to avoid resetting when state becomes empty
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Only initialize if MobX store state is empty and we have default props
    if (rowFields.length === 0 && defaultRowFields.length > 0) {
      store.setRowFields(defaultRowFields);
    }
    if (columnFields.length === 0 && defaultColumnFields.length > 0) {
      store.setColumnFields(defaultColumnFields);
    }
    if (valueFields.length === 0 && defaultValueFields.length > 0) {
      store.setValueFields(defaultValueFields);
    }
    if (aggregation === 'sum' && defaultAggregation !== 'sum') {
      store.setAggregation(defaultAggregation);
    }
    // If we have external data, set it in MobX store
    if (externalData.length > 0 && reduxData.length === 0) {
      store.setData(externalData);
    }
  }, [rowFields.length, columnFields.length, valueFields.length, aggregation, defaultRowFields, defaultColumnFields, defaultValueFields, defaultAggregation, externalData, reduxData]);

  // Get all available field names from data (fallback if MobX availableFields is empty)
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

  return (
    <div className="pivot-grid-container">
      <h2>Pivot Table Explorer</h2>
      
      {/* Configuration Panel */}
      <PivotGridConfiguration allFields={allFields} />

      {/* Pivot Table Display */}
      <div className="pivot-table-container">
        <h3>Pivot Table Result</h3>
        
        {displayData.length === 0 ? (
          <div className="empty-message">No data available</div>
        ) : (
          <PivotGridTable
            data={displayData}
            rowFields={rowFields}
            columnFields={columnFields}
            valueFields={valueFields}
            aggregation={aggregation}
          />
        )}
      </div>

      {/* Summary */}
      <PivotGridSummary pivotData={pivotData} />
    </div>
  );
});

export default PivotGrid;
