/**
 * Test Setup File
 * 
 * This file is executed before each test file.
 * It sets up the testing environment for React components.
 */

import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers);

// Mock console methods to reduce noise in test output
// Uncomment if needed
// console.log = vi.fn();
// console.warn = vi.fn();
// console.error = vi.fn();

// Global test timeout (default: 5000ms)
// vi.setConfig({ testTimeout: 10000 });
