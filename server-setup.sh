#!/bin/bash
set -e

# Configuration
PB_VERSION="0.22.4" # Check for latest version
DOMAIN="haugalandsved.no" # Change this to actual domain or IP if needed
EMAIL="admin@haugalandsved.no"

# Install PocketBase
echo "Installing PocketBase..."
mkdir -p /var/www/haugalandsved/pb
cd /var/www/haugalandsved/pb
wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip
unzip -o pocketbase_${PB_VERSION}_linux_amd64.zip
rm pocketbase_${PB_VERSION}_linux_amd64.zip
chmod +x pocketbase

# Create Systemd Service for PocketBase
echo "Creating PocketBase Service..."
sudo bash -c "cat > /etc/systemd/system/pocketbase.service <<EOF
[Unit]
Description = pocketbase
After = network.target

[Service]
Type             = simple
User             = deployer
Group            = deployer
LimitNOFILE      = 4096
Restart          = always
RestartSec       = 5s
WorkingDirectory = /var/www/haugalandsved/pb
ExecStart        = /var/www/haugalandsved/pb/pocketbase serve --http=127.0.0.1:8090

[Install]
WantedBy = multi-user.target
EOF"

# Create Systemd Service for SvelteKit Node App
echo "Creating SvelteKit App Service..."
sudo bash -c "cat > /etc/systemd/system/haugalandsved.service <<EOF
[Unit]
Description=Haugalandsved SvelteKit App
After=network.target

[Service]
User=deployer
Group=deployer
WorkingDirectory=/var/www/haugalandsved/web
ExecStart=/usr/bin/node build/index.js
Environment=PORT=3000
Environment=ORIGIN=http://localhost:3000
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

# Reload and Start Services
echo "Starting Services..."
sudo systemctl daemon-reload
sudo systemctl enable pocketbase haugalandsved
sudo systemctl start pocketbase
# Note: haugalandsved service will fail until code is deployed via GitHub Actions

echo "Setup Complete!"
