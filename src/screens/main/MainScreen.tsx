import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { parseCSV } from '../../utils/csvParser';
import type { LocalDataSource, DataColumn } from '../../models/pivot-project/types';
import { saveProjectToFile } from '../../models/pivot-project/serialization';
import './MainScreen.css';
import { useStore } from '../../stores/contexts/StoreContext';
import { SourceList } from './sources-list/SourceList';
import { Dimensions } from './dimensions/Dimensions';
import { Views } from './views/Views';

/**
 * MainScreen component
 * The primary interface for managing data sources and dimensions
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
const MainScreen = observer(() => {
  const navigate = useNavigate();

  const store = useStore();
  const pivotProject = store.pivotProject;
  
  // Get data from the new PivotProject model
  const exportProject = store.exportProject;
  
  const dataSources = store.getLocalDataSources();
  
  /**
   * Navigate to Axe screen
   */
  const navigateToAxeScreen = () => {
    navigate('/axe');
  };

  /**
   * Navigate to View Grid screen
   */
  const navigateToViewGridScreen = () => {
    navigate('/view-grid');
  };

  /**
   * Export project to file
   */
  const handleExportProject = () => {
    const project = exportProject();
    saveProjectToFile(project, `${project.name || 'pivot-project'}.pivot.json`);
  };

  return (
    <main className="main-screen">
      <h1>Pivot Table Explorer</h1>
      <p>Manage your data sources and dimensions</p>

      {/* Data Sources Section */}
      <SourceList />

      {/* Dimensions Section */}
      <Dimensions />

      {/* Views Section */}
      <Views />

      {/* Project Actions */}
      <section className="section project-actions">
        <h2>Project</h2>
        <div className="action-buttons">
          <button onClick={() => store.createProject()} className="nav-button">
            New Project
          </button>
          <button 
            onClick={handleExportProject}
            className="nav-button"
          >
            Export Project
          </button>
        </div>
      </section>

      {/* Navigation Buttons */}
      <section className="navigation">
        <button onClick={navigateToAxeScreen} className="nav-button">
          Create Dimension
        </button>
        <button onClick={navigateToViewGridScreen} className="nav-button">
          Configure View Grid
        </button>
      </section>
    </main>
  );
});

// Export the component directly - StoreContext is now provided at App level
export default MainScreen;
