/**
 * PivotGrid Component Tests
 * 
 * Tests for the PivotGrid React component.
 * Uses @testing-library/react for rendering and interacting with the component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PivotGrid from './PivotGrid';
import type { DataItem } from '../models/types';

// ============================================================================
// Test Data
// ============================================================================

const sampleSalesData: DataItem[] = [
  {
    id: 1,
    region: 'North',
    product: 'Laptop',
    quarter: 'Q1',
    sales: 10000,
    units: 100,
  },
  {
    id: 2,
    region: 'North',
    product: 'Laptop',
    quarter: 'Q2',
    sales: 15000,
    units: 150,
  },
  {
    id: 3,
    region: 'North',
    product: 'Phone',
    quarter: 'Q1',
    sales: 8000,
    units: 160,
  },
  {
    id: 4,
    region: 'North',
    product: 'Phone',
    quarter: 'Q2',
    sales: 12000,
    units: 240,
  },
  {
    id: 5,
    region: 'South',
    product: 'Laptop',
    quarter: 'Q1',
    sales: 9000,
    units: 90,
  },
  {
    id: 6,
    region: 'South',
    product: 'Phone',
    quarter: 'Q1',
    sales: 7000,
    units: 140,
  },
];

const emptyData: DataItem[] = [];

// ============================================================================
// Rendering Tests
// ============================================================================

describe('PivotGrid - Rendering', () => {
  it('should render without crashing', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
      />
    );
    expect(screen.getByText('Pivot Table Explorer')).toBeInTheDocument();
  });

  it('should display main sections', () => {
    render(<PivotGrid data={sampleSalesData} />);

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
        data={sampleSalesData}
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
    render(<PivotGrid data={sampleSalesData} />);

    // Check that field names appear in the configuration
    // Use findAllByText to handle multiple occurrences
    const regions = screen.getAllByText('region');
    expect(regions.length).toBeGreaterThan(0);
    expect(screen.getAllByText('product').length).toBeGreaterThan(0);
    expect(screen.getAllByText('quarter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('sales').length).toBeGreaterThan(0);
    expect(screen.getAllByText('units').length).toBeGreaterThan(0);
    expect(screen.getAllByText('id').length).toBeGreaterThan(0);
  });

  it('should display aggregation select element', () => {
    render(<PivotGrid data={sampleSalesData} />);

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
    render(<PivotGrid data={sampleSalesData} />);

    // Should still render without errors
    expect(screen.getByText('Pivot Table Explorer')).toBeInTheDocument();
  });

  it('should apply defaultRowFields', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
      />
    );

    // Check that the summary shows the correct configuration
    expect(screen.getByText(/Rows: region/)).toBeInTheDocument();
    expect(screen.getByText(/Columns: product/)).toBeInTheDocument();
    expect(screen.getByText(/Values: sales/)).toBeInTheDocument();
  });

  it('should apply defaultAggregation', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
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
    render(<PivotGrid data={sampleSalesData} />);

    // Find all checkboxes for region field
    const regionCheckboxes = screen.getAllByLabelText('region') as HTMLInputElement[];
    
    // First checkbox is for row fields
    const rowRegionCheckbox = regionCheckboxes[0];
    
    // Check it
    fireEvent.click(rowRegionCheckbox);

    // Find the region checkbox for column fields (should be the second one)
    const colRegionCheckbox = regionCheckboxes[1] || 
      screen.getAllByLabelText('region')[1] as HTMLInputElement;

    expect(colRegionCheckbox.disabled).toBe(true);
  });

  it('should update configuration when field is selected', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={[]}
        defaultColumnFields={[]}
        defaultValueFields={[]}
      />
    );

    // Initially should show no fields selected
    expect(screen.queryByText(/Rows: region/)).not.toBeInTheDocument();

    // Check the first region checkbox (row fields)
    const regionCheckboxes = screen.getAllByLabelText('region') as HTMLInputElement[];
    fireEvent.click(regionCheckboxes[0]);

    // Now should show region in the summary
    expect(screen.getByText(/Rows: region/)).toBeInTheDocument();
  });

  it('should allow unchecking a field', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={[]}
        defaultValueFields={[]}
      />
    );

    // Should initially show region selected
    expect(screen.getByText(/Rows: region/)).toBeInTheDocument();

    // Uncheck region (first checkbox for region)
    const regionCheckboxes = screen.getAllByLabelText('region') as HTMLInputElement[];
    // Find the checked one
    const checkedCheckbox = regionCheckboxes.find(cb => cb.checked);
    if (checkedCheckbox) {
      fireEvent.click(checkedCheckbox);
    }

    // Should no longer show region in summary
    expect(screen.queryByText(/Rows: region/)).not.toBeInTheDocument();
  });
});

// ============================================================================
// Aggregation Change Tests
// ============================================================================

describe('PivotGrid - Aggregation Change', () => {
  it('should display correct initial aggregation value', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
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
    render(<PivotGrid data={sampleSalesData} />);
    expect(screen.getByText('Reset All')).toBeInTheDocument();
  });

  it('should clear all selections when reset is clicked', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
      />
    );

    // Should initially show selections
    expect(screen.getByText(/Rows: region/)).toBeInTheDocument();
    expect(screen.getByText(/Columns: product/)).toBeInTheDocument();
    expect(screen.getByText(/Values: sales/)).toBeInTheDocument();

    // Click reset button
    const resetButton = screen.getByText('Reset All');
    fireEvent.click(resetButton);

    // Should no longer show selections
    expect(screen.queryByText(/Rows: region/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Columns: product/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Values: sales/)).not.toBeInTheDocument();

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
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
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
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
      />
    );

    // With the sample data:
    // Regions: North, South
    // Products: Laptop, Phone
    // We should have:
    // - 1 header row
    // - 2 data rows (North, South)
    // - Columns: empty corner + region label + Laptop + Phone = 4 columns

    const table = screen.getByRole('table');
    const rows = table.querySelectorAll('tr');

    // Should have at least 3 rows (header + 2 data rows)
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('should display correct values for sum aggregation', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
        defaultAggregation="sum"
      />
    );

    // North/Laptop: 10000 + 15000 = 25000
    // North/Phone: 8000 + 12000 = 20000
    // South/Laptop: 9000
    // South/Phone: 7000

    // Check if aggregated values appear (formatted as numbers)
    expect(screen.getByText('25,000')).toBeInTheDocument();
    expect(screen.getByText('20,000')).toBeInTheDocument();
    expect(screen.getByText('9,000')).toBeInTheDocument();
    expect(screen.getByText('7,000')).toBeInTheDocument();
  });

  it('should display correct values for count aggregation', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
        defaultAggregation="count"
      />
    );

    // With sample data:
    // North/Laptop: 2 records, North/Phone: 2 records
    // South/Laptop: 1 record, South/Phone: 1 record
    // So we should see 2 and 1 in the table
    const cellsWith2 = screen.getAllByText('2');
    const cellsWith1 = screen.getAllByText('1');
    expect(cellsWith2.length).toBeGreaterThan(0);
    expect(cellsWith1.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Preset Configurations Tests
// ============================================================================

describe('PivotGrid - Preset Configurations', () => {
  it('should work with multiple row fields', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region', 'quarter']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales']}
      />
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both row fields
    expect(screen.getByText(/Rows: region, quarter/)).toBeInTheDocument();
  });

  it('should work with multiple value fields', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product']}
        defaultValueFields={['sales', 'units']}
      />
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both value fields
    expect(screen.getByText(/Values: sales, units/)).toBeInTheDocument();
  });

  it('should work with multiple column fields', () => {
    render(
      <PivotGrid
        data={sampleSalesData}
        defaultRowFields={['region']}
        defaultColumnFields={['product', 'quarter']}
        defaultValueFields={['sales']}
      />
    );

    // Should render without errors
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Summary should show both column fields
    expect(screen.getByText(/Columns: product, quarter/)).toBeInTheDocument();
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

    render(<PivotGrid data={sampleSalesData} />);

    // Should still render without errors
    expect(screen.getByText('Pivot Table Explorer')).toBeInTheDocument();

    // Reset viewport
    global.innerWidth = 1024;
    global.innerHeight = 768;
    global.dispatchEvent(new Event('resize'));
  });
});
