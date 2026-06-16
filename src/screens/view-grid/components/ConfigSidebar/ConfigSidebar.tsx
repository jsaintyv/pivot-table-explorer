/**
 * ConfigSidebar component
 * Sidebar (20%) avec dimensions disponibles, sélectionnées et filtres
 */

import { useState } from 'react';
import type { View, Dimension } from '../../../../models/pivot-project/types';
import { useViewStore } from '../../../../stores/contexts/ViewStoreContext';
import { useStore } from '../../../../stores/contexts/StoreContext';

interface ConfigSidebarProps {
  view: View;
  dimensions: Dimension[];
  onAddToView: (dimensionId: string, category: 'row' | 'column' | 'value') => void;
  onRemoveFromView: (dimensionId: string, category: 'row' | 'column' | 'value') => void;
  onSetFilter: (dimensionId: string, nodeIds: string[]) => void;
  onConfigureAggregation: (measureId: string) => void;
}

export function ConfigSidebar({
  view,
  dimensions,
  onAddToView,
  onRemoveFromView,
  onSetFilter,
  onConfigureAggregation,
}: ConfigSidebarProps) {
  const viewStore = useViewStore();
  const store = useStore();
  
  // Créer une map pour un accès rapide aux dimensions
  const dimMap = new Map(dimensions.map(d => [d.id, d]));
  
  // Dimensions utilisées dans la vue
  const usedDimensionIds = new Set<string>([
    ...view.rowDimensions,
    ...view.columnDimensions,
    ...view.measures.map(m => m.id),
    ...(view.filterDimensions?.map(fd => fd.dimensionId) || [])
  ]);
  
  // Dimensions disponibles (non utilisées)
  const availableDimensions = dimensions.filter(d => !usedDimensionIds.has(d.id));
  
  // Handler pour gérer la sélection d'un filtre
  const handleFilterChange = (dimensionId: string, selectedNodeIds: string[]) => {
    onSetFilter(dimensionId, selectedNodeIds);
  };
  
  return (
    <aside className="config-sidebar">
      {/* Available Dimensions */}
      <div className="config-section">
        <h3>Available Dimensions</h3>
        <div className="available-dimensions">
          <div className="dimension-list">
            {availableDimensions.map(dim => (
              <div 
                key={dim.id}
                className="dimension-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', dim.id);
                }}
                onClick={() => onAddToView(dim.id, 'row')}
              >
                {dim.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Selected dimensions list */}
      <div className="config-section">
        <h3>Selected Dimensions</h3>
        <div className="selected-dimensions">
          {/* Dimensions en lignes */}
          {view.rowDimensions.length > 0 && (
            <div className="dimension-category">
              <h4>Rows</h4>
              {view.rowDimensions.map(dimId => {
                const dim = dimMap.get(dimId);
                return (
                  <div 
                    key={dimId} 
                    className="dimension-badge-full"
                    onClick={() => onRemoveFromView(dimId, 'row')}
                  >
                    <span className="dimension-name">{dim?.name}</span>
                    <span className="dimension-category-label">Row</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Dimensions en colonnes */}
          {view.columnDimensions.length > 0 && (
            <div className="dimension-category">
              <h4>Columns</h4>
              {view.columnDimensions.map(dimId => {
                const dim = dimMap.get(dimId);
                return (
                  <div 
                    key={dimId} 
                    className="dimension-badge-full"
                    onClick={() => onRemoveFromView(dimId, 'column')}
                  >
                    <span className="dimension-name">{dim?.name}</span>
                    <span className="dimension-category-label">Column</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Mesures */}
          {view.measures.length > 0 && (
            <div className="dimension-category">
              <h4>Measures</h4>
              {view.measures.map(measure => (
                <div 
                  key={measure.id} 
                  className="dimension-badge-full"
                  onClick={() => onConfigureAggregation(measure.id)}
                >
                  <span className="dimension-name">{measure.name}</span>
                  <span className="agg-indicator">{measure.aggregation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="config-section">
        <h3>Filters</h3>
        <div className="filters-list">
          {/* Filtres existants */}
          {view.filterDimensions?.map(filterDim => {
            const dim = dimMap.get(filterDim.dimensionId);
            const options = viewStore.getFilterOptions(filterDim.dimensionId);
            
            return (
              <div key={filterDim.dimensionId} className="filter-group">
                <h4>{dim?.name}</h4>
                <select
                  className="filter-select"
                  multiple
                  value={filterDim.selectedNodes}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions)
                      .map(opt => opt.value);
                    handleFilterChange(filterDim.dimensionId, selected);
                  }}
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          
          {/* Ajouter des filtres pour les dimensions utilisées dans row/column */}
          {[...view.rowDimensions, ...view.columnDimensions].map(dimId => {
            const dim = dimMap.get(dimId);
            const hasFilter = view.filterDimensions?.some(
              fd => fd.dimensionId === dimId
            );
            
            if (!hasFilter && dim) {
              return (
                <div key={dimId} className="filter-group">
                  <h4>{dim.name}</h4>
                  <select
                    className="filter-select"
                    multiple
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions)
                        .map(opt => opt.value);
                      handleFilterChange(dimId, selected);
                    }}
                  >
                    {viewStore.getFilterOptions(dimId).map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </aside>
  );
}
