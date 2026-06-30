/**
 * Column Mapping List
 * 
 * List of column mappings with add/remove functionality
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import { getDimensionEditorStore, type DimensionEditorStore } from '../stores/DimensionEditorStore';
import { ColumnMappingItem } from './ColumnMappingItem';

interface Props {
  
}

export const ColumnMappingList = observer(({  }: Props) => {
  const store = getDimensionEditorStore();
  const pivotProject = store.pivotProject;
  const dimension = store.dimension;
  if(!dimension) {
    return <></>;
  }
  // Add a new empty mapping
  const handleAddMapping = () => {
    if (pivotProject.dataSources.length === 0) {
      return; // No data sources available
    }
    // Use first data source by default
    const firstDataSource = pivotProject.dataSources[0];
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
      {dimension.columnMappings.length === 0 ? (
        <div className="empty-state">
          <p>No column mappings defined.</p>
          <p>Add mappings to associate columns from data sources to hierarchy levels.</p>
        </div>
      ) : (
        dimension.columnMappings.map((mapping, index) => (
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
        disabled={pivotProject.dataSources.length === 0}
      >
        + Add Column Mapping
      </button>
    </div>
  );
});

export default ColumnMappingList;
