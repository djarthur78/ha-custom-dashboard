#!/bin/sh
set -e

echo "Starting Family Dashboard..."
echo "HA URL: ${HA_URL:-not set}"
echo "HA Token: ${HA_TOKEN:+configured}"

# Create runtime config file with environment variables
cat > /usr/share/nginx/html/config.js << EOF
window.HA_CONFIG = {
  url: "${HA_URL}",
  token: "${HA_TOKEN}",
  useIngress: false
};
console.log('[Dashboard] Runtime config loaded:', { url: window.HA_CONFIG.url, hasToken: !!window.HA_CONFIG.token });
EOF

echo "Runtime configuration created"
echo "Starting nginx..."

# Execute the CMD (nginx)
exec "$@"
