#!/bin/bash

# Family Dashboard - Deploy to PiHole Pi
# This script deploys the React dashboard to the PiHole Pi at 192.168.1.3

set -e

PIHOLE_IP="192.168.1.3"
PIHOLE_USER="pihole"
DEPLOY_DIR="/home/pihole/family-dashboard"

echo "=========================================="
echo "Family Dashboard - PiHole Pi Deployment"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "ERROR: Must run from project root directory"
    exit 1
fi

# Build the React app first
echo "Step 1: Building React application..."
cd src
npm run build
cd ..

echo "✅ React app built successfully"
echo ""

# Create deployment package
echo "Step 2: Creating deployment package..."
mkdir -p deploy-package
cp docker-compose.yml deploy-package/
cp Dockerfile.production deploy-package/
cp nginx.production.conf deploy-package/
cp docker-entrypoint.sh deploy-package/
cp .env.pihole deploy-package/.env.example

# Copy built React app
cp -r src/dist deploy-package/build

echo "✅ Deployment package created"
echo ""

# Archive the package
echo "Step 3: Creating archive..."
tar -czf family-dashboard-deploy.tar.gz -C deploy-package .

echo "✅ Archive created: family-dashboard-deploy.tar.gz"
echo ""

# Instructions for manual deployment
cat << 'EOF'
========================================
DEPLOYMENT INSTRUCTIONS
========================================

The deployment package is ready: family-dashboard-deploy.tar.gz

OPTION 1: Manual Deployment (Recommended First Time)
-----------------------------------------------------
1. Copy the archive to PiHole Pi:
   scp family-dashboard-deploy.tar.gz pihole@192.168.1.3:~/

2. SSH to PiHole Pi:
   ssh pihole@192.168.1.3

3. On PiHole Pi, run:
   mkdir -p ~/family-dashboard
   cd ~/family-dashboard
   tar -xzf ../family-dashboard-deploy.tar.gz

4. Create .env file with your HA token:
   cp .env.example .env
   nano .env
   # Add your long-lived access token

5. Check Docker is installed:
   docker --version
   docker-compose --version

   # If not installed, run:
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker pihole
   sudo apt-get install docker-compose
   # Then logout and login again

6. Start the dashboard:
   docker-compose up -d

7. Check logs:
   docker-compose logs -f

8. Access dashboard:
   http://192.168.1.3

OPTION 2: Automated Deployment (If SSH key is set up)
------------------------------------------------------
Run this script with the 'auto' parameter:
   ./deploy-to-pihole.sh auto

========================================
NEXT STEPS AFTER DEPLOYMENT
========================================

1. Test local access: http://192.168.1.3
2. Configure Cloudflare tunnel (see CLOUDFLARE-SETUP.md)
3. Test remote access: https://dashboard.99swanlane.uk

EOF

# If 'auto' parameter is passed, attempt automated deployment
if [ "$1" == "auto" ]; then
    echo ""
    echo "Attempting automated deployment..."
    echo ""

    # Check SSH connection
    if ! ssh -o BatchMode=yes -o ConnectTimeout=5 ${PIHOLE_USER}@${PIHOLE_IP} exit 2>/dev/null; then
        echo "ERROR: Cannot connect to PiHole Pi via SSH"
        echo "Please set up SSH key authentication first:"
        echo "  ssh-copy-id ${PIHOLE_USER}@${PIHOLE_IP}"
        exit 1
    fi

    echo "✅ SSH connection established"
    echo ""

    # Copy archive
    echo "Copying archive to PiHole Pi..."
    scp family-dashboard-deploy.tar.gz ${PIHOLE_USER}@${PIHOLE_IP}:~/

    # Deploy
    echo "Deploying on PiHole Pi..."
    ssh ${PIHOLE_USER}@${PIHOLE_IP} << 'ENDSSH'
        mkdir -p ~/family-dashboard
        cd ~/family-dashboard
        tar -xzf ../family-dashboard-deploy.tar.gz

        # Check if .env exists
        if [ ! -f .env ]; then
            echo "WARNING: .env file not found. Creating from example."
            echo "You MUST edit .env and add your HA token!"
            cp .env.example .env
        fi

        # Check Docker
        if ! command -v docker &> /dev/null; then
            echo "ERROR: Docker not installed on PiHole Pi"
            echo "Please install Docker first."
            exit 1
        fi

        # Stop existing container if running
        docker-compose down 2>/dev/null || true

        # Start dashboard
        docker-compose up -d

        echo ""
        echo "=========================================="
        echo "Dashboard deployed successfully!"
        echo "=========================================="
        echo ""
        echo "Access at: http://192.168.1.3"
        echo ""
        echo "View logs with:"
        echo "  ssh pihole@192.168.1.3 'cd family-dashboard && docker-compose logs -f'"
        echo ""
ENDSSH
fi

echo ""
echo "Done!"
