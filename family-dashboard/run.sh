#!/bin/sh
set -eu

echo "[INFO] Starting Family Dashboard read-only boundary"

READ_TOKEN=$(jq --raw-output '.read_token // ""' /data/options.json)
PUBLISHER_TOKEN=$(jq --raw-output '.publisher_token // ""' /data/options.json)
IRRIGATION_SECRET=$(jq --raw-output '.irrigation_publisher_secret // ""' /data/options.json)
ALFRED_SECRET=$(jq --raw-output '.alfred_publisher_secret // ""' /data/options.json)

if [ -z "$READ_TOKEN" ] || [ -z "$PUBLISHER_TOKEN" ] || [ -z "$IRRIGATION_SECRET" ] || [ -z "$ALFRED_SECRET" ]; then
    echo "[ERROR] Required read/publisher boundary configuration is missing"
    exit 1
fi

chmod -R 755 /usr/share/nginx/html /var/lib/nginx /var/log/nginx /run/nginx

# Browser-visible runtime configuration intentionally contains no credential.
printf '%s\n' 'window.HA_CONFIG={apiBase:"/ha-read",readOnly:true};' > /usr/share/nginx/html/config.js

sed -i "s|%%HA_READ_TOKEN%%|${READ_TOKEN}|g" /etc/nginx/nginx.conf
sed -i "s|%%HA_PUBLISH_TOKEN%%|${PUBLISHER_TOKEN}|g" /etc/nginx/nginx.conf
sed -i "s|%%IRRIGATION_PUBLISHER_SECRET%%|${IRRIGATION_SECRET}|g" /etc/nginx/nginx.conf
sed -i "s|%%ALFRED_PUBLISHER_SECRET%%|${ALFRED_SECRET}|g" /etc/nginx/nginx.conf

export HA_READ_TOKEN="$READ_TOKEN"
export HA_WS_URL="ws://supervisor/core/api/websocket"
node /read-boundary.js &

nginx -t
echo "[INFO] Boundaries configured; browser mode is read-only"
exec nginx -g "daemon off;"
