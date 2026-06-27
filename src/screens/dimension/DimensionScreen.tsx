import { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import type { LocalDataSource, Dimension, DataColumn, ColumnMapping } from '../../models/pivot-project/types';
import './DimensionScreen.css';
import { useStore } from '../../stores/contexts/StoreContext';
 
/**
 * AxeScreen component
 * Allows users to create and edit dimensions by mapping columns from data sources
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function DimensionScreenComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const store = useStore();
  const dataSources = store.getLocalDataSources();
  const editingDimension = store.getEditingDimension();
  
  // Get dimensionId from URL params or search params
  const searchParams = new URLSearchParams(location.search);
  const dimensionId = params.dimensionId || searchParams.get('dimensionId');

  // Start editing when component mounts or dimensionId changes
  useEffect(() => {
    store.startEditingDimension(dimensionId || undefined);
    
    // Cleanup: cancel editing when component unmounts
    return () => {
      store.cancelEditingDimension();
    };
  }, [dimensionId]);

  // Navigate back to Main screen
  const navigateToMainScreen = () => {
    store.cancelEditingDimension();
    navigate('/');
  };

  /**
   * Handle property change for the dimension being edited
   */
  const handleDimensionChange = (property: keyof Dimension, value: any) => {
    if (editingDimension) {
      store.updateEditingDimension({
        [property]: value
      } as Partial<Dimension>);
    }
  };

  /**
   * Handle column selection change for a data source
   */
  const handleColumnSelection = (dataSourceId: string, columnIndex: number | '') => {
    if (!editingDimension) return;
    
    // Build new columnMappings array
    const existingMappings = editingDimension.columnMappings || [];
    let newMappings: ColumnMapping[];
    
    if (columnIndex === '') {
      // Remove mapping for this data source
      newMappings = existingMappings.filter(cm => cm.dataSourceId !== dataSourceId);
    } else {
      // Update or add mapping
      const dataSource = dataSources.find(ds => ds.id === dataSourceId);
      const columnName = dataSource?.columns[columnIndex]?.name || `Column ${columnIndex}`;
      
      const existingMappingIndex = existingMappings.findIndex(
        cm => cm.dataSourceId === dataSourceId
      );
      
      const newMapping: ColumnMapping = {
        dataSourceId,
        columnIndex,
        level: 0,
        name: columnName,
      };
      
      if (existingMappingIndex >= 0) {
        // Update existing mapping
        newMappings = [...existingMappings];
        newMappings[existingMappingIndex] = newMapping;
      } else {
        // Add new mapping
        newMappings = [...existingMappings, newMapping];
      }
    }
    
    store.updateEditingDimension({ columnMappings: newMappings });
  };

  /**
   * Save the dimension
   */
  const handleSave = () => {
    if (!editingDimension?.name.trim()) {
      alert('Please enter a dimension name');
      return;
    }
    
    try {
      store.saveEditingDimension();
      navigateToMainScreen();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  /**
   * Get column name from data source and index
   */
  const getColumnName = (dataSourceId: string, columnIndex: number): string => {
    const ds = dataSources.find(d => d.id === dataSourceId);
    if (ds && columnIndex >= 0 && columnIndex < ds.columns.length) {
      return ds.columns[columnIndex].name;
    }
    return `Column ${columnIndex}`;
  };

  /**
   * Get selected column index for a data source
   */
  const getSelectedColumnIndex = (dataSourceId: string): number | '' => {
    if (!editingDimension) return '';
    
    const mapping = editingDimension.columnMappings.find(
      cm => cm.dataSourceId === dataSourceId
    );
    return mapping ? mapping.columnIndex : '';
  };

  if (!editingDimension) {
    return (
      <main className="axe-screen">
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main className="axe-screen">
      <h1>{editingDimension.id ? 'Edit Dimension' : 'Create New Dimension'}</h1>
      <p>{editingDimension.id ? 'Edit the dimension properties and column mappings.' : 'Create a new dimension by selecting a name, data type, and mapping columns from your data sources.'}</p>

      {/* Dimension Identity Section */}
      <section className="section dimension-identity">
        <h2>Dimension Properties</h2>
        
        <div className="form-group">
          <label htmlFor="dimension-name">Name *</label>
          <input
            id="dimension-name"
            type="text"
            value={editingDimension.name || ''}
            onChange={(e) => handleDimensionChange('name', e.target.value)}
            placeholder="Enter dimension name"
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dimension-type">Data Type *</label>
          <select
            id="dimension-type"
            value={editingDimension.dataType || 'string'}
            onChange={(e) => handleDimensionChange('dataType', e.target.value as 'string' | 'number' | 'date' | 'boolean')}
            className="form-select"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="dimension-description">Description</label>
          <input
            id="dimension-description"
            type="text"
            value={editingDimension.description || ''}
            onChange={(e) => handleDimensionChange('description', e.target.value)}
            placeholder="Optional description"
            className="form-input"
          />
        </div>
      </section>

      {/* Column Mappings Section */}
      <section className="section column-mappings">
        <h2>Map Source Columns</h2>
        <p className="hint">
          Select which column from each data source should be mapped to this dimension.
        </p>
        
        {dataSources.length === 0 ? (
          <p className="no-data-sources">No data sources available. Please add CSV files first.</p>
        ) : (
          <div className="mapping-list">
            {dataSources.map((dataSource: LocalDataSource) => {
              const selectedColumnIndex = getSelectedColumnIndex(dataSource.id);
              
              return (
                <div key={dataSource.id} className="source-file-mapping">
                  <span className="source-name">{dataSource.name}</span>
                  
                  <select
                    value={selectedColumnIndex}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleColumnSelection(dataSource.id, value === '' ? '' : Number(value));
                    }}
                    className="column-select"
                  >
                    <option value="" disabled>Select a column</option>
                    {dataSource.columns.map((column: DataColumn, index) => (
                      <option key={index} value={index}>
                        {column.name} ({column.dataType})
                      </option>
                    ))}
                  </select>
                  
                  {selectedColumnIndex !== '' && (
                    <button
                      onClick={() => handleColumnSelection(dataSource.id, '')}
                      className="unlink-button"
                    >
                      Unlink
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Current Mappings Preview */}
      {editingDimension.id && (
        <section className="section mappings-preview">
          <h2>Current Mappings</h2>
          <div className="preview-list">
            {editingDimension.columnMappings.map((cm: ColumnMapping) => {
              const ds = dataSources.find(d => d.id === cm.dataSourceId);
              const colName = getColumnName(cm.dataSourceId, cm.columnIndex);
              return (
                <div key={`${cm.dataSourceId}-${cm.columnIndex}`} className="preview-item">
                  <strong>{ds?.name}:</strong> {colName}
                </div>
              );
            })}
            {editingDimension.columnMappings.length === 0 && (
              <p className="no-mappings">No columns mapped yet</p>
            )}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <section className="actions">
        <button onClick={handleSave} className="save-button">
          Save Dimension
        </button>
        <button onClick={navigateToMainScreen} className="back-button">
          Back to Main screen
        </button>
      </section>
    </main>
  );
}

// Export the component directly - StoreContext is now provided at App level
export default observer(DimensionScreenComponent);
