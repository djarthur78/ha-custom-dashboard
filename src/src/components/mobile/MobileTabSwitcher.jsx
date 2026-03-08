/**
 * MobileTabSwitcher Component
 * Generic horizontal tab bar for mobile pages
 */

export function MobileTabSwitcher({ tabs, activeTab, onTabChange }) {
  return (
    <div
      className="flex"
      style={{
        borderBottom: '1px solid var(--ds-border)',
        backgroundColor: 'var(--ds-card)',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex-1 py-2.5 text-xs font-semibold transition-colors"
          style={
            activeTab === tab.id
              ? { color: 'var(--ds-accent)', borderBottom: '2px solid var(--ds-accent)' }
              : { color: 'var(--ds-text-secondary)' }
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
