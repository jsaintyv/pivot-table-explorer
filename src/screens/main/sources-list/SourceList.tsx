import { observer } from "mobx-react-lite";
import type { LocalDataSource } from "../../../stores";
import { useStore } from "../../../stores/contexts/StoreContext";



export const SourceList = observer(() => {
    const store = useStore();        
    const dataSources = store.pivotProject.dataSources;

    /**
     * Handle file upload
     */
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        store.importCsv(file);    
    };

    /**
     * Remove a data source
     */
    const handleRemoveDataSource = (id: string) => {
        store.removeDataSource(id);
    };
    /*

     */

    const dataSourcesPart = dataSources.map((ds) => (
            <div key={"source-" + ds.id} className="file-item">
             <span>{ds.name}</span>
              <button  onClick={() => handleRemoveDataSource(ds.id)} className="remove-button">
                Delete
              </button>
            </div>
          ));
    return (
        <section className="section">
        <h2>Data Sources</h2>
        <div className="file-list">
          {dataSourcesPart.length > 0 ? dataSourcesPart : <p>No data sources loaded.</p>}
        </div>
        <label className="upload-button">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          Import a new CSV
        </label>
      </section>
    )
});