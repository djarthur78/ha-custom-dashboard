import { useCallback } from 'react';
import { useEntity } from '../../../../hooks/useEntity';
import { useServiceCall } from '../../../../hooks/useServiceCall';
import {
  GARDEN_LIGHT_ENTITIES,
  HUE_GARDEN_LIGHT,
  LIGHT_SYMPHONY_GARDEN_LIGHT,
} from '../gardenLightsConfig';

export function useGardenLights() {
  const lightSymphony = useEntity(LIGHT_SYMPHONY_GARDEN_LIGHT);
  const hue = useEntity(HUE_GARDEN_LIGHT);
  const { callService, loading: serviceLoading, error } = useServiceCall();
  const isOn = lightSymphony.state === 'on' || hue.state === 'on';

  const setState = useCallback((service) => callService('homeassistant', service, {
    entity_id: GARDEN_LIGHT_ENTITIES,
  }), [callService]);

  const turnOn = useCallback(() => setState('turn_on'), [setState]);
  const turnOff = useCallback(() => setState('turn_off'), [setState]);
  const toggle = useCallback(() => (isOn ? turnOff() : turnOn()), [isOn, turnOff, turnOn]);

  return {
    isOn,
    loading: serviceLoading || lightSymphony.loading || hue.loading,
    error,
    toggle,
    turnOn,
    turnOff,
  };
}
