/**
 * Weather Utilities
 * Shared weather icon mapping for all views.
 */

import { Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Sun, Moon, CloudFog, Wind, Snowflake } from 'lucide-react';

const WEATHER_ICONS = {
  'clear-night': { icon: Moon, color: '#FDB813' },
  'cloudy': { icon: Cloud, color: '#78909C' },
  'fog': { icon: CloudFog, color: '#B0BEC5' },
  'hail': { icon: CloudSnow, color: '#81D4FA' },
  'lightning': { icon: CloudLightning, color: '#FDD835' },
  'lightning-rainy': { icon: CloudLightning, color: '#FFA726' },
  'partlycloudy': { icon: Cloud, color: '#90CAF9' },
  'pouring': { icon: CloudRain, color: '#42A5F5' },
  'rainy': { icon: CloudDrizzle, color: '#5C6BC0' },
  'snowy': { icon: Snowflake, color: '#81D4FA' },
  'snowy-rainy': { icon: CloudSnow, color: '#64B5F6' },
  'sunny': { icon: Sun, color: '#FFB300' },
  'windy': { icon: Wind, color: '#90A4AE' },
  'windy-variant': { icon: Wind, color: '#78909C' },
  'exceptional': { icon: Cloud, color: '#FF5722' },
};

/**
 * Get a weather icon component for a given condition.
 * @param {string} condition - HA weather condition string
 * @param {number} [size=24] - Icon size in pixels
 * @returns {JSX.Element}
 */
export function getWeatherIcon(condition, size = 24) {
  const config = WEATHER_ICONS[condition] || WEATHER_ICONS['sunny'];
  const IconComponent = config.icon;

  return (
    <IconComponent
      size={size}
      style={{ color: config.color }}
      strokeWidth={2}
    />
  );
}
