/**
 * Clock Component
 * Self-contained clock that updates every minute.
 * Isolated state prevents re-rendering the rest of MainLayout.
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-medium">
      {format(currentTime, 'HH:mm')}
    </span>
  );
}
