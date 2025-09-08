#!/bin/bash

# iScribe Docker Stop Script for MeatPi
# This script stops iScribe Docker container on meatPi

set -e  # Exit on any error

echo "🛑 iScribe Docker Stop Script for MeatPi"
echo "========================================"

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Stop and remove iScribe containers
print_status "Stopping iScribe Docker containers..."
docker-compose down 2>/dev/null || print_warning "No docker-compose containers found"

# Remove standalone iScribe container if exists
print_status "Removing standalone iScribe container..."
docker stop iscribe 2>/dev/null || print_warning "iScribe container not found"
docker rm iscribe 2>/dev/null || print_warning "iScribe container not found"

# Remove iScribe Docker image
print_status "Removing iScribe Docker image..."
docker rmi iscribe_iscribe 2>/dev/null || print_warning "iScribe Docker image not found"

# Clean up unused Docker resources
print_status "Cleaning up unused Docker resources..."
docker system prune -f

# Display final status
echo ""
echo "📊 Docker Status:"
echo "================="
docker ps -a | grep iscribe || echo "No iScribe containers found"

echo ""
print_success "iScribe Docker deployment stopped successfully!"
print_status "iScribe is no longer running on port 3008"
