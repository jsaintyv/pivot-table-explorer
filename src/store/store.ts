/**
 * Redux Store Configuration
 * 
 * Central store for the Pivot Table Explorer application.
 * Configured with Redux Toolkit for simplified setup.
 */

import { configureStore } from '@reduxjs/toolkit';
import pivotReducer from './pivotSlice';

// Determine if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Configure the Redux store with all reducers
 */
export const store = configureStore({
  reducer: {
    pivot: pivotReducer,
  },
  // Enable Redux DevTools Extension in development
  devTools: isDevelopment,
});

// Export the store type for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
