/**
 * Test Utilities
 * 
 * Utility functions and components for testing MobX-enabled components.
 * Store acts as Controller in MVC pattern.
 */

import { render as rtlRender } from '@testing-library/react';
import { Store } from '../stores/Store';
import { StoreContext } from '../stores/contexts/StoreContext';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Create a test store with optional preloaded state
 * Returns a fresh MobX store instance for each test to avoid pollution
 */
export function createTestStore() {
  return Store.createTestInstance();
}

/**
 * Render a component with MobX store context
 * Wraps the component in StoreContext.Provider with either:
 * - The provided store (for isolated tests)
 * - The singleton instance (for integration tests)
 */
export function renderWithProviders(
  ui: ReactElement,
  renderOptions: RenderOptions = {},
  testStore?: Store
) {
  // Use provided test store or get singleton instance
  const store = testStore || Store.getInstance();
  
  // Wrap with StoreContext.Provider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
  
  return rtlRender(ui, { wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Re-export render with our custom wrapper as the default
export { renderWithProviders as render };
