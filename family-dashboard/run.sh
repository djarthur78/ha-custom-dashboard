#!/bin/sh
set -e

echo "[INFO] Starting Family Dashboard..."

# Get the Supervisor token (automatically available with homeassistant_api: true)
SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

# Ensure nginx can write to necessary directories
echo "[INFO] Setting up permissions..."
chmod -R 755 /usr/share/nginx/html
chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Inject runtime config directly into index.html as inline script
echo "[INFO] Injecting runtime configuration into HTML..."
sed -i 's|<script src="./config.js"></script>|<script>window.HA_CONFIG={token:"'"${SUPERVISOR_TOKEN}"'",useIngress:true};</script>|' /usr/share/nginx/html/index.html

echo "[INFO] Configuration injected into HTML"

# List files for debugging
echo "[INFO] Files in /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/

# Test nginx configuration
echo "[INFO] Testing nginx configuration..."
nginx -t

# Check what user we're running as
echo "[INFO] Running as user: $(whoami)"
echo "[INFO] User ID: $(id)"

# Show nginx error log if it exists from previous run
if [ -f /var/log/nginx/error.log ]; then
    echo "[INFO] Previous nginx errors (if any):"
    tail -20 /var/log/nginx/error.log || true
fi

# Start nginx in foreground
echo "[INFO] Starting nginx on port 8099..."

# Run nginx in foreground
exec nginx -g "daemon off;"
