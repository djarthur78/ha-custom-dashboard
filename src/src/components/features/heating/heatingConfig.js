/**
 * Heating Configuration
 * Entity IDs and room groupings for Heat Genius and Sensibo
 */

export const HEAT_GENIUS_ROOMS = {
  downstairs: [
    { id: 'climate.kitchen', label: 'Kitchen' },
    { id: 'climate.living_room', label: 'Living Room' },
    { id: 'climate.dining_room', label: 'Dining Room' },
    { id: 'climate.down_toilet', label: 'Downstairs WC' },
    { id: 'climate.office', label: 'Office' },
  ],
  upstairs: [
    { id: 'climate.main_bedroom', label: 'Main Bedroom' },
    { id: 'climate.cerys_bedroom', label: 'Tom\'s Room' },
    { id: 'climate.dexter_bedroom', label: 'Dexter\'s Room' },
    { id: 'climate.spare_bedroom', label: 'Spare Bedroom' },
  ],
  autoFollow: [
    { id: 'climate.hall_down_back', label: 'Hall (Back)' },
    { id: 'climate.hall_down_front', label: 'Hall (Front)' },
    { id: 'climate.landing', label: 'Landing' },
  ],
};

export const SENSIBO_ROOMS = [
  {
    id: 'climate.games_room',
    label: 'Games Room',
    feelsLikeEntity: 'sensor.games_room_temperature_feels_like',
  },
  {
    id: 'climate.gym',
    label: 'Gym',
    feelsLikeEntity: 'sensor.gym_temperature_feels_like',
  },
];

export const OUTDOOR_TEMP_ENTITY = 'sensor.met_office_wickford_temperature';

export const ALL_OVERRIDABLE = [
  ...HEAT_GENIUS_ROOMS.downstairs,
  ...HEAT_GENIUS_ROOMS.upstairs,
];

export const ALL_ROOMS = [
  ...HEAT_GENIUS_ROOMS.downstairs,
  ...HEAT_GENIUS_ROOMS.upstairs,
  ...HEAT_GENIUS_ROOMS.autoFollow,
];

export const FROST_PROTECTION_TEMP = 5;
export const DEFAULT_OVERRIDE_TEMP = 22;
export const DURATION_OPTIONS = [1, 2, 3, 4]; // hours

export function getHeatingColor(temp) {
  if (temp == null) return '#9ca3af';
  if (temp < 15) return '#5a8fb8';
  if (temp < 18) return '#4a9a9a';
  if (temp < 20) return '#4a9a4a';
  if (temp < 22) return '#d4944c';
  return '#b5453a';
}

/** Room has a heating schedule set (target above frost protection) */
export function hasHeatingDemand(targetTemp) {
  return targetTemp != null && targetTemp > FROST_PROTECTION_TEMP;
}

/** Room is actively calling for heat (target above frost AND current temp below target) */
export function isRoomHeating(targetTemp, currentTemp) {
  return targetTemp != null && currentTemp != null
    && targetTemp > FROST_PROTECTION_TEMP
    && currentTemp < targetTemp;
}
