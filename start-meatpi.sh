#!/bin/bash

# iScribe MeatPi Deployment Script
# This script sets up and starts iScribe on meatPi using PM2

set -e  # Exit on any error

echo "🎵 iScribe MeatPi Deployment Script"
echo "=================================="

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

# Check if running on meatPi (Raspberry Pi)
if [[ $(uname -m) == "arm"* ]] || [[ $(uname -m) == "aarch64" ]]; then
    print_status "Detected ARM architecture - running on meatPi"
else
    print_warning "Not running on ARM architecture - this script is designed for meatPi"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Installing PM2..."
    npm install -g pm2
    if [ $? -eq 0 ]; then
        print_success "PM2 installed successfully"
    else
        print_error "Failed to install PM2"
        exit 1
    fi
else
    print_success "PM2 is already installed"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
else
    NODE_VERSION=$(node --version)
    print_success "Node.js version: $NODE_VERSION"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p output
mkdir -p uploads
mkdir -p uploads/images
mkdir -p uploads/persistent_images

# Set proper permissions
chmod 755 logs output uploads uploads/images uploads/persistent_images

print_success "Directories created successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        print_success ".env file created from template"
        print_warning "Please edit .env file with your Fish.Audio API credentials"
    else
        print_error "env.example file not found"
        exit 1
    fi
else
    print_success ".env file found"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed"
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    print_error "FFmpeg is not installed. Installing FFmpeg..."
    sudo apt update
    sudo apt install -y ffmpeg
    if [ $? -eq 0 ]; then
        print_success "FFmpeg installed successfully"
    else
        print_error "Failed to install FFmpeg"
        exit 1
    fi
else
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    print_success "FFmpeg is installed: $FFMPEG_VERSION"
fi

# Stop existing PM2 process if running
print_status "Stopping existing iScribe process if running..."
pm2 stop iscribe 2>/dev/null || true
pm2 delete iscribe 2>/dev/null || true

# Start iScribe with PM2
print_status "Starting iScribe with PM2..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    print_success "iScribe started successfully with PM2"
else
    print_error "Failed to start iScribe with PM2"
    exit 1
fi

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup | grep -E '^sudo' | bash

print_success "PM2 startup script configured"

# Display status
echo ""
echo "🎵 iScribe Status:"
echo "=================="
pm2 status iscribe

echo ""
echo "📊 Useful Commands:"
echo "==================="
echo "View logs:        pm2 logs iscribe"
echo "Restart service:  pm2 restart iscribe"
echo "Stop service:     pm2 stop iscribe"
echo "Monitor:          pm2 monit"
echo "Status:           pm2 status"

echo ""
echo "🌐 Access iScribe:"
echo "=================="
echo "Local:  http://localhost:3008"
echo "Network: http://$(hostname -I | awk '{print $1}'):3008"

echo ""
print_success "iScribe deployment completed successfully!"
print_status "iScribe is now running on port 3008 with PM2"
