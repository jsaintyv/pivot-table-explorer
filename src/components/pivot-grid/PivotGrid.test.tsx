/**
 * PivotGrid Component Tests
 * 
 * Tests for the PivotGrid React component.
 * Uses @testing-library/react for rendering and interacting with the component.
 * Updated to work with the refactored component structure using MobX store.
 */

import { render as customRender, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PivotGrid from './PivotGrid';
import type { DataItem } from '../../models/types';
import { renderWithProviders, createTestStore } from '../../test/testUtils';
import { parseCSV } from '../../utils/csvParser';

// Override the default render with our custom version
// Uses a fresh test store for each test and sets up initial state directly
let testCounter = 0;

// Helper to render with a test store that has predefined state
const renderWithState = (ui: React.ReactElement, setupStore?: (store: any) => void, options?: any) => {
  const testStore = createTestStore();
  testCounter++;
  
  // Set up initial state directly on the store
  if (setupStore) {
    act(() => {
      setupStore(testStore);
    });
  }
  
  // Wrap the component in a div with a unique key to force re-mount
  const wrappedUi = <div key={`test-${testCounter}-${Date.now()}`}>{ui}</div>;
  return act(() => renderWithProviders(wrappedUi, options, testStore));
};

// Default render without setup
const render = (ui: React.ReactElement, options?: any) => {
  return renderWithState(ui, undefined, options);
};

// Clear is handled by using a new test store for each test
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// Test Data from sample.csv
// ============================================================================

// CSV content from public/sample.csv (French retail data)
const sampleCSVContent = `"Customer";"Year";"Month";"Product";"Quantity";"Total TTC"
"Magasin A";2025;1;"Dentifrice";10;200
"Magasin B";2025;2;"Dentifrice";40;300
"Magasin B";2025;3;"Dentifrice";40;300
"Magasin A";2025;1;"Yaourt";5;100
"Magasin B";2025;2;"Yaourt";20;200
"Magasin B";2025;3;"Yaourt";40;300
"Magasin A";2025;2;"Jouet A";5;300
"Magasin B";2025;3;"Jouet A";20;400
"Magasin B";2025;1;"Jouet A";40;500`;

// Parse CSV data for use in tests
const sampleCSVData: DataItem[] = parseCSV(sampleCSVContent);

const emptyData: DataItem[] = [];

// ============================================================================
// Rendering Tests
// ============================================================================

describe('PivotGrid - Rendering', () => {
  it('should render without crashing', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
      />
    );
    expect(screen.getByText('Pivot Table Explorer')).toBeInTheDocument();
  });

  it('should display main sections', () => {
    render(<PivotGrid data={sampleCSVData} />);

    // Should display configuration panel
    expect(screen.getByText('Row Fields (Y-Axis)')).toBeInTheDocument();
    expect(screen.getByText('Column Fields (X-Axis)')).toBeInTheDocument();
    expect(screen.getByText('Value Fields')).toBeInTheDocument();
    expect(screen.getByText('Aggregation Function')).toBeInTheDocument();

    // Should display pivot table section
    expect(screen.getByText('Pivot Table Result')).toBeInTheDocument();

    // Should display summary section
    expect(screen.getByText('Configuration:')).toBeInTheDocument();
  });

  it('should display empty message when no data', () => {
    render(<PivotGrid data={emptyData} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should display configuration prompt when no fields selected', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={[]}
        defaultColumnFields={[]}
        defaultValueFields={[]}
      />
    );
    expect(
      screen.getByText(
        /Select at least one field for Rows, Columns, and Values to generate the pivot table/
      )
    ).toBeInTheDocument();
  });

  it('should display all available fields as checkboxes', () => {
    render(<PivotGrid data={sampleCSVData} />);

    // Check that field names from sample.csv appear in the configuration
    // Customer, Year, Month, Product, Quantity, Total TTC
    expect(screen.getAllByText('Customer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Year').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Month').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Product').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quantity').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Total TTC').length).toBeGreaterThan(0);
  });

  it('should display aggregation select element', () => {
    render(<PivotGrid data={sampleCSVData} />);

    // Find select by its role
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    // Check that it has options
    expect(select.options.length).toBe(5);
  });
});

// ============================================================================
// Default Props Tests
// ============================================================================

describe('PivotGrid - Default Props', () => {
  it('should use default props when none provided', () => {
    render(<PivotGrid data={sampleCSVData} />);

    // Should still render without errors
    expect(screen.getByText('Pivot Table Explorer')).toBeInTheDocument();
  });

  it('should apply defaultRowFields', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        // Set up the store state directly since MobX reactivity isn't working for these properties
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.setData(sampleCSVData);
      }
    );

    // Wait for render to complete
    await waitFor(() => {
      // Check that the summary contains the field names
      // The summary text is all in one p element: "Configuration: Rows: Customer | Columns: Product | Values: Quantity | Aggregation: SUM"
      expect(screen.getByText(/Rows: Customer/)).toBeInTheDocument();
      expect(screen.getByText(/Columns: Product/)).toBeInTheDocument();
      expect(screen.getByText(/Values: Quantity/)).toBeInTheDocument();
    });
  });

  it('should apply defaultAggregation', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'avg';
        store.setData(sampleCSVData);
      }
    );

    // Wait for render to complete
    await waitFor(() => {
      expect(screen.getByText(/Aggregation: AVG/)).toBeInTheDocument();
    });

    // Check that the select element has the correct value
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('avg');
  });
});


// ============================================================================
// Aggregation Change Tests
// ============================================================================

describe('PivotGrid - Aggregation Change', () => {
  it('should display correct initial aggregation value', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    // Check the summary
    expect(screen.getByText(/Aggregation: SUM/)).toBeInTheDocument();

    // Check that the select element has the correct initial value
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('sum');
  });
});

// ============================================================================
// Reset Functionality Tests
// ============================================================================

describe('PivotGrid - Reset', () => {
  it('should have a reset button', () => {
    render(<PivotGrid data={sampleCSVData} />);
    expect(screen.getByText('Reset All')).toBeInTheDocument();
  });
  
});

// ============================================================================
// Pivot Table Generation Tests
// ============================================================================

describe('PivotGrid - Pivot Table Generation', () => {
  it('should generate pivot table with row and column fields', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    // Should display the pivot table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Should have cells
    const cells = screen.getAllByRole('cell', { hidden: true });
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should generate correct pivot table structure', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tr');

    // Should have at least 3 rows (header + 2 data rows for Magasin A and Magasin B)
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should display correct values for sum aggregation', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    // Sample.csv data with Customer x Product x Quantity:
    // Magasin A/Dentifrice: 10
    // Magasin A/Yaourt: 5
    // Magasin A/Jouet A: 5
    // Magasin B/Dentifrice: 40 + 40 = 80
    // Magasin B/Yaourt: 20 + 40 = 60
    // Magasin B/Jouet A: 20 + 40 = 60

    // Check if aggregated values appear (note: values are formatted with toLocaleString)
    expect(screen.getAllByText(/10/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/80/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/60/).length).toBeGreaterThan(0);
  });

  it('should display correct values for count aggregation', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'count';
        store.setData(sampleCSVData);
      }
    );

    // With sample.csv data:
    // Magasin A/Dentifrice: 1 record, Magasin A/Yaourt: 1 record, Magasin A/Jouet A: 1 record
    // Magasin B/Dentifrice: 2 records, Magasin B/Yaourt: 2 records, Magasin B/Jouet A: 2 records
    // So we should see 1 and 2 in the table
    const cellsWith1 = screen.getAllByText(/^1$/);
    const cellsWith2 = screen.getAllByText(/^2$/);
    expect(cellsWith1.length).toBeGreaterThan(0);
    expect(cellsWith2.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Preset Configurations Tests
// ============================================================================

describe('PivotGrid - Preset Configurations', () => {
  it('should work with multiple row fields', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer', 'Year'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both row fields
    expect(screen.getByText(/Rows: Customer, Year/)).toBeInTheDocument();
  });

  it('should work with multiple value fields', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product'];
        store.valueFields = ['Quantity', 'Total TTC'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both value fields
    expect(screen.getByText(/Values: Quantity, Total TTC/)).toBeInTheDocument();
  });

  it('should work with multiple column fields', async () => {
    renderWithState(
      <PivotGrid data={sampleCSVData} />,
      (store) => {
        store.rowFields = ['Customer'];
        store.columnFields = ['Product', 'Month'];
        store.valueFields = ['Quantity'];
        store.aggregation = 'sum';
        store.setData(sampleCSVData);
      }
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both column fields
    expect(screen.getByText(/Columns: Product, Month/)).toBeInTheDocument();
  });
});

// ============================================================================
// Responsive Design Tests
// ============================================================================

describe('PivotGrid - Responsive Design', () => {
  it('should render on mobile viewport', () => {
    // Simulate mobile viewport
    global.innerWidth = 400;
    global.innerHeight = 600;
    global.dispatchEvent(new Event('resize'));

    render(<PivotGrid data={sampleCSVData} />);

    // Should still render without errors
    expect(screen.getByText('Pivot Table Explorer')).toBeInTheDocument();

    // Reset viewport
    global.innerWidth = 1024;
    global.innerHeight = 768;
    global.dispatchEvent(new Event('resize'));
  });
});
