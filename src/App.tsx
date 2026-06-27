import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainScreen, DimensionScreen, ViewGridScreen } from './screens';
import { StoreContext } from './stores/contexts/StoreContext';
import { ViewStoreContext } from './stores/contexts/ViewStoreContext';
import { ToastStoreContext } from './stores/contexts/ToastStoreContext';
import { Store } from './stores';
import { Toast } from './components/toast';
import './App.css';
import './screens/index.css';
import './components/toast/Toast.css';

/**
 * App component
 * Main application component with routing for different screens
 */
function App() {
  const store = Store.getInstance();
  const [baseUrl, setBaseUrl] = useState<string>('/');

  // Detect base URL on app mount and store it
  useEffect(() => {
    const detectedBaseUrl = Store.detectBaseUrl();
    store.setBaseUrl(detectedBaseUrl);
    setBaseUrl(detectedBaseUrl);
  }, []);

  return (
    <StoreContext.Provider value={store}>
      <ViewStoreContext.Provider value={store.viewStore}>
        <ToastStoreContext.Provider value={store.toastStore}>
          <Router basename={baseUrl}>
            <div className="app">        
              <main className="app-main">
                <Routes>
                  {/* Main screen - manages data sources, dimensions, and views */}
                  <Route path="/" element={<MainScreen />} />
                  
                  {/* Axe screen - configures which columns are used as dimensions */}
                  <Route path="/axe" element={<DimensionScreen />} />
                  <Route path="/axe/:dimensionId" element={<DimensionScreen />} />
                  
                  {/* View Grid screen - configures pivot table structure */}
                  <Route path="/view-grid" element={<ViewGridScreen />} />
                  
                  {/* Redirect to home for unknown routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              <footer className="app-footer">
                <p>Built with React, TypeScript & MobX | Pivot Table Explorer v1.0</p>
              </footer>
              
              {/* Toast notifications */}
              <Toast />
            </div>
          </Router>
        </ToastStoreContext.Provider>
      </ViewStoreContext.Provider>
    </StoreContext.Provider>
  );
}

export default App;
