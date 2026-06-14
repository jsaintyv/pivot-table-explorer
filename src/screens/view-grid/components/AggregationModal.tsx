import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';


/**
 * AggregationModal component
 * Modal for selecting aggregation function for a measure
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const AggregationModal = observer(() => {
  const store = useViewGridStore();

  if (!store.state.isModalOpen || store.state.modalType !== 'aggregation') {
    return null;
  }

  const measureId = store.state.aggregationModalMeasureId;
  const measure = store.measures.find(m => m.id === measureId);

  const handleClose = (): void => {
    store.closeModal();
    store.setAggregationModalMeasureId(null);
  };

  const handleAggregationSelect = (aggregation: string): void => {
    if (measureId) {
      store.updateMeasureAggregation(measureId, aggregation as any);
    }
    handleClose();
  };

  return (
    <div className="modal" onClick={handleClose}>
      <div className="agg-modal-content" onClick={e => e.stopPropagation()}>
        <div className="agg-modal-header">
          <h3>Select Aggregation</h3>
          <p>for {measure?.name || measureId || 'this measure'}</p>
        </div>
        
        <div className="agg-options">
          {[
            { value: 'sum', label: 'Sum' },
            { value: 'avg', label: 'Average' },
            { value: 'count', label: 'Count' },
            { value: 'min', label: 'Min' },
            { value: 'max', label: 'Max' },
          ].map((option) => (
            <div 
              key={option.value} 
              className="agg-option"
              onClick={() => handleAggregationSelect(option.value)}
            >
              <input 
                type="radio" 
                id={`agg-${option.value}`}
                name="aggregation"
                value={option.value}
                checked={measure?.aggregation === option.value}
                onChange={() => handleAggregationSelect(option.value)}
              />
              <label htmlFor={`agg-${option.value}`}>{option.label}</label>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
});
