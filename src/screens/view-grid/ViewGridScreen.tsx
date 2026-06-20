import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useViewStore } from '../../stores/contexts/ViewStoreContext';
import { ViewHeader } from './components/ViewHeader';
import { ConfigSidebar } from './components/ConfigSidebar';
import { GridMain } from './components/GridMain';
import { ActionBar } from './components/ActionBar';

import './ViewGridScreen.css';

/**
 * ViewGridScreen component
 * Allows users to configure the pivot table structure with row dimensions, column dimensions, filters, and value fields
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function ViewGridScreenComponent() {
  const navigate = useNavigate();  
  const viewStore = useViewStore();
    
  // Charger la première vue par défaut au montage
  useEffect(() => {
    const views = viewStore.getViews();
    if (views.length > 0 && !viewStore.getActiveViewId()) {
      viewStore.loadView(views[0].id);
    }
  }, []);
    
  // Gestion de la vue active - use computed properties from viewStore
  const { activeView } = viewStore;
    
  // Handlers
  const handleBackToMain = () => {
    navigate('/');
  };
      
  if (!activeView) {
    return (
      <div className="view-grid-screen">
        <p className="no-view-message">Aucune vue disponible. Créez une vue dans l'écran principal.</p>
        <button className="nav-button" onClick={handleBackToMain}>
          Retour à l'écran principal
        </button>
      </div>
    );
  }
  
  return (
    <div className="view-grid-screen">
      {/* Header avec sélecteurs de dimensions */}
      <ViewHeader />
      
      {/* Layout principal */}
      <div className="screen-layout">
        {/* Sidebar - 20% */}
        <ConfigSidebar />
        
        {/* Zone Grid - 80% */}
        <GridMain />
      </div>
      
      {/* Barre d'actions */}
      <ActionBar
        onBack={handleBackToMain}        
      />
      
      
    </div>
  );
}

// Export the component directly - StoreContext and ViewStoreContext are provided at App level
export default observer(ViewGridScreenComponent);
