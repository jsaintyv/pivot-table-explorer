/**
 * ToastStore
 * 
 * MobX Store for managing toast notifications.
 * Follows the same pattern as ViewStore with single responsibility.
 * 
 * In MVC:
 * - Model: Toast messages state
 * - Controller: Actions to add/remove toasts
 * - View: Toast component that observes this store
 */

import { action, makeAutoObservable, observable } from 'mobx';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

export class ToastStore {
  // STATE: List of active toast messages
  public toasts: ToastMessage[] = [];

  constructor() {
    makeAutoObservable(this, {
      toasts: observable.ref,
      addToast: action,
      removeToast: action,
      clearAll: action,
    });
  }

  /**
   * Add a new toast message
   * @param type - Type of toast (success, error, info, warning)
   * @param message - Message to display
   * @param options - Optional toast configuration
   */
  addToast(
    type: ToastMessage['type'],
    message: string,
    options: Partial<Omit<ToastMessage, 'id' | 'type' | 'message'>> = {}
  ): string {
    const id = `toast-${Date.now()}`;
    const toast: ToastMessage = {
      id,
      type,
      message,
      autoClose: true,
      duration: 3000,
      ...options,
    };

    this.toasts.push(toast);

    // Auto-close if enabled
    if (toast.autoClose && toast.duration) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }

    return id;
  }

  /**
   * Convenience method to add a success toast
   */
  addSuccess(message: string, title?: string): string {
    return this.addToast('success', message, { title });
  }

  /**
   * Convenience method to add an error toast
   */
  addError(message: string, title?: string): string {
    return this.addToast('error', message, { title, duration: 5000 });
  }

  /**
   * Convenience method to add an info toast
   */
  addInfo(message: string, title?: string): string {
    return this.addToast('info', message, { title });
  }

  /**
   * Convenience method to add a warning toast
   */
  addWarning(message: string, title?: string): string {
    return this.addToast('warning', message, { title, duration: 4000 });
  }

  /**
   * Remove a toast by ID
   */
  removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  /**
   * Remove all toasts
   */
  clearAll(): void {
    this.toasts = [];
  }

  /**
   * Get toast by ID
   */
  getToast(id: string): ToastMessage | undefined {
    return this.toasts.find(toast => toast.id === id);
  }

  /**
   * Get all toasts of a specific type
   */
  getToastsByType(type: ToastMessage['type']): ToastMessage[] {
    return this.toasts.filter(toast => toast.type === type);
  }
}
