/**
 * HealthPage
 * Route page wrapper for Health & Wellness dashboard
 */

import { PageContainer } from '../components/layout/PageContainer';
import { HealthDashboard } from '../components/features/health/HealthDashboard';

export function HealthPage() {
  return (
    <PageContainer title="Health & Wellness" subtitle="Oura Ring data and Cold Plunge controls">
      <HealthDashboard />
    </PageContainer>
  );
}

export default HealthPage;
