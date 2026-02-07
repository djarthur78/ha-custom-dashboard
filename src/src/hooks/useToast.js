/**
 * useToast Hook
 * Simple toast notification state management.
 * Uses a shared array of toasts rendered by ToastContainer.
 */

import { useState, useCallback } from 'react';

let globalSetToasts = null;
let toastId = 0;

/**
 * Show a toast notification from anywhere (including non-component code).
 * @param {string} message - Toast message
 * @param {'info'|'success'|'error'} [type='info'] - Toast type
 * @param {number} [duration=4000] - Auto-dismiss duration in ms
 */
export function showToast(message, type = 'info', duration = 4000) {
  if (!globalSetToasts) return;
  const id = ++toastId;
  globalSetToasts(prev => [...prev, { id, message, type }]);
  setTimeout(() => {
    globalSetToasts(prev => prev.filter(t => t.id !== id));
  }, duration);
}

/**
 * Hook to manage toast state. Use in your root layout component.
 * Returns { toasts, dismissToast } for rendering, and registers
 * the global setter so showToast() works from anywhere.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  globalSetToasts = setToasts;

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, dismissToast };
}
