/**
 * useLawnData Hook
 * Aggregates RainBird zone states and soil moisture sensor readings
 * across all 4 irrigation areas.
 */

import { useEntity } from '../../../../hooks/useEntity';
import { IRRIGATION_AREAS, MOISTURE_TRIGGER } from '../lawnConfig';

// All entities must be called unconditionally (React rules of hooks).
// We use a fixed list derived from the config.

const ZONE_ENTITIES = IRRIGATION_AREAS.flatMap(a => a.zones.map(z => z.id));
const SENSOR_ENTITIES = IRRIGATION_AREAS.flatMap(a => a.sensors.map(s => s.id));

export function useLawnData() {
  // Call useEntity for every zone and sensor (unconditional, fixed order)
  const zoneStates = {};
  for (const id of ZONE_ENTITIES) {
    zoneStates[id] = useEntity(id);
  }

  const sensorStates = {};
  for (const id of SENSOR_ENTITIES) {
    sensorStates[id] = useEntity(id);
  }

  // Build per-area data
  const areas = IRRIGATION_AREAS.map(area => {
    const zones = area.zones.map(z => {
      const entity = zoneStates[z.id];
      return {
        id: z.id,
        label: z.label,
        state: entity?.state || 'unknown',
        lastChanged: entity?.lastChanged || null,
      };
    });

    const sensors = area.sensors.map(s => {
      const entity = sensorStates[s.id];
      const raw = entity?.state;
      const value = raw != null && raw !== 'unavailable' && raw !== 'unknown'
        ? parseFloat(raw) : null;
      return {
        id: s.id,
        label: s.label,
        value,
      };
    });

    const validValues = sensors.map(s => s.value).filter(v => v != null);
    const avgMoisture = validValues.length > 0
      ? validValues.reduce((a, b) => a + b, 0) / validValues.length
      : null;

    const isActive = zones.some(z => z.state === 'on');
    const needsWatering = avgMoisture != null && avgMoisture < MOISTURE_TRIGGER;

    // Last watered = most recent lastChanged among zones that were turned on
    const lastWatered = zones
      .map(z => z.lastChanged)
      .filter(Boolean)
      .sort()
      .pop() || null;

    return {
      ...area,
      zoneStates: zones,
      moistureReadings: sensors,
      avgMoisture,
      isActive,
      needsWatering,
      lastWatered,
    };
  });

  // Aggregates
  const allMoisture = areas
    .map(a => a.avgMoisture)
    .filter(v => v != null);
  const overallAvgMoisture = allMoisture.length > 0
    ? allMoisture.reduce((a, b) => a + b, 0) / allMoisture.length
    : null;

  const lawnAreas = areas.filter(a => a.type === 'lawn');
  const bedAreas = areas.filter(a => a.type === 'flowerbed');

  const lawnMoisture = lawnAreas.map(a => a.avgMoisture).filter(v => v != null);
  const lawnAvg = lawnMoisture.length > 0
    ? lawnMoisture.reduce((a, b) => a + b, 0) / lawnMoisture.length : null;

  const bedMoisture = bedAreas.map(a => a.avgMoisture).filter(v => v != null);
  const bedAvg = bedMoisture.length > 0
    ? bedMoisture.reduce((a, b) => a + b, 0) / bedMoisture.length : null;

  const activeZoneCount = areas.reduce(
    (count, a) => count + a.zoneStates.filter(z => z.state === 'on').length, 0
  );

  const dryAreaCount = areas.filter(a => a.needsWatering).length;

  return {
    areas,
    lawnAreas,
    bedAreas,
    overallAvgMoisture,
    lawnAvg,
    bedAvg,
    activeZoneCount,
    dryAreaCount,
  };
}
