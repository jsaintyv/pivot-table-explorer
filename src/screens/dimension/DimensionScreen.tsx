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

    

      {/* Action Buttons */}
      <section className="actions">        
        <button onClick={navigateToMainScreen} className="back-button">
          Back to Main screen
        </button>
      </section>
    </main>
  );
}

// Export the component directly - StoreContext is now provided at App level
export default observer(DimensionScreenComponent);
