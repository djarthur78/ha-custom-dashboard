/**
 * TwoTierSelector Component
 * User-friendly two-row button selector for calendar views
 *
 * Row 1: Period selector (Day/Week/Month)
 * Row 2: Layout selector (List/Schedule)
 */

export function TwoTierSelector({
  period,
  onPeriodChange,
  layout,
  onLayoutChange
}) {
  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      {/* Period Row */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        <span
          className="text-sm font-semibold text-[var(--color-text)]"
          style={{ width: '80px' }}
        >
          Show me:
        </span>
        <div className="flex" style={{ gap: '12px' }}>
          <SelectorButton
            active={period === 'day'}
            onClick={() => onPeriodChange('day')}
            label="Day"
          />
          <SelectorButton
            active={period === 'week'}
            onClick={() => onPeriodChange('week')}
            label="Week"
          />
          <SelectorButton
            active={period === 'month'}
            onClick={() => onPeriodChange('month')}
            label="Month"
          />
        </div>
      </div>

      {/* Layout Row */}
      <div className="flex items-center" style={{ gap: '12px' }}>
        <span
          className="text-sm font-semibold text-[var(--color-text)]"
          style={{ width: '80px' }}
        >
          View as:
        </span>
        <div className="flex" style={{ gap: '12px' }}>
          <SelectorButton
            active={layout === 'list'}
            onClick={() => onLayoutChange('list')}
            label="List"
          />
          <SelectorButton
            active={layout === 'schedule'}
            onClick={() => onLayoutChange('schedule')}
            label="Schedule"
          />
        </div>
      </div>
    </div>
  );
}

function SelectorButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="transition-all hover:opacity-80"
      style={{
        minWidth: '100px',
        height: '44px',
        backgroundColor: active ? 'var(--color-primary)' : '#efefef',
        color: active ? '#ffffff' : '#000000',
        border: 'none',
        borderRadius: '22px', // pill shape
        fontWeight: 700,
        fontSize: '15px',
        boxShadow: active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
        padding: '0 24px',
        cursor: 'pointer',
      }}
      aria-label={label}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
