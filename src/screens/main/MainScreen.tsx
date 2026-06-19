/**
 * MainScreen component
 * 
 * The primary interface for managing pivot table projects
 * Wrapped with observer to react to MobX store changes (MVC View)
 * Uses small, focused sub-components (< 200 lines each)
 * Stores handle all events
 */

import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/contexts/StoreContext';
import { ProjectHeader } from './components/ProjectHeader';
import { DataSourcesSection } from './components/DataSourcesSection';
import { DimensionsSection } from './components/DimensionsSection';
import { ViewsSection } from './components/ViewsSection';
import { NavigationSection } from './components/NavigationSection';
import './MainScreen.css';

/**
 * MainScreen component
 * The primary interface for managing data sources and dimensions
 * Wrapped with observer to react to MobX store changes (MVC View)
 */
const MainScreen = observer(() => {
  const store = useStore();

  return (
    <main className="main-screen">
      <h1>Pivot Table Explorer</h1>
      <p>Manage your data sources, dimensions, and views</p>

      {/* Project Header - Project name, save/load/import/export */}
      <ProjectHeader />

      {/* Data Sources Section */}
      <DataSourcesSection />

      {/* Dimensions Section */}
      <DimensionsSection />

      {/* Views Section */}
      <ViewsSection />

      {/* Navigation Buttons */}
      <NavigationSection />
    </main>
  );
});

// Export the component directly - StoreContext is provided at App level
export default MainScreen;
