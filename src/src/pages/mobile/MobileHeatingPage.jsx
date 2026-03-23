/**
 * MobileHeatingPage
 * Vertical stack: status + override buttons + room grid + sensibo
 */

import { useState, useCallback } from 'react';
import { Thermometer, Flame, ArrowDown, ArrowUp, Warehouse } from 'lucide-react';
import { MobilePageContainer } from '../../components/mobile/MobilePageContainer';
import { useEntity } from '../../hooks/useEntity';
import {
  HEAT_GENIUS_ROOMS,
  SENSIBO_ROOMS,
  OUTDOOR_TEMP_ENTITY,
  ALL_ROOMS,
  FROST_PROTECTION_TEMP,
  getHeatingColor,
} from '../../components/features/heating/heatingConfig';
import { RoomCard } from '../../components/features/heating/RoomCard';
import { SensiboCard } from '../../components/features/heating/SensiboCard';
import { OverrideControls } from '../../components/features/heating/OverrideControls';
import { useHeatingOverride } from '../../components/features/heating/hooks/useHeatingOverride';

function useRoomStates(rooms) {
  const entities = {};
  for (const room of rooms) {
    entities[room.id] = useEntity(room.id);
  }
  return entities;
}

export function MobileHeatingPage() {
  const [selectedRooms, setSelectedRooms] = useState(new Set());
  const [showCustomOverride, setShowCustomOverride] = useState(false);
  const outdoorTemp = useEntity(OUTDOOR_TEMP_ENTITY);
  const { activeOverrides, loading, startOverride, cancelOverride, getTimeRemaining } = useHeatingOverride();
  const roomStates = useRoomStates(ALL_ROOMS);

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
    <MobilePageContainer>
      <div className="space-y-3">
        {/* Status Card */}
        <div className="ds-card flex items-center gap-4" style={{ padding: '16px' }}>
          <div className="flex flex-col items-center" style={{ minWidth: 72 }}>
            <Thermometer size={28} style={{ color: avgColor }} />
            <span className="text-3xl font-bold leading-tight" style={{ color: avgColor }}>
              {avgTemp != null ? `${avgTemp.toFixed(1)}°` : '--'}
            </span>
            <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">House</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Flame size={20} style={{ color: heatingCount > 0 ? '#b5453a' : '#9ca3af' }} />
              <span className="text-lg font-bold" style={{ color: heatingCount > 0 ? '#b5453a' : '#9ca3af' }}>
                {heatingCount === 0 ? 'All Off' : `${heatingCount} of ${overridableRooms.length} heating`}
              </span>
            </div>
            {/* Floor averages */}
            <div className="flex gap-3 mt-1">
              <span className="text-xs font-medium" style={{ color: getHeatingColor(downAvg) }}>
                <ArrowDown size={10} className="inline mr-0.5" />Down: {downAvg != null ? `${downAvg.toFixed(1)}°` : '--'}
              </span>
              <span className="text-xs font-medium" style={{ color: getHeatingColor(upAvg) }}>
                <ArrowUp size={10} className="inline mr-0.5" />Up: {upAvg != null ? `${upAvg.toFixed(1)}°` : '--'}
              </span>
            </div>
            {outdoor != null && (
              <div className="text-sm font-medium" style={{ color: '#5a8fb8' }}>
                Outside: {outdoor.toFixed(1)}°C
              </div>
            )}
            {Object.entries(activeOverrides).map(([key, override]) => {
              const tr = getTimeRemaining(key);
              return (
                <div key={key} className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#b5453a' }} />
                  <span className="text-xs font-medium" style={{ color: '#b5453a' }}>
                    {key}: {override.temp}° — {tr ? `${tr.hours}h ${tr.minutes}m` : 'expiring'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Override Controls */}
        <OverrideControls
          label="Downstairs"
          overrideKey="Downstairs"
          rooms={HEAT_GENIUS_ROOMS.downstairs}
          activeOverride={activeOverrides['Downstairs']}
          timeRemaining={getTimeRemaining('Downstairs')}
          onStart={handleGroupOverride}
          onCancel={cancelOverride}
          loading={loading}
          compact
        />
        <OverrideControls
          label="Upstairs"
          overrideKey="Upstairs"
          rooms={HEAT_GENIUS_ROOMS.upstairs}
          activeOverride={activeOverrides['Upstairs']}
          timeRemaining={getTimeRemaining('Upstairs')}
          onStart={handleGroupOverride}
          onCancel={cancelOverride}
          loading={loading}
          compact
        />

        {/* Custom override for selected rooms */}
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
            compact
          />
        )}

        {/* Downstairs Rooms */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
            <ArrowDown size={12} className="inline mr-1" />Downstairs
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

        {/* Upstairs Rooms */}
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
            <ArrowUp size={12} className="inline mr-1" />Upstairs
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
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 px-1">
            <Warehouse size={12} className="inline mr-1" />Outbuildings
          </h3>
          <div className="space-y-2">
            {SENSIBO_ROOMS.map(room => (
              <SensiboCard
                key={room.id}
                entityId={room.id}
                label={room.label}
                feelsLikeEntity={room.feelsLikeEntity}
                compact
              />
            ))}
          </div>
        </div>

      </div>
    </MobilePageContainer>
  );
}

export default MobileHeatingPage;
