/**
 * Dimensions Component Tests
 * 
 * Tests for the Dimensions React component.
 * Uses @testing-library/react for rendering and Vitest as test runner.
 */

import { render as customRender, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Dimensions } from './Dimensions';
import { renderWithProviders } from '../../../test/testUtils';
import { Store } from '../../../stores/Store';
import { PivotProjectService } from '../../../services/PivotProjectService';

// Get the store instance
const store = Store.getInstance();

// Override the default render with our custom version
const render = (ui: React.ReactElement, options?: any) => {
  return act(() => renderWithProviders(ui, options));
};

// Clear the MobX store before each test to prevent pollution
beforeEach(() => {
  act(() => {
    store.clear();
  });
});

afterEach(() => {
  act(() => {
    store.clear();
  });
});

describe('Dimensions Component - Rendering', () => {
  it('should render without crashing', () => {
    render(<Dimensions />);
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
  });

  it('should display the heading', () => {
    render(<Dimensions />);
    expect(screen.getByRole('heading', { name: 'Dimensions' })).toBeInTheDocument();
  });

  it('should display info text', () => {
    render(<Dimensions />);
    expect(screen.getByText(/Dimensions are automatically created from CSV columns/)).toBeInTheDocument();
  });

  it('should display the dimension list container', () => {
    render(<Dimensions />);
    // Check that the container div exists
    const heading = screen.getByText('Dimensions');
    const section = heading.parentElement;
    expect(section).toBeInTheDocument();
    expect(section?.querySelector('.dimension-list')).toBeInTheDocument();
  });
});

describe('Dimensions Component - With Data', () => {
  it('should display dimensions when they exist in the store', async () => {
    // Create dimensions directly in the store
    act(() => {
      store.createProject('Test Project');
      
      // Manually add a data source
      const dataSource = PivotProjectService.buildLocalDataSource(
        'test.csv',
        'csv',
        [],
        []
      );
      store.pivotProject.dataSources = [dataSource];
      
      // Manually add dimensions
      const dimension1 = PivotProjectService.buildDimension(
        'Name',
        'string',
        'Test dimension',
        [{ dataSourceId: dataSource.id, columnIndex: 0, level: 0, name: 'Name' }]
      );
      const dimension2 = PivotProjectService.buildDimension(
        'Age',
        'number',
        'Test dimension',
        [{ dataSourceId: dataSource.id, columnIndex: 1, level: 0, name: 'Age' }]
      );
      store.pivotProject.dimensions = [dimension1, dimension2];
    });

    render(<Dimensions />);

    // Should display the dimensions section
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    
    // Check if dimension names appear
    expect(screen.getByText(/Name/)).toBeInTheDocument();
    expect(screen.getByText(/Age/)).toBeInTheDocument();
    
    // Check if data types appear
    expect(screen.getByText(/string/)).toBeInTheDocument();
    expect(screen.getByText(/number/)).toBeInTheDocument();
  });

  it('should display delete button for each dimension', async () => {
    act(() => {
      store.createProject('Test Project');
      
      const dataSource = PivotProjectService.buildLocalDataSource(
        'test.csv',
        'csv',
        [],
        []
      );
      store.pivotProject.dataSources = [dataSource];
      
      const dimension1 = PivotProjectService.buildDimension(
        'Name',
        'string',
        'Test dimension',
        [{ dataSourceId: dataSource.id, columnIndex: 0, level: 0, name: 'Name' }]
      );
      store.pivotProject.dimensions = [dimension1];
    });

    render(<Dimensions />);

    // Find delete buttons
    const deleteButtons = screen.getAllByText('Delete');
    // Should have one delete button
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('should display source hint for dimensions', async () => {
    act(() => {
      store.createProject('Test Project');
      
      const dataSource = PivotProjectService.buildLocalDataSource(
        'test.csv',
        'csv',
        [],
        []
      );
      store.pivotProject.dataSources = [dataSource];
      
      const dimension1 = PivotProjectService.buildDimension(
        'Name',
        'string',
        'Test dimension',
        [{ dataSourceId: dataSource.id, columnIndex: 0, level: 0, name: 'Name' }]
      );
      store.pivotProject.dimensions = [dimension1];
    });

    render(<Dimensions />);

    // Check for source hint text
    expect(screen.getByText(/from test\.csv/)).toBeInTheDocument();
  });
});
