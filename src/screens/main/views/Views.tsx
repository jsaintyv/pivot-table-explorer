import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import type { View } from '../../../models/pivot-project/types';
import { useStore } from '../../../stores/contexts/StoreContext';

/**
 * Views component
 * Displays the list of views and allows creation, loading, and deletion
 */
export const Views = observer(() => {
  const navigate = useNavigate();
  const store = useStore();
  const views = store.getViews();
  
  const [newViewName, setNewViewName] = useState('');

  /**
   * Create a new view from current configuration
   */
  const handleCreateView = () => {
    if (!newViewName.trim()) return;
    
    const viewId = store.addView(newViewName.trim());
    setNewViewName('');
  };

  /**
   * Load a view
   */
  const handleLoadView = (viewId: string) => {
    store.loadView(viewId);
    navigate('/view-grid');
  };

  /**
   * Remove a view
   */
  const handleRemoveView = (viewId: string) => {
    store.removeView(viewId);
  };

  return (
    <section className="section">
      <h2>Views</h2>
      <div className="view-list">
        {views.map((view: View) => (
          <div key={view.id} className="view-item">
            <span>{view.name}</span>
            <button 
              onClick={() => handleLoadView(view.id)}
              className="load-button"
            >
              Show
            </button>
            <button 
              onClick={() => handleRemoveView(view.id)}
              className="remove-button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <div className="create-view">
        <input
          type="text"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
          placeholder="View name"
        />
        <button onClick={handleCreateView}>Add new view</button>
      </div>
    </section>
  );
});
