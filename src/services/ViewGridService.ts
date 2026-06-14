/**
 * ViewGridService
 * 
 * Service layer for ViewGrid operations (Model factories and transformers)
 * Used by ViewGridStore to manipulate View and related models
 */

import type {
  View,
  Dimension,
  Measure,
  FilterDimension,
  AggregationType,
  DataSource,
  LocalDataSource,
} from '../models/pivot-project/types';

export class ViewGridService {
  constructor() { }

  /**
   * Create a new view with default configuration
   */
  buildEmptyView(name: string = 'New View'): View {
    const now = new Date().toISOString();
    return {
      id: `view-${Date.now()}`,
      name,
      description: '',
      rowDimensions: [],
      columnDimensions: [],
      measures: [],
      filterDimensions: [],
      showTotals: true,
      showGrandTotal: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Add a dimension to row dimensions
   */
  addRowDimension(view: View, dimensionId: string): View {
    if (!view.rowDimensions.includes(dimensionId)) {
      const newRowDimensions = [...view.rowDimensions, dimensionId];
      return {
        ...view,
        rowDimensions: newRowDimensions,
        updatedAt: new Date().toISOString(),
      };
    }
    return view;
  }

  /**
   * Remove a dimension from row dimensions
   */
  removeRowDimension(view: View, dimensionId: string): View {
    const newRowDimensions = view.rowDimensions.filter(id => id !== dimensionId);
    return {
      ...view,
      rowDimensions: newRowDimensions,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add a dimension to column dimensions
   */
  addColumnDimension(view: View, dimensionId: string): View {
    if (!view.columnDimensions.includes(dimensionId)) {
      const newColumnDimensions = [...view.columnDimensions, dimensionId];
      return {
        ...view,
        columnDimensions: newColumnDimensions,
        updatedAt: new Date().toISOString(),
      };
    }
    return view;
  }

  /**
   * Remove a dimension from column dimensions
   */
  removeColumnDimension(view: View, dimensionId: string): View {
    const newColumnDimensions = view.columnDimensions.filter(id => id !== dimensionId);
    return {
      ...view,
      columnDimensions: newColumnDimensions,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add a measure to the view
   */
  addMeasure(view: View, measure: Measure): View {
    return {
      ...view,
      measures: [...view.measures, measure],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Remove a measure from the view
   */
  removeMeasure(view: View, measureId: string): View {
    const newMeasures = view.measures.filter(m => m.id !== measureId);
    return {
      ...view,
      measures: newMeasures,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update measure aggregation
   */
  updateMeasureAggregation(view: View, measureId: string, aggregation: AggregationType): View {
    const updatedMeasures = view.measures.map(m => {
      if (m.id === measureId) {
        return { ...m, aggregation };
      }
      return m;
    });
    return {
      ...view,
      measures: updatedMeasures,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update a filter dimension
   */
  updateFilterDimension(view: View, dimensionId: string, selectedNodes: string[]): View {
    const existingIndex = view.filterDimensions?.findIndex(fd => fd.dimensionId === dimensionId);
    
    let newFilterDimensions = view.filterDimensions || [];
    
    if (existingIndex !== undefined && existingIndex >= 0) {
      newFilterDimensions = [...newFilterDimensions];
      newFilterDimensions[existingIndex] = {
        ...newFilterDimensions[existingIndex],
        selectedNodes,
      };
    } else {
      newFilterDimensions = [
        ...newFilterDimensions,
        {
          dimensionId,
          selectedNodes,
          operator: 'include' as const,
        },
      ];
    }

    return {
      ...view,
      filterDimensions: newFilterDimensions,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update view name
   */
  updateViewName(view: View, name: string): View {
    return {
      ...view,
      name,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a measure from a numeric column
   */
  buildMeasureFromColumn(
    columnName: string,
    dataSourceId: string,
    columnIndex: number,
    aggregation: AggregationType = 'sum'
  ): Measure {
    return {
      id: `measure-${Date.now()}`,
      name: columnName,
      source: {
        type: 'column',
        dataSourceId,
        columnIndex,
      },
      aggregation,
      format: undefined,
      visible: true,
    };
  }

  /**
   * Get available numeric columns from data sources
   */
  getNumericColumns(dataSources: DataSource[]): { dataSourceId: string; columnIndex: number; name: string }[] {
    const numericColumns: { dataSourceId: string; columnIndex: number; name: string }[] = [];
    
    dataSources.forEach(ds => {
      if (ds.type === 'local') {
        const localDs = ds as LocalDataSource;
        localDs.columns.forEach((col, index) => {
          if (col.dataType === 'number') {
            numericColumns.push({
              dataSourceId: ds.id,
              columnIndex: index,
              name: col.name,
            });
          }
        });
      }
    });
    
    return numericColumns;
  }
}
