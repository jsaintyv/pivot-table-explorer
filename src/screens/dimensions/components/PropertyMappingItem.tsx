/**
 * Property Mapping Item
 * 
 * Individual property mapping row with DataSource, Column, and Property Name inputs
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import type { DimensionEditorStore, EditorPropertyMapping } from '../stores/DimensionEditorStore';

interface Props {
  mapping: EditorPropertyMapping;
  index: number;
  store: DimensionEditorStore;
}

export const PropertyMappingItem = observer(({ mapping, index, store }: Props) => {
  // Get data source options
  const dataSourceOptions = store.dataSources;
  
  // Get current data source
  const currentDataSource = dataSourceOptions.find(
    ds => ds.id === mapping.dataSourceId
  );
  
  // Get column options for current data source
  const columnOptions = currentDataSource?.columns || [];

  // Handle data source change
  const handleDataSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dataSourceId = e.target.value;
    const dataSource = dataSourceOptions.find(ds => ds.id === dataSourceId);
    if (dataSource && dataSource.columns.length > 0) {
      const firstColumn = dataSource.columns[0];
      store.updatePropertyMapping(mapping.id, {
        dataSourceId,
        columnIndex: firstColumn.index,
        columnName: firstColumn.name
      });
    }
  };

  // Handle column change
  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const columnIndex = parseInt(e.target.value);
    const column = columnOptions.find(c => c.index === columnIndex);
    if (column) {
      store.updatePropertyMapping(mapping.id, {
        columnIndex,
        columnName: column.name
      });
    }
  };

  // Handle property name change
  const handlePropertyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.updatePropertyMappingPropertyName(mapping.id, e.target.value);
  };

  // Handle remove
  const handleRemove = () => {
    store.removePropertyMapping(mapping.id);
  };

  // Get error for this property mapping
  const getError = (field: string): string | undefined => {
    const error = store.errors.find(e => e.field === `property-${index}-${field}`);
    return error?.message;
  };

  return (
    <div className="mapping-item property-mapping">
      {/* Data Source Selector */}
      <div className="form-group">
        <label htmlFor={`property-${index}-dataSource`}>Data Source</label>
        <select
          id={`property-${index}-dataSource`}
          name={`property-${index}-dataSource`}
          className="form-select"
          value={mapping.dataSourceId || ''}
          onChange={handleDataSourceChange}
        >
          {dataSourceOptions.length === 0 ? (
            <option value="">No data sources available</option>
          ) : (
            dataSourceOptions.map(ds => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Column Selector */}
      <div className="form-group">
        <label htmlFor={`property-${index}-column`}>Column</label>
        <select
          id={`property-${index}-column`}
          name={`property-${index}-column`}
          className="form-select"
          value={mapping.columnIndex}
          onChange={handleColumnChange}
          disabled={!currentDataSource}
        >
          {columnOptions.length === 0 ? (
            <option value="">Select data source first</option>
          ) : (
            columnOptions.map(col => (
              <option key={col.index} value={col.index}>
                {col.name} ({col.dataType})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Property Name Input */}
      <div className="form-group">
        <label htmlFor={`property-${index}-propertyName`}>Property Name</label>
        <input
          id={`property-${index}-propertyName`}
          name={`property-${index}-propertyName`}
          type="text"
          className="form-input"
          value={mapping.propertyName || ''}
          onChange={handlePropertyNameChange}
          placeholder="e.g., color"
        />
        {getError('propertyName') && (
          <span className="error-message">{getError('propertyName')}</span>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="remove-mapping"
        title="Remove property mapping"
        aria-label="Remove property mapping"
      >
        ×
      </button>
    </div>
  );
});

export default PropertyMappingItem;
