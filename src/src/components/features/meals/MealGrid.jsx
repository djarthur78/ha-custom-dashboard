/**
 * MealGrid Component
 * Displays 7-day meal grid (Thu-Wed) with 4 meal types per day
 * Touch-optimized for wall panel
 */

import { MealCell } from './MealCell';
import { format, addDays, isToday } from 'date-fns';
import { X, Coffee, UtensilsCrossed, Pizza, Cake } from 'lucide-react';

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

const MEAL_CONFIG = {
  breakfast: {
    label: 'Breakfast',
    icon: Coffee,
    color: '#FF6B35',
    bgColor: '#FFF5F2'
  },
  lunch: {
    label: 'Lunch',
    icon: UtensilsCrossed,
    color: '#4ECDC4',
    bgColor: '#F0FFFE'
  },
  dinner: {
    label: 'Dinner',
    icon: Pizza,
    color: '#9B59B6',
    bgColor: '#F9F3FF'
  },
  cakes: {
    label: 'Cakes',
    icon: Cake,
    color: '#E91E63',
    bgColor: '#FFF0F5'
  },
};

export function MealGrid({ meals, loading, onMealUpdate, onClearDay }) {
  // Calculate dates for the current week (Thu-Wed)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate offset to Thursday
    let offset;
    if (dayOfWeek === 0) {
      offset = -3;
    } else if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      offset = dayOfWeek - 4 - 7;
    } else {
      offset = dayOfWeek - 4;
    }

    const thursday = addDays(today, offset);

    return DAYS.map((_, index) => {
      const date = addDays(thursday, index);
      return {
        formatted: format(date, 'MMM d'),
        date: date,
        isToday: isToday(date)
      };
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
    <div className="overflow-x-auto" style={{ borderRadius: '12px' }}>
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <th
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '16px',
                textAlign: 'left',
                fontWeight: '700',
                fontSize: '16px',
                borderTopLeftRadius: '12px',
                minWidth: '160px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Day
            </th>
            {MEAL_TYPES.map((mealType) => {
              const config = MEAL_CONFIG[mealType];
              const Icon = config.icon;
              return (
                <th
                  key={mealType}
                  style={{
                    background: config.color,
                    color: 'white',
                    padding: '16px',
                    textAlign: 'center',
                    fontWeight: '700',
                    fontSize: '16px',
                    minWidth: '180px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Icon size={20} />
                    <span>{config.label}</span>
                  </div>
                </th>
              );
            })}
            <th
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '16px',
                textAlign: 'center',
                fontWeight: '700',
                fontSize: '16px',
                borderTopRightRadius: '12px',
                width: '100px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Clear
            </th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, index) => {
            const dateInfo = weekDates[index];
            const isCurrentDay = dateInfo.isToday;

            return (
              <tr
                key={day}
                style={{
                  backgroundColor: isCurrentDay ? '#FFF3CC' : 'transparent',
                  outline: isCurrentDay ? '3px solid #FFA500' : 'none',
                  outlineOffset: '-1px',
                  position: isCurrentDay ? 'relative' : 'static',
                  zIndex: isCurrentDay ? 1 : 'auto',
                }}
              >
                <td
                  style={{
                    background: isCurrentDay
                      ? 'linear-gradient(135deg, #FFD93D 0%, #FFA500 100%)'
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: isCurrentDay ? 'white' : '#2c3e50',
                    padding: '20px 16px',
                    fontWeight: '700',
                    borderTop: '2px solid white',
                    boxShadow: isCurrentDay ? '0 2px 8px rgba(255, 215, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                    ...(index === DAYS.length - 1 && { borderBottomLeftRadius: '12px' }),
                  }}
                >
                  <div style={{ fontSize: '15px', marginBottom: '4px' }}>
                    {isCurrentDay && '⭐ '}{DAY_LABELS[day]}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    opacity: isCurrentDay ? 0.95 : 0.7,
                  }}>
                    {dateInfo.formatted}
                  </div>
                </td>
                {MEAL_TYPES.map(mealType => {
                  const mealData = meals[day]?.[mealType];
                  const config = MEAL_CONFIG[mealType];

                  return (
                    <td
                      key={`${day}-${mealType}`}
                      style={{
                        backgroundColor: config.bgColor,
                        padding: '0',
                        borderTop: '2px solid white',
                        borderLeft: '2px solid white',
                      }}
                    >
                      <MealCell
                        value={mealData?.value || ''}
                        onSave={(value) => onMealUpdate(day, mealType, value)}
                        isLoading={!mealData}
                        mealType={mealType}
                        isToday={isCurrentDay}
                      />
                    </td>
                  );
                })}
                <td
                  style={{
                    backgroundColor: '#fafafa',
                    padding: '16px',
                    textAlign: 'center',
                    borderTop: '2px solid white',
                    borderLeft: '2px solid white',
                    ...(index === DAYS.length - 1 && { borderBottomRightRadius: '12px' }),
                  }}
                >
                  <button
                    onClick={() => onClearDay(day)}
                    className="flex items-center justify-center mx-auto rounded-full transition-all"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor: '#fee',
                      border: '2px solid #fcc',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fcc';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={`Clear all meals for ${DAY_LABELS[day]}`}
                  >
                    <X size={22} style={{ color: '#e53e3e', fontWeight: 'bold' }} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MealGrid;
