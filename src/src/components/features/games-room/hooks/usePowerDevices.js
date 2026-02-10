/**
 * usePowerDevices Hook
 * Subscribes to all 4 games room light switches.
 *
 * Returns: Array of device objects:
 *   [{
 *     ...deviceConfig,   // id, label, icon, switchEntity
 *     switchState,       // 'on' | 'off' | 'unavailable'
 *     loading,           // boolean
 *   }]
 */

import { useEntity } from '../../../../hooks/useEntity';
import { POWER_DEVICES } from '../gamesRoomConfig';

export function usePowerDevices() {
  // IMPORTANT: All useEntity calls MUST be at the top level, unconditional.
  // Switches (4 lights)
  const sw0 = useEntity(POWER_DEVICES[0].switchEntity);
  const sw1 = useEntity(POWER_DEVICES[1].switchEntity);
  const sw2 = useEntity(POWER_DEVICES[2].switchEntity);
  const sw3 = useEntity(POWER_DEVICES[3].switchEntity);

  const switches = [sw0, sw1, sw2, sw3];

  const devices = POWER_DEVICES.map((device, i) => ({
    ...device,
    switchState: switches[i].state || 'unavailable',
    loading: switches[i].loading,
  }));

  return { devices, totalConsumption: 0 };
}
