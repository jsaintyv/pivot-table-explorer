import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAppDispatch } from './store';
import { setData, loadPreset, addSourceFile, addDimension } from './store';
import { MainScreen, AxeScreen, ViewGridScreen } from './screens';
import { parseCSV } from './utils/csvParser';
import './App.css';
import './screens/index.css';

// Default preset configurations for the sample CSV data
const presets = [
  {
    name: 'Sales by Customer & Product',
    rowFields: ['Customer'],
    columnFields: ['Product'],
    valueFields: ['Quantity'],
    aggregation: 'sum' as const,
  },
  {
    name: 'Sales by Year & Month',
    rowFields: ['Year'],
    columnFields: ['Month'],
    valueFields: ['Total TTC'],
    aggregation: 'sum' as const,
  },
  {
    name: 'Customer Product Analysis',
    rowFields: ['Customer', 'Product'],
    columnFields: ['Month'],
    valueFields: ['Quantity'],
    aggregation: 'sum' as const,
  },
];

/**
 * App component
 * Main application component with routing for different screens
 */
function App() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load sample CSV data and default preset on initial load
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load the sample CSV file with semicolon separator
        const response = await fetch('/sample.csv');
        
        if (!response.ok) {
          throw new Error(`Failed to load sample.csv: ${response.status}`);
        }
        
        const csvContent = await response.text();
        const data = parseCSV(csvContent);
        
        if (data.length === 0) {
          throw new Error('No data found in sample.csv');
        }
        
        // Create a source file entry for the sample CSV
        const columns = Object.keys(data[0]);
        dispatch(addSourceFile({
          id: 'sample-csv',
          name: 'sample.csv',
          columns,
        }));
        
        // Create dimensions for each column
        columns.forEach(columnName => {
          dispatch(addDimension({
            id: `sample-${columnName}`,
            name: columnName,
            sourceFileId: 'sample-csv',
            columnName,
          }));
        });
        
        // Load the data into the store
        dispatch(setData(data));
        
        // Load default preset
        const preset = presets[0];
        dispatch(loadPreset({
          rowFields: preset.rowFields,
          columnFields: preset.columnFields,
          valueFields: preset.valueFields,
          aggregation: preset.aggregation,
        }));
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };
    
    loadData();
  }, [dispatch]);

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
        <p>Please ensure sample.csv exists in the public folder.</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">        
        <main className="app-main">
          <Routes>
            {/* Main screen - manages data sources, dimensions, and views */}
            <Route path="/" element={<MainScreen />} />
            
            {/* Axe screen - configures which columns are used as dimensions */}
            <Route path="/axe" element={<AxeScreen />} />
            
            {/* View Grid screen - configures pivot table structure */}
            <Route path="/view-grid" element={<ViewGridScreen />} />
            
            {/* Redirect to home for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Built with React, TypeScript & Redux Toolkit | Pivot Table Explorer v1.0</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
