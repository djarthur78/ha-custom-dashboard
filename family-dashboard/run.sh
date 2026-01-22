#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Family Dashboard..."

# Get the Supervisor token (automatically available with homeassistant_api: true)
SUPERVISOR_TOKEN="${SUPERVISOR_TOKEN}"

# Create runtime config file for the React app
bashio::log.info "Creating runtime configuration..."
cat > /usr/share/nginx/html/config.js << EOF
// Runtime configuration injected by add-on
window.HA_CONFIG = {
  token: "${SUPERVISOR_TOKEN}",
  useIngress: true
};
EOF

bashio::log.info "Configuration created with Supervisor token"

# Start nginx
bashio::log.info "Starting nginx..."
exec nginx -g 'daemon off;'
