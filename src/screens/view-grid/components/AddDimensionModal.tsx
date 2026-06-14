import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';


/**
 * AddDimensionModal component
 * Modal for selecting dimensions to add to row/column/value
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const AddDimensionModal = observer(() => {
  const store = useViewGridStore();

  if (!store.state.isModalOpen || !store.state.modalType) {
    return null;
  }

  const modalType = store.state.modalType;
  const dimensions = store.dimensions;
  const usedIds = new Set([
    ...store.rowDimensionIds,
    ...store.columnDimensionIds,
  ]);

  const availableDimensions = dimensions.filter(dim => !usedIds.has(dim.id));

  const handleClose = (): void => {
    store.closeModal();
  };

  const handleApply = (): void => {
    // Get checked checkboxes
    const checkboxes = document.querySelectorAll('.dimension-item-modal input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.id.replace('dim-', ''));
    
    // Add to appropriate category
    const category: any = modalType;
    selectedIds.forEach(id => {
      store.addDimension(id, category);
    });
    
    store.closeModal();
  };

  return (
    <div className="modal" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {modalType === 'rows' && 'Select Row Dimensions'}
            {modalType === 'columns' && 'Select Column Dimensions'}
            {modalType === 'values' && 'Select Value Fields'}
          </h3>
          <button className="close-modal" onClick={handleClose}>
            &times;
          </button>
        </div>
        
        <div className="dimension-list-modal">
          {availableDimensions.map(dim => (
            <div key={dim.id} className="dimension-item-modal">
              <input type="checkbox" id={`dim-${dim.id}`} />
              <label htmlFor={`dim-${dim.id}`}>{dim.name}</label>
            </div>
          ))}
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={handleClose}>Cancel</button>
          <button className="btn-apply-modal" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
});
