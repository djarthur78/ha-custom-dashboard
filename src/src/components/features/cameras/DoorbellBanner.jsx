import { X } from 'lucide-react';

export function DoorbellBanner({ onDismiss }) {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-500 text-white px-6 py-3 flex items-center justify-between shadow-lg doorbell-flash">
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label="doorbell">
          🔔
        </span>
        <span className="font-semibold text-lg">
          Doorbell — Someone is at the front door
        </span>
      </div>

      <button
        onClick={onDismiss}
        className="p-2 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Dismiss alert"
      >
        <X size={24} />
      </button>
    </div>
  );
}
