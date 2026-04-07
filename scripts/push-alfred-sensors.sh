#!/bin/bash
# Push Alfred sensor data from Mac Mini to Home Assistant
# Runs every minute via cron on the Mac Mini
# Avoids need for SSH from HA → Mac Mini

HA_URL="http://192.168.1.2:8123"
HA_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkMTFhNDVkY2Y5MDQ0ZjNkYTMxZjU4ZmRlYzBjZDA2YSIsImlhdCI6MTc3MjM5MjUyNiwiZXhwIjoyMDg3NzUyNTI2fQ.HNhVuSrYxE6vhNv7rpRvA0TBoQZwm1Yi7aGwbOkCVsw"
OPENCLAW="$HOME/.npm-global/bin/openclaw"

push_sensor() {
  local entity_id="$1"
  local payload="$2"
  curl -s -X POST "${HA_URL}/api/states/${entity_id}" \
    -H "Authorization: Bearer ${HA_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null 2>&1
}

# ── Cron Jobs ──────────────────────────────────────────────────
CRON_JSON=$($OPENCLAW cron list --json 2>/dev/null | sed $'s/\x1b\\[[0-9;]*m//g' | grep -v '^\[plugins\]')
if [ $? -eq 0 ] && [ -n "$CRON_JSON" ]; then
  # Extract jobs array and count
  JOBS=$(echo "$CRON_JSON" | /usr/bin/python3 -c "
import sys, json
data = json.load(sys.stdin)
jobs = data.get('jobs', data) if isinstance(data, dict) else data
result = []
for j in jobs:
    state = j.get('state', {})
    result.append({
        'name': j.get('name', 'Unknown'),
        'schedule': j.get('schedule', {}).get('expr', ''),
        'enabled': j.get('enabled', False),
        'last_run': state.get('lastRunAtMs'),
        'next_run': state.get('nextRunAtMs'),
        'status': state.get('lastStatus', 'unknown'),
        'last_duration_ms': state.get('lastDurationMs'),
        'consecutive_errors': state.get('consecutiveErrors', 0)
    })
print(json.dumps({'count': len(result), 'jobs': result}))
" 2>/dev/null)

  if [ -n "$JOBS" ]; then
    COUNT=$(echo "$JOBS" | /usr/bin/python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
    push_sensor "sensor.alfred_cron_list" "{
      \"state\": \"$COUNT\",
      \"attributes\": {
        \"friendly_name\": \"Alfred Cron List\",
        \"icon\": \"mdi:clock-outline\",
        \"jobs\": $(echo "$JOBS" | /usr/bin/python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['jobs']))")
      }
    }"
  fi
fi

# ── Memory Status ──────────────────────────────────────────────
MEM_JSON=$($OPENCLAW memory status --json 2>/dev/null | sed $'s/\x1b\\[[0-9;]*m//g' | grep -v '^\[plugins\]')
if [ $? -eq 0 ] && [ -n "$MEM_JSON" ]; then
  MEM_ATTRS=$(echo "$MEM_JSON" | /usr/bin/python3 -c "
import sys, json
data = json.load(sys.stdin)
# memory status returns an array of agents
agent = data[0] if isinstance(data, list) else data
status = agent.get('status', agent)
print(json.dumps({
    'total_files': status.get('files', 0),
    'total_chunks': status.get('chunks', 0),
    'provider': status.get('provider', 'unknown'),
    'model': status.get('model', 'unknown'),
    'dirty': status.get('dirty', False)
}))
" 2>/dev/null)

  if [ -n "$MEM_ATTRS" ]; then
    FILES=$(echo "$MEM_ATTRS" | /usr/bin/python3 -c "import sys,json; print(json.load(sys.stdin)['total_files'])")
    push_sensor "sensor.alfred_memory_status" "{
      \"state\": \"$FILES\",
      \"attributes\": {
        \"friendly_name\": \"Alfred Memory Status\",
        \"icon\": \"mdi:brain\",
        \"unit_of_measurement\": \"files\",
        $(echo "$MEM_ATTRS" | /usr/bin/python3 -c "
import sys, json
d = json.load(sys.stdin)
parts = []
for k,v in d.items():
    parts.append(f'\"{k}\": {json.dumps(v)}')
print(', '.join(parts))
")
      }
    }"
  fi
fi

# ── System Stats (Mac Mini) ────────────────────────────────────
# CPU usage
CPU=$(top -l 1 -n 0 2>/dev/null | grep "CPU usage" | awk '{print 100 - $7}' | tr -d '%')
if [ -n "$CPU" ]; then
  push_sensor "sensor.mac_mini_cpu_usage" "{
    \"state\": \"$CPU\",
    \"attributes\": {
      \"friendly_name\": \"Mac Mini CPU Usage\",
      \"unit_of_measurement\": \"%\",
      \"icon\": \"mdi:cpu-64-bit\"
    }
  }"
fi

# RAM usage
RAM=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print 100 - $5}' | tr -d '%')
if [ -n "$RAM" ]; then
  push_sensor "sensor.mac_mini_ram_usage" "{
    \"state\": \"$RAM\",
    \"attributes\": {
      \"friendly_name\": \"Mac Mini RAM Usage\",
      \"unit_of_measurement\": \"%\",
      \"icon\": \"mdi:memory\"
    }
  }"
fi

# Disk usage
DISK=$(df -h / 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
if [ -n "$DISK" ]; then
  push_sensor "sensor.mac_mini_disk_usage" "{
    \"state\": \"$DISK\",
    \"attributes\": {
      \"friendly_name\": \"Mac Mini Disk Usage\",
      \"unit_of_measurement\": \"%\",
      \"icon\": \"mdi:harddisk\"
    }
  }"
fi

# ── Gateway Health ─────────────────────────────────────────────
# Check if gateway is running locally
GW_HEALTH=$(curl -s --connect-timeout 2 http://localhost:18789/api/health 2>/dev/null)
if [ -n "$GW_HEALTH" ] && echo "$GW_HEALTH" | /usr/bin/python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  GW_STATUS=$(echo "$GW_HEALTH" | /usr/bin/python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','ok'))" 2>/dev/null)
  push_sensor "sensor.alfred_gateway_health" "{
    \"state\": \"${GW_STATUS:-ok}\",
    \"attributes\": {
      \"friendly_name\": \"Alfred Gateway Health\",
      \"icon\": \"mdi:server\",
      $(echo "$GW_HEALTH" | /usr/bin/python3 -c "
import sys, json
d = json.load(sys.stdin)
parts = []
for k,v in d.items():
    parts.append(f'\"{k}\": {json.dumps(v)}')
print(', '.join(parts))
" 2>/dev/null)
    }
  }"

  # Gateway status
  GW_STATUS_RESP=$(curl -s --connect-timeout 2 http://localhost:18789/api/status 2>/dev/null)
  if [ -n "$GW_STATUS_RESP" ]; then
    push_sensor "sensor.alfred_gateway_status" "{
      \"state\": \"online\",
      \"attributes\": {
        \"friendly_name\": \"Alfred Gateway Status\",
        \"icon\": \"mdi:robot\",
        $(echo "$GW_STATUS_RESP" | /usr/bin/python3 -c "
import sys, json
d = json.load(sys.stdin)
parts = []
for k,v in d.items():
    parts.append(f'\"{k}\": {json.dumps(v)}')
print(', '.join(parts))
" 2>/dev/null)
      }
    }"
  fi
else
  # Gateway not running — push offline status
  push_sensor "sensor.alfred_gateway_health" "{
    \"state\": \"offline\",
    \"attributes\": {
      \"friendly_name\": \"Alfred Gateway Health\",
      \"icon\": \"mdi:server-off\"
    }
  }"
fi

# ── Service Binary Sensors ─────────────────────────────────────
# Gateway
if curl -s --connect-timeout 2 http://localhost:18789/api/health > /dev/null 2>&1; then
  push_sensor "binary_sensor.alfred_gateway" "{\"state\": \"on\", \"attributes\": {\"friendly_name\": \"Alfred Gateway\", \"device_class\": \"connectivity\"}}"
else
  push_sensor "binary_sensor.alfred_gateway" "{\"state\": \"off\", \"attributes\": {\"friendly_name\": \"Alfred Gateway\", \"device_class\": \"connectivity\"}}"
fi

# Ollama
if curl -s --connect-timeout 2 http://localhost:11434/api/tags > /dev/null 2>&1; then
  push_sensor "binary_sensor.alfred_ollama" "{\"state\": \"on\", \"attributes\": {\"friendly_name\": \"Alfred Ollama\", \"device_class\": \"connectivity\"}}"
else
  push_sensor "binary_sensor.alfred_ollama" "{\"state\": \"off\", \"attributes\": {\"friendly_name\": \"Alfred Ollama\", \"device_class\": \"connectivity\"}}"
fi

# Location Bridge
if curl -s --connect-timeout 2 http://localhost:18790/health > /dev/null 2>&1; then
  push_sensor "binary_sensor.alfred_location_bridge" "{\"state\": \"on\", \"attributes\": {\"friendly_name\": \"Alfred Location Bridge\", \"device_class\": \"connectivity\"}}"
else
  push_sensor "binary_sensor.alfred_location_bridge" "{\"state\": \"off\", \"attributes\": {\"friendly_name\": \"Alfred Location Bridge\", \"device_class\": \"connectivity\"}}"
fi

# Home Assistant (always reachable if this script runs and pushes work)
push_sensor "binary_sensor.alfred_ha_check" "{\"state\": \"on\", \"attributes\": {\"friendly_name\": \"Home Assistant\", \"device_class\": \"connectivity\"}}"

# Pi-hole
if ping -c 1 -W 2 192.168.1.3 > /dev/null 2>&1; then
  push_sensor "binary_sensor.alfred_pihole" "{\"state\": \"on\", \"attributes\": {\"friendly_name\": \"Pi-hole\", \"device_class\": \"connectivity\"}}"
else
  push_sensor "binary_sensor.alfred_pihole" "{\"state\": \"off\", \"attributes\": {\"friendly_name\": \"Pi-hole\", \"device_class\": \"connectivity\"}}"
fi
