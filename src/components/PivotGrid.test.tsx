/**
 * PivotGrid Component Tests
 * 
 * Tests for the PivotGrid React component.
 * Uses @testing-library/react for rendering and interacting with the component.
 */

import { render as customRender, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import PivotGrid from './PivotGrid';
import type { DataItem } from '../models/types';
import { renderWithProviders } from '../test/testUtils';
import { parseCSV } from '../utils/csvParser';

// Override the default render with our custom version
const render = renderWithProviders;

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

    // Find select by its class name or direct query
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

  it('should apply defaultRowFields', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
      />
    );

    // Check that the summary shows the correct configuration
    expect(screen.getByText(/Rows: Customer/)).toBeInTheDocument();
    expect(screen.getByText(/Columns: Product/)).toBeInTheDocument();
    expect(screen.getByText(/Values: Quantity/)).toBeInTheDocument();
  });

  it('should apply defaultAggregation', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
        defaultAggregation="avg"
      />
    );

    expect(screen.getByText(/Aggregation: AVG/)).toBeInTheDocument();
  });
});

// ============================================================================
// Field Selection Tests
// ============================================================================

describe('PivotGrid - Field Selection', () => {
  it('should disable field in other categories when selected', () => {
    render(<PivotGrid data={sampleCSVData} />);

    // Find all checkboxes for Customer field
    const customerCheckboxes = screen.getAllByLabelText('Customer') as HTMLInputElement[];
    
    // First checkbox is for row fields
    const rowCustomerCheckbox = customerCheckboxes[0];
    
    // Check it
    fireEvent.click(rowCustomerCheckbox);

    // Find the Customer checkbox for column fields (should be the second one)
    const colCustomerCheckbox = customerCheckboxes[1] || 
      screen.getAllByLabelText('Customer')[1] as HTMLInputElement;

    expect(colCustomerCheckbox.disabled).toBe(true);
  });

  it('should update configuration when field is selected', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={[]}
        defaultColumnFields={[]}
        defaultValueFields={[]}
      />
    );

    // Initially should show no fields selected
    expect(screen.queryByText(/Rows: Customer/)).not.toBeInTheDocument();

    // Check the first Customer checkbox (row fields)
    const customerCheckboxes = screen.getAllByLabelText('Customer') as HTMLInputElement[];
    fireEvent.click(customerCheckboxes[0]);

    // Now should show Customer in the summary
    expect(screen.getByText(/Rows: Customer/)).toBeInTheDocument();
  });

  it('should allow unchecking a field', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={[]}
        defaultValueFields={[]}
      />
    );

    // Should initially show Customer selected
    expect(screen.getByText(/Rows: Customer/)).toBeInTheDocument();

    // Uncheck Customer (first checkbox for Customer)
    const customerCheckboxes = screen.getAllByLabelText('Customer') as HTMLInputElement[];
    // Find the checked one
    const checkedCheckbox = customerCheckboxes.find(cb => cb.checked);
    if (checkedCheckbox) {
      fireEvent.click(checkedCheckbox);
    }

    // Should no longer show Customer in summary
    expect(screen.queryByText(/Rows: Customer/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Aggregation Change Tests
// ============================================================================

describe('PivotGrid - Aggregation Change', () => {
  it('should display correct initial aggregation value', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
        defaultAggregation="sum"
      />
    );

    // Initially should show SUM
    expect(screen.getByText(/Aggregation: SUM/)).toBeInTheDocument();

    // Check that the select element has the correct initial value
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select).toHaveValue('sum');
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

  it('should clear all selections when reset is clicked', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
      />
    );

    // Should initially show selections
    expect(screen.getByText(/Rows: Customer/)).toBeInTheDocument();
    expect(screen.getByText(/Columns: Product/)).toBeInTheDocument();
    expect(screen.getByText(/Values: Quantity/)).toBeInTheDocument();

    // Click reset button
    const resetButton = screen.getByText('Reset All');
    fireEvent.click(resetButton);

    // Should no longer show selections
    expect(screen.queryByText(/Rows: Customer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Columns: Product/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Values: Quantity/)).not.toBeInTheDocument();

    // Should show default aggregation (sum)
    expect(screen.getByText(/Aggregation: SUM/)).toBeInTheDocument();
  });
});

// ============================================================================
// Pivot Table Generation Tests
// ============================================================================

describe('PivotGrid - Pivot Table Generation', () => {
  it('should generate pivot table with row and column fields', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
      />
    );

    // Should display the pivot table
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Should have header cells
    const headerCells = screen.getAllByRole('cell', { hidden: true });
    expect(headerCells.length).toBeGreaterThan(0);
  });

  it('should generate correct pivot table structure', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
      />
    );

    // With the sample.csv data:
    // Customers: Magasin A, Magasin B
    // Products: Dentifrice, Yaourt, Jouet A
    // We should have:
    // - 1 header row
    // - 2 data rows (Magasin A, Magasin B)
    // - Columns: empty corner + Customer label + Dentifrice + Yaourt + Jouet A = 5 columns

    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tr');

    // Should have at least 3 rows (header + 2 data rows)
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should display correct values for sum aggregation', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
        defaultAggregation="sum"
      />
    );

    // Sample.csv data with Customer x Product x Quantity:
    // Magasin A/Dentifrice: 10
    // Magasin A/Yaourt: 5
    // Magasin A/Jouet A: 5
    // Magasin B/Dentifrice: 40 + 40 = 80
    // Magasin B/Yaourt: 20 + 40 = 60
    // Magasin B/Jouet A: 20 + 40 = 60

    // Check if aggregated values appear (note: there are multiple '5's, so use getAllByText)
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5').length).toBeGreaterThan(0);
    expect(screen.getAllByText('80').length).toBeGreaterThan(0);
    expect(screen.getAllByText('60').length).toBeGreaterThan(0);
  });

  it('should display correct values for count aggregation', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
        defaultAggregation="count"
      />
    );

    // With sample.csv data:
    // Magasin A/Dentifrice: 1 record, Magasin A/Yaourt: 1 record, Magasin A/Jouet A: 1 record
    // Magasin B/Dentifrice: 2 records, Magasin B/Yaourt: 2 records, Magasin B/Jouet A: 2 records
    // So we should see 1 and 2 in the table
    const cellsWith1 = screen.getAllByText('1');
    const cellsWith2 = screen.getAllByText('2');
    expect(cellsWith1.length).toBeGreaterThan(0);
    expect(cellsWith2.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Preset Configurations Tests
// ============================================================================

describe('PivotGrid - Preset Configurations', () => {
  it('should work with multiple row fields', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer', 'Year']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity']}
      />
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both row fields
    expect(screen.getByText(/Rows: Customer, Year/)).toBeInTheDocument();
  });

  it('should work with multiple value fields', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product']}
        defaultValueFields={['Quantity', 'Total TTC']}
      />
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both value fields
    expect(screen.getByText(/Values: Quantity, Total TTC/)).toBeInTheDocument();
  });

  it('should work with multiple column fields', () => {
    render(
      <PivotGrid
        data={sampleCSVData}
        defaultRowFields={['Customer']}
        defaultColumnFields={['Product', 'Month']}
        defaultValueFields={['Quantity']}
      />
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
