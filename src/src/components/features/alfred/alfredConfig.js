/**
 * Alfred Command Centre Configuration
 * Entity IDs for OpenClaw Alfred monitoring sensors
 */

// Gateway REST sensors (poll every 60s)
export const ALFRED_GATEWAY = {
  health: 'sensor.alfred_gateway_health',
  status: 'sensor.alfred_gateway_status',
};

// Command-line sensors (poll every 5m)
export const ALFRED_DATA = {
  cronList: 'sensor.alfred_cron_list',
  memoryStatus: 'sensor.alfred_memory_status',
};

// Mac Mini system monitoring
export const ALFRED_SYSTEM = {
  cpu: 'sensor.mac_mini_cpu_usage',
  ram: 'sensor.mac_mini_ram_usage',
  disk: 'sensor.mac_mini_disk_usage',
};

// Service health binary sensors
export const ALFRED_SERVICES = [
  { key: 'gateway', label: 'Gateway', port: 18789, entityId: 'binary_sensor.alfred_gateway' },
  { key: 'locationBridge', label: 'Location Bridge', port: 18790, entityId: 'binary_sensor.alfred_location_bridge' },
  { key: 'ollama', label: 'Ollama', port: 11434, entityId: 'binary_sensor.alfred_ollama' },
];

// Oura recovery snapshot (reuses existing entities from healthConfig)
export const OURA_SNAPSHOT = {
  readiness: 'sensor.oura_ring_readiness_score',
  hrv: 'sensor.oura_ring_average_sleep_hrv',
};

/**
 * Get color for system resource usage percentage
 * Uses design system health palette
 */
export function getResourceColor(pct) {
  if (pct == null || isNaN(pct)) return 'var(--ds-text-secondary)';
  if (pct < 60) return 'var(--ds-health-good)';
  if (pct < 85) return 'var(--ds-health-warn)';
  return 'var(--ds-health-bad)';
}

/**
 * Get color for Oura readiness score
 * Matches healthConfig.getScoreColor but uses CSS vars
 */
export function getReadinessColor(score) {
  if (score == null || isNaN(score)) return 'var(--ds-text-secondary)';
  if (score >= 80) return 'var(--ds-health-good)';
  if (score >= 60) return 'var(--ds-health-warn)';
  return 'var(--ds-health-bad)';
}

/**
 * Get training recommendation from readiness score
 */
export function getTrainingRec(score) {
  if (score == null || isNaN(score)) return { label: '--', color: 'var(--ds-text-secondary)' };
  if (score >= 80) return { label: 'Train Hard', color: 'var(--ds-health-good)' };
  if (score >= 60) return { label: 'Moderate', color: 'var(--ds-health-warn)' };
  return { label: 'Rest Day', color: 'var(--ds-health-bad)' };
}

/**
 * Format relative time from epoch ms or ISO date string
 */
export function formatRelativeTime(value) {
  if (!value) return '--';
  const now = Date.now();
  const ts = typeof value === 'number' ? value : new Date(value).getTime();
  if (isNaN(ts)) return '--';
  const diffMs = now - ts;
  const isFuture = diffMs < 0;
  const absDiff = Math.abs(diffMs);
  const mins = Math.floor(absDiff / 60000);
  if (mins < 1) return isFuture ? 'now' : 'just now';
  if (mins < 60) return isFuture ? `in ${mins}m` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isFuture ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isFuture ? `in ${days}d` : `${days}d ago`;
}
