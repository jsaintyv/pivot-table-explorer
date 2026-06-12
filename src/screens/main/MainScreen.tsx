import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { parseCSV } from '../../utils/csvParser';
import type { LocalDataSource, View, DataColumn } from '../../models/pivot-project/types';
import { saveProjectToFile } from '../../models/pivot-project/serialization';
import './MainScreen.css';
import { StoreContext, useStore } from '../../stores/contexts/StoreContext';
import { Store } from '../../stores';
import { SourceList } from './sources-list/SourceList';
import { Dimensions } from './dimensions/Dimensions';

/**
 * MainScreen component
 * The primary interface for managing data sources and dimensions
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
const MainScreen = observer(() => {
  const navigate = useNavigate();

  const store = useStore();
  const pivotProject = store.pivotProject;
  
  // Get data from the new PivotProject model
  const exportProject = store.exportProject;
  
  const dataSources = store.getLocalDataSources();
  const views = store.getViews();
  
  const [newViewName, setNewViewName] = useState('');
  
  /**
   * Navigate to Axe screen
   */
  const navigateToAxeScreen = () => {
    navigate('/axe');
  };

  /**
   * Navigate to View Grid screen
   */
  const navigateToViewGridScreen = () => {
    navigate('/view-grid');
  };

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


  /**
   * Export project to file
   */
  const handleExportProject = () => {
    const project = exportProject();
    saveProjectToFile(project, `${project.name || 'pivot-project'}.pivot.json`);
  };

  return (
    <main className="main-screen">
      <h1>Pivot Table Explorer</h1>
      <p>Manage your data sources and dimensions</p>

      {/* Data Sources Section */}
      <SourceList />

      {/* Dimensions Section */}
      <Dimensions />

      {/* Views Section */}
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

      {/* Project Actions */}
      <section className="section project-actions">
        <h2>Project</h2>
        <div className="action-buttons">
          <button onClick={() => store.createProject()} className="nav-button">
            New Project
          </button>
          <button 
            onClick={handleExportProject}
            className="nav-button"
          >
            Export Project
          </button>
        </div>
      </section>

      {/* Navigation Buttons */}
      <section className="navigation">
        <button onClick={navigateToAxeScreen} className="nav-button">
          Configure Axes
        </button>
        <button onClick={navigateToViewGridScreen} className="nav-button">
          Configure View Grid
        </button>
      </section>
    </main>
  );
});

// Wrap the component with StoreContext.Provider
export default observer(function MainScreenWrapper() {
  return (
    <StoreContext.Provider value={Store.getInstance()}>
      <MainScreen />
    </StoreContext.Provider>
  );
});
