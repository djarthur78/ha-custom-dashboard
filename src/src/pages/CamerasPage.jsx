/**
 * CamerasPage Component
 * Camera feeds with doorbell alert support
 */

import { useOutletContext } from 'react-router-dom';
import { CameraGrid } from '../components/features/cameras/CameraGrid';

export function CamerasPage() {
  const { alertMode, dismissAlert } = useOutletContext() || {};

  return (
    <div className="camera-page">
      <CameraGrid alertMode={alertMode} onDismissAlert={dismissAlert} />
    </div>
  );
}

export default CamerasPage;
