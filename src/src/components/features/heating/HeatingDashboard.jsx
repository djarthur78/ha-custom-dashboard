/**
 * HeatingDashboard Component
 * Full viewport heating page — left hero panel + right controls/grid
 * Mirrors the cold plunge tab layout
 */

import { useState, useCallback } from 'react';
import { Thermometer, Flame, ArrowDown, ArrowUp, Warehouse } from 'lucide-react';
import { useEntity } from '../../../hooks/useEntity';
import {
  HEAT_GENIUS_ROOMS,
  SENSIBO_ROOMS,
  OUTDOOR_TEMP_ENTITY,
  ALL_ROOMS,
  FROST_PROTECTION_TEMP,
  getHeatingColor,
} from './heatingConfig';
import { RoomCard } from './RoomCard';
import { SensiboCard } from './SensiboCard';
import { OverrideControls } from './OverrideControls';
import { useHeatingOverride } from './hooks/useHeatingOverride';

function useRoomStates(rooms) {
  const entities = {};
  for (const room of rooms) {
    entities[room.id] = useEntity(room.id);
  }
  return entities;
}

export function HeatingDashboard() {
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [showCustomOverride, setShowCustomOverride] = useState(false);
  const outdoorTemp = useEntity(OUTDOOR_TEMP_ENTITY);
  const { activeOverrides, loading, startOverride, cancelOverride, getTimeRemaining } = useHeatingOverride();

  const roomStates = useRoomStates(ALL_ROOMS);

  // Calculate stats
  const overridableRooms = [...HEAT_GENIUS_ROOMS.downstairs, ...HEAT_GENIUS_ROOMS.upstairs];
  const heatingCount = overridableRooms.filter(room => {
    const entity = roomStates[room.id];
    return entity?.attributes?.temperature > FROST_PROTECTION_TEMP;
  }).length;

  // Overall average
  const temps = ALL_ROOMS
    .map(room => roomStates[room.id]?.attributes?.current_temperature)
    .filter(t => t != null);
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const avgColor = getHeatingColor(avgTemp);

  // Downstairs average
  const downTemps = HEAT_GENIUS_ROOMS.downstairs
    .map(room => roomStates[room.id]?.attributes?.current_temperature)
    .filter(t => t != null);
  const downAvg = downTemps.length > 0 ? downTemps.reduce((a, b) => a + b, 0) / downTemps.length : null;

  // Upstairs average
  const upTemps = HEAT_GENIUS_ROOMS.upstairs
    .map(room => roomStates[room.id]?.attributes?.current_temperature)
    .filter(t => t != null);
  const upAvg = upTemps.length > 0 ? upTemps.reduce((a, b) => a + b, 0) / upTemps.length : null;

  const outdoor = outdoorTemp.state && outdoorTemp.state !== 'unavailable'
    ? parseFloat(outdoorTemp.state) : null;

  const handleSelect = useCallback((entityId) => {
    setSelectedRooms(prev => {
      const next = new Set(prev);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      return next;
    });
    setShowCustomOverride(true);
  }, []);

  const handleGroupOverride = useCallback((key, rooms, temp, duration) => {
    const roomsWithPrev = rooms.map(room => ({
      id: room.id,
      previousTarget: roomStates[room.id]?.attributes?.temperature || FROST_PROTECTION_TEMP,
    }));
    startOverride(key, roomsWithPrev, temp, duration);
    setSelectedRooms(new Set());
    setShowCustomOverride(false);
  }, [roomStates, startOverride]);

  const handleCustomOverride = useCallback((key, rooms, temp, duration) => {
    const roomsWithPrev = rooms.map(r => ({
      id: r.id,
      previousTarget: roomStates[r.id]?.attributes?.temperature || FROST_PROTECTION_TEMP,
    }));
    startOverride(key, roomsWithPrev, temp, duration);
    setSelectedRooms(new Set());
    setShowCustomOverride(false);
  }, [roomStates, startOverride]);

  const customRooms = overridableRooms.filter(r => selectedRooms.has(r.id));

  return (
    <div className="flex gap-3 p-3" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Left: Hero Display (30%) */}
      <div className="flex-[30] min-h-0">
        <div
          className="ds-card h-full flex flex-col items-center text-center"
          style={{
            background: heatingCount > 0
              ? 'linear-gradient(135deg, rgba(181,69,58,0.06), rgba(181,69,58,0.02))'
              : 'var(--ds-card)',
          }}
        >
          {/* Average Temp Hero */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <Thermometer size={48} style={{ color: avgColor }} className="mb-2" />
            <div className="text-[96px] font-bold leading-none mb-1" style={{ color: avgColor }}>
              {avgTemp != null ? `${avgTemp.toFixed(1)}°` : '--'}
            </div>
            <div className="text-lg font-medium text-[var(--color-text-secondary)] mb-4">
              House Average
            </div>

            {/* Status */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <Flame size={20} style={{ color: heatingCount > 0 ? '#b5453a' : '#9ca3af' }} />
                <span className="text-lg font-bold" style={{ color: heatingCount > 0 ? '#b5453a' : '#9ca3af' }}>
                  {heatingCount === 0 ? 'All Rooms Off' : `${heatingCount} of ${overridableRooms.length} heating`}
                </span>
              </div>

              {outdoor != null && (
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{ backgroundColor: 'rgba(90,143,184,0.1)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#5a8fb8' }}>
                    Outside: {outdoor.toFixed(1)}°C
                  </span>
                </div>
              )}

              {/* Active override indicators */}
              {Object.entries(activeOverrides).map(([key, override]) => {
                const tr = getTimeRemaining(key);
                return (
                  <div key={key} className="flex items-center gap-2 px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(181,69,58,0.12)' }}
                  >
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#b5453a' }} />
                    <span className="text-sm font-medium" style={{ color: '#b5453a' }}>
                      {key}: {override.temp}° — {tr ? `${tr.hours}h ${tr.minutes}m` : 'expiring'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom stats — Downstairs avg, Upstairs avg, Outside */}
          <div className="w-full flex-shrink-0 pt-4 mt-4" style={{ borderTop: '1px solid var(--ds-border)' }}>
            <div className="flex justify-around px-4 text-sm">
              <div className="text-center">
                <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">
                  <ArrowDown size={10} className="inline mr-0.5" />Downstairs
                </div>
                <div className="text-lg font-bold" style={{ color: getHeatingColor(downAvg) }}>
                  {downAvg != null ? `${downAvg.toFixed(1)}°` : '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">
                  <ArrowUp size={10} className="inline mr-0.5" />Upstairs
                </div>
                <div className="text-lg font-bold" style={{ color: getHeatingColor(upAvg) }}>
                  {upAvg != null ? `${upAvg.toFixed(1)}°` : '--'}
                </div>
              </div>
              {outdoor != null && (
                <div className="text-center">
                  <div className="text-xs text-[var(--ds-text-secondary)] uppercase tracking-wider mb-1">Outside</div>
                  <div className="text-lg font-bold" style={{ color: '#5a8fb8' }}>
                    {outdoor.toFixed(1)}°
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Controls + Grid (70%) */}
      <div className="flex-[70] min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-3 h-full">
          {/* Quick Override Buttons */}
          <div className="flex gap-3 flex-shrink-0">
            <div className="flex-1">
              <OverrideControls
                label="Downstairs"
                overrideKey="Downstairs"
                rooms={HEAT_GENIUS_ROOMS.downstairs}
                activeOverride={activeOverrides['Downstairs']}
                timeRemaining={getTimeRemaining('Downstairs')}
                onStart={handleGroupOverride}
                onCancel={cancelOverride}
                loading={loading}
              />
            </div>
            <div className="flex-1">
              <OverrideControls
                label="Upstairs"
                overrideKey="Upstairs"
                rooms={HEAT_GENIUS_ROOMS.upstairs}
                activeOverride={activeOverrides['Upstairs']}
                timeRemaining={getTimeRemaining('Upstairs')}
                onStart={handleGroupOverride}
                onCancel={cancelOverride}
                loading={loading}
              />
            </div>
          </div>

          {/* Custom override (when rooms selected) */}
          {showCustomOverride && customRooms.length > 0 && (
            <OverrideControls
              label={`${customRooms.length} Selected`}
              overrideKey="Custom"
              rooms={customRooms}
              activeOverride={activeOverrides['Custom']}
              timeRemaining={getTimeRemaining('Custom')}
              onStart={handleCustomOverride}
              onCancel={cancelOverride}
              loading={loading}
            />
          )}

          {/* Heat Genius Room Grid — Downstairs */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
              <ArrowDown size={14} className="inline mr-1" />Downstairs
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {HEAT_GENIUS_ROOMS.downstairs.map(room => (
                <RoomCard
                  key={room.id}
                  entityId={room.id}
                  label={room.label}
                  selected={selectedRooms.has(room.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>

          {/* Heat Genius Room Grid — Upstairs */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
              <ArrowUp size={14} className="inline mr-1" />Upstairs
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {HEAT_GENIUS_ROOMS.upstairs.map(room => (
                <RoomCard
                  key={room.id}
                  entityId={room.id}
                  label={room.label}
                  selected={selectedRooms.has(room.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>

          {/* Outbuildings (Sensibo) — at the bottom */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
              <Warehouse size={14} className="inline mr-1" />Outbuildings
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {SENSIBO_ROOMS.map(room => (
                <SensiboCard
                  key={room.id}
                  entityId={room.id}
                  label={room.label}
                  feelsLikeEntity={room.feelsLikeEntity}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
