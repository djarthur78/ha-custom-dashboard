/**
 * MealGrid Component
 * Displays 7-day meal grid (Thu-Wed) with 4 meal types per day
 * Touch-optimized for wall panel
 */

import { MealCell } from './MealCell';
import { format, addDays } from 'date-fns';
import { X } from 'lucide-react';

const DAYS = ['thu', 'fri', 'sat', 'sun', 'mon', 'tue', 'wed'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'cakes'];

const DAY_LABELS = {
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
};

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  cakes: 'Cakes',
};

export function MealGrid({ meals, loading, onMealUpdate, onClearDay }) {
  // Calculate dates for the current week (Thu-Wed)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate offset to Thursday
    // If today is Thu (4), Fri (5), Sat (6), or Sun (0), start from this week's Thursday
    // If today is Mon (1), Tue (2), Wed (3), start from last week's Thursday
    let offset;
    if (dayOfWeek === 0) {
      // Sunday - go back 3 days to Thursday
      offset = -3;
    } else if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      // Mon, Tue, Wed - go back to last Thursday
      offset = dayOfWeek - 4 - 7;
    } else {
      // Thu, Fri, Sat - this week's Thursday
      offset = dayOfWeek - 4;
    }

    const thursday = addDays(today, offset);

    return DAYS.map((_, index) => {
      const date = addDays(thursday, index);
      return format(date, 'MMM d');
    });
  };

  const weekDates = getWeekDates();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading meals...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="bg-gray-100 p-3 text-left font-semibold border border-gray-300 min-w-[140px]">
              Day
            </th>
            {MEAL_TYPES.map(mealType => (
              <th
                key={mealType}
                className="bg-gray-100 p-3 text-center font-semibold border border-gray-300 min-w-[200px]"
              >
                {MEAL_LABELS[mealType]}
              </th>
            ))}
            <th className="bg-gray-100 p-3 text-center font-semibold border border-gray-300 w-[80px]">
              Clear
            </th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, index) => (
            <tr key={day}>
              <td className="bg-gray-50 p-3 font-medium border border-gray-300">
                <div>{DAY_LABELS[day]}</div>
                <div className="text-sm font-normal text-gray-600">{weekDates[index]}</div>
              </td>
              {MEAL_TYPES.map(mealType => {
                const mealData = meals[day]?.[mealType];
                return (
                  <td key={`${day}-${mealType}`} className="border border-gray-300 p-0">
                    <MealCell
                      value={mealData?.value || ''}
                      onSave={(value) => onMealUpdate(day, mealType, value)}
                      isLoading={!mealData}
                    />
                  </td>
                );
              })}
              <td className="border border-gray-300 p-3 text-center">
                <button
                  onClick={() => onClearDay(day)}
                  className="flex items-center justify-center mx-auto p-2 rounded-full hover:bg-red-100 transition-colors"
                  style={{
                    width: '44px',
                    height: '44px',
                  }}
                  title={`Clear all meals for ${DAY_LABELS[day]}`}
                >
                  <X size={20} className="text-red-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MealGrid;
