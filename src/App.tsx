import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import {
  setData,
  loadPreset,
} from './store';
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
  const dispatch = useAppDispatch();
  const { data: sampleDatasets, loading, error } = useSampleData();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);

  // Load data into Redux store when available
  useEffect(() => {
    if (sampleDatasets) {
      const preset = presets[selectedPreset || 0];
      const currentData = preset.dataType === 'personnel' 
        ? sampleDatasets.personnel 
        : sampleDatasets.sales;
      
      dispatch(setData(currentData));
      
      dispatch(loadPreset({
        rowFields: preset.rowFields,
        columnFields: preset.columnFields,
        valueFields: preset.valueFields,
        aggregation: preset.aggregation,
      }));
    }
  }, [sampleDatasets, selectedPreset, dispatch]);

  // Update Redux store when preset changes
  useEffect(() => {
    if (sampleDatasets && selectedPreset !== null) {
      const preset = presets[selectedPreset];
      const currentData = preset.dataType === 'personnel' 
        ? sampleDatasets.personnel 
        : sampleDatasets.sales;
      
      dispatch(setData(currentData));
      dispatch(loadPreset({
        rowFields: preset.rowFields,
        columnFields: preset.columnFields,
        valueFields: preset.valueFields,
        aggregation: preset.aggregation,
      }));
    }
  }, [selectedPreset, sampleDatasets, dispatch]);

  // Get state from Redux
  const {
    rowFields,
    columnFields,
    valueFields,
    aggregation,
    availableFields,
    data: reduxData,
  } = useAppSelector(state => state.pivot);

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
        <p className="redux-info">
          ⚡ Powered by Redux Toolkit
        </p>
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
            data={reduxData}
          />
        </section>

        <section className="redux-state-viewer">
          <h2>Redux State</h2>
          <div className="state-display">
            <p><strong>Row Fields:</strong> {rowFields.length > 0 ? rowFields.join(', ') : 'None'}</p>
            <p><strong>Column Fields:</strong> {columnFields.length > 0 ? columnFields.join(', ') : 'None'}</p>
            <p><strong>Value Fields:</strong> {valueFields.length > 0 ? valueFields.join(', ') : 'None'}</p>
            <p><strong>Aggregation:</strong> {aggregation.toUpperCase()}</p>
            <p><strong>Available Fields:</strong> {availableFields.length} fields</p>
            <p><strong>Data Items:</strong> {reduxData.length} records</p>
          </div>
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
                <p>The pivot table will automatically update as you change your selections. All state is managed by Redux!</p>
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
          <p>✨ <strong>Redux Features:</strong></p>
          <ul>
            <li>All component state is managed in a central Redux store</li>
            <li>Actions are dispatched to update the state</li>
            <li>Redux DevTools Extension is enabled in development</li>
            <li>State is persistent across the application</li>
            <li>Easy to debug and time-travel</li>
          </ul>
          <p>Feel free to modify the data in the <code>public/sampleData.json</code> file to test with your own dataset!</p>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with React, TypeScript & Redux Toolkit | Pivot Table Component v2.0</p>
      </footer>
    </>
  );
}

export default App;
