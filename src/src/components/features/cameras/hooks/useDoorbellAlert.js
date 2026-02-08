import { useState, useEffect, useRef, useCallback } from 'react';
import { useEntity } from '../../../../hooks/useEntity';
import { useNavigate, useLocation } from 'react-router-dom';
import { DOORBELL_ENTITY, PERSON_SENSOR, ALERT_DURATION_MS } from '../camerasConfig';

export function useDoorbellAlert() {
  const [alertMode, setAlertMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const returnTimer = useRef(null);
  const previousPath = useRef(null);

  // Track doorbell entity
  const doorbell = useEntity(DOORBELL_ENTITY);
  const person = useEntity(PERSON_SENSOR);

  // Store initial lastChanged to avoid triggering on mount
  const doorbellInitial = useRef(null);
  const personInitial = useRef(null);

  // Initialize refs on first valid data
  useEffect(() => {
    if (doorbell.lastChanged && !doorbellInitial.current) {
      doorbellInitial.current = doorbell.lastChanged;
    }
  }, [doorbell.lastChanged]);

  useEffect(() => {
    if (person.lastChanged && !personInitial.current) {
      personInitial.current = person.lastChanged;
    }
  }, [person.lastChanged]);

  const triggerAlert = useCallback(() => {
    // Save current path for return (only if not already on cameras)
    if (location.pathname !== '/cameras') {
      previousPath.current = location.pathname;
      navigate('/cameras');
    }
    setAlertMode(true);

    // Clear existing timer
    if (returnTimer.current) clearTimeout(returnTimer.current);

    // Auto-return after ALERT_DURATION_MS
    returnTimer.current = setTimeout(() => {
      setAlertMode(false);
      navigate(previousPath.current || '/calendar');
    }, ALERT_DURATION_MS);
  }, [location.pathname, navigate]);

  // Watch doorbell — trigger on lastChanged update (not initial)
  useEffect(() => {
    if (!doorbell.lastChanged || !doorbellInitial.current) return;
    if (doorbell.lastChanged !== doorbellInitial.current) {
      doorbellInitial.current = doorbell.lastChanged;
      triggerAlert();
    }
  }, [doorbell.lastChanged, triggerAlert]);

  // Watch person sensor — trigger on off→on transition
  useEffect(() => {
    if (!person.lastChanged || !personInitial.current) return;
    if (person.state === 'on' && person.lastChanged !== personInitial.current) {
      personInitial.current = person.lastChanged;
      triggerAlert();
    }
  }, [person.state, person.lastChanged, triggerAlert]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (returnTimer.current) clearTimeout(returnTimer.current); };
  }, []);

  const dismissAlert = useCallback(() => {
    setAlertMode(false);
    if (returnTimer.current) clearTimeout(returnTimer.current);
  }, []);

  return { alertMode, triggerAlert, dismissAlert };
}
