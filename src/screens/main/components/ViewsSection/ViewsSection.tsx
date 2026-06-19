/**
 * ViewsSection component
 * 
 * Displays list of views with show/delete actions and create form
 * Follows MVC pattern: Uses store from React context, is a MobX observer
 * Max lines: < 200
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import type { View } from '../../../../models/pivot-project/types';
import { useStore } from '../../../../stores/contexts/StoreContext';
import './ViewsSection.css';

interface ViewItemProps {
  view: View;
  onShow: (id: string) => void;
  onRemove: (id: string) => void;
}

function ViewItem({ view, onShow, onRemove }: ViewItemProps) {
  const formattedDate = new Date(view.updatedAt).toLocaleDateString();
  
  return (
    <div className="view-item">
      <div className="view-info">
        <span className="view-name">{view.name}</span>
        {view.description && (
          <span className="view-description" title={view.description}>
            {view.description}
          </span>
        )}
        <span className="view-date">Updated: {formattedDate}</span>
      </div>
      <div className="view-actions">
        <button 
          onClick={() => onShow(view.id)}
          className="show-button"
          title="Show view in View Grid screen"
        >
          Show
        </button>
        <button 
          onClick={() => onRemove(view.id)}
          className="remove-button"
          title="Remove view"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * Main ViewsSection component
 */
export const ViewsSection = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const views = store.getViews();
  const [newViewName, setNewViewName] = useState('');

  /**
   * Create a new view
   */
  const handleCreateView = () => {
    if (!newViewName.trim()) return;
    
    store.addView(newViewName.trim());
    setNewViewName('');
  };

  /**
   * Load a view and navigate to View Grid screen
   */
  const handleShowView = (viewId: string) => {
    store.loadView(viewId);
    navigate('/view-grid');
  };

  /**
   * Remove a view
   */
  const handleRemoveView = (viewId: string) => {
    if (window.confirm('Are you sure you want to remove this view?')) {
      store.removeView(viewId);
    }
  };

  return (
    <section className="section views-section">
      <div className="section-header">
        <h2>Views</h2>
      </div>
      
      <div className="views-list">
        {views.length > 0 ? (
          views.map((view: View) => (
            <ViewItem
              key={view.id}
              view={view}
              onShow={handleShowView}
              onRemove={handleRemoveView}
            />
          ))
        ) : (
          <p className="empty-message">No views created yet.</p>
        )}
      </div>
      
      <div className="create-view">
        <input
          type="text"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
          placeholder="View name"
          className="view-name-input"
        />
        <button 
          onClick={handleCreateView}
          disabled={!newViewName.trim()}
          className="create-button"
        >
          Add View
        </button>
      </div>
    </section>
  );
});
