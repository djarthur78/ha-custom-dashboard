/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 */

import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...', size = 24 }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2
        size={size}
        className="animate-spin text-[var(--color-primary)]"
      />
      {message && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;
