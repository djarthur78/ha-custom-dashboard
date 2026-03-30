/**
 * RoomCard Component
 * Displays a Heat Genius room's current + target temp.
 * Selectable for group override. Auto-follow rooms are dimmed.
 */

import { Thermometer } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import { getHeatingColor, isRoomHeating, hasHeatingDemand } from './heatingConfig';

export function RoomCard({ entityId, label, selected, onSelect, isAutoFollow }) {
  const { state, attributes } = useEntity(entityId);
  const currentTemp = attributes?.current_temperature;
  const targetTemp = attributes?.temperature;
  const heating = isRoomHeating(targetTemp, currentTemp);
  const hasDemand = hasHeatingDemand(targetTemp);
  const tempColor = getHeatingColor(currentTemp);

  return (
    <button
      onClick={isAutoFollow ? undefined : () => onSelect(entityId)}
      disabled={isAutoFollow}
      className="ds-card flex flex-col items-center justify-center gap-1 transition-all disabled:cursor-default"
      style={{
        padding: '12px 8px',
        opacity: isAutoFollow ? 0.5 : 1,
        backgroundColor: selected
          ? 'rgba(181,69,58,0.08)'
          : heating
            ? 'var(--ds-state-on-bg)'
            : 'var(--ds-card)',
        border: selected
          ? '2px solid var(--ds-accent)'
          : heating
            ? '2px solid var(--ds-state-on)'
            : '1px solid var(--ds-border)',
        ...(!isAutoFollow ? { cursor: 'pointer' } : {}),
      }}
    >
      <Thermometer size={20} style={{ color: tempColor }} />
      <span className="text-xs font-semibold text-[var(--color-text)] text-center leading-tight">
        {label}
      </span>
      <span className="text-2xl font-bold leading-none" style={{ color: tempColor }}>
        {currentTemp != null ? `${parseFloat(currentTemp).toFixed(1)}°` : '--'}
      </span>
      <div className="flex items-center gap-1">
        <div className="rounded-full" style={{
          width: 6,
          height: 6,
          backgroundColor: heating ? 'var(--ds-state-on)'
            : hasDemand ? '#d4944c'
            : 'var(--ds-state-off)',
          boxShadow: heating ? '0 0 6px rgba(74,154,74,0.4)' : 'none',
        }} />
        <span className="text-[10px] font-medium" style={{
          color: heating ? 'var(--ds-state-on)'
            : hasDemand ? '#d4944c'
            : 'var(--ds-text-secondary)',
        }}>
          {isAutoFollow ? 'Auto' : heating ? `→ ${Math.round(targetTemp)}°` : hasDemand ? `${Math.round(targetTemp)}°` : 'Off'}
        </span>
      </div>
    </button>
  );
}
