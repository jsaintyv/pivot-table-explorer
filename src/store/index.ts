/**
 * Store Index
 * 
 * Re-exports everything from the MobX store.
 * Import from this file for a cleaner import path.
 * 
 * Example:
 *   import { store } from './store';
 *   import { Store, SourceFile, Dimension, View, FilterConfig } from './store';
 */

export { Store, store } from './Store';
export type { SourceFile, Dimension, FilterConfig, View } from './Store';

