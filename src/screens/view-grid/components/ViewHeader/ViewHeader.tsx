/**
 * ViewHeader component
 * Header avec sélecteurs de dimensions lignes/colonnes/champs valeurs
 */

import { observer } from 'mobx-react-lite';
import type { View, Measure } from '../../../../models/pivot-project/types';
import type { Dimension } from '../../../../models/pivot-project/types';
import { useStore } from '../../../../stores/contexts/StoreContext';
import { useViewStore } from '../../../../stores/contexts/ViewStoreContext';
import { AddDimensionModal } from '../../components/modals/AddDimensionModal';
import { AggregationModal } from '../../components/modals/AggregationModal';
import { useState } from 'react';
import type { ModalType } from '../../../../stores/ViewStore';

interface ViewHeaderProps {    
}

export const ViewHeader = observer(({}: ViewHeaderProps) =>  {    
  const [viewName, setViewName] = useState("");  
  const viewStore = useViewStore();
  if(! viewStore.activeView) {
    return (<></>);
  }

  if(viewName !== viewStore.activeView?.name) {
    setViewName(viewStore.activeView.name);
  }

  // Créer une map pour un accès rapide aux dimensions
  const dimMap = new Map(viewStore.allDimensions.map(d => [d.id, d]));

  // Handlers pour les modals  
  return (
    <div className="view-header">
      <div className="dimension-header">
        {/* Row dimensions */}
        <div className="dimension-config-line">
          <span className="config-label">Row dimensions:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => viewStore.openModal( 'row')}
            title="Add row dimension"
          >
            +
          </button>
          <div className="current-selections">
            {viewStore.rowDimensions.map(dim => {
              
              return (
                <span key={dim.id} className="selected-badge">
                  {dim?.name}
                  <span 
                    className="remove-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      viewStore.removeDimensionFromView(dim.id, 'row');
                    }}
                  >
                    &times;
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Column dimensions */}
        <div className="dimension-config-line">
          <span className="config-label">Column dimensions:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => viewStore.openModal('column')}
            title="Add column dimension"
          >
            +
          </button>
          <div className="current-selections">
            {viewStore.colDimensions.map(dim => {              
              return (
                <span key={dim.id} className="selected-badge">
                  {dim?.name}
                  <span 
                    className="remove-btn" 
                    onClick={() => {                      
                      viewStore.removeDimensionFromView(dim.id, 'column');
                    }}
                  >
                    &times;
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Value fields */}
        <div className="dimension-config-line">
          <span className="config-label">Value fields:</span>
          <button 
            className="add-dimension-btn" 
            onClick={() => viewStore.openModal('value')}
            title="Add value field"
          >
            +
          </button>
          <div className="current-selections">
            {viewStore.measures.map(measure => (
              <span 
                key={measure.id} 
                className="selected-badge"
                onClick={() => viewStore.openAggregationModal(measure.id)}
              >
                {measure.name}
                <span className="agg-indicator">
                  {measure.aggregation}
                </span>
                <span 
                  className="remove-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    viewStore.removeMeasureFromView(measure.id);
                  }}
                >
                  &times;
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* View name input */}
      <div className="view-name">
        <input
          type="text"
          value={viewStore.activeView?.name || ""}
          onChange={(e) => {setViewName(e.target.value); viewStore.updateName(e.target.value)}}
          placeholder="View name"
          className="view-name-input"
        />        
      </div>

      {/* Modal pour ajouter des dimensions */}
      {viewStore.showAddModal && (
        <AddDimensionModal
          dimensions={viewStore.allDimensions}
          usedDimensionIds={viewStore.usedDimensionIds}
          target={viewStore.addModalTarget}
          onClose={() => viewStore.showAddModal = false}
          onAdd={(id) => {viewStore.addDimensionToView(id, viewStore.addModalTarget)}}
        />
      )}
      
      {/* Modal pour configurer l'agrégation */}
      {viewStore.showAggregationModal && (
        <AggregationModal
          measure={viewStore.getMeasure(viewStore.currentMeasureId)!}
          onClose={() => viewStore.closeAggregationModal()}
          onSetAggregation={(agg)=>viewStore.updateMeasureAggregation(agg)}
        />
      )}
    </div>
  );
})
