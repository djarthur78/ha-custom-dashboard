export const CAMERAS = [
  // Front cameras (large, top row) — use MJPEG streams
  { id: 'camera.front_door_high_resolution_channel', label: 'Front Door', zone: 'front', priority: 1 },
  { id: 'camera.front_right_high_resolution_channel', label: 'Front Right', zone: 'front', priority: 2 },
  { id: 'camera.front_left_high_resolution_channel', label: 'Front Left', zone: 'front', priority: 3 },

  // Back/side cameras (small, bottom row) — use snapshot refresh
  { id: 'camera.front_door_package_camera', label: 'Package Cam', zone: 'other', priority: 4 },
  { id: 'camera.back_shed_high_resolution_channel', label: 'Back Shed', zone: 'other', priority: 5 },
  { id: 'camera.back_gym_high_resolution_channel', label: 'Back Gym', zone: 'other', priority: 6 },
  { id: 'camera.side_gate_high_resolution_channel', label: 'Side Gate', zone: 'other', priority: 7 },
  { id: 'camera.outdoor_kitchen_high_resolution_channel', label: 'Outdoor Kitchen', zone: 'other', priority: 8 },
];

export const DOORBELL_ENTITY = 'event.front_door_doorbell';
export const PERSON_SENSOR = 'binary_sensor.front_door_person_detected';
export const FRONT_DOOR_CAMERA = 'camera.front_door_high_resolution_channel';
export const ALERT_DURATION_MS = 120_000; // 2 minutes
export const SNAPSHOT_INTERVAL_MS = 3000; // 3s normal refresh
export const SNAPSHOT_INTERVAL_FAST_MS = 1000; // 1s for enlarged modal
