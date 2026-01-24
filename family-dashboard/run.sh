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

# Show network configuration for debugging
echo "[INFO] Network configuration:"
ip addr show || true
echo "[INFO] Hostname: $(hostname)"
echo "[INFO] Checking if port 8099 is already in use:"
netstat -tlnp | grep 8099 || echo "Port 8099 is free"

# Start nginx and monitor it
echo "[INFO] Starting nginx on port 8099..."

# Create a simple health check script
cat > /tmp/healthcheck.sh << 'HEALTHEOF'
#!/bin/sh
sleep 3

# Get container IP
CONTAINER_IP=$(ip addr show eth0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)

echo "[INFO] Testing nginx on localhost:8099..."
if wget -q -O /dev/null http://127.0.0.1:8099/; then
    echo "[INFO] ✓ Health check PASSED - nginx responding on localhost:8099"
else
    echo "[ERROR] ✗ Health check FAILED on localhost:8099"
fi

echo "[INFO] Testing nginx on container IP ($CONTAINER_IP:8099)..."
if wget -q -O /dev/null http://$CONTAINER_IP:8099/; then
    echo "[INFO] ✓ Health check PASSED - nginx responding on $CONTAINER_IP:8099"
else
    echo "[ERROR] ✗ Health check FAILED on $CONTAINER_IP:8099"
    echo "[ERROR] This is the problem! Ingress proxy needs to connect via container IP"
fi

echo "[INFO] Checking what nginx is actually listening on:"
netstat -tlnp | grep 8099
echo "[INFO] Expected: nginx should be listening on 0.0.0.0:8099 (all interfaces)"
echo "[INFO] If it shows 127.0.0.1:8099, that's the problem!"
HEALTHEOF

chmod +x /tmp/healthcheck.sh

# Run health check in background
/tmp/healthcheck.sh &

# Start nginx in foreground
exec nginx -g "daemon off;"
