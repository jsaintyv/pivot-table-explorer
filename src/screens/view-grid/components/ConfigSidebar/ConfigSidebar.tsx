/**
 * ConfigSidebar component
 * Sidebar (20%) avec dimensions disponibles, sélectionnées et filtres
 */
import { useViewStore } from '../../../../stores/contexts/ViewStoreContext';
import { observer } from 'mobx-react-lite';

interface ConfigSidebarProps {}

export const ConfigSidebar = observer(({}: ConfigSidebarProps) => {
  const viewStore = useViewStore();
  const filters = viewStore.filters;
    
  return (
    <aside className="config-sidebar">              
      {/* Filters */}
      <div className="config-section">
        <h3>Filters {filters.length ? ("(" + filters.length + ")") : ""}</h3>
        <div className="filters-list">
          {/* Filtres existants */}
          {viewStore.rootStore.getDimensions()?.map(dim => {
            const filterDim = viewStore.getFilterForDimension(dim.id);
            const options = viewStore.getFilterOptions(dim.id);
            
            return (
              <div key={dim.id} className="filter-group">
                <h4>{dim?.name} {filterDim && filterDim.selectedNodes.length > 0 ? <button onClick={()=>viewStore.clearFilter(dim.id)}>🗑</button> : <></>}</h4>
                <select
                  className="filter-select"
                  multiple
                  value={filterDim?.selectedNodes}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions)
                      .map(opt => opt.value);
                    viewStore.setFilterForDimension(dim.id, selected, "include");                    
                  }}
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}                    
        </div>
      </div>
    </aside>
  );
});
