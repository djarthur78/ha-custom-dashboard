/**
 * Health & Wellness Configuration
 * Entity IDs for Oura Ring sensors and Cold Plunge controls
 * Verified against actual HA entities 2026-03-02
 */

export const OURA_SCORES = {
  sleep: 'sensor.oura_ring_sleep_score',
  readiness: 'sensor.oura_ring_readiness_score',
  activity: 'sensor.oura_ring_activity_score',
};

export const OURA_SLEEP = {
  efficiency: 'sensor.oura_ring_sleep_efficiency',
  restfulness: 'sensor.oura_ring_restfulness',
  regularity: 'sensor.oura_ring_sleep_regularity_score',
  timing: 'sensor.oura_ring_sleep_timing',
  total_duration: 'sensor.oura_ring_total_sleep_duration',
  deep_duration: 'sensor.oura_ring_deep_sleep_duration',
  deep_pct: 'sensor.oura_ring_deep_sleep_percentage',
  light_duration: 'sensor.oura_ring_light_sleep_duration',
  rem_duration: 'sensor.oura_ring_rem_sleep_duration',
  rem_pct: 'sensor.oura_ring_rem_sleep_percentage',
  awake_time: 'sensor.oura_ring_awake_time',
  time_in_bed: 'sensor.oura_ring_time_in_bed',
  latency: 'sensor.oura_ring_sleep_latency',
  bedtime_start: 'sensor.oura_ring_bedtime_start',
  bedtime_end: 'sensor.oura_ring_bedtime_end',
  recovery_score: 'sensor.oura_ring_sleep_recovery_score',
};

export const OURA_HEART = {
  current: 'sensor.oura_ring_current_heart_rate',
  average: 'sensor.oura_ring_average_heart_rate',
  avg_sleep: 'sensor.oura_ring_average_sleep_heart_rate',
  lowest_sleep: 'sensor.oura_ring_lowest_sleep_heart_rate',
  min: 'sensor.oura_ring_minimum_heart_rate',
  max: 'sensor.oura_ring_maximum_heart_rate',
  resting_score: 'sensor.oura_ring_resting_heart_rate_score',
  hrv_balance: 'sensor.oura_ring_hrv_balance_score',
  avg_sleep_hrv: 'sensor.oura_ring_average_sleep_hrv',
  cardio_age: 'sensor.oura_ring_cardiovascular_age',
};

export const OURA_ACTIVITY = {
  steps: 'sensor.oura_ring_steps',
  active_calories: 'sensor.oura_ring_active_calories',
  total_calories: 'sensor.oura_ring_total_calories',
  target_calories: 'sensor.oura_ring_target_calories',
  high_activity: 'sensor.oura_ring_high_activity_time',
  medium_activity: 'sensor.oura_ring_medium_activity_time',
  low_activity: 'sensor.oura_ring_low_activity_time',
};

export const OURA_BODY = {
  temp_deviation: 'sensor.oura_ring_temperature_deviation',
  spo2: 'sensor.oura_ring_spo2_average',
  breathing_index: 'sensor.oura_ring_breathing_disturbance_index',
};

export const OURA_STRESS = {
  day_summary: 'sensor.oura_ring_stress_day_summary',
  resilience: 'sensor.oura_ring_resilience_level',
  resilience_score: 'sensor.oura_ring_stress_resilience_score',
  stress_high: 'sensor.oura_ring_stress_high_duration',
  recovery_high: 'sensor.oura_ring_recovery_high_duration',
  daytime_recovery: 'sensor.oura_ring_daytime_recovery_score',
};

export const COLD_PLUNGE = {
  chiller: 'switch.cold_plunge_devices_p304m_cold_plunge_chiller',
  pump: 'switch.cold_plunge_devices_p304m_cold_plunge_pump',
  fan: 'switch.cold_plunge_devices_p304m_cold_plunge_fan',
  ozone: 'switch.cold_plunge_devices_p304m_cold_plunge_ozone',
};

export const COLD_PLUNGE_POWER = {
  chiller: 'sensor.cold_plunge_devices_p304m_cold_plunge_chiller_power',
  pump: 'sensor.cold_plunge_devices_p304m_cold_plunge_pump_power',
  fan: 'sensor.cold_plunge_devices_p304m_cold_plunge_fan_power',
  ozone: 'sensor.cold_plunge_devices_p304m_cold_plunge_ozone_power',
};

/** All Oura entity IDs for bulk refresh */
export const ALL_OURA_ENTITIES = [
  ...Object.values(OURA_SCORES),
  ...Object.values(OURA_SLEEP),
  ...Object.values(OURA_HEART),
  ...Object.values(OURA_ACTIVITY),
  ...Object.values(OURA_BODY),
  ...Object.values(OURA_STRESS),
];

export const SCORE_COLORS = {
  high: '#6b8a6b',    // sage - 80+
  medium: '#b08a62',  // bronze - 60-79
  low: '#9a6b6b',     // muted rose - below 60
};

export function getScoreColor(score) {
  const num = parseInt(score, 10);
  if (isNaN(num)) return '#9ca3af';
  if (num >= 80) return SCORE_COLORS.high;
  if (num >= 60) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}
