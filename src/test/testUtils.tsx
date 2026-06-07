/**
 * Test Utilities
 * 
 * Utility functions and components for testing Redux-enabled components.
 */

import { render as rtlRender } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import pivotReducer from '../store/pivotSlice';
import type { PivotState } from '../store/pivotSlice';
import type { AggregationFunction } from '../models/types';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Create a test store with optional preloaded state
 */
export function createTestStore(preloadedState?: Partial<PivotState>) {
  const defaultState: PivotState = {
    rowFields: [],
    columnFields: [],
    valueFields: [],
    aggregation: 'sum',
    availableFields: [],
    data: [],
  };
  
  return configureStore({
    reducer: {
      pivot: pivotReducer,
    },
    preloadedState: {
      pivot: {
        ...defaultState,
        ...preloadedState,
      },
    },
  });
}

/**
 * Render a component wrapped in a Redux Provider
 * This is necessary for testing components that use Redux hooks
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    ...renderOptions
  }: Omit<RenderOptions, 'wrapper'> & { preloadedState?: Partial<PivotState> } = {}
) {
  // Create a fresh store for each test
  const store = createTestStore(preloadedState);

  // Create a wrapper component that provides the store
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );

  // Use the custom wrapper in render
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from testing-library
import * as rtl from '@testing-library/react';
export { rtl };

// Re-export render with our custom wrapper as the default
export { renderWithProviders as render };
