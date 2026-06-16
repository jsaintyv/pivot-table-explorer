/**
 * AddDimensionModal component
 * Modal pour ajouter des dimensions à la vue (rows, columns, values)
 */

import type { Dimension } from '../../../../models/pivot-project/types';

interface AddDimensionModalProps {
  dimensions: Dimension[];
  usedDimensionIds: Set<string>;
  target: 'row' | 'column' | 'value';
  onClose: () => void;
  onAdd: (dimensionId: string) => void;
}

export function AddDimensionModal({
  dimensions,
  usedDimensionIds,
  target,
  onClose,
  onAdd,
}: AddDimensionModalProps) {
  const getTargetLabel = () => {
    if (target === 'row') return 'Row';
    if (target === 'column') return 'Column';
    return 'Value';
  };
  
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Select {getTargetLabel()} Dimensions</h3>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="dimension-list-modal">
          {dimensions.map(dim => {
            const isUsed = usedDimensionIds.has(dim.id);
            return (
              <div 
                key={dim.id} 
                className={`dimension-item-modal ${isUsed ? 'disabled' : ''}`}
                onClick={() => {
                  if (!isUsed) {
                    onAdd(dim.id);
                  }
                }}
              >
                <input
                  type="checkbox"
                  id={`modal-dim-${dim.id}`}
                  checked={false}
                  disabled={isUsed}
                  onChange={(e) => e.stopPropagation()}
                />
                <label htmlFor={`modal-dim-${dim.id}`}>{dim.name}</label>
                {isUsed && <span className="used-label">(Used)</span>}
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
