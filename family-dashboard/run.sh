#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Family Dashboard..."

# Get configuration from add-on options
HA_TOKEN=$(bashio::config 'ha_token')

# Create runtime config file for the React app
bashio::log.info "Creating runtime configuration..."
cat > /usr/share/nginx/html/config.js << EOF
// Runtime configuration injected by add-on
window.HA_CONFIG = {
  token: "${HA_TOKEN}",
  useIngress: true
};
EOF

# Start nginx
bashio::log.info "Starting nginx..."
exec nginx -g 'daemon off;'
