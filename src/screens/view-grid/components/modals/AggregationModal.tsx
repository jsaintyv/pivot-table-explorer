/**
 * AggregationModal component
 * Modal pour configurer l'agrégation d'une mesure
 */

import type { AggregationType, Measure } from '../../../../models/pivot-project/types';

interface AggregationModalProps {
  measure: Measure;
  onClose: () => void;
  onSetAggregation: (aggregation: AggregationType) => void;
}

export function AggregationModal({
  measure,
  onClose,
  onSetAggregation,
}: AggregationModalProps) {
  const aggregationOptions: AggregationType[] = [
    'sum', 'average', 'count', 'min', 'max', 'first', 'last'
  ];
  
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="agg-modal-content">
        <div className="agg-modal-header">
          <h3>Select Aggregation for {measure.name}</h3>
        </div>
        
        <div className="agg-options">
          {aggregationOptions.map(agg => {
            const isSelected = measure.aggregation === agg;
            return (
              <div 
                key={agg} 
                className={`agg-option ${isSelected ? 'selected' : ''}`}
                onClick={() => onSetAggregation(agg)}
              >
                <input
                  type="radio"
                  id={`agg-${agg}`}
                  name="aggregation"
                  value={agg}
                  checked={isSelected}
                  onChange={() => {}}
                />
                <label htmlFor={`agg-${agg}`}>
                  {agg.charAt(0).toUpperCase() + agg.slice(1)}
                </label>
              </div>
            );
          })}
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-apply-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
