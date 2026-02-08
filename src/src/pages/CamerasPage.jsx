/**
 * CamerasPage Component
 * Camera feeds with doorbell alert support
 * Auto-returns to calendar after 10 minutes
 */

import { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { CameraGrid } from '../components/features/cameras/CameraGrid';

const AUTO_RETURN_DELAY = 10 * 60 * 1000; // 10 minutes in milliseconds

export function CamerasPage() {
  const { alertMode, dismissAlert } = useOutletContext() || {};
  const navigate = useNavigate();

  // Auto-return to calendar after 10 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/calendar');
    }, AUTO_RETURN_DELAY);

    // Clean up timer on unmount
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="camera-page">
      <CameraGrid alertMode={alertMode} onDismissAlert={dismissAlert} />
    </div>
  );
}

export default CamerasPage;
