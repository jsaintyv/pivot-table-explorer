/**
 * ToastStoreContext
 * 
 * React Context for providing ToastStore to components.
 */

import { createContext, useContext } from 'react';
import { ToastStore } from '../ToastStore';

// Create context with null default
export const ToastStoreContext = createContext<ToastStore | null>(null);

// Provider component
export const ToastStoreProvider = ToastStoreContext.Provider;

/**
 * Hook to access ToastStore
 * Throws error if used outside provider
 */
export function useToastStore(): ToastStore {
  const store = useContext(ToastStoreContext);
  if (!store) {
    throw new Error('useToastStore must be used within a ToastStoreProvider');
  }
  return store;
}

/**
 * Optional hook to access ToastStore
 * Returns null if not available
 */
export function useToastStoreOptional(): ToastStore | null {
  return useContext(ToastStoreContext);
}
