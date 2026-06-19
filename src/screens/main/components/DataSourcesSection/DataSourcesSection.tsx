/**
 * DataSourcesSection component
 * 
 * Displays list of data sources and handles CSV import
 * Follows MVC pattern: Uses store from React context, is a MobX observer
 * Max lines: < 200
 */

import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import type { LocalDataSource, DataSource } from '../../../../models/pivot-project/types';
import { useStore } from '../../../../stores/contexts/StoreContext';
import './DataSourcesSection.css';

interface DataSourceItemProps {
  dataSource: DataSource;
  onRemove: (id: string) => void;
}

function DataSourceItem({ dataSource, onRemove }: DataSourceItemProps) {
  const isLocal = dataSource.type === 'local';
  const localDs = dataSource as LocalDataSource;
  const columnCount = isLocal ? localDs.columns?.length || 0 : 0;
  const rowCount = isLocal ? localDs.data?.length || 0 : 0;

  return (
    <div className="data-source-item">
      <div className="data-source-info">
        <span className="data-source-name">{dataSource.name}</span>
        <span className="data-source-type">{dataSource.type}</span>
        {isLocal && (
          <span className="data-source-stats">
            {columnCount} columns, {rowCount} rows
          </span>
        )}
      </div>
      <button 
        onClick={() => onRemove(dataSource.id)}
        className="remove-button"
        title="Remove data source"
      >
        Delete
      </button>
    </div>
  );
}

/**
 * Main DataSourcesSection component
 */
export const DataSourcesSection = observer(() => {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataSources = store.pivotProject.dataSources;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      store.importCsv(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveDataSource = (id: string) => {
    if (window.confirm('Are you sure you want to remove this data source? All associated dimensions and nodes will be affected.')) {
      store.removeDataSource(id);
    }
  };

  return (
    <section className="section data-sources-section">
      <div className="section-header">
        <h2>Data Sources</h2>
        <label className="import-button">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".csv" 
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          Import CSV
        </label>
      </div>
      
      <div className="data-sources-list">
        {dataSources.length > 0 ? (
          dataSources.map((ds) => (
            <DataSourceItem
              key={ds.id}
              dataSource={ds}
              onRemove={handleRemoveDataSource}
            />
          ))
        ) : (
          <p className="empty-message">No data sources loaded. Import a CSV file to get started.</p>
        )}
      </div>
    </section>
  );
});
