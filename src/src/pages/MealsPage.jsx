/**
 * MealsPage Component
 * Meal planner feature (Phase 2B)
 */

import { PageContainer } from '../components/layout/PageContainer';

export function MealsPage() {
  return (
    <PageContainer
      title="Meal Planner"
      subtitle="Coming soon in Phase 2B"
    >
      <div className="bg-[var(--color-surface)] rounded-lg p-12 border border-[var(--color-border)] text-center">
        <p className="text-[var(--color-text-secondary)] text-lg">
          This feature is coming in Phase 2B
        </p>
      </div>
    </PageContainer>
  );
}

export default MealsPage;
