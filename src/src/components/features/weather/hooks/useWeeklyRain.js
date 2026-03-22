/**
 * useWeeklyRain Hook
 * Tries the Ecowitt weekly rain entity first, returns null if unavailable.
 */

import { useEntity } from '../../../../hooks/useEntity';
import { RAIN } from '../weatherConfig';

export function useWeeklyRain() {
  const weekly = useEntity(RAIN.weekly);
  const yearly = useEntity(RAIN.yearly);

  const weeklyVal = weekly.state && weekly.state !== 'unavailable' && weekly.state !== 'unknown'
    ? parseFloat(weekly.state)
    : null;

  const yearlyVal = yearly.state && yearly.state !== 'unavailable' && yearly.state !== 'unknown'
    ? parseFloat(yearly.state)
    : null;

  return {
    weeklyRain: weeklyVal,
    yearlyRain: yearlyVal,
    loading: weekly.loading,
  };
}
