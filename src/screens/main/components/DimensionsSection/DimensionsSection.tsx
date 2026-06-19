/**
 * DimensionsSection component
 * 
 * Displays list of dimensions with edit/delete actions
 * Follows MVC pattern: Uses store from React context, is a MobX observer
 * Max lines: < 200
 */

import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import type { Dimension } from '../../../../models/pivot-project/types';
import { useStore } from '../../../../stores/contexts/StoreContext';
import './DimensionsSection.css';

interface DimensionItemProps {
  dimension: Dimension;
  dataSourceName: string;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

function DimensionItem({ dimension, dataSourceName, onEdit, onRemove }: DimensionItemProps) {
  return (
    <div className="dimension-item">
      <div className="dimension-info">
        <span className="dimension-name">{dimension.name}</span>
        <span className="dimension-type">{dimension.dataType}</span>
        <span className="dimension-source">from {dataSourceName}</span>
        {dimension.description && (
          <span className="dimension-description" title={dimension.description}>
            {dimension.description}
          </span>
        )}
      </div>
      <div className="dimension-actions">
        <button 
          onClick={() => onEdit(dimension.id)}
          className="edit-button"
          title="Edit dimension"
        >
          Edit
        </button>
        <button 
          onClick={() => onRemove(dimension.id)}
          className="remove-button"
          title="Remove dimension"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * Main DimensionsSection component
 */
export const DimensionsSection = observer(() => {
  const store = useStore();
  const navigate = useNavigate();
  const dimensions = store.getDimensions();
  const pivotProject = store.pivotProject;

  /**
   * Get the name of a data source by ID
   */
  const getDataSourceName = (id: string): string => {
    const ds = pivotProject.dataSources.find(d => d.id === id);
    return ds?.name || 'Unknown';
  };

  /**
   * Navigate to Axe screen to edit a dimension
   */
  const handleEditDimension = (dimensionId: string) => {
    navigate(`/axe?dimensionId=${dimensionId}`);
  };

  /**
   * Remove a dimension
   */
  const handleRemoveDimension = (dimensionId: string) => {
    if (window.confirm('Are you sure you want to remove this dimension? All associated nodes and view references will be removed.')) {
      store.removeDimension(dimensionId);
    }
  };

  /**
   * Navigate to Axe screen to create a new dimension
   */
  const handleCreateDimension = () => {
    navigate('/axe');
  };

  return (
    <section className="section dimensions-section">
      <div className="section-header">
        <h2>Dimensions</h2>
        <button 
          onClick={handleCreateDimension}
          className="create-button"
        >
          Create Dimension
        </button>
      </div>
      
      <div className="dimensions-list">
        {dimensions.length > 0 ? (
          dimensions.map((dimension: Dimension) => {
            const firstMapping = dimension.columnMappings[0];
            const dsName = firstMapping ? getDataSourceName(firstMapping.dataSourceId) : 'Unknown';
            
            return (
              <DimensionItem
                key={dimension.id}
                dimension={dimension}
                dataSourceName={dsName}
                onEdit={handleEditDimension}
                onRemove={handleRemoveDimension}
              />
            );
          })
        ) : (
          <p className="empty-message">
            No dimensions configured. Import a CSV file to auto-create dimensions, or create them manually.
          </p>
        )}
      </div>
      
      <p className="info-text">
        Dimensions define how your data is organized. 
        Click "Create Dimension" to add new dimensions or Edit to modify existing ones.
      </p>
    </section>
  );
});
