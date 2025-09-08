#!/bin/bash

# iScribe MeatPi Stop Script
# This script stops iScribe service on meatPi

set -e  # Exit on any error

echo "🛑 iScribe MeatPi Stop Script"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed"
    exit 1
fi

# Stop iScribe process
print_status "Stopping iScribe service..."
pm2 stop iscribe 2>/dev/null || print_warning "iScribe process not found or already stopped"

# Delete iScribe process
print_status "Removing iScribe process from PM2..."
pm2 delete iscribe 2>/dev/null || print_warning "iScribe process not found in PM2"

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Display final status
echo ""
echo "📊 PM2 Status:"
echo "=============="
pm2 status

echo ""
print_success "iScribe service stopped successfully!"
print_status "iScribe is no longer running on port 3008"
