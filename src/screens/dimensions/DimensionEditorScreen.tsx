/**
 * Dimension Editor Screen
 * 
 * Main screen component for creating and editing dimensions
 * Wrapped with observer to react to MobX store changes
 */

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { getDimensionEditorStore } from './stores';
import { DimensionIdentityForm } from './components/DimensionIdentityForm';
import { ColumnMappingList } from './components/ColumnMappingList';
import { PropertyMappingList } from './components/PropertyMappingList';
import { HierarchyPreview } from './components/HierarchyPreview';
import './DimensionEditorScreen.css';
import './components/SharedStyles.css';

// Re-export for backward compatibility
import { DimensionEditorStore } from './stores';
export { DimensionEditorStore };

export const DimensionEditorScreen = observer(() => {
  const navigate = useNavigate();
  const params = useParams<{ dimensionId?: string }>();
  const store = getDimensionEditorStore();
  const dataSources= store.pivotProject.dataSources;
  const dimension = store.dimension;

  // Load dimension on mount or when dimensionId changes
  useEffect(() => {
    store.loadDimension(params.dimensionId);
    
    // Cleanup on unmount
    return () => {
      store.cancelEditing();
    };
  }, [params.dimensionId]);

  // Navigate back to main screen
  const handleBack = () => {
    store.cancelEditing();
    navigate('/');
  };

  // Save dimension and navigate back
  const handleSave = async () => {
    try {
      const dimensionId = await store.saveDimension();
      store.cancelEditing();
      navigate('/');
      // Could show toast notification here
    } catch (error) {
      // Error is already handled in store and errors are displayed
      console.error('Failed to save dimension:', error);
    }
  };

  // If loading, show loading state
  if (store.isLoading) {
    return (
      <main className="dimension-editor-screen">
        <h1>Loading...</h1>
      </main>
    );
  }

  // If no dimension data, show empty state
  if (!dimension) {
    return (
      <main className="dimension-editor-screen">
        <h1>Create New Dimension</h1>
        <p>Initializing dimension editor...</p>
      </main>
    );
  }

  return (
    <main className="dimension-editor-screen">
      {/* Header */}
      <header className="editor-header">
        <div className="header-content">
          <h1>Edit Dimension</h1>
          <p className="subtitle">
            {dimension.id ? 'Edit existing dimension' : 'Create a new dimension'}
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleBack} 
            className="btn btn-secondary"
          >
            ← Back to Main
          </button>
          <button 
            onClick={handleSave}
            className="btn btn-primary"
            disabled={store.errors.length > 0}
          >
            💾 Save Dimension
          </button>
        </div>
      </header>

      {/* Editor Card */}
      <div className="editor-card">
        {/* Dimension Identity Section */}
        <section className="card-section">
          <div className="section-header">
            <h2>Dimension Identity</h2>
          </div>
          <DimensionIdentityForm store={store} />
        </section>

        {/* Available Data Sources Section */}
        <section className="card-section">
          <div className="section-header">
            <h2>Available Data Sources</h2>
          </div>
          <div className="source-files-list">
            {dataSources.map(ds => (
              <span key={ds.id} className="source-badge">
                📁 {ds.name}
              </span>
            ))}
          </div>
          {dataSources.length === 0 && (
            <p className="empty-state">No data sources available. Please add CSV files first.</p>
          )}
        </section>

        {/* Column Mappings Section */}
        <section className="card-section">
          <div className="section-header">
            <h2>
              Column Mappings
              <span className="mode-badge mode-{dimension.hierarchyMode}">
                {dimension.hierarchyMode === 'generation' ? 'Generation Mode' : 'Parent Mode'}
              </span>
            </h2>
          </div>
          <ColumnMappingList />
        </section>

        {/* Properties Mapping Section */}
        <section className="card-section">
          <div className="section-header">
            <h2>Properties Mapping</h2>
          </div>
          <PropertyMappingList store={store} />
        </section>

        {/* Hierarchy Preview Section */}
        <section className="card-section">
          <div className="section-header">
            <h2>Hierarchy Preview</h2>
          </div>
          <HierarchyPreview  />
        </section>
      </div>

      {/* Error Display */}
      {store.errors.length > 0 && (
        <div className="error-display">
          <h3>⚠️ Validation Errors</h3>
          <ul>
            {store.errors.map((error, index) => (
              <li key={index} className={`error-item severity-${error.severity}`}>
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
});

export default DimensionEditorScreen;
