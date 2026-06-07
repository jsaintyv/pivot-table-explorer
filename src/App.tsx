import { useState, useMemo } from 'react';
import PivotGrid from './components/PivotGrid';
import { useSampleData } from './hooks';
import './App.css';
import './components/PivotGrid.css';

// Default preset configurations
const presets = [
  {
    name: 'Sales by Region & Product',
    dataType: 'sales' as const,
    rowFields: ['region'],
    columnFields: ['product'],
    valueFields: ['sales'],
    aggregation: 'sum' as const,
  },
  {
    name: 'Sales by Quarter & Region',
    dataType: 'sales' as const,
    rowFields: ['quarter'],
    columnFields: ['region'],
    valueFields: ['sales'],
    aggregation: 'sum' as const,
  },
  {
    name: 'Profit Analysis',
    dataType: 'sales' as const,
    rowFields: ['region', 'product'],
    columnFields: ['quarter'],
    valueFields: ['profit'],
    aggregation: 'avg' as const,
  },
  {
    name: 'Salary by Department',
    dataType: 'personnel' as const,
    rowFields: ['department', 'role'],
    columnFields: ['experience'],
    valueFields: ['salary'],
    aggregation: 'avg' as const,
  },
  {
    name: 'Headcount by Department',
    dataType: 'personnel' as const,
    rowFields: ['department'],
    columnFields: ['gender'],
    valueFields: ['count'],
    aggregation: 'sum' as const,
  },
];

function App() {
  const { data: sampleDatasets, loading, error } = useSampleData();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);

  // Current data based on preset selection
  const currentData = useMemo(() => {
    if (!sampleDatasets) return [];
    
    const preset = presets[selectedPreset || 0];
    if (preset.dataType === 'personnel') {
      return sampleDatasets.personnel;
    }
    return sampleDatasets.sales;
  }, [sampleDatasets, selectedPreset]);

  const selectedPresetConfig = selectedPreset !== null ? presets[selectedPreset] : null;

  const handlePresetChange = (index: number | null) => {
    setSelectedPreset(index);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading sample data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error.message}</p>
        <p>Using fallback data for demonstration.</p>
        <PivotGrid
          data={[]}
          defaultRowFields={['region']}
          defaultColumnFields={['product']}
          defaultValueFields={['sales']}
        />
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <h1>Pivot Table Explorer</h1>
        <p className="app-subtitle">
          A React component for creating Excel-like pivot tables for data exploration
        </p>
        {sampleDatasets && (
          <p className="data-source">
            Data loaded: {sampleDatasets.sales.length} sales records, {sampleDatasets.personnel.length} personnel records
          </p>
        )}
      </header>

      <main className="app-main">
        <section className="preset-selector">
          <h2>Quick Start Presets</h2>
          <div className="preset-buttons">
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetChange(index)}
                className={`preset-button ${selectedPreset === index ? 'active' : ''}`}
              >
                {preset.name}
              </button>
            ))}
            <button
              onClick={() => handlePresetChange(null)}
              className={`preset-button ${selectedPreset === null ? 'active' : ''}`}
            >
              Custom Configuration
            </button>
          </div>
          {selectedPreset !== null && selectedPresetConfig && (
            <div className="preset-description">
              <p>
                <strong>Configuration:</strong> 
                Rows: {selectedPresetConfig.rowFields.join(', ')} | 
                Columns: {selectedPresetConfig.columnFields.join(', ')} | 
                Values: {selectedPresetConfig.valueFields.join(', ')} | 
                Aggregation: {selectedPresetConfig.aggregation.toUpperCase()}
              </p>
            </div>
          )}
        </section>

        <section className="pivot-grid-section">
          <PivotGrid
            data={currentData}
            defaultRowFields={selectedPreset !== null ? presets[selectedPreset].rowFields : ['region']}
            defaultColumnFields={selectedPreset !== null ? presets[selectedPreset].columnFields : ['product']}
            defaultValueFields={selectedPreset !== null ? presets[selectedPreset].valueFields : ['sales']}
            defaultAggregation={selectedPreset !== null ? presets[selectedPreset].aggregation : 'sum'}
          />
        </section>

        <section className="instructions">
          <h2>How to Use</h2>
          <div className="instruction-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h3>Select Preset or Start Fresh</h3>
                <p>Choose a preset configuration to see different pivot table examples, or select "Custom Configuration" to build your own.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h3>Choose Your Axes</h3>
                <p>Select which fields to use as Row Fields (Y-axis) and Column Fields (X-axis) to define your pivot table structure.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h3>Select Values & Aggregation</h3>
                <p>Pick which fields contain the values to aggregate, and choose how to aggregate them (Sum, Average, Count, Min, Max).</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h3>Explore Your Data</h3>
                <p>The pivot table will automatically update as you change your selections. Scroll to see all data.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="data-info">
          <h2>Sample Data</h2>
          <p>This demo loads data from <code>/public/sampleData.json</code>:</p>
          <ul>
            <li><strong>Sales Data:</strong> 22 records of product sales across regions (North, South, East, West), products (Laptop, Phone, Tablet), and quarters (Q1-Q4) with sales, units, and profit figures.</li>
            <li><strong>Personnel Data:</strong> 12 records of employee information including department, role, experience level, gender, salary, and headcount.</li>
          </ul>
          <p>Feel free to modify the data in the <code>public/sampleData.json</code> file to test with your own dataset!</p>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with React & TypeScript | Pivot Table Component v1.0</p>
      </footer>
    </>
  );
}

export default App;
