/**
 * useWeather Hook
 * Get current weather and forecast data
 */

import { useEntity } from './useEntity';

export function useWeather() {
  const weather = useEntity('weather.forecast_home');

  if (!weather) {
    return {
      loading: true,
      temperature: null,
      forecast: [],
    };
  }

  return {
    loading: false,
    temperature: weather.attributes?.temperature || null,
    temperatureUnit: weather.attributes?.temperature_unit || '°C',
    condition: weather.state || 'unknown',
    humidity: weather.attributes?.humidity || null,
    forecast: weather.attributes?.forecast || [],
  };
}

export default useWeather;
