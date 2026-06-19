/**
 * Toast component
 * 
 * Displays toast notifications at the bottom of the screen.
 * Wrapped with observer to react to ToastStore changes.
 */

import { observer } from 'mobx-react-lite';
import type { ToastMessage } from '../../stores/ToastStore';
import { useToastStore } from '../../stores/contexts/ToastStoreContext';
import './Toast.css';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

/**
 * Individual toast message component
 */
function ToastComponent({ toast, onClose }: ToastProps) {
  const handleClose = () => {
    onClose(toast.id);
  };

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={handleClose}>
        &times;
      </button>
    </div>
  );
}

/**
 * Toast container component that displays all active toasts
 */
export const Toast = observer(() => {
  const toastStore = useToastStore();
  const toasts = toastStore.toasts;

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onClose={(id) => toastStore.removeToast(id)}
        />
      ))}
    </div>
  );
});
