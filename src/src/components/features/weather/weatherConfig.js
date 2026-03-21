/**
 * Weather Configuration
 * Entity IDs for Ecowitt GW3000A + WS69 weather station sensors
 */

export const ECOWITT_INDOOR = {
  temperature: 'sensor.gw3000a_indoor_temperature',
  humidity: 'sensor.gw3000a_indoor_humidity',
  dewpoint: 'sensor.gw3000a_indoor_dewpoint',
};

// WS69 placeholders — update entity IDs when station is installed
export const ECOWITT_OUTDOOR = {
  temperature: 'sensor.gw3000a_outdoor_temperature',
  humidity: 'sensor.gw3000a_outdoor_humidity',
  dewpoint: 'sensor.gw3000a_outdoor_dewpoint',
  feelsLike: 'sensor.gw3000a_outdoor_feels_like',
};

export const WIND = {
  speed: 'sensor.gw3000a_wind_speed',
  direction: 'sensor.gw3000a_wind_direction',
  gust: 'sensor.gw3000a_wind_gust',
};

export const RAIN = {
  rate: 'sensor.gw3000a_rain_rate',
  daily: 'sensor.gw3000a_daily_rain',
  event: 'sensor.gw3000a_event_rain',
  monthly: 'sensor.gw3000a_monthly_rain',
};

export const UV_SOLAR = {
  uv: 'sensor.gw3000a_uv_index',
  solar: 'sensor.gw3000a_solar_radiation',
};

export const PRESSURE = {
  absolute: 'sensor.gw3000a_absolute_pressure',
  relative: 'sensor.gw3000a_relative_pressure',
};

// 8 soil moisture probes — update IDs as probes are set up
export const SOIL_MOISTURE = [
  { id: 'sensor.gw3000a_soil_moisture_1', label: 'Probe 1' },
  { id: 'sensor.gw3000a_soil_moisture_2', label: 'Probe 2' },
  { id: 'sensor.gw3000a_soil_moisture_3', label: 'Probe 3' },
  { id: 'sensor.gw3000a_soil_moisture_4', label: 'Probe 4' },
  { id: 'sensor.gw3000a_soil_moisture_5', label: 'Probe 5' },
  { id: 'sensor.gw3000a_soil_moisture_6', label: 'Probe 6' },
  { id: 'sensor.gw3000a_soil_moisture_7', label: 'Probe 7' },
  { id: 'sensor.gw3000a_soil_moisture_8', label: 'Probe 8' },
];

/**
 * Color helpers for weather values
 */
export function getTempColor(temp) {
  if (temp == null) return '#9ca3af';
  if (temp < 0) return '#5a8fb8';
  if (temp < 10) return '#4a9a9a';
  if (temp < 20) return '#4a9a4a';
  if (temp < 30) return '#d4944c';
  return '#b5453a';
}

export function getHumidityColor(humidity) {
  if (humidity == null) return '#9ca3af';
  if (humidity < 30) return '#d4944c';
  if (humidity < 60) return '#4a9a4a';
  return '#5a8fb8';
}

export function getUVColor(uv) {
  if (uv == null) return '#9ca3af';
  if (uv < 3) return '#4a9a4a';
  if (uv < 6) return '#d4944c';
  if (uv < 8) return '#b5453a';
  return '#c4636a';
}

export function getSoilMoistureColor(value) {
  if (value == null) return '#9ca3af';
  if (value < 20) return '#b5453a';
  if (value < 40) return '#d4944c';
  if (value < 70) return '#4a9a4a';
  return '#5a8fb8';
}

export function getWindColor(speed) {
  if (speed == null) return '#9ca3af';
  if (speed < 10) return '#4a9a4a';
  if (speed < 25) return '#d4944c';
  return '#b5453a';
}
