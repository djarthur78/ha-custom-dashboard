#!/bin/bash

# deploy.sh — Build, bump version, commit, push, and print HA deploy command
# Usage:
#   ./deploy.sh              # Auto-bump patch version (2.0.3 → 2.0.4)
#   ./deploy.sh 2.1.0        # Set specific version
#   ./deploy.sh --dry-run    # Show what would happen without doing it

set -e

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE="sed -i ''"
else
  SED_INPLACE="sed -i"
fi

ADDON_DIR="family-dashboard"
CONFIG="$ADDON_DIR/config.json"
HA_URL="http://192.168.1.2:8123"
ADDON_SLUG="c2ba14e6_family-dashboard"
DASHBOARD_URL="http://192.168.1.2:8099"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DRY_RUN=false
NEW_VERSION=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      ;;
    *)
      NEW_VERSION="$arg"
      ;;
  esac
done

# Get current version from config.json
CURRENT_VERSION=$(grep '"version"' "$CONFIG" | sed 's/.*"\([0-9.]*\)".*/\1/')
echo -e "${CYAN}Current version:${NC} $CURRENT_VERSION"

# Calculate new version (auto-bump patch if not specified)
if [ -z "$NEW_VERSION" ]; then
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
  PATCH=$((PATCH + 1))
  NEW_VERSION="$MAJOR.$MINOR.$PATCH"
fi

echo -e "${CYAN}New version:${NC}     $NEW_VERSION"
echo ""

if $DRY_RUN; then
  echo -e "${YELLOW}[DRY RUN] Would perform the following:${NC}"
  echo "  1. Run tests (cd src && npx vitest run)"
  echo "  2. Build React app (cd src && npm run build)"
  echo "  3. Copy build to $ADDON_DIR/build/"
  echo "  4. Inject config.js into index.html"
  echo "  5. Bump version $CURRENT_VERSION → $NEW_VERSION in $CONFIG"
  echo "  6. Git add, commit, push"
  echo ""
  exit 0
fi

# Step 1: Run tests
echo -e "${CYAN}[1/7]${NC} Running tests..."
cd src
npx vitest run
cd ..
echo -e "${GREEN}  Tests passed.${NC}"
echo ""

# Step 2: Build React app
echo -e "${CYAN}[2/7]${NC} Building React app..."
cd src
npm run build 2>&1 | tail -5
cd ..
echo -e "${GREEN}  Build complete.${NC}"
echo ""

# Step 3: Copy build to add-on
echo -e "${CYAN}[3/7]${NC} Copying build to $ADDON_DIR/build/..."
rm -rf "$ADDON_DIR/build"
cp -r src/dist "$ADDON_DIR/build"
echo -e "${GREEN}  Copied.${NC}"
echo ""

# Step 4: Inject config.js
echo -e "${CYAN}[4/7]${NC} Injecting runtime config loader..."
if ! grep -q 'config.js' "$ADDON_DIR/build/index.html"; then
  $SED_INPLACE 's|<head>|<head>\n    <script src="./config.js"></script>|' "$ADDON_DIR/build/index.html"
  echo -e "${GREEN}  Injected.${NC}"
else
  echo -e "${YELLOW}  Already present, skipped.${NC}"
fi
echo ""

# Step 5: Bump version
echo -e "${CYAN}[5/7]${NC} Bumping version $CURRENT_VERSION → $NEW_VERSION..."
$SED_INPLACE "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$CONFIG"
echo -e "${GREEN}  Version updated.${NC}"
echo ""

# Step 6: Git commit
echo -e "${CYAN}[6/7]${NC} Committing changes..."
git add "$ADDON_DIR/build/" "$ADDON_DIR/config.json"
# Also add any staged source changes
git add -u
git status --short
echo ""
git commit -m "Build add-on v$NEW_VERSION for deployment"
echo -e "${GREEN}  Committed.${NC}"
echo ""

# Step 7: Git push
echo -e "${CYAN}[7/7]${NC} Pushing to origin..."
git push
echo -e "${GREEN}  Pushed.${NC}"
echo ""

# Done — print HA deployment instructions
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Build v$NEW_VERSION pushed to GitHub${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${YELLOW}To deploy on Home Assistant:${NC}"
echo ""
echo "  Option A — HA UI:"
echo "    1. Go to $HA_URL → Settings → Add-ons"
echo "    2. Click Family Dashboard → Update"
echo ""
echo "  Option B — HA Terminal / SSH:"
echo "    ha addons update $ADDON_SLUG"
echo ""
echo "  Option C — HA REST API (curl):"
echo "    curl -s -X POST \\"
echo "      -H 'Authorization: Bearer \$HA_TOKEN' \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      '$HA_URL/api/hassio/addons/$ADDON_SLUG/update'"
echo ""
echo -e "${CYAN}After deploying, verify at:${NC} $DASHBOARD_URL"
echo ""
