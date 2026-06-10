import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../../store';
import { parseCSV } from '../../utils/csvParser';
import type { LocalDataSource, Dimension, View, DataColumn } from '../../models/pivot-project/types';
import { saveProjectToFile } from '../../models/pivot-project/serialization';
import './MainScreen.css';

/**
 * MainScreen component
 * The primary interface for managing data sources and dimensions
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function MainScreen() {
  const navigate = useNavigate();
  
  // Get data from the new PivotProject model
  const { pivotProject, exportProject } = store;
  
  const dataSources = store.getLocalDataSources();
  const dimensions = store.getDimensions();
  const views = store.getViews();
  
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
      
      // Convert to row-major format (array of arrays)
      const data: any[][] = csvData.map(row => columns.map(col => row[col]));
      
      // Create DataColumn metadata
      const dataColumns: DataColumn[] = columns.map((name, index) => ({
        index,
        name,
        dataType: detectColumnType(csvData, name, index),
        nullable: false,
        unique: isColumnUnique(csvData, name),
      }));
      
      // Add the data source
      const dsId = store.addLocalDataSource(
        file.name,
        'csv',
        dataColumns,
        data
      );
      
      // Auto-create dimensions for each column
      dataColumns.forEach((column, colIndex) => {
        const dimId = store.addDimension(
          column.name,
          column.dataType as 'string' | 'number' | 'date' | 'boolean',
          `Dimension for ${column.name}`,
          [{
            dataSourceId: dsId,
            columnIndex: colIndex,
            level: 0,
            name: column.name,
          }]
        );
        
        // Create root node for this dimension
        const uniqueValues = getUniqueValues(csvData, column.name);
        uniqueValues.forEach((value) => {
          store.addNode(
            dimId,
            String(value),
            value,
            {},
            [],
            [dsId]
          );
        });
      });
    };
    reader.readAsText(file);
  };

  /**
   * Detect the data type of a column
   */
  function detectColumnType(csvData: any[], columnName: string, index: number): 'string' | 'number' | 'date' | 'boolean' | 'unknown' {
    if (csvData.length === 0) return 'unknown';
    
    const values = csvData.map(row => row[columnName]);
    
    // Check if all values are numbers
    const allNumbers = values.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''));
    if (allNumbers) return 'number';
    
    // Check if all values are dates
    const allDates = values.every(v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v));
    if (allDates) return 'date';
    
    // Check if all values are booleans
    const allBooleans = values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false');
    if (allBooleans) return 'boolean';
    
    return 'string';
  }

  /**
   * Check if a column has unique values
   */
  function isColumnUnique(csvData: any[], columnName: string): boolean {
    if (csvData.length === 0) return false;
    const values = csvData.map(row => row[columnName]);
    const uniqueValues = new Set(values);
    return uniqueValues.size === values.length;
  }

  /**
   * Get unique values from a column
   */
  function getUniqueValues(csvData: any[], columnName: string): any[] {
    if (csvData.length === 0) return [];
    const values = csvData.map(row => row[columnName]);
    return [...new Set(values)];
  }

  /**
   * Remove a data source
   */
  const handleRemoveDataSource = (id: string) => {
    store.removeDataSource(id);
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
   * Get the name of a data source by ID
   */
  const getDataSourceName = (id: string): string => {
    const ds = pivotProject.dataSources.find(d => d.id === id);
    return ds?.name || 'Unknown';
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
      <section className="section">
        <h2>Data Sources</h2>
        <div className="file-list">
          {dataSources.map((dataSource: LocalDataSource) => (
            <div key={dataSource.id} className="file-item">
              <span>{dataSource.name} ({dataSource.columns.length} columns)</span>
              <button 
                onClick={() => handleRemoveDataSource(dataSource.id)}
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
          {dimensions.map((dimension: Dimension) => {
            // Find the first data source that this dimension references
            const firstMapping = dimension.columnMappings[0];
            const dsName = firstMapping ? getDataSourceName(firstMapping.dataSourceId) : 'Unknown';
            
            return (
              <div key={dimension.id} className="dimension-item">
                <span>{dimension.name} ({dimension.dataType})</span>
                <span className="source-hint"> from {dsName}</span>
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
        <p className="info-text">
          Dimensions are automatically created from CSV columns. 
          Use the Axe screen to configure which columns map to which dimensions.
        </p>
      </section>

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
}

export default observer(MainScreen);
