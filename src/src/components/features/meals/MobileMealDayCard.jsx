/**
 * MobileMealDayCard Component
 * Card-per-day layout replacing the table for mobile
 */

import { Coffee, UtensilsCrossed, Pizza, Cake, X } from 'lucide-react';
import { MealCell } from './MealCell';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'cakes'];

const MEAL_CONFIG = {
  breakfast: { label: 'Breakfast', icon: Coffee, color: '#c4956b' },
  lunch: { label: 'Lunch', icon: UtensilsCrossed, color: '#7ba89e' },
  dinner: { label: 'Dinner', icon: Pizza, color: '#9b86a8' },
  cakes: { label: 'Cakes', icon: Cake, color: '#b8798e' },
};

export function MobileMealDayCard({ day, dayLabel, dateFormatted, isToday, meals, onMealUpdate, onClearDay }) {
  return (
    <div
      className="ds-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: isToday ? '2px solid var(--ds-accent)' : '1px solid var(--ds-border)',
      }}
    >
      {/* Day Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: isToday
            ? 'linear-gradient(135deg, #9f5644 0%, #b08a62 100%)'
            : '#f8f8fa',
          color: isToday ? 'white' : 'var(--ds-text)',
        }}
      >
        <div>
          <div className="text-sm font-bold">{isToday ? '⭐ ' : ''}{dayLabel}</div>
          <div className="text-xs" style={{ opacity: 0.8 }}>{dateFormatted}</div>
        </div>
        <button
          onClick={() => onClearDay(day)}
          className="p-1.5 rounded-full transition-all"
          style={{
            backgroundColor: isToday ? 'rgba(255,255,255,0.2)' : '#fee',
          }}
        >
          <X size={14} style={{ color: isToday ? 'white' : '#e53e3e' }} />
        </button>
      </div>

      {/* Meal Rows */}
      <div>
        {MEAL_TYPES.map((mealType) => {
          const config = MEAL_CONFIG[mealType];
          const Icon = config.icon;
          const mealData = meals?.[mealType];

          return (
            <div
              key={mealType}
              className="flex items-center gap-2 px-3"
              style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0" style={{ width: 80 }}>
                <Icon size={14} style={{ color: config.color }} />
                <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
              </div>
              <div className="flex-1 min-w-0">
                <MealCell
                  value={mealData?.value || ''}
                  onSave={(value) => onMealUpdate(day, mealType, value)}
                  isLoading={!mealData}
                  mealType={mealType}
                  isToday={isToday}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
