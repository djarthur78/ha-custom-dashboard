/**
 * useWeather Hook
 * Get current weather and forecast data using WebSocket subscription.
 * Subscribes when connection is established, re-subscribes on reconnect.
 */

import { useState, useEffect } from 'react';
import { useEntity } from './useEntity';
import { useHAConnection } from './useHAConnection';
import haWebSocket from '../services/ha-websocket';

const WEATHER_ENTITY = 'weather.met_office_wickford';

export function useWeather() {
  const weather = useEntity(WEATHER_ENTITY);
  const { isConnected } = useHAConnection();
  const [forecast, setForecast] = useState([]);
  const [forecastByDate, setForecastByDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    let unsubscribe = null;
    let mounted = true;

    const subscribe = async () => {
      try {
        unsubscribe = await haWebSocket.subscribeToWeatherForecast(
          WEATHER_ENTITY,
          'daily',
          (forecastData) => {
            if (!mounted) return;

            // Create date-indexed lookup
            const byDate = {};
            forecastData.forEach(f => {
              const date = f.datetime.split('T')[0];
              byDate[date] = {
                condition: f.condition,
                temperature: f.temperature,
                templow: f.templow,
                humidity: f.humidity,
                precipitation: f.precipitation,
                datetime: f.datetime,
              };
            });

            setForecast(forecastData);
            setForecastByDate(byDate);
            setLoading(false);
          }
        );
      } catch (error) {
        // Error is expected during reconnection; will retry via isConnected dependency
        console.error('Failed to subscribe to weather forecast:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isConnected]);

  return {
    loading,
    temperature: weather?.attributes?.temperature || null,
    temperatureUnit: weather?.attributes?.temperature_unit || '°C',
    condition: weather?.state || 'unknown',
    humidity: weather?.attributes?.humidity || null,
    forecast,
    forecastByDate,
  };
}

export default useWeather;
