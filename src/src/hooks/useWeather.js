/**
 * useWeather Hook
 * Get current weather and forecast data using WebSocket subscription
 */

import { useState, useEffect } from 'react';
import { useEntity } from './useEntity';
import haWebSocket from '../services/ha-websocket';

const WEATHER_ENTITY = 'weather.met_office_wickford';

export function useWeather() {
  const weather = useEntity(WEATHER_ENTITY);
  const [forecast, setForecast] = useState([]);
  const [forecastByDate, setForecastByDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    const subscribe = async () => {
      try {
        console.log('Subscribing to weather forecast...');

        unsubscribe = await haWebSocket.subscribeToWeatherForecast(
          WEATHER_ENTITY,
          'daily',
          (forecastData) => {
            if (!mounted) return;

            console.log('Received weather forecast:', forecastData);

            // Create date-indexed lookup
            const byDate = {};
            forecastData.forEach(f => {
              const date = f.datetime.split('T')[0]; // Get YYYY-MM-DD
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
        console.error('Failed to subscribe to weather forecast:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Wait for WebSocket connection
    if (haWebSocket.getStatus() === 'connected') {
      subscribe();
    } else {
      const timer = setTimeout(() => {
        if (mounted && haWebSocket.getStatus() === 'connected') {
          subscribe();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    loading,
    temperature: weather?.attributes?.temperature || null,
    temperatureUnit: weather?.attributes?.temperature_unit || '°C',
    condition: weather?.state || 'unknown',
    humidity: weather?.attributes?.humidity || null,
    forecast,
    forecastByDate, // Easy lookup: forecastByDate['2026-01-21']
  };
}

export default useWeather;
