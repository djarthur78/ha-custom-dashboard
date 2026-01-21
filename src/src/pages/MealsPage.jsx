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
      <div
        className="bg-[var(--color-surface)] rounded-xl p-12 text-center"
        style={{
          border: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        }}
      >
        <p className="text-[var(--color-text-secondary)] text-lg">
          This feature is coming in Phase 2B
        </p>
      </div>
    </PageContainer>
  );
}

export default MealsPage;
