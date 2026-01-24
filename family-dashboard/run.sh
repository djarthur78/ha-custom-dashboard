#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Family Dashboard..."

# Get the Supervisor token (automatically available with homeassistant_api: true)
SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

# Ensure nginx can write to necessary directories
bashio::log.info "Setting up permissions..."
chmod -R 755 /usr/share/nginx/html
chmod -R 755 /var/lib/nginx /var/log/nginx /run/nginx

# Create runtime config file for the React app
bashio::log.info "Creating runtime configuration..."
cat > /usr/share/nginx/html/config.js << EOF
// Runtime configuration injected by add-on
window.HA_CONFIG = {
  token: "${SUPERVISOR_TOKEN}",
  useIngress: true
};
EOF

chmod 644 /usr/share/nginx/html/config.js

bashio::log.info "Configuration created with Supervisor token"

# List files for debugging
bashio::log.info "Files in /usr/share/nginx/html:"
ls -la /usr/share/nginx/html/

# Test nginx configuration
bashio::log.info "Testing nginx configuration..."
nginx -t

# Start nginx
bashio::log.info "Starting nginx..."
exec nginx -g 'daemon off;'
