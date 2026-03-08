export const CAMERAS = [
  // Front cameras — snapshot polling at 2s for speed
  { id: 'camera.front_door_high_resolution_channel', label: 'Front Door', zone: 'front', priority: 1, interval: 2000 },
  { id: 'camera.front_right_high_resolution_channel', label: 'Front Right', zone: 'front', priority: 2, interval: 2000 },
  { id: 'camera.front_left_high_resolution_channel', label: 'Front Left', zone: 'front', priority: 3, interval: 2000 },

  // Outside cameras — snapshot polling at 10s
  { id: 'camera.back_shed_high_resolution_channel', label: 'Back Shed', zone: 'outside', priority: 4, interval: 10000 },
  { id: 'camera.side_gate_high_resolution_channel', label: 'Side Gate', zone: 'outside', priority: 5, interval: 10000 },
  { id: 'camera.outdoor_kitchen_high_resolution_channel', label: 'Outdoor Kitchen', zone: 'outside', priority: 6, interval: 10000 },

  // Outbuildings cameras — snapshot polling at 10s
  { id: 'camera.g6_turret_high_resolution_channel', label: 'Gym', zone: 'outbuildings', priority: 7, interval: 10000 },
  { id: 'camera.g6_turret_high_resolution_channel_2', label: 'Games Room', zone: 'outbuildings', priority: 8, interval: 10000 },
];

export const DOORBELL_ENTITY = 'event.front_door_doorbell';
export const PERSON_SENSOR = 'binary_sensor.front_door_person_detected';
export const FRONT_DOOR_CAMERA = 'camera.front_door_high_resolution_channel';
export const ALERT_DURATION_MS = 120_000; // 2 minutes
export const SNAPSHOT_INTERVAL_MS = 10000; // 10s normal refresh for back cameras
export const SNAPSHOT_INTERVAL_FAST_MS = 1000; // 1s for enlarged modal
export const SNAPSHOT_INTERVAL_FOCUSED_MS = 5000; // 5s when camera is focused
