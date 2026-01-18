/**
 * CamerasPage Component
 * Camera feeds (Phase 2D)
 */

import { PageContainer } from '../components/layout/PageContainer';

export function CamerasPage() {
  return (
    <PageContainer
      title="Camera Feeds"
      subtitle="Coming soon in Phase 2D"
    >
      <div className="bg-[var(--color-surface)] rounded-lg p-12 border border-[var(--color-border)] text-center">
        <p className="text-[var(--color-text-secondary)] text-lg">
          This feature is coming in Phase 2D
        </p>
      </div>
    </PageContainer>
  );
}

export default CamerasPage;
