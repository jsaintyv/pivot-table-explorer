import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { store, StoreContext } from './store';
import PivotGrid from '../../components/pivot-grid/PivotGrid';
import type { Dimension, Node, View, Measure, AggregationType } from '../../models/pivot-project/types';
import './ViewGridScreen.css';

/**
 * ViewGridScreen component
 * Allows users to configure the pivot table structure with row dimensions, column dimensions, filters, and value fields
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function ViewGridScreenComponent() {
  const navigate = useNavigate();
  
  /*
  const {
    pivotProject,
    getDimensions,
    getNodesByDimension,
    getRootNodes,
    getActiveView,
    getViews,
    updateView,
    addView,
    activeViewId,
    // Legacy compatibility
    rowFields: legacyRowFields,
    columnFields: legacyColumnFields,
    valueFields: legacyValueFields,
    aggregation: legacyAggregation,
    data: legacyData,
    setRowFields: setLegacyRowFields,
    setColumnFields: setLegacyColumnFields,
    setValueFields: setLegacyValueFields,
    setAggregation: setLegacyAggregation,
  } = store;
  */
  
  const [viewName, setViewName] = useState('');

  // Get the active view or create a temporary one
  const activeView = store.getActiveView();
  const dimensions = store.getDimensions();
  const views = store.getViews();

  // Get row and column dimensions from active view
  const rowDimensionIds = activeView?.rowDimensions || [];
  const columnDimensionIds = activeView?.columnDimensions || [];
  const measures = activeView?.measures || [];
  const filterDimensions = activeView?.filterDimensions || [];

  // Get dimension names for display
  const dimensionMap = useMemo(() => {
    const map: Record<string, Dimension> = {};
    dimensions.forEach(dim => {
      map[dim.id] = dim;
    });
    return map;
  }, [dimensions]);

  // Available dimensions
  const availableDimensions = useMemo(() => {
    return dimensions.map(dim => ({
      id: dim.id,
      name: dim.name,
      dataType: dim.dataType,
    }));
  }, [dimensions]);

 
  // Get root nodes for a dimension    
  // Check if a dimension is used in any category
  const isDimensionUsed = (dimensionId: string): boolean => {
    return (
      rowDimensionIds.includes(dimensionId) ||
      columnDimensionIds.includes(dimensionId) ||
      measures.some(m => 
        m.source.type === 'column' && 
        store.pivotProject.dataSources.some(ds => 
          ds.type === 'local' && (m.source.columnIndex) < ds.columns.length
        )
      ) ||
      filterDimensions.some(fd => fd.dimensionId === dimensionId)
    );
  };

  // Get the category a dimension belongs to
  const getDimensionCategory = (dimensionId: string): 'row' | 'column' | 'value' | null => {
    if (rowDimensionIds.includes(dimensionId)) return 'row';
    if (columnDimensionIds.includes(dimensionId)) return 'column';
    // Check if used in measures (simplified)
    if (measures.some(m => 
      m.source.type === 'column' && 
      store.pivotProject.dataSources.some(ds => 
        ds.type === 'local' && m.source.columnIndex < ds.columns.length &&
        ds.columns[(m.source.columnIndex)].name === dimensionMap[dimensionId]?.name
      )
    )) return 'value';
    return null;
  };

  // Get all unique values from nodes of a dimension
  const getDimensionValues = (dimensionId: string): { code: string; value: any; metaData: any }[] => {
    const nodes = store.getNodesByDimension(dimensionId);
    return nodes.map(node => ({
      code: node.code,
      value: node.value,
      metaData: node.metaData,
    }));
  };

  // Get current filter values for a dimension
  const getCurrentFilterValues = (dimensionId: string): string[] => {
    const filter = filterDimensions.find(f => f.dimensionId === dimensionId);
    return filter ? filter.selectedNodes : [];
  };

  // Get filter options for a dimension
  const getFilterOptions = (dimensionId: string): { value: string; label: string }[] => {
    const nodes = store.getNodesByDimension(dimensionId);
    const dimension = dimensionMap[dimensionId];
    
    if (!dimension || !dimension.nodeSchema) {
      return nodes.map(node => ({
        value: node.id,
        label: String(node.value),
      }));
    }
    
    // Use label from metaData if available
    return nodes.map(node => ({
      value: node.id,
      label: node.metaData.label ? String(node.metaData.label) : String(node.value),
    }));
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dimensionId: string) => {
    e.dataTransfer.setData('text/plain', dimensionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on row dimensions zone
  const handleDropOnRows = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dimensionId = e.dataTransfer.getData('text/plain');
    if (dimensionId && !rowDimensionIds.includes(dimensionId)) {
      // Remove from other categories if present
      const newColumnDimensions = columnDimensionIds.filter(id => id !== dimensionId);
      
      if (activeView) {
        activeView.columnDimensions = newColumnDimensions;
        if (!activeView.rowDimensions.includes(dimensionId)) {
          activeView.rowDimensions = [...activeView.rowDimensions, dimensionId];
        }
        activeView.updatedAt = new Date().toISOString();
        store.updateView(activeView.id, activeView);
      } else {
        // Create a new temporary view
        const viewId = store.addView(
          'Temporary View',
          [dimensionId],
          newColumnDimensions,
          [],
          'View for pivot configuration'
        );
        store.loadView(viewId);
      }
    }
  };

  // Handle drop on column dimensions zone
  const handleDropOnColumns = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dimensionId = e.dataTransfer.getData('text/plain');
    if (dimensionId && !columnDimensionIds.includes(dimensionId)) {
      // Remove from other categories if present
      const newRowDimensions = rowDimensionIds.filter(id => id !== dimensionId);
      
      if (activeView) {
        activeView.rowDimensions = newRowDimensions;
        if (!activeView.columnDimensions.includes(dimensionId)) {
          activeView.columnDimensions = [...activeView.columnDimensions, dimensionId];
        }
        activeView.updatedAt = new Date().toISOString();
        store.updateView(activeView.id, activeView);
      } else {
        // Create a new temporary view
        const viewId = store.addView(
          'Temporary View',
          newRowDimensions,
          [dimensionId],
          [],
          'View for pivot configuration'
        );
        store.loadView(viewId);
      }
    }
  };

  // Handle drop on value fields zone
  const handleDropOnValues = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dimensionId = e.dataTransfer.getData('text/plain');
    if (dimensionId) {
      // For now, values come from DataSource columns, not dimensions
      // Find a numeric column from a LocalDataSource
      const localDs = store.getLocalDataSources()[0];
      if (!localDs) return;
      
      // Find numeric columns
      const numericColumns = localDs.columns.filter(c => c.dataType === 'number');
      if (numericColumns.length === 0) return;
      
      // Use the first numeric column
      const measure: Measure = {
        id: `measure-${Date.now()}`,
        name: numericColumns[0].name,
        source: {
          type: 'column',
          dataSourceId: localDs.id,
          columnIndex: numericColumns[0].index,
        },
        aggregation: 'sum',
        format: undefined,
        visible: true,
      };
      
      if (activeView) {
        activeView.measures = [...activeView.measures, measure];
        activeView.updatedAt = new Date().toISOString();
        store.updateView(activeView.id, activeView);
      } else {
        // Create a new temporary view with the measure
        const viewId = store.addView(
          'Temporary View',
          [],
          [],
          [measure]
        );
        store.loadView(viewId);
      }
    }
  };

  // Remove a dimension from its category
  const removeDimension = (dimensionId: string, category: 'row' | 'column' | 'value') => {
    if (!activeView) return;
    
    switch (category) {
      case 'row':
        activeView.rowDimensions = activeView.rowDimensions.filter(id => id !== dimensionId);
        break;
      case 'column':
        activeView.columnDimensions = activeView.columnDimensions.filter(id => id !== dimensionId);
        break;
      case 'value':
        activeView.measures = activeView.measures.filter(m => 
          !(m.source.type === 'column' && m.source.dataSourceId && m.source.columnIndex)
        );
        break;
    }
    
    activeView.updatedAt = new Date().toISOString();
    store.updateView(activeView.id, activeView);
  };

  // Handle filter change for a dimension
  const handleFilterChange = (dimensionId: string, selectedNodeIds: string[]) => {
    let activeView = store.getActiveView();
    if (!activeView) {
      // Create a new view if none exists
      const viewId = store.addView('Temporary View');
      store.loadView(viewId);
    }
    activeView = store.getActiveView();
    
    if (!activeView) return;
    
    // Find or create filter dimension
    let filterDim = activeView.filterDimensions?.find(fd => fd.dimensionId === dimensionId);
    
    if (!filterDim) {
      filterDim = {
        dimensionId,
        selectedNodes: selectedNodeIds,
        operator: 'include',
      };
      activeView.filterDimensions = [...(activeView.filterDimensions || []), filterDim];
    } else {
      filterDim.selectedNodes = selectedNodeIds;
    }
    
    activeView.updatedAt = new Date().toISOString();
    store.updateView(activeView.id, activeView);
  };

  // Handle aggregation function change
  const handleAggregationChange = (measureId: string, aggregationFunc: AggregationType) => {
    if (!activeView) return;
    
    const measure = activeView.measures.find(m => m.id === measureId);
    if (measure) {
      measure.aggregation = aggregationFunc;
      activeView.updatedAt = new Date().toISOString();
      store.updateView(activeView.id, activeView);
    }
  };

  // Save current configuration as a view
  const handleSaveView = () => {
    if (!viewName.trim() || !activeView) return;
    
    activeView.name = viewName.trim();
    activeView.updatedAt = new Date().toISOString();
    store.updateView(activeView.id, activeView);
    setViewName('');
  };

  // Navigate back to Main screen
  const navigateToMainScreen = () => {
    navigate('/');
  };

  // Prepare data for PivotGrid component (legacy format)
  // This converts the new PivotProject model to the old format expected by PivotGrid
  const pivotDataForGrid = useMemo(() => {
    if (store.data.length > 0) {
      return store.data;
    }
    
    // If we have active view and data sources, try to convert
    if (!activeView || rowDimensionIds.length === 0 || measures.length === 0) {
      return [];
    }
    
    // For now, return empty array - the PivotGrid will need to be updated to use the new model
    return [];
  }, [store.data]);

  return (
    <main className="view-grid-screen">
      <h1>Configure Pivot View</h1>
      <p>Define row dimensions, column dimensions, filters, and value fields for your pivot table.</p>

      {/* View Name Input */}
      <section className="section view-name-section">
        <h2>View Configuration</h2>
        <div className="view-name-input">
          <input
            type="text"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="Enter view name to save"
          />
          <button onClick={handleSaveView} className="save-button">
            Save View
          </button>
        </div>
        {views.length > 0 && (
          <div className="saved-views">
            <h4>Saved Views: {views.map(v => v.name).join(', ')}</h4>
          </div>
        )}
      </section>

      {/* Dimensions Configuration */}
      <section className="section">
        <h2>Dimensions</h2>
        
        <div className="dimension-config">
          {/* Available Dimensions */}
          <div className="available-dimensions">
            <h3>Available Dimensions</h3>
            <div className="available-list">
              {availableDimensions
                .filter(dim => !isDimensionUsed(dim.id))
                .map((dim) => (
                  <div
                    key={dim.id}
                    className="field-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, dim.id)}
                  >
                    {dim.name} ({dim.dataType})
                  </div>
                ))}
            </div>
          </div>

          {/* Drop Zones */}
          <div className="drop-zones">
            {/* Row Dimensions */}
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropOnRows}
            >
              <h3>Row Dimensions</h3>
              <div className="drop-area">
                {rowDimensionIds.length === 0 ? (
                  <p>Drop dimensions here for rows</p>
                ) : (
                  rowDimensionIds.map((dimId) => {
                    const dim = dimensionMap[dimId];
                    return (
                      <div key={dimId} className="field-badge">
                        {dim?.name || dimId} ({dim?.dataType})
                        <button 
                          onClick={() => removeDimension(dimId, 'row')}
                          className="remove-field"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column Dimensions */}
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropOnColumns}
            >
              <h3>Column Dimensions</h3>
              <div className="drop-area">
                {columnDimensionIds.length === 0 ? (
                  <p>Drop dimensions here for columns</p>
                ) : (
                  columnDimensionIds.map((dimId) => {
                    const dim = dimensionMap[dimId];
                    return (
                      <div key={dimId} className="field-badge">
                        {dim?.name || dimId} ({dim?.dataType})
                        <button 
                          onClick={() => removeDimension(dimId, 'column')}
                          className="remove-field"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Value Fields */}
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropOnValues}
            >
              <h3>Measures</h3>
              <div className="drop-area">
                {measures.length === 0 ? (
                  <p>Drop numeric columns here for values</p>
                ) : (
                  measures.map((measure) => {
                    const ds = store.pivotProject.dataSources.find(
                      d => d.id === measure.source.dataSourceId && d.type === 'local'
                    ) as any;
                    const colName = ds?.columns[measure.source.columnIndex]?.name || 
                      `Column ${measure.source.columnIndex}`;
                    
                    return (
                      <div key={measure.id} className="field-badge">
                        {measure.name || colName}
                        <select
                          value={measure.aggregation}
                          onChange={(e) => handleAggregationChange(measure.id, e.target.value as AggregationType)}
                          className="aggregation-select"
                        >
                          <option value="sum">Sum</option>
                          <option value="average">Average</option>
                          <option value="count">Count</option>
                          <option value="min">Min</option>
                          <option value="max">Max</option>
                          <option value="first">First</option>
                          <option value="last">Last</option>
                        </select>
                        <button 
                          onClick={() => removeDimension(measure.id, 'value')}
                          className="remove-field"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Configuration */}
      <section className="section">
        <h2>Filters</h2>
        <p className="hint">Select which node values to include for each dimension.</p>
        
        <div className="filters-config">
          {dimensions.map((dimension: Dimension) => {
            const nodes = store.getNodesByDimension(dimension.id);
            if (nodes.length === 0) return null;
            
            const filterOptions = getFilterOptions(dimension.id);
            const currentValues = getCurrentFilterValues(dimension.id);
            
            return (
              <div key={dimension.id} className="filter-group">
                <h4>{dimension.name}</h4>
                <select
                  multiple
                  value={currentValues}
                  onChange={(e) => {
                    const selectedValues = Array.from(e.target.selectedOptions)
                      .map(option => option.value);
                    handleFilterChange(dimension.id, selectedValues);
                  }}
                  className="filter-select"
                  size={Math.min(filterOptions.length, 5)}
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pivot Grid Display */}
      <section className="section pivot-grid-section">
        <h2>Pivot Table Preview</h2>
        <p className="hint">
          {activeView ? 
            `Current view: ${activeView.name} | Rows: [${rowDimensionIds.join(', ')}] | Columns: [${columnDimensionIds.join(', ')}]` 
            : 'Configure dimensions and measures to see the pivot table'}
        </p>
        <div className="pivot-grid-container">
          {/* PivotGrid component will be updated to use the new model */}
          <PivotGrid
            data={pivotDataForGrid}
            defaultRowFields={store.rowFields}
            defaultColumnFields={store.columnFields}
            defaultValueFields={store.valueFields}
            defaultAggregation={store.aggregation}
          />
        </div>
      </section>

      {/* Navigation */}
      <section className="navigation">
        <button onClick={navigateToMainScreen} className="back-button">
          Back to Main screen
        </button>
      </section>
    </main>
  );
}

// Wrap the component with StoreContext.Provider
export default observer(function ViewGridScreen() {
  return (
    <StoreContext.Provider value={store}>
      <ViewGridScreenComponent />
    </StoreContext.Provider>
  );
});
