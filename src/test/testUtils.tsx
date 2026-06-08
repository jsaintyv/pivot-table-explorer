/**
 * Test Utilities
 * 
 * Utility functions and components for testing MobX-enabled components.
 * Store acts as Controller in MVC pattern.
 */

import { render as rtlRender } from '@testing-library/react';
import { Store } from '../store/Store';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

/**
 * Create a test store with optional preloaded state
 * Returns a fresh MobX store instance for each test to avoid pollution
 */
export function createTestStore() {
  return new Store();
}

/**
 * Render a component with MobX store context
 * With MobX using singleton pattern, components directly access the global store.
 * For testing, we render directly without a Provider since MobX uses direct references.
 */
export function renderWithProviders(
  ui: ReactElement,
  renderOptions: RenderOptions = {}
) {
  // For MobX with singleton store, render directly
  return rtlRender(ui, renderOptions);
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Re-export render with our custom wrapper as the default
export { renderWithProviders as render };
