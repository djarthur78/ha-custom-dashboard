/**
 * CamerasPage Component
 * Camera feeds (Phase 2D)
 */

import { PageContainer } from '../components/layout/PageContainer';

export function CamerasPage() {
  return (
    <PageContainer>
      <div
        className="bg-[var(--color-surface)] rounded-xl p-12 text-center"
        style={{
          border: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        }}
      >
        <p className="text-[var(--color-text-secondary)] text-lg">
          This feature is coming in Phase 2D
        </p>
      </div>
    </PageContainer>
  );
}

export default CamerasPage;
