#!/bin/bash

# iScribe Frontend Production Deployment Script

set -e

echo "🚀 Starting iScribe frontend deployment..."

# Detect docker compose command (v2 or v1)
if command -v docker-compose >/dev/null 2>&1; then
    DC="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DC="docker compose"
else
    echo "❌ Error: Docker Compose not found. Please install Docker Desktop or docker-compose."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure your settings."
    exit 1
fi

# Check if tScribe backend is available
echo "🔍 Checking tScribe backend availability..."
if ! curl -s http://localhost:3003/api/health > /dev/null; then
    echo "⚠️  Warning: tScribe backend is not available on port 3003"
    echo "   iScribe frontend will start but API calls will fail until tScribe is running"
    echo "   Make sure tScribe is running on the meatPi"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
$DC down || true

# Build and start the application
echo "🔨 Building and starting iScribe frontend..."
$DC up --build -d

# Wait for the service to be healthy
echo "⏳ Waiting for service to be healthy..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if $DC ps | grep -q "healthy"; then
        echo "✅ iScribe frontend is healthy and running!"
        break
    fi
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo "❌ Service failed to become healthy within $timeout seconds"
    $DC logs
    exit 1
fi

# Show service status
echo "📊 Service Status:"
$DC ps

echo "🎉 iScribe frontend deployment completed successfully!"
echo "🌐 Frontend is available at: http://localhost:3008"
echo "🔗 Backend connection: http://localhost:3003 (tScribe)"
echo "📋 To view logs: $DC logs -f"
echo "🛑 To stop: $DC down"
