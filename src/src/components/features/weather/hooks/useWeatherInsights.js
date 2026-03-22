/**
 * useWeatherInsights Hook
 * Derives actionable insights from forecast and sensor data:
 * - Next rain prediction
 * - Cold snap warning
 * - Pollen season awareness
 * - Pressure trend
 */

import { useMemo } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { useWeather } from '../../../../hooks/useWeather';
import { useEntity } from '../../../../hooks/useEntity';
import { PRESSURE, getPollenSeason } from '../weatherConfig';

const RAINY_CONDITIONS = ['rainy', 'pouring', 'lightning', 'hail'];

export function useWeatherInsights() {
  const { forecast, loading } = useWeather();
  const pressure = useEntity(PRESSURE.relative);

  const insights = useMemo(() => {
    const result = {
      nextRain: null,
      coldSnap: null,
      pollen: getPollenSeason(new Date().getMonth() + 1),
      pressureTrend: null,
    };

    if (!forecast || forecast.length === 0) return result;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Next rain: scan forecast for rainy conditions or high precipitation probability
    for (const day of forecast) {
      const prob = day.precipitation_probability;
      const isRainy = RAINY_CONDITIONS.includes(day.condition);
      const highProb = prob != null && prob > 40;

      if (isRainy || highProb) {
        const date = parseISO(day.datetime);
        const daysAway = differenceInCalendarDays(date, today);
        if (daysAway >= 0) {
          result.nextRain = {
            day: daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : format(date, 'EEEE'),
            probability: prob,
            daysAway,
            condition: day.condition,
            precipitation: day.precipitation,
          };
          break;
        }
      }
    }

    // Cold snap: compare today's high with upcoming days
    if (forecast.length >= 2) {
      const todayTemp = forecast[0].temperature;
      if (todayTemp != null) {
        for (let i = 1; i < forecast.length; i++) {
          const futureTemp = forecast[i].temperature;
          if (futureTemp != null) {
            const drop = todayTemp - futureTemp;
            if (drop >= 5) {
              const date = parseISO(forecast[i].datetime);
              const daysAway = differenceInCalendarDays(date, today);
              result.coldSnap = {
                day: daysAway === 1 ? 'Tomorrow' : format(date, 'EEEE'),
                drop: Math.round(drop),
                fromTemp: Math.round(todayTemp),
                toTemp: Math.round(futureTemp),
                daysAway,
              };
              break;
            }
          }
        }
      }
    }

    return result;
  }, [forecast]);

  // Pressure value (trend requires history which we don't have yet — just expose current)
  const pressureVal = pressure.state && pressure.state !== 'unavailable' ? parseFloat(pressure.state) : null;

  return {
    ...insights,
    pressure: pressureVal,
    loading,
  };
}
