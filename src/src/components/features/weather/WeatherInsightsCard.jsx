/**
 * WeatherInsightsCard Component
 * Glanceable weather intelligence: next rain, cold snap, pollen, pressure
 */

import { Umbrella, ThermometerSnowflake, Flower2, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeatherInsights } from './hooks/useWeatherInsights';

function InsightRow({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="flex items-center gap-3 py-1.5" style={{ borderBottom: '1px solid var(--ds-border)' }}>
      <Icon size={16} style={{ color: color || 'var(--ds-text-secondary)' }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--ds-text-secondary)]">{label}</div>
        <div className="text-sm font-semibold" style={{ color: color || 'var(--ds-text)' }}>{value}</div>
      </div>
      {subtext && (
        <span className="text-xs text-[var(--ds-text-secondary)] flex-shrink-0">{subtext}</span>
      )}
    </div>
  );
}

export function WeatherInsightsCard({ compact = false }) {
  const { nextRain, coldSnap, pollen, pressure, loading } = useWeatherInsights();

  if (loading) return null;

  // Next rain display
  const rainValue = nextRain
    ? `${nextRain.day}${nextRain.probability ? ` (${nextRain.probability}%)` : ''}`
    : 'No rain in forecast';
  const rainColor = nextRain ? '#5a8fb8' : '#4a9a4a';

  // Cold snap display
  const coldValue = coldSnap
    ? `${coldSnap.day}: ${coldSnap.fromTemp}° → ${coldSnap.toTemp}°`
    : 'No cold snap expected';
  const coldColor = coldSnap ? '#5a8fb8' : '#4a9a4a';
  const coldSubtext = coldSnap ? `${coldSnap.drop}° drop` : null;

  // Pollen display
  const pollenValue = pollen.types.length > 0
    ? `${pollen.label} — ${pollen.types[0]}`
    : `${pollen.label} risk`;

  // Pressure display
  const pressureValue = pressure != null ? `${pressure.toFixed(0)} hPa` : 'Unavailable';

  return (
    <div className="ds-card" style={{ padding: compact ? '12px' : '12px 16px' }}>
      <h3 className="text-xs font-semibold text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">
        Insights
      </h3>
      <div>
        <InsightRow
          icon={Umbrella}
          label="Next Rain"
          value={rainValue}
          color={rainColor}
        />
        <InsightRow
          icon={ThermometerSnowflake}
          label="Cold Change"
          value={coldValue}
          color={coldColor}
          subtext={coldSubtext}
        />
        <InsightRow
          icon={Flower2}
          label="Pollen / Hayfever"
          value={pollenValue}
          color={pollen.color}
        />
        <InsightRow
          icon={Gauge}
          label="Pressure"
          value={pressureValue}
          color="#5a8fb8"
        />
      </div>
    </div>
  );
}
