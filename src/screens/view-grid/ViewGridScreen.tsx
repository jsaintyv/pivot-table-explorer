import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import PivotGrid from '../../components/pivot-grid/PivotGrid';
import type { Dimension, Measure, LocalDataSource } from '../../models/pivot-project/types';
import './ViewGridScreen.css';
import { useStore } from '../../stores/contexts/StoreContext';
import { ViewGridStore } from '../../stores';
import { ViewGridStoreContext } from '../../stores/contexts';
import { 
  AvailableDimensions, 
  RowSelect, 
  ColumnSelect, 
  ValueSelect, 
  Filters,
  AddDimensionModal,
  AggregationModal 
} from './components';

/**
 * ViewGridScreen component
 * Follows MVC Pattern with MobX and design.html layout:
 * - Header: Row/Column/Value dimension selectors with (+) buttons
 * - Sidebar (20%): Available dimensions, selected dimensions (no titles), filters
 * - Main (80%): PivotGrid visualization
 * - View: React component (Observer) + child components
 */
function ViewGridScreenComponent() {
  const navigate = useNavigate();
  const mainStore = useStore();
  
  // Get singleton ViewGridStore instance
  const viewGridStore = useMemo(() => ViewGridStore.getInstance(), []);
  
  // Get data from main Store
  const activeView = mainStore.getActiveView();
  const dimensions = mainStore.getDimensions();
  const views = mainStore.getViews();

  // Initialize ViewGridStore
  useEffect(() => {
    if (activeView) {
      viewGridStore.setActiveView(activeView.id, activeView.name);
      viewGridStore.initialize();
    }
  }, [activeView, viewGridStore]);

  // Get dimension info
  const rowDimensionIds = activeView?.rowDimensions || [];
  const columnDimensionIds = activeView?.columnDimensions || [];
  const measures = activeView?.measures || [];

  // Get dimension map
  const dimensionMap = useMemo(() => {
    const map: Record<string, Dimension> = {};
    dimensions.forEach(dim => {
      map[dim.id] = dim;
    });
    return map;
  }, [dimensions]);

  // Get row dimension names for header
  const rowDimensionNames = useMemo(() => {
    return rowDimensionIds
      .map(id => dimensionMap[id]?.name || id)
      .filter(Boolean);
  }, [rowDimensionIds, dimensionMap]);

  // Get column dimension names for header
  const columnDimensionNames = useMemo(() => {
    return columnDimensionIds
      .map(id => dimensionMap[id]?.name || id)
      .filter(Boolean);
  }, [columnDimensionIds, dimensionMap]);

  // Get measure names for header
  const measureNames = useMemo(() => {
    return measures
      .map(m => {
        const ds = mainStore.getLocalDataSources().find(
          d => d.id === m.source.dataSourceId
        ) as LocalDataSource | undefined;
        return ds?.columns[m.source.columnIndex]?.name || m.name || `Column ${m.source.columnIndex}`;
      });
  }, [measures, mainStore]);

  // Handle add dimension to row
  const handleAddRowDimension = (): void => {
    viewGridStore.openModal('rows');
  };

  // Handle add dimension to column
  const handleAddColumnDimension = (): void => {
    viewGridStore.openModal('columns');
  };

  // Handle add value field
  const handleAddValueField = (): void => {
    viewGridStore.openModal('values');
  };

  // Handle view name change
  const handleViewNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    viewGridStore.setViewName(e.target.value);
  };

  // Save view
  const handleSaveView = (): void => {
    viewGridStore.saveView();
  };

  // Navigate back
  const navigateToMainScreen = (): void => {
    navigate('/');
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dimensionId: string): void => {
    e.dataTransfer.setData('text/plain', dimensionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on row dimensions
  const handleDropOnRows = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const dimensionId = e.dataTransfer.getData('text/plain');
    if (dimensionId && !rowDimensionIds.includes(dimensionId)) {
      viewGridStore.addDimension(dimensionId, 'row');
      const activeView = mainStore.getActiveView();
      if (activeView) {
        const newColumnDimensions = columnDimensionIds.filter(id => id !== dimensionId);
        mainStore.updateView(activeView.id, {
          ...activeView,
          rowDimensions: [...rowDimensionIds, dimensionId],
          columnDimensions: newColumnDimensions,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Handle drop on column dimensions
  const handleDropOnColumns = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const dimensionId = e.dataTransfer.getData('text/plain');
    if (dimensionId && !columnDimensionIds.includes(dimensionId)) {
      viewGridStore.addDimension(dimensionId, 'column');
      const activeView = mainStore.getActiveView();
      if (activeView) {
        const newRowDimensions = rowDimensionIds.filter(id => id !== dimensionId);
        mainStore.updateView(activeView.id, {
          ...activeView,
          columnDimensions: [...columnDimensionIds, dimensionId],
          rowDimensions: newRowDimensions,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Prepare data for PivotGrid
  const pivotDataForGrid = useMemo(() => {
    return mainStore.data.length > 0 ? mainStore.data : [];
  }, [mainStore.data]);

  return (
    <ViewGridStoreContext.Provider value={viewGridStore}>
      <main className="view-grid-screen">
        {/* HEADER - Configuration lines for Row, Column, Value */}
        <div className="view-header">
          <div className="dimension-header">
            {/* Row dimensions line */}
            <div className="dimension-config-line">
              <span className="config-label">Row dimensions:</span>
              <button 
                className="add-dimension-btn" 
                title="Add row dimension"
                onClick={handleAddRowDimension}
              >
                +
              </button>
              <div className="current-selections">
                {rowDimensionNames.length > 0 ? (
                  rowDimensionNames.map((name, index) => (
                    <span key={index} className="selected-badge">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="hint">None selected</span>
                )}
              </div>
            </div>

            {/* Column dimensions line */}
            <div className="dimension-config-line">
              <span className="config-label">Column dimensions:</span>
              <button 
                className="add-dimension-btn" 
                title="Add column dimension"
                onClick={handleAddColumnDimension}
              >
                +
              </button>
              <div className="current-selections">
                {columnDimensionNames.length > 0 ? (
                  columnDimensionNames.map((name, index) => (
                    <span key={index} className="selected-badge">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="hint">None selected</span>
                )}
              </div>
            </div>

            {/* Value fields line */}
            <div className="dimension-config-line">
              <span className="config-label">Value fields:</span>
              <button 
                className="add-dimension-btn" 
                title="Add value field"
                onClick={handleAddValueField}
              >
                +
              </button>
              <div className="current-selections">
                {measureNames.length > 0 ? (
                  measureNames.map((name, index) => (
                    <span key={index} className="selected-badge">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="hint">None selected</span>
                )}
              </div>
            </div>
          </div>

          {/* View name and save */}
          <div className="view-name">
            <input 
              type="text" 
              placeholder="View name" 
              value={viewGridStore.state.viewName}
              onChange={handleViewNameChange}
            />
            <button onClick={handleSaveView}>Save View</button>
          </div>
        </div>

        {/* MAIN LAYOUT - Sidebar (20%) + Grid (80%) */}
        <div className="screen-layout">
          {/* SIDEBAR - Configuration Panel (20%) */}
          <aside className="config-sidebar">
            {/* Available Dimensions */}
            <div className="config-section">
              <h3>📁 Available Dimensions</h3>
              <AvailableDimensions />
            </div>

            {/* Row Dimensions - NO TITLE (per design) */}
            <div className="config-section">
              <RowSelect />
            </div>

            {/* Column Dimensions - NO TITLE (per design) */}
            <div className="config-section">
              <ColumnSelect />
            </div>

            {/* Value Fields / Measures - NO TITLE (per design) */}
            <div className="config-section">
              <ValueSelect />
            </div>

            {/* Filters */}
            <div className="config-section">
              <h3>🔍 Filters</h3>
              <Filters />
            </div>
          </aside>

          {/* MAIN CONTENT - Pivot Grid (80%) */}
          <div className="grid-main">
            <PivotGrid
              data={pivotDataForGrid}
              defaultRowFields={mainStore.rowFields}
              defaultColumnFields={mainStore.columnFields}
              defaultValueFields={mainStore.valueFields}
              defaultAggregation={mainStore.aggregation}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="view-actions">
          <button className="btn-secondary" onClick={navigateToMainScreen}>
            Back to Main screen
          </button>
          <button className="btn-primary" onClick={() => {}}>
            Apply Configuration
          </button>
        </div>

        {/* MODALS */}
        <AddDimensionModal />
        <AggregationModal />
      </main>
    </ViewGridStoreContext.Provider>
  );
}

// Export wrapped with observer
export default observer(ViewGridScreenComponent);
