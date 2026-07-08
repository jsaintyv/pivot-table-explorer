/**
 * Column Mapping Item
 * 
 * Individual column mapping row with DataSource, Column, and Mapping Type selectors
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import type { DimensionEditorStore, EditorColumnMapping } from '../stores/DimensionEditorStore';
import { MAPPING_TYPES_BY_MODE, MAPPING_TYPE_LABELS } from '../types';
import type { ColumnMapping, MappingType } from '../../../models/pivot-project/types';

interface Props {
  mapping: ColumnMapping;
  index: number;
  store: DimensionEditorStore;
}

export const ColumnMappingItem = observer(({ mapping, index, store }: Props) => {
  // Get data source options
  const dimension = store.dimension;  
  const dataSourceOptions = store.pivotProject.dataSources;
  
  // Get current data source
  const currentDataSource = dataSourceOptions.find(
    ds => ds.id === mapping.dataSourceId
  );
  
  // Get column options for current data source
  const columnOptions = currentDataSource?.columns || [];

  // Handle data source change
  const handleDataSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dataSourceId = e.target.value;
    store.updateColumnMappingDataSource(mapping.id, dataSourceId);
  };

  // Handle column change
  const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const columnIndex = parseInt(e.target.value);
    const column = columnOptions.find(c => c.index === columnIndex);
    if (column) {
      store.updateColumnMappingColumn(mapping.id, columnIndex, column.name);
    }
  };

  // Handle mapping type change
  const handleMappingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mappingType = e.target.value as MappingType;
    store.updateColumnMappingType(mapping.id, mappingType);
  };

  // Handle remove
  const handleRemove = () => {
    store.removeColumnMapping(mapping.id);
  };

  

  // Get error for this mapping
  const getError = (field: string): string | undefined => {
    const error = store.errors.find(e => e.field === `mapping-${index}-${field}`);
    return error?.message;
  };

  if(!dimension ) {
    return <></>;
  }

  // Get available mapping types based on current hierarchy mode
  const availableMappingTypes = MAPPING_TYPES_BY_MODE[dimension.hierarchyMode || "generation"];

  return (
    <div className={`mapping-item mapping-${dimension.hierarchyMode}`}>
      {/* Data Source Selector */}
      <div className="form-group">
        <label htmlFor={`mapping-${index}-dataSource`}>Data Source</label>
        <select
          id={`mapping-${index}-dataSource`}
          name={`mapping-${index}-dataSource`}
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
        {getError('dataSource') && (
          <span className="error-message">{getError('dataSource')}</span>
        )}
      </div>

      {/* Column Selector */}
      <div className="form-group">
        <label htmlFor={`mapping-${index}-column`}>Column</label>
        <select
          id={`mapping-${index}-column`}
          name={`mapping-${index}-column`}
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
        {getError('column') && (
          <span className="error-message">{getError('column')}</span>
        )}
      </div>

      {/* Mapping Type Selector */}
      <div className="form-group">
        <label htmlFor={`mapping-${index}-mappingType`}>Mapping Type</label>
        <select
          id={`mapping-${index}-mappingType`}
          name={`mapping-${index}-mappingType`}
          className="form-select"
          value={mapping.mappingType || ''}
          onChange={handleMappingTypeChange}
        >
          <option value="">Select mapping type...</option>
          {availableMappingTypes.map(type => (
            <option key={type} value={type}>
              {MAPPING_TYPE_LABELS[type] || type}
            </option>
          ))}
        </select>
        {getError('mappingType') && (
          <span className="error-message">{getError('mappingType')}</span>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="remove-mapping"
        title="Unlink this mapping"
        aria-label="Remove mapping"
      >
        ×
      </button>
    </div>
  );
});

export default ColumnMappingItem;
