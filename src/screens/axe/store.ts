import { Store } from '../../../stores/Store';
import { StoreContext } from '../../../stores/contexts/StoreContext';

// Singleton instance for this screen
const store = Store.getInstance();

export { store, StoreContext };
