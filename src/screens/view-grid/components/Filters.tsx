import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';
import type { Dimension } from '../../../models/pivot-project/types';

/**
 * Filters component
 * Displays filter controls for each dimension
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const Filters = observer(() => {
  const store = useViewGridStore();
  const dimensions = store.dimensions;

  if (dimensions.length === 0) {
    return null;
  }

  return (
    <div className="filters-config">
      {dimensions.map((dimension: Dimension) => {
        const nodes = store.getNodesByDimension(dimension.id);
        if (nodes.length === 0) return null;
        
        const filterOptions = store.getFilterOptions(dimension.id);
        const currentValues = store.getCurrentFilterValues(dimension.id);
        
        return (
          <div key={dimension.id} className="filter-group">
            <h4>{dimension.name}</h4>
            <select
              multiple
              value={currentValues}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions)
                  .map(option => option.value);
                store.updateFilter(dimension.id, selectedValues);
              }}
              className="filter-select"
              size={Math.min(filterOptions.length, 5)}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
});
