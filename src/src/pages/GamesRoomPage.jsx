/**
 * GamesRoomPage Component
 * Games room controls (Phase 2C)
 */

import { PageContainer } from '../components/layout/PageContainer';

export function GamesRoomPage() {
  return (
    <PageContainer
      title="Games Room"
      subtitle="Coming soon in Phase 2C"
    >
      <div className="bg-[var(--color-surface)] rounded-lg p-12 border border-[var(--color-border)] text-center">
        <p className="text-[var(--color-text-secondary)] text-lg">
          This feature is coming in Phase 2C
        </p>
      </div>
    </PageContainer>
  );
}

export default GamesRoomPage;
