/**
 * ToastContainer Component
 * Renders toast notifications in the bottom-right corner.
 */

import { X } from 'lucide-react';

const TYPE_STYLES = {
  info: { bg: 'bg-blue-600', icon: null },
  success: { bg: 'bg-green-600', icon: null },
  error: { bg: 'bg-red-600', icon: null },
};

export function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3" style={{ maxWidth: '400px' }}>
      {toasts.map(toast => {
        const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;
        return (
          <div
            key={toast.id}
            className={`${style.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3`}
            role="alert"
          >
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
