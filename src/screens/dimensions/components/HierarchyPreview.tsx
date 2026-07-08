/**
 * Hierarchy Preview
 * 
 * Visual preview of the hierarchy structure based on current mappings
 */

import { observer } from 'mobx-react-lite';
import { DimensionEditorStore, getDimensionEditorStore } from '../stores/DimensionEditorStore';
import type { Node } from '../../../models/pivot-project/types';



// Tree node for rendering - matches the store's hierarchy preview structure
interface TreeNodeComponentProps {
  store: DimensionEditorStore,
  node: Node,
  level: number
}

// Tree node component
const TreeNodeComponent = ({ store, node, level } : TreeNodeComponentProps) => (

  <div style={{ marginLeft: level > 0 ? `${level * 20}px` : '0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {level > 0 && (
        <span style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
          {level === 1 ? '├──' : level === 2 ? '│  └──' : '└──'}
        </span>
      )}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: level === 0 ? 600 : 400, color: level === 0 ? '#2980b9' : '#34495e' }}>
          {node.code}
        </span>        
      </div>
    </div>
    {node.children
        .map((child, ) => store.nodesByCode.get(child))
        .filter(n => n != null)
        .map((child, ) => (<TreeNodeComponent key={child.id} store={store} node={child} level={level + 1} />))}
  </div>
);

interface Props {
  
}

export const HierarchyPreview = observer(({ }: Props) => {
  const store = getDimensionEditorStore();      
  const nodes = store.dimension?.rootNodes?.map(id => store.nodesByCode.get(id)).filter(n => n != null);  
  return (
    <div className="hierarchy-preview">
      <div className="preview-header">
        <span className="preview-title">
          📊 Current Hierarchy Structure
        </span>
        <span className="mode-indicator">
          Mode: {store.dimension!.hierarchyMode === 'generation' ? 'Generation' : 'Parent'}
        </span>
      </div>

      <div className="preview-description">
        {store.dimension!.hierarchyMode === 'generation' 
          ? 'Each level represents a generation (Racine → Génération 1 → Génération 2 → ...)'
          : 'Hierarchy built via parent code references'}
      </div>

      <div className="hierarchy-tree">
        {nodes ? (
          nodes.map((rootNode, index) => (
            <TreeNodeComponent key={index} store={store}  node={rootNode} level={0} />
          ))
        ) : (
          <div className="empty-state">
            <p>No hierarchy to display.</p>
            <p>Add column mappings to see the hierarchy structure.</p>
          </div>
        )}
      </div>

      {store.dimension!.hierarchyMode === 'generation' && store.dimension!.columnMappings.length > 0 && (
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
