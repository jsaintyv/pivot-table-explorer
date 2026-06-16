/**
 * Test Utilities
 * 
 * Utility functions and components for testing MobX-enabled components.
 * Store acts as Controller in MVC pattern.
 */

import { render as rtlRender } from '@testing-library/react';
import { Store } from '../stores/Store';
import { StoreContext } from '../stores/contexts/StoreContext';
import { MemoryRouter } from 'react-router-dom';
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
 * Render a component with MobX store context and Router context
 * Wraps the component in both StoreContext.Provider and MemoryRouter for:
 * - MobX store access (for isolated or integration tests)
 * - React Router hooks support (useNavigate, useParams, etc.)
 */
export function renderWithProviders(
  ui: ReactElement,
  renderOptions: RenderOptions = {},
  testStore?: Store
) {
  // Use provided test store or get singleton instance
  const store = testStore || Store.getInstance();
  
  // Wrap with both StoreContext.Provider and MemoryRouter
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoreContext.Provider value={store}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </StoreContext.Provider>
  );
  
  return rtlRender(ui, { wrapper, ...renderOptions });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Re-export render with our custom wrapper as the default
export { renderWithProviders as render };
