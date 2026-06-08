import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../store';
import { parseCSV } from '../utils/csvParser';
import type { SourceFile, Dimension, View } from '../store';
import '../screens/MainScreen.css';

/**
 * MainScreen component
 * The primary interface for managing data sources and dimensions
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function MainScreen() {
  const navigate = useNavigate();
  
  const { sourceFiles, dimensions, views } = store;
  
  const [newViewName, setNewViewName] = useState('');

  /**
   * Handle file upload
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const csvData = parseCSV(content);
      const columns = csvData.length > 0 ? Object.keys(csvData[0]) : [];
      
      const newSourceFile: SourceFile = {
        id: Date.now().toString(),
        name: file.name,
        columns,
      };
      
      store.addSourceFile(newSourceFile);
      
      // Auto-create dimensions for each column
      columns.forEach(columnName => {
        const newDimension: Dimension = {
          id: `${Date.now()}-${columnName}`,
          name: columnName,
          sourceFileId: newSourceFile.id,
          columnName,
        };
        store.addDimension(newDimension);
      });
    };
    reader.readAsText(file);
  };

  /**
   * Remove a source file
   */
  const handleRemoveSourceFile = (id: string) => {
    store.removeSourceFile(id);
  };

  /**
   * Remove a dimension
   */
  const handleRemoveDimension = (id: string) => {
    store.removeDimension(id);
  };

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
    
    // For now, create a view with empty configuration
    // The actual configuration will be managed by the ViewGridScreen
    const newView: Omit<View, 'id'> = {
      name: newViewName.trim(),
      rowFields: [],
      columnFields: [],
      valueFields: [],
      aggregation: 'sum',
      filters: [],
    };
    
    store.addView(newView);
    setNewViewName('');
  };

  /**
   * Load a view
   */
  const handleLoadView = (viewId: string) => {
    store.loadView(viewId);
    // Navigate to view grid screen to see the loaded view
    navigate('/view-grid');
  };

  /**
   * Remove a view
   */
  const handleRemoveView = (viewId: string) => {
    store.removeView(viewId);
  };

  return (
    <main className="main-screen">
      <h1>Pivot Table Explorer</h1>
      <p>Manage your data sources and dimensions</p>

      {/* Source Files Section */}
      <section className="section">
        <h2>Source Files</h2>
        <div className="file-list">
          {sourceFiles.map((sourceFile) => (
            <div key={sourceFile.id} className="file-item">
              <span>{sourceFile.name} ({sourceFile.columns.length} columns)</span>
              <button 
                onClick={() => handleRemoveSourceFile(sourceFile.id)}
                className="remove-button"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <label className="upload-button">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          Import a new CSV
        </label>
      </section>

      {/* Dimensions Section */}
      <section className="section">
        <h2>Dimensions</h2>
        <div className="dimension-list">
          {dimensions.map((dimension) => {
            const sourceFile = sourceFiles.find(sf => sf.id === dimension.sourceFileId);
            return (
              <div key={dimension.id} className="dimension-item">
                <span>{dimension.name}</span>
                {sourceFile && <span className="source-hint"> from {sourceFile.name}</span>}
                <button 
                  onClick={() => handleRemoveDimension(dimension.id)}
                  className="remove-button"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Views Section */}
      <section className="section">
        <h2>Views</h2>
        <div className="view-list">
          {views.map((view) => (
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
}

export default observer(MainScreen);
