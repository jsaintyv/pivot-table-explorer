import { useState } from 'react';
import PivotGrid from './components/PivotGrid';
import './App.css';
import './components/PivotGrid.css';

// Sample data for pivot table demonstration
const sampleSalesData = [
  {
    id: 1,
    region: 'North',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 15000,
    units: 150,
    profit: 3000,
  },
  {
    id: 2,
    region: 'North',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q2',
    sales: 18000,
    units: 180,
    profit: 3600,
  },
  {
    id: 3,
    region: 'North',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q3',
    sales: 22000,
    units: 220,
    profit: 4400,
  },
  {
    id: 4,
    region: 'North',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q4',
    sales: 25000,
    units: 250,
    profit: 5000,
  },
  {
    id: 5,
    region: 'North',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 12000,
    units: 240,
    profit: 2400,
  },
  {
    id: 6,
    region: 'North',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q2',
    sales: 14000,
    units: 280,
    profit: 2800,
  },
  {
    id: 7,
    region: 'North',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q3',
    sales: 16000,
    units: 320,
    profit: 3200,
  },
  {
    id: 8,
    region: 'North',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q4',
    sales: 18000,
    units: 360,
    profit: 3600,
  },
  {
    id: 9,
    region: 'South',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 12000,
    units: 120,
    profit: 2400,
  },
  {
    id: 10,
    region: 'South',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q2',
    sales: 14000,
    units: 140,
    profit: 2800,
  },
  {
    id: 11,
    region: 'South',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q3',
    sales: 16000,
    units: 160,
    profit: 3200,
  },
  {
    id: 12,
    region: 'South',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q4',
    sales: 18000,
    units: 180,
    profit: 3600,
  },
  {
    id: 13,
    region: 'South',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 10000,
    units: 200,
    profit: 2000,
  },
  {
    id: 14,
    region: 'South',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q2',
    sales: 11000,
    units: 220,
    profit: 2200,
  },
  {
    id: 15,
    region: 'South',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q3',
    sales: 12000,
    units: 240,
    profit: 2400,
  },
  {
    id: 16,
    region: 'South',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q4',
    sales: 13000,
    units: 260,
    profit: 2600,
  },
  {
    id: 17,
    region: 'East',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 10000,
    units: 100,
    profit: 2000,
  },
  {
    id: 18,
    region: 'East',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q2',
    sales: 11000,
    units: 110,
    profit: 2200,
  },
  {
    id: 19,
    region: 'East',
    product: 'Tablet',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 8000,
    units: 160,
    profit: 1600,
  },
  {
    id: 20,
    region: 'East',
    product: 'Tablet',
    category: 'Electronics',
    quarter: 'Q2',
    sales: 9000,
    units: 180,
    profit: 1800,
  },
  {
    id: 21,
    region: 'West',
    product: 'Laptop',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 9000,
    units: 90,
    profit: 1800,
  },
  {
    id: 22,
    region: 'West',
    product: 'Phone',
    category: 'Electronics',
    quarter: 'Q1',
    sales: 7000,
    units: 140,
    profit: 1400,
  },
];

// Additional sample data for different scenarios
const samplePersonnelData = [
  { department: 'Engineering', role: 'Developer', experience: 'Junior', gender: 'Male', salary: 60000, count: 5 },
  { department: 'Engineering', role: 'Developer', experience: 'Junior', gender: 'Female', salary: 62000, count: 3 },
  { department: 'Engineering', role: 'Developer', experience: 'Senior', gender: 'Male', salary: 90000, count: 8 },
  { department: 'Engineering', role: 'Developer', experience: 'Senior', gender: 'Female', salary: 92000, count: 4 },
  { department: 'Engineering', role: 'Manager', experience: 'Senior', gender: 'Male', salary: 120000, count: 2 },
  { department: 'Engineering', role: 'Manager', experience: 'Senior', gender: 'Female', salary: 125000, count: 1 },
  { department: 'Marketing', role: 'Specialist', experience: 'Junior', gender: 'Female', salary: 55000, count: 6 },
  { department: 'Marketing', role: 'Specialist', experience: 'Senior', gender: 'Female', salary: 75000, count: 4 },
  { department: 'Marketing', role: 'Manager', experience: 'Senior', gender: 'Male', salary: 100000, count: 2 },
  { department: 'Sales', role: 'Representative', experience: 'Junior', gender: 'Male', salary: 50000, count: 8 },
  { department: 'Sales', role: 'Representative', experience: 'Senior', gender: 'Male', salary: 70000, count: 5 },
  { department: 'Sales', role: 'Manager', experience: 'Senior', gender: 'Male', salary: 110000, count: 3 },
];

// Default preset configurations
const presets = [
  {
    name: 'Sales by Region & Product',
    data: sampleSalesData,
    rowFields: ['region'],
    columnFields: ['product'],
    valueFields: ['sales'],
    aggregation: 'sum' as const,
  },
  {
    name: 'Sales by Quarter & Region',
    data: sampleSalesData,
    rowFields: ['quarter'],
    columnFields: ['region'],
    valueFields: ['sales'],
    aggregation: 'sum' as const,
  },
  {
    name: 'Profit Analysis',
    data: sampleSalesData,
    rowFields: ['region', 'product'],
    columnFields: ['quarter'],
    valueFields: ['profit'],
    aggregation: 'avg' as const,
  },
  {
    name: 'Salary by Department',
    data: samplePersonnelData,
    rowFields: ['department', 'role'],
    columnFields: ['experience'],
    valueFields: ['salary'],
    aggregation: 'avg' as const,
  },
  {
    name: 'Headcount by Department',
    data: samplePersonnelData,
    rowFields: ['department'],
    columnFields: ['gender'],
    valueFields: ['count'],
    aggregation: 'sum' as const,
  },
];

function App() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);

  const selectedPresetConfig = selectedPreset !== null ? presets[selectedPreset] : null;

  const handlePresetChange = (index: number | null) => {
    setSelectedPreset(index);
  };

  return (
    <>
      <header className="app-header">
        <h1>Pivot Table Explorer</h1>
        <p className="app-subtitle">
          A React component for creating Excel-like pivot tables for data exploration
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
          {selectedPreset !== null && (
            <div className="preset-description">
              <p>
                <strong>Configuration:</strong> 
                Rows: {selectedPresetConfig?.rowFields.join(', ')} | 
                Columns: {selectedPresetConfig?.columnFields.join(', ')} | 
                Values: {selectedPresetConfig?.valueFields.join(', ')} | 
                Aggregation: {selectedPresetConfig?.aggregation.toUpperCase()}
              </p>
            </div>
          )}
        </section>

        <section className="pivot-grid-section">
          <PivotGrid
            data={selectedPreset !== null ? presets[selectedPreset].data : sampleSalesData}
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
          <p>This demo includes two sample datasets:</p>
          <ul>
            <li><strong>Sales Data:</strong> 22 records of product sales across regions, products, and quarters with sales, units, and profit figures.</li>
            <li><strong>Personnel Data:</strong> 12 records of employee information including department, role, experience level, gender, salary, and headcount.</li>
          </ul>
          <p>Feel free to modify the data in the <code>App.tsx</code> file to test with your own dataset!</p>
        </section>
      </main>

      <footer className="app-footer">
        <p>Built with React & TypeScript | Pivot Table Component v1.0</p>
      </footer>
    </>
  );
}

export default App;
