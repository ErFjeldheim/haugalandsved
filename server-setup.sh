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
ExecStart        = /var/www/haugalandsved/pb/pocketbase serve --http=127.0.0.1:8091

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
Environment=PORT=3001
Environment=ORIGIN=http://localhost:3001
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

# Apache Configuration
echo "Configuring Apache..."
sudo a2enmod proxy proxy_http rewrite headers

sudo bash -c "cat > /etc/apache2/sites-available/haugalandsved.conf <<EOF
<VirtualHost *:80>
    ServerName haugalandsved.no
    ServerAdmin $EMAIL

    # PocketBase API and Admin
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:8091/api/
    ProxyPassReverse /api/ http://127.0.0.1:8091/api/
    
    ProxyPass /_/ http://127.0.0.1:8091/_/
    ProxyPassReverse /_/ http://127.0.0.1:8091/_/

    # SvelteKit App
    ProxyPass / http://127.0.0.1:3001/
    ProxyPassReverse / http://127.0.0.1:3001/

    ErrorLog \${APACHE_LOG_DIR}/haugalandsved_error.log
    CustomLog \${APACHE_LOG_DIR}/haugalandsved_access.log combined
</VirtualHost>
EOF"

sudo a2dissite 000-default.conf || true
sudo a2ensite haugalandsved.conf
sudo systemctl reload apache2

echo "Setup Complete! Domain $DOMAIN is now served via Apache."
