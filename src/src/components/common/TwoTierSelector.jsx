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
    <div
      className="flex items-center"
      style={{
        gap: '20px',
        padding: '8px 16px',
        border: '2px solid #e0e0e0',
        borderRadius: '999px',
        backgroundColor: '#ffffff'
      }}
    >
      {/* Period Section */}
      <div className="flex items-center" style={{ gap: '8px' }}>
        <span
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          Show me:
        </span>
        <div className="flex" style={{ gap: '8px' }}>
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
            active={period === 'biweekly'}
            onClick={() => onPeriodChange('biweekly')}
            label="Biweekly"
          />
          <SelectorButton
            active={period === 'month'}
            onClick={() => onPeriodChange('month')}
            label="Month"
          />
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '30px', backgroundColor: '#e0e0e0' }} />

      {/* Layout Section */}
      <div className="flex items-center" style={{ gap: '8px' }}>
        <span
          className="text-sm font-semibold text-[var(--color-text)]"
        >
          View as:
        </span>
        <div className="flex" style={{ gap: '8px' }}>
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
