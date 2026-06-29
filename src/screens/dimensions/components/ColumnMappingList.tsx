/**
 * Column Mapping List
 * 
 * List of column mappings with add/remove functionality
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import type { DimensionEditorStore } from '../stores/DimensionEditorStore';
import { ColumnMappingItem } from './ColumnMappingItem';

interface Props {
  store: DimensionEditorStore;
}

export const ColumnMappingList = observer(({ store }: Props) => {
  // Add a new empty mapping
  const handleAddMapping = () => {
    if (store.dataSources.length === 0) {
      return; // No data sources available
    }
    // Use first data source by default
    const firstDataSource = store.dataSources[0];
    const firstColumn = firstDataSource?.columns[0];
    
    if (firstColumn) {
      store.addColumnMapping(
        firstDataSource.id,
        firstColumn.index,
        firstColumn.name
      );
    }
  };

  return (
    <div className="mappings-container">
      {store.columnMappings.length === 0 ? (
        <div className="empty-state">
          <p>No column mappings defined.</p>
          <p>Add mappings to associate columns from data sources to hierarchy levels.</p>
        </div>
      ) : (
        store.columnMappings.map((mapping, index) => (
          <ColumnMappingItem
            key={mapping.id}
            mapping={mapping}
            index={index}
            store={store}
          />
        ))
      )}

      <button 
        onClick={handleAddMapping}
        className="add-mapping-btn"
        disabled={store.dataSources.length === 0}
      >
        + Add Column Mapping
      </button>
    </div>
  );
});

export default ColumnMappingList;
