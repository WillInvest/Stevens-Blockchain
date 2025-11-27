#!/bin/bash

# Setup nginx to proxy port 80 to the SBC frontend on port 5173

set -e

NGINX_CONF="/etc/nginx/sites-available/sbc-frontend.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/sbc-frontend.conf"
PROJECT_ROOT="/home/stevensbc/SBC-Project-Full"
SOURCE_CONF="$PROJECT_ROOT/nginx/sbc-frontend.conf"

echo "=== Setting up nginx for SBC Frontend ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script needs to be run with sudo privileges"
    echo "Usage: sudo ./setup-nginx.sh"
    exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "nginx is not installed. Installing nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Copy configuration file
echo "Copying nginx configuration to $NGINX_CONF..."
cp "$SOURCE_CONF" "$NGINX_CONF"

# Create symbolic link to enable the site
echo "Enabling nginx site..."
if [ -L "$NGINX_ENABLED" ]; then
    echo "Removing existing symlink..."
    rm "$NGINX_ENABLED"
fi
ln -s "$NGINX_CONF" "$NGINX_ENABLED"

# Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if nginx -t; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration test failed!"
    exit 1
fi

# Reload nginx
echo ""
echo "Reloading nginx..."
systemctl reload nginx

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Your web application should now be accessible on port 80"
echo "You can access it at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Note: Make sure your frontend is running on port 5173"
echo "      (Run: ./run-all.sh or ./run-dev.sh)"
echo ""
echo "To view nginx status: sudo systemctl status nginx"
echo "To view nginx logs: sudo tail -f /var/log/nginx/error.log"

