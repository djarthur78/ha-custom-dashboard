#!/bin/bash

# Build script for Family Dashboard Home Assistant Add-on
# This script builds the React app and prepares it for the add-on

set -e

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
