import { describe, expect, it } from 'vitest';
import { IRRIGATION_AREAS } from '../lawnConfig';
import { SOIL_MOISTURE } from '../../weather/weatherConfig';

const expectedByArea = {
  'lawn-left': [
    ['sensor.gw3000a_soil_moisture_7', 'Front'],
    ['sensor.gw3000a_soil_moisture_2', 'Back'],
  ],
  'lawn-right': [
    ['sensor.gw3000a_soil_moisture_3', 'Front'],
    ['sensor.gw3000a_soil_moisture_4', 'Back'],
  ],
  'flowerbed-left': [
    ['sensor.gw3000a_soil_moisture_1', 'Front'],
    ['sensor.gw3000a_soil_moisture_5', 'Back'],
  ],
  'flowerbed-right': [
    ['sensor.gw3000a_soil_moisture_6', 'Front'],
    ['sensor.gw3000a_soil_moisture_8', 'Back'],
  ],
};

describe('soil moisture mapping', () => {
  it('groups each probe with the matching irrigation area', () => {
    const actual = Object.fromEntries(IRRIGATION_AREAS.map((area) => [
      area.key,
      area.sensors.map(({ id, label }) => [id, label]),
    ]));

    expect(actual).toEqual(expectedByArea);
  });

  it('uses the same physical locations on the weather dashboard', () => {
    expect(SOIL_MOISTURE).toEqual({
      lawn: [
        { id: 'sensor.gw3000a_soil_moisture_7', label: 'Left-Front' },
        { id: 'sensor.gw3000a_soil_moisture_2', label: 'Left-Back' },
        { id: 'sensor.gw3000a_soil_moisture_3', label: 'Right-Front' },
        { id: 'sensor.gw3000a_soil_moisture_4', label: 'Right-Back' },
      ],
      plants: [
        { id: 'sensor.gw3000a_soil_moisture_1', label: 'Left-Front' },
        { id: 'sensor.gw3000a_soil_moisture_5', label: 'Left-Back' },
        { id: 'sensor.gw3000a_soil_moisture_6', label: 'Right-Front' },
        { id: 'sensor.gw3000a_soil_moisture_8', label: 'Right-Back' },
      ],
    });
  });
});
