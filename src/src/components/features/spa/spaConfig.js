export const SPA_ENTITIES = {
  climate: 'climate.spa_thermostat',
  status: 'select.spa_heater_mode',
  currentTemp: 'sensor.spa_current_temperature',
  targetTemp: 'number.spa_target_desired_temperature',
  heaterState: 'sensor.spa_heater',
  waterQualityPh: 'sensor.hot_tub_ph',
  waterQualityOrp: 'sensor.hot_tub_oxydo_reduction_potential',
  icoTemp: 'sensor.hot_tub_temperature',
  icoBattery: 'sensor.hot_tub_battery',
  icoRecommendation: 'sensor.spa_ico_recommendation',
  phMinimum: 'input_number.spa_ph_minimum',
  phMaximum: 'input_number.spa_ph_maximum',
  orpMinimum: 'input_number.spa_orp_minimum',
  orpMaximum: 'input_number.spa_orp_maximum',
  jets1: 'switch.spa_pump_1',
  jets2: 'switch.spa_pump_2',
  blower: 'switch.spa_blower',
  lights: 'switch.spa_light',
  standbyTemp: 'input_number.spa_standby_temperature',
  sonos: 'media_player.spa_sonos_port',
  alert: 'sensor.spa_total_alerts',
  fault: 'sensor.spa_fault_message',
  online: 'binary_sensor.isonline',
};

export const SPA_TARGET_PRESETS = {
  ready: 38,
};
