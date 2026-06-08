import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../store';
import PivotGrid from '../components/PivotGrid';
import type { FilterConfig, View } from '../store';
import '../screens/ViewGridScreen.css';

/**
 * ViewGridScreen component
 * Allows users to configure the pivot table structure with row dimensions, column dimensions, filters, and value fields
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function ViewGridScreen() {
  const navigate = useNavigate();
  
  const {
    rowFields,
    columnFields,
    valueFields,
    aggregation,
    availableFields,
    data,
    dimensions,
    filters,
    views
  } = store;
  
  const [viewName, setViewName] = useState('');

  // Available dimensions are the dimension names from the store
  const availableDimensions = useMemo(() => {
    return [...new Set(dimensions.map(dim => dim.name))];
  }, [dimensions]);

  // All fields that can be used (from availableFields or dimensions)
  const allAvailableFields = useMemo(() => {
    return [...new Set([...availableFields, ...availableDimensions])];
  }, [availableFields, availableDimensions]);

  /**
   * Check if a field is already used in any category
   */
  const isFieldUsed = (field: string): boolean => {
    return (
      rowFields.includes(field) ||
      columnFields.includes(field) ||
      valueFields.includes(field)
    );
  };

  /**
   * Get the category a field belongs to
   */
  const getFieldCategory = (field: string): 'row' | 'column' | 'value' | null => {
    if (rowFields.includes(field)) return 'row';
    if (columnFields.includes(field)) return 'column';
    if (valueFields.includes(field)) return 'value';
    return null;
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, field: string) => {
    e.dataTransfer.setData('text/plain', field);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handle drop on row dimensions zone
   */
  const handleDropOnRows = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain');
    if (field && !rowFields.includes(field)) {
      // Remove from other categories if present
      const newColumnFields = columnFields.filter(f => f !== field);
      const newValueFields = valueFields.filter(f => f !== field);
      
      store.setColumnFields(newColumnFields);
      store.setValueFields(newValueFields);
      store.setRowFields([...rowFields, field]);
    }
  };

  /**
   * Handle drop on column dimensions zone
   */
  const handleDropOnColumns = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain');
    if (field && !columnFields.includes(field)) {
      // Remove from other categories if present
      const newRowFields = rowFields.filter(f => f !== field);
      const newValueFields = valueFields.filter(f => f !== field);
      
      store.setRowFields(newRowFields);
      store.setValueFields(newValueFields);
      store.setColumnFields([...columnFields, field]);
    }
  };

  /**
   * Handle drop on value fields zone
   */
  const handleDropOnValues = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain');
    if (field && !valueFields.includes(field)) {
      // Remove from other categories if present
      const newRowFields = rowFields.filter(f => f !== field);
      const newColumnFields = columnFields.filter(f => f !== field);
      
      store.setRowFields(newRowFields);
      store.setColumnFields(newColumnFields);
      store.setValueFields([...valueFields, field]);
    }
  };

  /**
   * Remove a field from its category
   */
  const removeField = (field: string, category: 'row' | 'column' | 'value') => {
    switch (category) {
      case 'row':
        store.setRowFields(rowFields.filter(f => f !== field));
        break;
      case 'column':
        store.setColumnFields(columnFields.filter(f => f !== field));
        break;
      case 'value':
        store.setValueFields(valueFields.filter(f => f !== field));
        break;
    }
  };

  /**
   * Handle filter change for a dimension
   */
  const handleFilterChange = (dimensionName: string, selectedValues: string[]) => {
    const existingFilter = filters.find(f => f.dimensionId === dimensionName);
    
    const filter: FilterConfig = {
      dimensionId: dimensionName,
      selectedValues,
    };
    
    store.setFilter(filter);
  };

  /**
   * Get all values for a dimension from the data
   */
  const getDimensionValues = (dimensionName: string): string[] => {
    if (!data.length) return [];
    
    const values = new Set<string>();
    data.forEach((item: any) => {
      const value = item[dimensionName];
      if (value !== undefined && value !== null) {
        values.add(String(value));
      }
    });
    
    return Array.from(values).sort();
  };

  /**
   * Get current filter values for a dimension
   */
  const getCurrentFilterValues = (dimensionName: string): string[] => {
    const filter = filters.find(f => f.dimensionId === dimensionName);
    return filter ? filter.selectedValues : [];
  };

  /**
   * Handle aggregation function change
   */
  const handleAggregationChange = (_field: string, aggregationFunc: string) => {
    // For now, we'll use the same aggregation for all value fields
    // In a more advanced implementation, each value field could have its own aggregation
    store.setAggregation(aggregationFunc as any);
  };

  /**
   * Save current configuration as a view
   */
  const handleSaveView = () => {
    if (!viewName.trim()) return;
    
    const newView: Omit<View, 'id'> = {
      name: viewName.trim(),
      rowFields,
      columnFields,
      valueFields,
      aggregation,
      filters,
    };
    
    store.addView(newView);
    setViewName('');
  };

  /**
   * Navigate back to Main screen
   */
  const navigateToMainScreen = () => {
    navigate('/');
  };

  // Filter the data based on current filter configuration
  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;
    
    return data.filter((item: any) => {
      return filters.every((filter) => {
        const fieldValue = item[filter.dimensionId];
        // If no values are selected for this filter, include all
        if (filter.selectedValues.length === 0) return true;
        // Otherwise, check if the value is in the selected values
        return filter.selectedValues.includes(String(fieldValue));
      });
    });
  }, [data, filters]);

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
            <h3>Available Fields</h3>
            <div className="available-list">
              {allAvailableFields
                .filter(field => !isFieldUsed(field))
                .map((field) => (
                  <div
                    key={field}
                    className="field-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                  >
                    {field}
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
                {rowFields.length === 0 ? (
                  <p>Drop fields here for rows</p>
                ) : (
                  rowFields.map((field) => (
                    <div key={field} className="field-badge">
                      {field}
                      <button 
                        onClick={() => removeField(field, 'row')}
                        className="remove-field"
                      >
                        ×
                      </button>
                    </div>
                  ))
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
                {columnFields.length === 0 ? (
                  <p>Drop fields here for columns</p>
                ) : (
                  columnFields.map((field) => (
                    <div key={field} className="field-badge">
                      {field}
                      <button 
                        onClick={() => removeField(field, 'column')}
                        className="remove-field"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Value Fields */}
            <div
              className="drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDropOnValues}
            >
              <h3>Value Fields</h3>
              <div className="drop-area">
                {valueFields.length === 0 ? (
                  <p>Drop fields here for values</p>
                ) : (
                  valueFields.map((field) => (
                    <div key={field} className="field-badge">
                      {field}
                      <select
                        value={aggregation}
                        onChange={(e) => handleAggregationChange(field, e.target.value)}
                        className="aggregation-select"
                      >
                        <option value="sum">Sum</option>
                        <option value="avg">Average</option>
                        <option value="count">Count</option>
                        <option value="min">Min</option>
                        <option value="max">Max</option>
                      </select>
                      <button 
                        onClick={() => removeField(field, 'value')}
                        className="remove-field"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Configuration */}
      <section className="section">
        <h2>Filters</h2>
        <p className="hint">Select which values to include for each dimension.</p>
        
        <div className="filters-config">
          {availableDimensions.map((dimensionName) => {
            const values = getDimensionValues(dimensionName);
            const currentValues = getCurrentFilterValues(dimensionName);
            
            return (
              <div key={dimensionName} className="filter-group">
                <h4>{dimensionName}</h4>
                <select
                  multiple
                  value={currentValues}
                  onChange={(e) => {
                    const selectedValues = Array.from(e.target.selectedOptions)
                      .map(option => option.value);
                    handleFilterChange(dimensionName, selectedValues);
                  }}
                  className="filter-select"
                >
                  {values.map((value) => (
                    <option key={value} value={value}>
                      {value}
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
        <div className="pivot-grid-container">
          <PivotGrid
            data={filteredData}
            defaultRowFields={rowFields}
            defaultColumnFields={columnFields}
            defaultValueFields={valueFields}
            defaultAggregation={aggregation}
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

export default observer(ViewGridScreen);
