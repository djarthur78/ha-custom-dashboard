/**
 * WeekSelector Component
 * Tab selector for This Week / Next Week
 */

export function WeekSelector({ selectedWeek, onWeekChange }) {
  const weeks = [
    { id: 'w1', label: 'This Week' },
    { id: 'w2', label: 'Next Week' },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {weeks.map(week => (
        <button
          key={week.id}
          onClick={() => onWeekChange(week.id)}
          className={`
            px-6 py-3 rounded-lg font-semibold text-lg transition-all
            ${
              selectedWeek === week.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
          style={{
            minHeight: '48px',
            minWidth: '140px',
          }}
        >
          {week.label}
        </button>
      ))}
    </div>
  );
}

export default WeekSelector;
