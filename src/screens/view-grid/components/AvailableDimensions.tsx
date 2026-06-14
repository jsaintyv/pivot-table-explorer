import { observer } from 'mobx-react-lite';
import { useViewGridStore } from '../../../stores/contexts';


/**
 * AvailableDimensions component
 * Displays list of dimensions that can be added to row/column/value
 * Part of ViewGridScreen - follows MVC Pattern (View layer)
 */
export const AvailableDimensions = observer(() => {
  const store = useViewGridStore();
  const availableDimensions = store.availableDimensions;

  if (availableDimensions.length === 0) {
    return (
      <div className="available-dimensions">
        <h3>Available Dimensions</h3>
        <p className="hint">No dimensions available</p>
      </div>
    );
  }

  return (
    <div className="available-dimensions">
      <h3>📁 Available Dimensions</h3>
      <div className="dimension-list">
        {availableDimensions.map((dim) => (
          <div
            key={dim.id}
            className="dimension-item"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', dim.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            style={{ opacity: 1 }}
          >
            {dim.name} ({dim.dataType})
          </div>
        ))}
      </div>
    </div>
  );
});
