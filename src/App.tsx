import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainScreen, AxeScreen, ViewGridScreen } from './screens';
import { StoreContext } from './stores/contexts/StoreContext';
import { Store } from './stores';
import './App.css';
import './screens/index.css';

/**
 * App component
 * Main application component with routing for different screens
 */
function App() {
  return (
    <StoreContext.Provider value={Store.getInstance()}>
      <Router>
        <div className="app">        
          <main className="app-main">
            <Routes>
              {/* Main screen - manages data sources, dimensions, and views */}
              <Route path="/" element={<MainScreen />} />
              
              {/* Axe screen - configures which columns are used as dimensions */}
              <Route path="/axe" element={<AxeScreen />} />
              <Route path="/axe/:dimensionId" element={<AxeScreen />} />
              
              {/* View Grid screen - configures pivot table structure */}
              <Route path="/view-grid" element={<ViewGridScreen />} />
              
              {/* Redirect to home for unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>Built with React, TypeScript & MobX | Pivot Table Explorer v1.0</p>
          </footer>
        </div>
      </Router>
    </StoreContext.Provider>
  );
}

export default App;
