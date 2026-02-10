/**
 * useClimate Hook
 * Subscribes to climate.games_room and the feels-like temperature sensor.
 *
 * Returns:
 *   state       - 'heat', 'cool', 'off', 'dry', 'fan_only', 'heat_cool'
 *   isOn        - boolean (state !== 'off')
 *   currentTemp - number (e.g., 20.3)
 *   targetTemp  - number (e.g., 25)
 *   humidity    - number (e.g., 59.8)
 *   feelsLike   - number (e.g., 20.3) from separate sensor
 *   fanMode     - string (e.g., 'high')
 *   hvacModes   - string[] available modes
 *   fanModes    - string[] available fan modes
 *   minTemp     - number (10)
 *   maxTemp     - number (32)
 *   tempStep    - number (1)
 *   loading     - boolean
 *   error       - string or null
 */

import { useEntity } from '../../../../hooks/useEntity';
import { CLIMATE_ENTITY, FEELS_LIKE_ENTITY } from '../gamesRoomConfig';

export function useClimate() {
  const climate = useEntity(CLIMATE_ENTITY);
  const feelsLikeSensor = useEntity(FEELS_LIKE_ENTITY);

  return {
    state: climate.state,
    isOn: climate.state !== 'off' && climate.state !== 'unavailable',
    currentTemp: climate.attributes?.current_temperature,
    targetTemp: climate.attributes?.temperature,
    humidity: climate.attributes?.current_humidity,
    feelsLike: feelsLikeSensor.state ? parseFloat(feelsLikeSensor.state) : null,
    fanMode: climate.attributes?.fan_mode,
    hvacModes: climate.attributes?.hvac_modes || [],
    fanModes: climate.attributes?.fan_modes || [],
    minTemp: climate.attributes?.min_temp || 10,
    maxTemp: climate.attributes?.max_temp || 32,
    tempStep: climate.attributes?.target_temp_step || 1,
    loading: climate.loading,
    error: climate.error,
  };
}
