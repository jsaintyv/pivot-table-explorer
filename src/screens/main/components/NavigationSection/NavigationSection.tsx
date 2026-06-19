/**
 * NavigationSection component
 * 
 * Provides navigation buttons to other screens
 * Follows MVC pattern: Uses store from React context, is a MobX observer
 * Max lines: < 100
 */

import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import './NavigationSection.css';

/**
 * Main NavigationSection component
 */
export const NavigationSection = observer(() => {
  const navigate = useNavigate();

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

  return (
    <section className="navigation">
      <button onClick={navigateToAxeScreen} className="nav-button">
        Create Dimension
      </button>
      <button onClick={navigateToViewGridScreen} className="nav-button">
        Configure View Grid
      </button>
    </section>
  );
});
