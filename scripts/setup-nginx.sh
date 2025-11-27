#!/bin/bash

# Setup nginx to proxy port 80 to the SBC frontend on port 5173

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Project root is the parent directory of scripts/
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_CONF="$PROJECT_ROOT/infrastructure/nginx/sbc-frontend.conf"

NGINX_CONF="/etc/nginx/sites-available/sbc-frontend.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/sbc-frontend.conf"

echo "=== Setting up nginx for SBC Frontend ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "This script needs to be run with sudo privileges"
    echo "Usage: sudo ./scripts/setup-nginx.sh"
    exit 1
fi

# Check if nginx config source exists
if [ ! -f "$SOURCE_CONF" ]; then
    echo "ERROR: Nginx configuration file not found at: $SOURCE_CONF"
    echo "Please ensure the file exists in infrastructure/nginx/"
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
echo "      (Run: ./scripts/run-with-pm2.sh)"
echo ""
echo "To view nginx status: sudo systemctl status nginx"
echo "To view nginx logs: sudo tail -f /var/log/nginx/error.log"
