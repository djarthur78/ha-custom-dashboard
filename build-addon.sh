#!/bin/bash

# Build script for Family Dashboard Home Assistant Add-on
# This script builds the React app and prepares it for the add-on

set -e

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE="sed -i ''"
else
  SED_INPLACE="sed -i"
fi

echo "🏗️  Building Family Dashboard Add-on..."

# Step 1: Build the React app
echo "📦 Building React app..."
cd src
npm run build
cd ..

# Step 2: Copy build to family-dashboard directory
echo "📋 Copying build to family-dashboard directory..."
rm -rf family-dashboard/build
cp -r src/dist family-dashboard/build

# Step 3: Inject config.js script into index.html
echo "🔧 Injecting runtime config loader..."
$SED_INPLACE 's|<head>|<head>\n    <script src="./config.js"></script>|' family-dashboard/build/index.html
$SED_INPLACE 's|<head>|<head>\n    <script src="./config.js"></script>|' family-dashboard/build/mobile.html

# Step 3: Update version in config.json (optional)
VERSION=$(date +%Y.%m.%d)
echo "📝 Version: $VERSION"

echo ""
echo "✅ Add-on build complete!"
echo ""
echo "Next steps:"
echo "1. Copy the 'addon' folder to your Home Assistant at: /config/addons/family-dashboard/"
echo "2. In HA: Settings → Add-ons → ⋮ menu → Check for updates"
echo "3. Install and start the 'Family Dashboard' add-on"
echo ""
echo "Or push to GitHub and add as a repository in Home Assistant."
