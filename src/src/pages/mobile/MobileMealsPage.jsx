/**
 * MobileMealsPage
 * Card-per-day layout for mobile meal planning
 */

import { useState } from 'react';
import { format, addDays, isToday } from 'date-fns';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { WeekSelector } from '../../components/features/meals/WeekSelector';
import { CopyWeekButton } from '../../components/features/meals/CopyWeekButton';
import { MobileMealDayCard } from '../../components/features/meals/MobileMealDayCard';
import { useMealData } from '../../components/features/meals/hooks/useMealData';
import haWebSocket from '../../services/ha-websocket';
import entitiesConfig from '../../../../config/entities.json';

const DAYS = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'cakes'];

const DAY_LABELS = {
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
};

export function MobileMealsPage() {
  const [selectedWeek, setSelectedWeek] = useState('w1');
  const { meals, loading, error, updateMeal } = useMealData(selectedWeek);
  const { meals: nextWeekMeals, loading: nextWeekLoading } = useMealData('w2');

  const handleMealUpdate = async (day, mealType, value) => {
    return await updateMeal(day, mealType, value);
  };

  const handleClearDay = async (day) => {
    if (!window.confirm(`Clear all meals for ${DAY_LABELS[day]}?`)) return;
    try {
      await Promise.all(MEAL_TYPES.map(mt => updateMeal(day, mt, '')));
    } catch (err) {
      console.error(`Failed to clear meals for ${day}:`, err);
    }
  };

  const handleCopyWeek = async () => {
    try {
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
      return true;
    } catch (err) {
      console.error('Failed to copy week:', err);
      return false;
    }
  };

  // Calculate dates for the selected week
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const offset = -((dayOfWeek - 4 + 7) % 7);
    const thursday = addDays(today, offset);
    const weekStart = selectedWeek === 'w2' ? addDays(thursday, 7) : thursday;

    return DAYS.map((_, index) => {
      const date = addDays(weekStart, index);
      return {
        formatted: format(date, 'MMM d'),
        date,
        isToday: isToday(date),
      };
    });
  };

  const weekDates = getWeekDates();

  if (error) {
    return (
      <MobilePageContainer>
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      </MobilePageContainer>
    );
  }

  return (
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Week Selector + Copy */}
        <div className="flex items-center justify-between">
          <WeekSelector selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
          {selectedWeek === 'w1' && (
            <CopyWeekButton onCopy={handleCopyWeek} disabled={loading || nextWeekLoading} />
          )}
        </div>

        {/* Day Cards */}
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading meals...</div>
        ) : (
          DAYS.map((day, index) => (
            <MobileMealDayCard
              key={day}
              day={day}
              dayLabel={DAY_LABELS[day]}
              dateFormatted={weekDates[index].formatted}
              isToday={weekDates[index].isToday}
              meals={meals[day]}
              onMealUpdate={handleMealUpdate}
              onClearDay={handleClearDay}
            />
          ))
        )}
      </div>
    </MobilePageContainer>
  );
}

export default MobileMealsPage;
