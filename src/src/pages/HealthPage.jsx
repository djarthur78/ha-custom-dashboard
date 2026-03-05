/**
 * HealthPage
 * Viewport-filling health dashboard (no scroll, like CamerasPage)
 */

import { HealthDashboard } from '../components/features/health/HealthDashboard';

export function HealthPage() {
  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      maxHeight: 'calc(100vh - 56px)',
      overflow: 'hidden',
      padding: '12px',
    }}>
      <HealthDashboard />
    </div>
  );
}

export default HealthPage;
