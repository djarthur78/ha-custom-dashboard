/**
 * useInactivityTimer Hook
 * Redirects to a default route after a period of inactivity
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useInactivityTimer(timeoutMs = 300000, defaultRoute = '/calendar') {
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Don't start timer if already on default route
    if (location.pathname === defaultRoute) {
      return;
    }

    timerRef.current = setTimeout(() => {
      console.log('[Inactivity Timer] Redirecting to', defaultRoute);
      navigate(defaultRoute);
    }, timeoutMs);
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Reset timer on any activity
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Start initial timer
    resetTimer();

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [location.pathname, timeoutMs, defaultRoute]);

  return { resetTimer };
}
