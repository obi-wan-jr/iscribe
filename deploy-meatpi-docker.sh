#!/bin/bash

# iScribe Docker Deployment Script for MeatPi
# This script deploys iScribe using Docker on meatPi

set -e  # Exit on any error

echo "🐳 iScribe Docker Deployment for MeatPi"
echo "======================================="

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Installing Docker..."
    
    # Install Docker on Raspberry Pi
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
    print_warning "Please log out and log back in for Docker group changes to take effect"
    print_warning "Then run this script again"
    exit 1
else
    DOCKER_VERSION=$(docker --version)
    print_success "Docker is installed: $DOCKER_VERSION"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Installing Docker Compose..."
    
    # Install Docker Compose
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    
    print_success "Docker Compose installed successfully"
else
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose is installed: $COMPOSE_VERSION"
fi

# Stop and remove existing iScribe containers
print_status "Stopping and removing existing iScribe containers..."
docker-compose down 2>/dev/null || true
docker stop iscribe 2>/dev/null || true
docker rm iscribe 2>/dev/null || true

# Remove existing iScribe image
print_status "Removing existing iScribe Docker image..."
docker rmi iscribe_iscribe 2>/dev/null || true

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs output uploads uploads/images uploads/persistent_images

# Set proper permissions
sudo chown -R $USER:$USER logs output uploads

print_success "Directories created successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        print_success ".env file created from template"
        print_warning "Please edit .env file with your Fish.Audio API credentials"
        print_warning "Required variables: FISH_AUDIO_API_KEY and FISH_AUDIO_VOICE_MODEL_ID"
    else
        print_error "env.example file not found"
        exit 1
    fi
else
    print_success ".env file found"
fi

# Check if required environment variables are set
if ! grep -q "FISH_AUDIO_API_KEY=your_fish_audio_api_key_here" .env; then
    print_success "Fish.Audio API key appears to be configured"
else
    print_warning "Please configure your Fish.Audio API credentials in .env file"
fi

# Build and start the Docker container
print_status "Building iScribe Docker image..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Start the container
print_status "Starting iScribe container..."
docker-compose up -d

if [ $? -eq 0 ]; then
    print_success "iScribe container started successfully"
else
    print_error "Failed to start iScribe container"
    exit 1
fi

# Wait for container to be ready
print_status "Waiting for iScribe to be ready..."
sleep 10

# Check container status
print_status "Checking container status..."
docker-compose ps

# Check if container is healthy
print_status "Checking container health..."
for i in {1..30}; do
    if docker-compose exec -T iscribe node -e "require('http').get('http://localhost:3008/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" 2>/dev/null; then
        print_success "iScribe is healthy and ready!"
        break
    else
        print_status "Waiting for iScribe to be ready... ($i/30)"
        sleep 2
    fi
done

# Display logs
echo ""
echo "📊 Container Logs (last 20 lines):"
echo "=================================="
docker-compose logs --tail=20 iscribe

echo ""
echo "🎵 iScribe Docker Deployment Complete!"
echo "====================================="
echo "Container Status:"
docker-compose ps

echo ""
echo "📊 Useful Commands:"
echo "==================="
echo "View logs:        docker-compose logs -f iscribe"
echo "Restart service:  docker-compose restart iscribe"
echo "Stop service:     docker-compose down"
echo "Update service:   docker-compose pull && docker-compose up -d"
echo "Shell access:     docker-compose exec iscribe sh"

echo ""
echo "🌐 Access iScribe:"
echo "=================="
echo "Local:  http://localhost:3008"
echo "Network: http://$(hostname -I | awk '{print $1}'):3008"

echo ""
print_success "iScribe is now running in Docker on port 3008!"
print_status "Container will automatically restart on system reboot"
