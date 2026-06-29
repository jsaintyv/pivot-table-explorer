/**
 * Property Mapping List
 * 
 * List of property mappings with add/remove functionality
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import type { DimensionEditorStore } from '../stores/DimensionEditorStore';
import { PropertyMappingItem } from './PropertyMappingItem';

interface Props {
  store: DimensionEditorStore;
}

export const PropertyMappingList = observer(({ store }: Props) => {
  // Add a new empty property mapping
  const handleAddProperty = () => {
    if (store.dataSources.length === 0) {
      return; // No data sources available
    }
    // Use first data source by default
    const firstDataSource = store.dataSources[0];
    const firstColumn = firstDataSource?.columns[0];
    
    if (firstColumn) {
      store.addPropertyMapping(
        firstDataSource.id,
        firstColumn.index,
        firstColumn.name
      );
    }
  };

  return (
    <div className="properties-section">
      <p className="section-description">
        Associate columns from your data sources to dimension properties (e.g., color, description, isActive).
      </p>
      
      {store.propertyMappings.length === 0 ? (
        <div className="empty-state">
          <p>No property mappings defined.</p>
          <p>Add property mappings to include metadata with your dimension nodes.</p>
        </div>
      ) : (
        store.propertyMappings.map((mapping, index) => (
          <PropertyMappingItem
            key={mapping.id}
            mapping={mapping}
            index={index}
            store={store}
          />
        ))
      )}

      <button 
        onClick={handleAddProperty}
        className="add-mapping-btn"
        disabled={store.dataSources.length === 0}
      >
        + Add Property Mapping
      </button>
    </div>
  );
});

export default PropertyMappingList;
