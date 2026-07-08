/**
 * Dimension Identity Form
 * 
 * Form for editing dimension identity (name, description, data type, hierarchy mode)
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import type { DimensionEditorStore } from '../stores/DimensionEditorStore';
import type { EditorValidationError } from '../stores/DimensionEditorStore';

interface Props {
  store: DimensionEditorStore;
}

// Data type options
const DATA_TYPE_OPTIONS: { value: 'string' | 'number' | 'date' | 'boolean'; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
];

// Hierarchy mode options
const HIERARCHY_MODE_OPTIONS: { value: 'parent' | 'generation'; label: string; description: string }[] = [
  {
    value: 'generation',
    label: 'Generation Mode',
    description: 'Each column represents a fixed generation level'
  },
  {
    value: 'parent',
    label: 'Parent Mode',
    description: 'Uses parent codes to build hierarchy'
  }
];

export const DimensionIdentityForm = observer(({ store }: Props) => {
  const dimension = store.dimension;
  
  if (!dimension) {
    return <div>No dimension data available</div>;
  }

  // Handle input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.updateName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    store.updateDescription(e.target.value);
  };

  const handleDataTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dataType = e.target.value as 'string' | 'number' | 'date' | 'boolean';
    store.updateDataType(dataType);
  };

  const handleHierarchyModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as 'parent' | 'generation';
    store.updateHierarchyMode(mode);
  };

  // Get error for a specific field
  const getError = (field: string): string | undefined => {
    const error = store.errors.find(e => e.field === field);
    return error?.message;
  };

  // Data type badge style
  const getDataTypeBadgeStyle = (dataType?: string): React.CSSProperties => {
    const colors: Record<string, { background: string; text: string }> = {
      string: { background: '#3498db', text: 'white' },
      number: { background: '#27ae60', text: 'white' },
      date: { background: '#8e44ad', text: 'white' },
      boolean: { background: '#e67e22', text: 'white' },
    };
    return {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      background: colors[dataType || 'string'].background,
      color: colors[dataType || 'string'].text,
    };
  };

  return (
    <div className="identity-form">
      {/* Name Field */}
      <div className="form-group">
        <label htmlFor="dimension-name">
          Dimension Name <span className="required-marker">*</span>
        </label>
        <input
          id="dimension-name"
          type="text"
          className="form-input"
          value={dimension.name || ''}
          onChange={handleNameChange}
          placeholder="e.g., Product"
        />
        {getError('name') && (
          <span className="error-message">{getError('name')}</span>
        )}
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label htmlFor="dimension-description">Description</label>
        <textarea
          id="dimension-description"
          className="form-input form-textarea"
          value={dimension.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Optional description of this dimension"
          rows={3}
        />
      </div>

      {/* Data Type Field */}
      <div className="form-group">
        <label htmlFor="dimension-datatype">
          Data Type <span className="required-marker">*</span>
        </label>
        <select
          id="dimension-datatype"
          className="form-select"
          value={dimension.dataType || ''}
          onChange={handleDataTypeChange}
        >
          <option value="">Select data type...</option>
          {DATA_TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {dimension.dataType && (
          <div style={{ marginTop: '8px' }}>
            <span style={getDataTypeBadgeStyle(dimension.dataType)}>
              {dimension.dataType}
            </span>
          </div>
        )}
        {getError('dataType') && (
          <span className="error-message">{getError('dataType')}</span>
        )}
      </div>

      {/* Hierarchy Mode Field */}
      <div className="form-group">
        <label htmlFor="dimension-hierarchy-mode">
          Hierarchy Mode <span className="required-marker">*</span>
        </label>
        <select
          id="dimension-hierarchy-mode"
          className="form-select"
          value={dimension.hierarchyMode || 'generation'}
          onChange={handleHierarchyModeChange}
        >
          {HIERARCHY_MODE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="mode-description">
          {HIERARCHY_MODE_OPTIONS.find(opt => opt.value === (dimension.hierarchyMode || 'generation'))?.description}
        </div>
        {getError('hierarchyMode') && (
          <span className="error-message">{getError('hierarchyMode')}</span>
        )}
      </div>

      {/* Dimension ID (read-only) */}
      <div className="form-group">
        <label htmlFor="dimension-id">Dimension ID</label>
        <input
          id="dimension-id"
          type="text"
          className="form-input"
          value={dimension.id || 'Auto-generated'}
          readOnly
          disabled
        />
      </div>
    </div>
  );
});

export default DimensionIdentityForm;
