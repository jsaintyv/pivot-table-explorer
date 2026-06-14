import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';
import type { Measure, LocalDataSource } from '../../../models/pivot-project/types';

/**
 * ValueSelect component
 * Displays selected measures (value fields) with aggregation controls
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const ValueSelect = observer(() => {
  const store = useViewGridStore();
  const measures = store.measures;

  if (measures.length === 0) {
    return null;
  }

  return (
    <div className="selected-dimensions">
      {measures.map((measure) => {
        // Get column name from data source
        const ds = store.localDataSources.find(
          d => d.id === measure.source.dataSourceId
        ) as LocalDataSource | undefined;
        
        const colName = ds?.columns[measure.source.columnIndex]?.name || 
          `Column ${measure.source.columnIndex}`;

        return (
          <div 
            key={measure.id} 
            className="dimension-badge-full"
            onClick={() => store.setAggregationModalMeasureId(measure.id)}
          >
            <span className="dimension-name">{measure.name || colName}</span>
            <select
              value={measure.aggregation}
              onChange={(e) => {
                e.stopPropagation();
                store.updateMeasureAggregation(measure.id, e.target.value as any);
              }}
              onClick={(e) => e.stopPropagation()}
              className="agg-select"
            >
              <option value="sum">Sum</option>
              <option value="avg">Avg</option>
              <option value="count">Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                store.removeDimension(measure.id, 'value');
              }}
              className="remove-field"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
});
