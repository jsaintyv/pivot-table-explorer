/**
 * ViewHeader component
 * Header avec sélecteurs de dimensions lignes/colonnes/champs valeurs
 */

import type { View, Measure } from '../../../../models/pivot-project/types';
import type { Dimension } from '../../../../models/pivot-project/types';

interface ViewHeaderProps {
  view: View;
  dimensions: Dimension[];
  onAddDimension: (target: 'row' | 'column' | 'value') => void;
  onRemoveDimension: (dimensionId: string, category: 'row' | 'column' | 'value') => void;
  onConfigureAggregation: (measureId: string) => void;
  viewName: string;
  onViewNameChange: (name: string) => void;
  onSaveView: () => void;
  canSave: boolean;
}

export function ViewHeader({
  view,
  dimensions,
  onAddDimension,
  onRemoveDimension,
  onConfigureAggregation,
  viewName,
  onViewNameChange,
  onSaveView,
  canSave,
}: ViewHeaderProps) {
  // Créer une map pour un accès rapide aux dimensions
  const dimMap = new Map(dimensions.map(d => [d.id, d]));
  
  return (
    <div className="view-header">
      <div className="dimension-header">
        {/* Row dimensions */}
        <div className="dimension-config-line">
          <span className="config-label">Row dimensions:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => onAddDimension('row')}
            title="Add row dimension"
          >
            +
          </button>
          <div className="current-selections">
            {view.rowDimensions.map(dimId => {
              const dim = dimMap.get(dimId);
              return (
                <span key={dimId} className="selected-badge">
                  {dim?.name}
                  <span 
                    className="remove-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDimension(dimId, 'row');
                    }}
                  >
                    &times;
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Column dimensions */}
        <div className="dimension-config-line">
          <span className="config-label">Column dimensions:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => onAddDimension('column')}
            title="Add column dimension"
          >
            +
          </button>
          <div className="current-selections">
            {view.columnDimensions.map(dimId => {
              const dim = dimMap.get(dimId);
              return (
                <span key={dimId} className="selected-badge">
                  {dim?.name}
                  <span 
                    className="remove-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDimension(dimId, 'column');
                    }}
                  >
                    &times;
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Value fields */}
        <div className="dimension-config-line">
          <span className="config-label">Value fields:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => onAddDimension('value')}
            title="Add value field"
          >
            +
          </button>
          <div className="current-selections">
            {view.measures.map(measure => (
              <span 
                key={measure.id} 
                className="selected-badge"
                onClick={() => onConfigureAggregation(measure.id)}
              >
                {measure.name}
                <span className="agg-indicator">
                  {measure.aggregation}
                </span>
                <span 
                  className="remove-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDimension(measure.id, 'value');
                  }}
                >
                  &times;
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* View name input */}
      <div className="view-name">
        <input
          type="text"
          value={viewName}
          onChange={(e) => onViewNameChange(e.target.value)}
          placeholder="View name"
          className="view-name-input"
        />
        <button 
          className="save-view-btn" 
          onClick={onSaveView}
          disabled={!canSave}
        >
          Save View
        </button>
      </div>
    </div>
  );
}
