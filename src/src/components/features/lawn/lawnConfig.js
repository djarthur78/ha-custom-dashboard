/**
 * Lawn & Flowerbeds Configuration
 * Entity IDs for RainBird irrigation zones, Ecowitt soil moisture sensors,
 * and watering thresholds from the lawn care programme.
 */

// Watering thresholds (from openclaw irrigation-system.md)
export const MOISTURE_TRIGGER = 42;  // Below this → needs watering
export const MOISTURE_HARD_STOP = 70; // Above this → stop watering

/**
 * Soil moisture color for the lawn tab — aligned with getMoistureStatus thresholds.
 * Overrides the weather tab's version which uses different ranges.
 */
export function getSoilMoistureColor(value) {
  if (value == null) return '#9ca3af';
  if (value < 20) return '#b5453a';       // Dry — red
  if (value < MOISTURE_TRIGGER) return '#d4944c'; // Low — orange (trigger at 42%)
  if (value < 60) return '#4a9a4a';        // Good — green
  if (value < MOISTURE_HARD_STOP) return '#3a8a8a'; // High — teal (approaching hard stop)
  return '#b5453a';                         // Saturated — red (>70%)
}

/**
 * 4 watering areas, each with RainBird zone(s) and 2 soil moisture sensors.
 * Lawn areas have 2 zones that alternate (A then B).
 * Flowerbed areas have 1 zone each.
 */
export const IRRIGATION_AREAS = [
  {
    key: 'lawn-left',
    label: 'Lawn Left',
    type: 'lawn',
    zones: [
      { id: 'switch.rain_bird_sprinkler_lawn_left', label: 'Left' },
      { id: 'switch.rain_bird_sprinkler_lawn_left_middle', label: 'Left Middle' },
    ],
    paired: true, // zones alternate A→B
    sensors: [
      { id: 'sensor.gw3000a_soil_moisture_4', label: 'Front' },
      { id: 'sensor.gw3000a_soil_moisture_3', label: 'Back' },
    ],
  },
  {
    key: 'lawn-right',
    label: 'Lawn Right',
    type: 'lawn',
    zones: [
      { id: 'switch.rain_bird_sprinkler_lawn_right', label: 'Right' },
      { id: 'switch.rain_bird_sprinkler_lawn_right_middle', label: 'Right Middle' },
    ],
    paired: true,
    sensors: [
      { id: 'sensor.gw3000a_soil_moisture_1', label: 'Front' },
      { id: 'sensor.gw3000a_soil_moisture_2', label: 'Back' },
    ],
  },
  {
    key: 'flowerbed-left',
    label: 'Flower Bed Left',
    type: 'flowerbed',
    zones: [
      { id: 'switch.rain_bird_sprinkler_flower_bed_left', label: 'Left' },
    ],
    paired: false,
    sensors: [
      { id: 'sensor.gw3000a_soil_moisture_6', label: 'Front' },
      { id: 'sensor.gw3000a_soil_moisture_5', label: 'Back' },
    ],
  },
  {
    key: 'flowerbed-right',
    label: 'Flower Bed Right',
    type: 'flowerbed',
    zones: [
      { id: 'switch.rain_bird_sprinkler_flower_bed_right', label: 'Right' },
    ],
    paired: false,
    sensors: [
      { id: 'sensor.gw3000a_soil_moisture_7', label: 'Front' },
      { id: 'sensor.gw3000a_soil_moisture_8', label: 'Back' },
    ],
  },
];

// All entity IDs flattened for hook initialization
export const ALL_ZONE_IDS = IRRIGATION_AREAS.flatMap(a => a.zones.map(z => z.id));
export const ALL_SENSOR_IDS = IRRIGATION_AREAS.flatMap(a => a.sensors.map(s => s.id));

// Plan URL — served from HA's /config/www/ directory
// In production, nginx proxies /local/ to HA. In dev, use full HA URL.
import { getHAConfig } from '../../../utils/ha-config';

export function getPlanUrl() {
  const { url } = getHAConfig({ useProxy: true });
  return `${url}/local/lawn-plan.json`;
}

// Duration options per area type (minutes)
// Placeholder values — update after tin test results (28 Mar 2026)
export const WATERING_DURATIONS = {
  lawn: [10, 15, 20, 30],       // Lawn zones: shorter runs, tin test will refine
  flowerbed: [15, 30, 45, 60],  // Flowerbeds: +6% per 30 min (calibrated)
};

export const DEFAULT_DURATION = {
  lawn: 15,       // default lawn run (minutes)
  flowerbed: 30,  // default flowerbed run (minutes)
};

/**
 * Returns moisture status with label and color
 */
export function getMoistureStatus(value) {
  if (value == null) return { label: '--', color: '#9ca3af' };
  if (value < 20) return { label: 'Dry', color: '#b5453a' };
  if (value < MOISTURE_TRIGGER) return { label: 'Low', color: '#d4944c' };
  if (value < 60) return { label: 'Good', color: '#4a9a4a' };
  if (value < MOISTURE_HARD_STOP) return { label: 'High', color: '#3a8a8a' };
  return { label: 'Saturated', color: '#b5453a' };
}
