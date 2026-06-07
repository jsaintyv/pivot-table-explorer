/**
 * Redux Hooks
 * 
 * Custom hooks for using Redux with TypeScript.
 * These hooks provide typed access to the Redux store.
 */

import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed useSelector hook
 * Use this instead of the plain useSelector for proper TypeScript typing
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Typed useDispatch hook
 * Use this instead of the plain useDispatch for proper TypeScript typing
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Re-export store from store module
export { store } from './store';
