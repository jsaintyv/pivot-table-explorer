/**
 * Test Setup File
 * 
 * This file is executed before each test file.
 * It sets up the testing environment for React components.
 */

import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { configure } from 'mobx';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Configure MobX for testing
// Disable enforceActions to allow direct state modifications
// Use 'observed' to track only observable properties (helps with act() warnings)
configure({
  enforceActions: 'never',
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
});

// Import the Store class to access singleton instance
import { act } from '@testing-library/react';
import { Store } from '../stores/Store';

// Get the singleton instance for test cleanup
const store = Store.getInstance();

// Reset the store before each test to ensure clean state
// Wrap in act() to handle MobX state updates
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

// Mock console methods to reduce noise in test output
// Uncomment if needed
// console.log = vi.fn();
// console.warn = vi.fn();
// console.error = vi.fn();

// Global test timeout (default: 5000ms)
// vi.setConfig({ testTimeout: 10000 });
