import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../../store';
import type { LocalDataSource, Dimension, DataColumn } from '../../models/pivot-project/types';
import './AxeScreen.css';

/**
 * AxeScreen component
 * Allows users to configure ColumnMappings for dimensions
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function AxeScreen() {
  const navigate = useNavigate();
  
  const { 
    pivotProject, 
    getLocalDataSources, 
    getDimensions,
    updateDimension,
    getDimension
  } = store;
  
  const dataSources = getLocalDataSources();
  const dimensions = getDimensions();

  /**
   * Get all unique column names across all data sources
   */
  const getAllColumnNames = (): string[] => {
    const allColumns: string[] = [];
    dataSources.forEach(ds => {
      ds.columns.forEach(col => {
        if (!allColumns.includes(col.name)) {
          allColumns.push(col.name);
        }
      });
    });
    return allColumns;
  };

  /**
   * Handle adding a column mapping to a dimension
   */
  const handleAddColumnMapping = (
    dimensionId: string,
    dataSourceId: string,
    columnIndex: number,
    level: number
  ) => {
    const dimension = getDimension(dimensionId);
    if (!dimension) return;
    
    // Check if this column is already mapped
    const existingMapping = dimension.columnMappings.find(
      cm => cm.dataSourceId === dataSourceId && cm.columnIndex === columnIndex
    );
    
    if (existingMapping) {
      // Remove the mapping
      dimension.columnMappings = dimension.columnMappings.filter(
        cm => !(cm.dataSourceId === dataSourceId && cm.columnIndex === columnIndex)
      );
    } else {
      // Add the mapping
      const dataSource = dataSources.find(ds => ds.id === dataSourceId);
      const columnName = dataSource?.columns[columnIndex]?.name || `Column ${columnIndex}`;
      
      dimension.columnMappings.push({
        dataSourceId,
        columnIndex,
        level,
        name: columnName,
      });
    }
    
    updateDimension(dimensionId, dimension);
  };

  /**
   * Check if a column is already mapped to a dimension
   */
  const isColumnMapped = (
    dimensionId: string,
    dataSourceId: string,
    columnIndex: number
  ): boolean => {
    const dimension = getDimension(dimensionId);
    if (!dimension) return false;
    
    return dimension.columnMappings.some(
      cm => cm.dataSourceId === dataSourceId && cm.columnIndex === columnIndex
    );
  };

  /**
   * Get the level for a new mapping (next available level)
   */
  const getNextLevel = (dimensionId: string): number => {
    const dimension = getDimension(dimensionId);
    if (!dimension || dimension.columnMappings.length === 0) return 0;
    
    return Math.max(...dimension.columnMappings.map(cm => cm.level)) + 1;
  };

  /**
   * Navigate back to Main screen
   */
  const navigateToMainScreen = () => {
    navigate('/');
  };

  return (
    <main className="axe-screen">
      <h1>Configure Axes</h1>
      <p>Configure ColumnMappings for your dimensions. Select which columns from which DataSources map to which dimensions.</p>

      {/* Dimensions Configuration Section */}
      <section className="section">
        <h2>Configure Dimension Mappings</h2>
        <p className="hint">
          Each dimension can map to columns from multiple DataSources. 
          The level defines the hierarchy (0 = root, 1 = child, etc.).
        </p>
        
        <div className="dimension-mapping-list">
          {dimensions.map((dimension: Dimension) => {
            return (
              <div key={dimension.id} className="dimension-mapping-item">
                <h3>{dimension.name} ({dimension.dataType})</h3>
                
                {/* Show current mappings */}
                <div className="current-mappings">
                  <h4>Current ColumnMappings:</h4>
                  {dimension.columnMappings.length === 0 ? (
                    <p className="no-mappings">No mappings defined</p>
                  ) : (
                    <ul>
                      {dimension.columnMappings.map((cm, index) => {
                        const ds = dataSources.find(d => d.id === cm.dataSourceId);
                        const colName = ds?.columns[cm.columnIndex]?.name || `Column ${cm.columnIndex}`;
                        return (
                          <li key={index}>
                            Level {cm.level}: {ds?.name}.{colName}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                
                {/* Add new mappings */}
                <div className="add-mapping">
                  <h4>Add ColumnMapping:</h4>
                  <select
                    onChange={(e) => {
                      const dsId = e.target.value;
                      if (dsId) {
                        const ds = dataSources.find(d => d.id === dsId);
                        if (ds) {
                          // For simplicity, map the first column
                          handleAddColumnMapping(dimension.id, dsId, 0, getNextLevel(dimension.id));
                        }
                      }
                    }}
                    value=""
                    className="mapping-select"
                  >
                    <option value="" disabled>Select a DataSource</option>
                    {dataSources.map(ds => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.columns.length} columns)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Column Overview Section */}
      <section className="section">
        <h2>All Available Columns</h2>
        <p className="hint">
          These are all columns from all imported DataSources.
        </p>
        
        <div className="column-overview">
          {dataSources.map((dataSource: LocalDataSource) => (
            <div key={dataSource.id} className="data-source-columns">
              <h3>{dataSource.name}</h3>
              <table className="column-table">
                <thead>
                  <tr>
                    <th>Index</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Used in Dimensions</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSource.columns.map((column: DataColumn, colIndex) => {
                    // Find dimensions that use this column
                    const usingDimensions = dimensions.filter(dim =>
                      dim.columnMappings.some(
                        cm => cm.dataSourceId === dataSource.id && cm.columnIndex === colIndex
                      )
                    );
                    
                    return (
                      <tr key={colIndex}>
                        <td>{column.index}</td>
                        <td>{column.name}</td>
                        <td>{column.dataType}</td>
                        <td>
                          {usingDimensions.length > 0 ? (
                            <ul className="using-dimensions">
                              {usingDimensions.map(dim => (
                                <li key={dim.id}>
                                  {dim.name} (level {dim.columnMappings.find(cm => cm.dataSourceId === dataSource.id && cm.columnIndex === colIndex)?.level})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="not-used">Not used</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <section className="navigation">
        <button onClick={navigateToMainScreen} className="back-button">
          Back to Main screen
        </button>
      </section>
    </main>
  );
}

export default observer(AxeScreen);
