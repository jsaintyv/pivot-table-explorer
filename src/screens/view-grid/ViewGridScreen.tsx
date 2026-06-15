import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/contexts/StoreContext';
import { useViewStore } from '../../stores/contexts/ViewStoreContext';
import type { AggregationType, View, Measure } from '../../models/pivot-project/types';
import { ViewHeader } from './components/ViewHeader';
import { ConfigSidebar } from './components/ConfigSidebar';
import { GridMain } from './components/GridMain';
import { ActionBar } from './components/ActionBar';
import { AddDimensionModal } from './components/modals/AddDimensionModal';
import { AggregationModal } from './components/modals/AggregationModal';
import './ViewGridScreen.css';

/**
 * ViewGridScreen component
 * Allows users to configure the pivot table structure with row dimensions, column dimensions, filters, and value fields
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
function ViewGridScreenComponent() {
  const navigate = useNavigate();
  const store = useStore();
  const viewStore = useViewStore();
  
  // État local pour les modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalTarget, setAddModalTarget] = useState<'row' | 'column' | 'value'>('row');
  const [isAggregationModalOpen, setIsAggregationModalOpen] = useState(false);
  const [aggregationMeasure, setAggregationMeasure] = useState<Measure | null>(null);
  const [viewNameInput, setViewNameInput] = useState('');
  
  // Charger la première vue par défaut au montage
  useEffect(() => {
    const views = viewStore.getViews();
    if (views.length > 0 && !viewStore.getActiveViewId()) {
      viewStore.loadView(views[0].id);
    }
  }, []);
  
  // Mettre à jour le nom de la vue active dans l'input
  useEffect(() => {
    const activeView = viewStore.getActiveView();
    if (activeView) {
      setViewNameInput(activeView.name);
    } else {
      setViewNameInput('');
    }
  }, [viewStore.getActiveViewId()]);
  
  // Gestion de la vue active
  const activeView = viewStore.getActiveView();
  const dimensions = store.getDimensions();
  
  // Dimensions utilisées dans la vue
  const usedDimensionIds = new Set<string>([
    ...(activeView?.rowDimensions || []),
    ...(activeView?.columnDimensions || []),
    ...(activeView?.measures.map(m => m.id) || []),
    ...(activeView?.filterDimensions?.map(fd => fd.dimensionId) || [])
  ]);
  
  // Handlers pour les modals
  const openAddModal = (target: 'row' | 'column' | 'value') => {
    setAddModalTarget(target);
    setIsAddModalOpen(true);
  };
  
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };
  
  const openAggregationModal = (measureId: string) => {
    const measure = activeView?.measures.find(m => m.id === measureId);
    if (measure) {
      setAggregationMeasure(measure);
      setIsAggregationModalOpen(true);
    }
  };
  
  const closeAggregationModal = () => {
    setIsAggregationModalOpen(false);
    setAggregationMeasure(null);
  };
  
  // Handlers
  const handleBackToMain = () => {
    navigate('/');
  };
  
  const handleSaveViewName = () => {
    if (viewNameInput.trim() && activeView) {
      viewStore.updateActiveViewName(viewNameInput);
    }
  };
  
  const handleAddDimension = (dimensionId: string) => {
    viewStore.addDimensionToView(dimensionId, addModalTarget);
    closeAddModal();
  };
  
  const handleSetAggregation = (aggregation: AggregationType) => {
    if (aggregationMeasure) {
      viewStore.updateMeasureAggregation(aggregationMeasure.id, aggregation);
      closeAggregationModal();
    }
  };
  
  const handleRemoveDimension = (dimensionId: string, category: 'row' | 'column' | 'value') => {
    viewStore.removeDimensionFromView(dimensionId, category);
  };
  
  const handleSetFilter = (dimensionId: string, nodeIds: string[]) => {
    viewStore.setFilterForDimension(dimensionId, nodeIds);
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
      <ViewHeader
        view={activeView}
        dimensions={dimensions}
        onAddDimension={openAddModal}
        onRemoveDimension={handleRemoveDimension}
        onConfigureAggregation={openAggregationModal}
        viewName={viewNameInput}
        onViewNameChange={setViewNameInput}
        onSaveView={handleSaveViewName}
        canSave={viewNameInput.trim().length > 0}
      />
      
      {/* Layout principal */}
      <div className="screen-layout">
        {/* Sidebar - 20% */}
        <ConfigSidebar
          view={activeView}
          dimensions={dimensions}
          onAddToView={handleAddDimension}
          onRemoveFromView={handleRemoveDimension}
          onSetFilter={handleSetFilter}
          onConfigureAggregation={openAggregationModal}
        />
        
        {/* Zone Grid - 80% */}
        <GridMain view={activeView} />
      </div>
      
      {/* Barre d'actions */}
      <ActionBar
        onBack={handleBackToMain}
        onApply={() => {}} // Apply est géré automatiquement via observer
      />
      
      {/* Modal pour ajouter des dimensions */}
      {isAddModalOpen && (
        <AddDimensionModal
          dimensions={dimensions}
          usedDimensionIds={usedDimensionIds}
          target={addModalTarget}
          onClose={closeAddModal}
          onAdd={handleAddDimension}
        />
      )}
      
      {/* Modal pour configurer l'agrégation */}
      {isAggregationModalOpen && aggregationMeasure && (
        <AggregationModal
          measure={aggregationMeasure}
          onClose={closeAggregationModal}
          onSetAggregation={handleSetAggregation}
        />
      )}
    </div>
  );
}

// Export the component directly - StoreContext and ViewStoreContext are provided at App level
export default observer(ViewGridScreenComponent);
