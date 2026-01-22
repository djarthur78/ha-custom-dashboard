#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Family Dashboard..."

# Start nginx
bashio::log.info "Starting nginx..."
exec nginx -g 'daemon off;'
