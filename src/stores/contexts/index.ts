/**
 * Store Contexts Index
 * 
 * Re-exports all store context providers and hooks.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { useStore, StoreContext } from './stores/contexts';
 *   import { useViewGridStore, ViewGridStoreContext } from './stores/contexts';
 */

export { StoreContext, useStore } from './StoreContext';
export { 
  ViewGridStoreContext, 
  useViewGridStore,
  ViewGridStoreProvider,
  type ViewGridStoreProviderProps 
} from './ViewGridStoreContext';
