import { observer } from "mobx-react-lite";
import type { Dimension } from "../../../models/pivot-project/types";
import { useStore } from "../../../stores/contexts/StoreContext";

/**
 * Dimensions component
 * Displays the list of dimensions and allows their removal
 */
export const Dimensions = observer(() => {
    const store = useStore();
    const pivotProject = store.pivotProject;
    const dimensions = store.getDimensions();
    
    /**
     * Get the name of a data source by ID
     */
    const getDataSourceName = (id: string): string => {
        const ds = pivotProject.dataSources.find(d => d.id === id);
        return ds?.name || 'Unknown';
    };

    return (
        <section className="section">
            <h2>Dimensions</h2>
            <div className="dimension-list">
                {dimensions.map((dimension: Dimension) => {
                    // Find the first data source that this dimension references
                    const firstMapping = dimension.columnMappings[0];
                    const dsName = firstMapping ? getDataSourceName(firstMapping.dataSourceId) : 'Unknown';
                    
                    return (
                        <div key={dimension.id} className="dimension-item">
                            <span>{dimension.name} ({dimension.dataType})</span>
                            <span className="source-hint"> from {dsName}</span>
                            <button 
                                onClick={() => store.removeDimension(dimension.id)}
                                className="remove-button"
                            >
                                Delete
                            </button>
                        </div>
                    );
                })}
            </div>
            <p className="info-text">
                Dimensions are automatically created from CSV columns. 
                Use the Axe screen to configure which columns map to which dimensions.
            </p>
        </section>
    );
});
