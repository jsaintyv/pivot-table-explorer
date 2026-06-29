/**
 * Hierarchy Preview
 * 
 * Visual preview of the hierarchy structure based on current mappings
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import type { DimensionEditorStore } from '../stores/DimensionEditorStore';
import type { MAPPING_TYPE_LABELS } from '../types';

interface Props {
  store: DimensionEditorStore;
}

// Tree node for rendering
interface TreeNode {
  name: string;
  type: string;
  children: TreeNode[];
}

// Build a sample hierarchy for preview
const buildSampleHierarchy = (
  mode: 'parent' | 'generation',
  columnMappings: any[]
): TreeNode[] => {
  if (mode === 'generation') {
    // Build generation-based hierarchy
    const rootMappings = columnMappings.filter((m: any) => m.mappingType === 'root');
    const gen1Mappings = columnMappings.filter((m: any) => m.mappingType === 'gen1');
    const gen2Mappings = columnMappings.filter((m: any) => m.mappingType === 'gen2');
    const gen3Mappings = columnMappings.filter((m: any) => m.mappingType === 'gen3');

    if (rootMappings.length === 0) {
      return [
        {
          name: '(No root level defined)',
          type: 'Info',
          children: []
        }
      ];
    }

    // For demo purposes, show the Product example from the use case
    // In a real implementation, this would be built from actual data
    if (columnMappings.some((m: any) => m.columnName === 'ParentCode')) {
      return [
        {
          name: 'MEM',
          type: 'Racine',
          children: [
            { name: 'DDR4', type: 'Génération 1', children: [] },
            { name: 'DDR5', type: 'Génération 1', children: [] }
          ]
        },
        {
          name: 'GRAPH',
          type: 'Racine',
          children: [
            { name: 'NV5050', type: 'Génération 1', children: [] },
            { name: 'NV5060', type: 'Génération 1', children: [] }
          ]
        }
      ];
    }

    return [
      {
        name: '(Hierarchy preview based on mappings)',
        type: 'Info',
        children: []
      }
    ];
  }

  // Parent mode - show structure
  return [
    {
      name: 'Hierarchy (Parent Mode)',
      type: 'Mode',
      children: [
        {
          name: 'Parent Code Column',
          type: 'Parent Code',
          children: [
            {
              name: '(References parent nodes)',
              type: 'Reference',
              children: []
            }
          ]
        },
        {
          name: 'Label Column',
          type: 'Label',
          children: [
            {
              name: '(Display names)',
              type: 'Display',
              children: []
            }
          ]
        }
      ]
    }
  ];
};

// Tree node component
const TreeNodeComponent: React.FC<{ node: TreeNode; level?: number }> = ({ node, level = 0 }) => (
  <div style={{ marginLeft: level > 0 ? `${level * 20}px` : '0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {level > 0 && (
        <span style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
          {level === 1 ? '├──' : level === 2 ? '│  └──' : '└──'}
        </span>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: level === 0 ? 600 : 400, color: level === 0 ? '#2980b9' : '#34495e' }}>
          {node.name}
        </span>
        <span 
          style={{ 
            fontSize: '0.75rem', 
            padding: '2px 6px', 
            borderRadius: '4px',
            background: level === 0 ? '#27ae60' : level === 1 ? '#3498db' : level === 2 ? '#8e44ad' : '#e67e22',
            color: 'white'
          }}
        >
          {node.type}
        </span>
      </div>
    </div>
    {node.children.map((child, index) => (
      <TreeNodeComponent key={index} node={child} level={level + 1} />
    ))}
  </div>
);

export const HierarchyPreview = observer(({ store }: Props) => {
  const hierarchy = store.hierarchyPreview;
  const hasMappings = store.columnMappings.length > 0;

  return (
    <div className="hierarchy-preview">
      <div className="preview-header">
        <span className="preview-title">
          📊 Current Hierarchy Structure
        </span>
        <span className="mode-indicator">
          Mode: {store.hierarchyMode === 'generation' ? 'Generation' : 'Parent'}
        </span>
      </div>

      <div className="preview-description">
        {store.hierarchyMode === 'generation' 
          ? 'Each level represents a generation (Racine → Génération 1 → Génération 2 → ...)'
          : 'Hierarchy built via parent code references'}
      </div>

      <div className="hierarchy-tree">
        {hasMappings ? (
          hierarchy.map((rootNode, index) => (
            <TreeNodeComponent key={index} node={rootNode} level={0} />
          ))
        ) : (
          <div className="empty-state">
            <p>No hierarchy to display.</p>
            <p>Add column mappings to see the hierarchy structure.</p>
          </div>
        )}
      </div>

      {store.hierarchyMode === 'generation' && store.columnMappings.length > 0 && (
        <div className="legend">
          <h4>Legend</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="color-box" style={{ background: '#27ae60' }}></span>
              <span>Racine (Root Level)</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ background: '#3498db' }}></span>
              <span>Génération 1 (Child Level)</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ background: '#8e44ad' }}></span>
              <span>Génération 2</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ background: '#e67e22' }}></span>
              <span>Génération 3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default HierarchyPreview;
