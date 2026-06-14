/**
 * ViewGridStoreContext
 * 
 * React Context for ViewGridStore propagation
 * Used to provide the ViewGridStore singleton to the component tree
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { ViewGridStore } from '../ViewGridStore';

// Create the context with null as default value
export const ViewGridStoreContext = createContext<ViewGridStore | null>(null);

// Custom hook to use the ViewGridStore
// Throws an error if used outside of ViewGridStoreContext.Provider
export const useViewGridStore = (): ViewGridStore => {
  const store = useContext(ViewGridStoreContext);
  if (!store) {
    throw new Error('useViewGridStore must be used within a ViewGridStoreContext.Provider');
  }
  return store;
};

// Props type for the provider
export interface ViewGridStoreProviderProps {
  children: ReactNode;
  store: ViewGridStore;
}

// Provider component
export const ViewGridStoreProvider = ({ 
  children, 
  store 
}: ViewGridStoreProviderProps) => {
  return (
    <ViewGridStoreContext.Provider value={store}>
      {children}
    </ViewGridStoreContext.Provider>
  );
};
