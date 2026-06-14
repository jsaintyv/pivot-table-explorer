import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';
import type { Dimension } from '../../../models/pivot-project/types';

/**
 * RowSelect component
 * Displays selected row dimensions and allows removal
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const RowSelect = observer(() => {
  const store = useViewGridStore();

  // Get row dimensions with full info
  const rowDimensions = store.rowDimensionIds
    .map(id => store.dimensionMap[id])
    .filter(Boolean) as Dimension[];

  if (rowDimensions.length === 0) {
    return null;
  }

  return (
    <div className="selected-dimensions">
      {rowDimensions.map((dim) => (
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
              store.removeDimension(dim.id, 'row');
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
