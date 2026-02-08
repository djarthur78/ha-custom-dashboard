/**
 * MealsPage Component
 * Meal planner feature (Phase 2B)
 * Two-week meal planning with inline editing
 */

import { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { WeekSelector } from '../components/features/meals/WeekSelector';
import { MealGrid } from '../components/features/meals/MealGrid';
import { CopyWeekButton } from '../components/features/meals/CopyWeekButton';
import { useMealData } from '../components/features/meals/hooks/useMealData';
import haWebSocket from '../services/ha-websocket';
import entitiesConfig from '../../../config/entities.json';

const DAYS = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'cakes'];

export function MealsPage() {
  const [selectedWeek, setSelectedWeek] = useState('w1');

  // Fetch meal data for the selected week
  const { meals, loading, error, updateMeal } = useMealData(selectedWeek);

  // Also fetch Next Week data for copy function (only when on This Week view)
  const { meals: nextWeekMeals, loading: nextWeekLoading } = useMealData('w2');

  const handleWeekChange = (weekId) => {
    setSelectedWeek(weekId);
  };

  const handleMealUpdate = async (day, mealType, value) => {
    return await updateMeal(day, mealType, value);
  };

  const handleClearDay = async (day) => {
    if (!window.confirm(`Clear all meals for ${day.toUpperCase()}?`)) {
      return;
    }

    try {
      const clearPromises = MEAL_TYPES.map(mealType =>
        updateMeal(day, mealType, '')
      );

      await Promise.all(clearPromises);
      console.log(`[MealsPage] Cleared all meals for ${day}`);
    } catch (err) {
      console.error(`[MealsPage] Failed to clear meals for ${day}:`, err);
    }
  };

  const handleCopyWeek = async () => {
    try {
      // Copy all meals from w2 to w1
      const copyPromises = [];

      for (const day of DAYS) {
        for (const mealType of MEAL_TYPES) {
          const sourceValue = nextWeekMeals[day]?.[mealType]?.value || '';
          const targetEntityId = entitiesConfig.mealPlanner.weeks.w1.days[day][mealType];

          copyPromises.push(
            haWebSocket.callService('input_text', 'set_value', {
              entity_id: targetEntityId,
              value: sourceValue,
            })
          );
        }
      }

      await Promise.all(copyPromises);

      // Show success message (could use a toast here in the future)
      console.log('[MealsPage] Week copied successfully');

      return true;
    } catch (err) {
      console.error('[MealsPage] Failed to copy week:', err);
      return false;
    }
  };

  if (error) {
    return (
      <PageContainer>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Week Selector */}
        <div className="flex items-center justify-between">
          <WeekSelector selectedWeek={selectedWeek} onWeekChange={handleWeekChange} />

          {/* Copy Week Button - only show when viewing This Week */}
          {selectedWeek === 'w1' && (
            <CopyWeekButton
              onCopy={handleCopyWeek}
              disabled={loading || nextWeekLoading}
            />
          )}
        </div>

        {/* Meal Grid */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <MealGrid
            meals={meals}
            loading={loading}
            selectedWeek={selectedWeek}
            onMealUpdate={handleMealUpdate}
            onClearDay={handleClearDay}
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <strong>Tip:</strong> Tap any cell to edit. Press Enter to save, or Escape to cancel. Changes save automatically when you tap outside the cell.
        </div>
      </div>
    </PageContainer>
  );
}

export default MealsPage;
