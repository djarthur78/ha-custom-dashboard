/**
 * Weather Configuration
 * Entity IDs for Ecowitt GW3000A + WS69 weather station sensors
 */

export const ECOWITT_INDOOR = {
  temperature: 'sensor.gw3000a_indoor_temperature',
  humidity: 'sensor.gw3000a_indoor_humidity',
  dewpoint: 'sensor.gw3000a_indoor_dewpoint',
};

// WS69 outdoor sensor array (connected via GW3000A gateway)
export const ECOWITT_OUTDOOR = {
  temperature: 'sensor.gw3000a_outdoor_temperature',
  humidity: 'sensor.gw3000a_humidity',
  dewpoint: 'sensor.gw3000a_dewpoint',
  feelsLike: 'sensor.gw3000a_feels_like_temperature',
  windchill: 'sensor.gw3000a_windchill',
};

export const MET_OFFICE = {
  feelsLike: 'sensor.met_office_wickford_feels_like_temperature_3_hourly',
  windSpeed: 'sensor.met_office_wickford_wind_speed_3_hourly',
  uvIndex: 'sensor.met_office_wickford_uv_index_3_hourly',
  precipProb: 'sensor.met_office_wickford_probability_of_precipitation_3_hourly',
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
  weekly: 'sensor.gw3000a_weekly_rain',
  yearly: 'sensor.gw3000a_yearly_rain',
};

export const UV_SOLAR = {
  uv: 'sensor.gw3000a_uv_index',
  solar: 'sensor.gw3000a_solar_radiation',
};

export const PRESSURE = {
  absolute: 'sensor.gw3000a_absolute_pressure',
  relative: 'sensor.gw3000a_relative_pressure',
};

// Soil moisture probes grouped by garden area
// Probes 1-4 = Lawn, Probes 5-8 = Plants
// To remap: swap entity IDs between positions. Check Ecowitt app for physical probe locations.
export const SOIL_MOISTURE = {
  lawn: [
    { id: 'sensor.gw3000a_soil_moisture_1', label: 'Right-Front' },
    { id: 'sensor.gw3000a_soil_moisture_2', label: 'Right-Back' },
    { id: 'sensor.gw3000a_soil_moisture_3', label: 'Left-Back' },
    { id: 'sensor.gw3000a_soil_moisture_4', label: 'Left-Front' },
  ],
  plants: [
    { id: 'sensor.gw3000a_soil_moisture_5', label: 'Left-Back' },
    { id: 'sensor.gw3000a_soil_moisture_6', label: 'Left-Front' },
    { id: 'sensor.gw3000a_soil_moisture_7', label: 'Right-Front' },
    { id: 'sensor.gw3000a_soil_moisture_8', label: 'Right-Back' },
  ],
};

// Flat array for backward compat
export const SOIL_MOISTURE_ALL = [...SOIL_MOISTURE.lawn, ...SOIL_MOISTURE.plants];

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

/**
 * UK pollen season calendar (month is 1-indexed)
 */
export function getPollenSeason(month) {
  if (month >= 3 && month <= 5) return { level: 'moderate', label: 'Moderate', types: ['Tree pollen (birch, oak)'], color: '#d4944c' };
  if (month >= 6 && month <= 7) return { level: 'high', label: 'High', types: ['Grass pollen'], color: '#b5453a' };
  if (month >= 8 && month <= 9) return { level: 'moderate', label: 'Moderate', types: ['Weed pollen (ragweed, nettle)'], color: '#d4944c' };
  return { level: 'low', label: 'Low', types: [], color: '#4a9a4a' };
}

/**
 * Pressure trend from delta (hPa change over 3h)
 */
export function getPressureTrend(delta) {
  if (delta == null) return { trend: 'unknown', label: 'Unknown', color: '#9ca3af' };
  if (delta > 1) return { trend: 'rising', label: 'Rising', color: '#4a9a4a' };
  if (delta < -1) return { trend: 'falling', label: 'Falling', color: '#5a8fb8' };
  return { trend: 'steady', label: 'Steady', color: '#9ca3af' };
}
