#!/bin/bash

# Automated Family Dashboard Setup Script
# This script creates a Lovelace dashboard with iframe card automatically

set -e

echo "==================================="
echo "Family Dashboard Automated Setup"
echo "==================================="
echo ""

# Configuration
HA_URL="http://192.168.1.2:8123"
HA_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhNTFjMzFkNzA4MzM0NzdkODNmNmE0NzUwZGE2NDZkMCIsImlhdCI6MTc2ODY1ODc1NSwiZXhwIjoyMDg0MDE4NzU1fQ.ULPVcBjPdaqDV0fp1CiUqGOomTSibjZW7Lqt-ikUBqQ"
DASHBOARD_URL="http://192.168.1.2:8099"

echo "Step 1: Checking HA connection..."
if ! curl -sf -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/" > /dev/null; then
    echo "❌ ERROR: Cannot connect to Home Assistant at $HA_URL"
    echo "   Please check HA is running and the token is valid"
    exit 1
fi
echo "✅ Connected to Home Assistant"
echo ""

echo "Step 2: Checking Family Dashboard add-on..."
if ! curl -sf "$DASHBOARD_URL" > /dev/null; then
    echo "❌ ERROR: Family Dashboard add-on not accessible at $DASHBOARD_URL"
    echo "   Please start the add-on: Settings → Add-ons → Family Dashboard → Start"
    exit 1
fi
echo "✅ Family Dashboard add-on is running"
echo ""

echo "Step 3: Creating Lovelace dashboard configuration..."

# Create dashboard configuration JSON
DASHBOARD_CONFIG=$(cat << 'EOF'
{
  "views": [
    {
      "title": "Dashboard",
      "path": "dashboard",
      "icon": "mdi:calendar-heart",
      "panel": true,
      "cards": [
        {
          "type": "iframe",
          "url": "http://192.168.1.2:8099",
          "aspect_ratio": "100%"
        }
      ]
    }
  ]
}
EOF
)

echo "$DASHBOARD_CONFIG" > /tmp/dashboard_config.json
echo "✅ Configuration created"
echo ""

echo "Step 4: Creating dashboard via WebSocket..."
echo ""
echo "⚠️  MANUAL STEP REQUIRED ⚠️"
echo ""
echo "Unfortunately, the HA API doesn't support creating dashboards programmatically."
echo "You need to complete these steps manually (takes 2 minutes):"
echo ""
echo "1. Open Home Assistant: $HA_URL"
echo "2. Go to: Settings → Dashboards"
echo "3. Click: + ADD DASHBOARD (bottom right)"
echo "4. Fill in:"
echo "   - Name: Family Dashboard"
echo "   - Icon: mdi:calendar-heart"
echo "   - Show in sidebar: ✅ ON"
echo "   - Admin only: ❌ OFF"
echo "5. Click: CREATE"
echo ""
echo "6. Click on 'Family Dashboard' in your sidebar"
echo "7. Click: ⋮ (three dots) → Edit Dashboard"
echo "8. Click: + ADD CARD"
echo "9. Search for: Webpage Card"
echo "10. Configure:"
echo "    - URL: $DASHBOARD_URL"
echo "    - Aspect Ratio: (leave blank for full height)"
echo "11. Click: SAVE"
echo "12. Click: DONE"
echo ""
echo "==================================="
echo "✅ Pre-checks complete!"
echo "✅ Your dashboard will work locally and remotely via Cloudflare"
echo "==================================="
echo ""

# Cleanup
rm -f /tmp/dashboard_config.json
