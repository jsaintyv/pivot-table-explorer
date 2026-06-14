import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';
import type { Dimension } from '../../../models/pivot-project/types';

/**
 * ColumnSelect component
 * Displays selected column dimensions and allows removal
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const ColumnSelect = observer(() => {
  const store = useViewGridStore();

  // Get column dimensions with full info
  const columnDimensions = store.columnDimensionIds
    .map(id => store.dimensionMap[id])
    .filter(Boolean) as Dimension[];

  if (columnDimensions.length === 0) {
    return null;
  }

  return (
    <div className="selected-dimensions">
      {columnDimensions.map((dim) => (
        <div 
          key={dim.id} 
          className="dimension-badge-full"
          onClick={() => store.setSelectedDimensionForAggregation(dim.id)}
        >
          <span className="dimension-name">{dim.name}</span>
          <span className="agg-indicator">Sum</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              store.removeDimension(dim.id, 'column');
            }}
            className="remove-field"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
});
