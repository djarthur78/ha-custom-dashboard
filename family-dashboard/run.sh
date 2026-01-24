#!/bin/sh
set -e

echo "[INFO] Starting Family Dashboard..."

# Get the Supervisor token (automatically available with homeassistant_api: true)
SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

# Ensure nginx can write to necessary directories
echo "[INFO] Setting up permissions..."
chmod -R 755 /usr/share/nginx/html
chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Create runtime config file for the React app
echo "[INFO] Creating runtime configuration..."
cat > /usr/share/nginx/html/config.js << EOF
// Runtime configuration injected by add-on
window.HA_CONFIG = {
  token: "${SUPERVISOR_TOKEN}",
  useIngress: true
};
EOF

chmod 644 /usr/share/nginx/html/config.js

echo "[INFO] Configuration created with Supervisor token"

# Inject CSP meta tag into index.html to allow eval
echo "[INFO] Injecting CSP meta tag into index.html..."
sed -i '/<meta name="viewport"/a\    <meta http-equiv="Content-Security-Policy" content="default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-eval'\'' '\''unsafe-inline'\''; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https: blob:; font-src '\''self'\'' data:; connect-src '\''self'\'' http://supervisor/core/api/websocket ws://supervisor/core/api/websocket;">' /usr/share/nginx/html/index.html

echo "[INFO] CSP meta tag injected"

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
