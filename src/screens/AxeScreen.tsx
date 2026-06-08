import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../store';
import type { SourceFile, Dimension } from '../store';
import '../screens/AxeScreen.css';

/**
 * AxeScreen component
 * Allows users to configure which columns from source CSV files will be used as axes (dimensions)
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function AxeScreen() {
  const navigate = useNavigate();
  
  const { sourceFiles, dimensions } = store;

  /**
   * Handle column selection for a source file
   */
  const handleColumnSelect = (sourceFileId: string, columnName: string) => {
    // Check if there's already a dimension for this source file
    const existingDimension = dimensions.find(
      dim => dim.sourceFileId === sourceFileId
    );
    
    if (existingDimension) {
      // Update existing dimension
      const updatedDimension: Dimension = {
        ...existingDimension,
        columnName,
        name: columnName,
      };
      store.updateDimension(updatedDimension);
    } else {
      // Create new dimension
      const newDimension: Dimension = {
        id: `${Date.now()}-${sourceFileId}-${columnName}`,
        name: columnName,
        sourceFileId,
        columnName,
      };
      store.addDimension(newDimension);
    }
  };

  /**
   * Get the currently selected column for a source file
   */
  const getSelectedColumn = (sourceFileId: string): string | undefined => {
    const dimension = dimensions.find(dim => dim.sourceFileId === sourceFileId);
    return dimension?.columnName;
  };

  /**
   * Get associated columns for a dimension name across all source files
   */
  const getAssociatedColumns = (columnName: string) => {
    return dimensions
      .filter(dim => dim.name === columnName)
      .map(dim => {
        const sourceFile = sourceFiles.find(sf => sf.id === dim.sourceFileId);
        return { sourceFileName: sourceFile?.name || 'Unknown', columnName: dim.columnName };
      });
  };

  /**
   * Navigate back to Main screen
   */
  const navigateToMainScreen = () => {
    navigate('/');
  };

  /**
   * Get unique dimension names (columns used as axes)
   */
  const getUniqueDimensionNames = (): string[] => {
    const names = dimensions.map(dim => dim.name);
    return [...new Set(names)];
  };

  return (
    <main className="axe-screen">
      <h1>Configure Axes</h1>
      <p>Select which columns from your source files will be used as dimensions (axes) for pivoting data.</p>

      {/* Column Selection Section */}
      <section className="section">
        <h2>Select Columns for Axes</h2>
        <p className="hint">
          By default, all columns with the same name in different source files are automatically associated to the same dimension.
        </p>
        
        <div className="source-file-list">
          {sourceFiles.map((sourceFile) => {
            const selectedColumn = getSelectedColumn(sourceFile.id);
            
            return (
              <div key={sourceFile.id} className="source-file-item">
                <h3>{sourceFile.name}</h3>
                <select
                  value={selectedColumn || ''}
                  onChange={(e) => handleColumnSelect(sourceFile.id, e.target.value)}
                  className="column-select"
                >
                  <option value="" disabled>
                    Select a column for axe
                  </option>
                  {sourceFile.columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      {/* Associated Columns Section */}
      <section className="section">
        <h2>Associated Columns</h2>
        <p className="hint">
          Columns with the same name across different source files are automatically grouped together.
        </p>
        
        <div className="associated-columns">
          {getUniqueDimensionNames().map((dimensionName) => {
            const associatedColumns = getAssociatedColumns(dimensionName);
            
            return (
              <div key={dimensionName} className="dimension-group">
                <h4>{dimensionName}</h4>
                <ul>
                  {associatedColumns.map((assoc, index) => (
                    <li key={index}>
                      {assoc.sourceFileName}.{assoc.columnName}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
