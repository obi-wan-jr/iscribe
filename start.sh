#!/bin/bash

# Audibible Startup Script
# This script starts the Audibible server with proper environment setup

echo "🎵 Starting Audibible Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js version 16 or higher"
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  Warning: FFmpeg is not installed"
    echo "Audio processing will not work without FFmpeg"
    echo "Install FFmpeg using:"
    echo "  - Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  - macOS: brew install ffmpeg"
    echo "  - Windows: Download from https://ffmpeg.org"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create necessary directories
mkdir -p uploads output

# Set default environment variables if not set
export PORT=${PORT:-3005}
export AUDIO_OUTPUT_DIR=${AUDIO_OUTPUT_DIR:-./output}
export TEMP_AUDIO_DIR=${TEMP_AUDIO_DIR:-./uploads}
export CHUNK_SIZE_LIMIT=${CHUNK_SIZE_LIMIT:-4500}

echo "🚀 Starting server on port $PORT..."
echo "📁 Audio output: $AUDIO_OUTPUT_DIR"
echo "📂 Temp directory: $TEMP_AUDIO_DIR"
echo ""
echo "Open your browser to: http://localhost:$PORT"
echo "Or from other devices: http://YOUR_PI_IP:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"

# Start the server
npm start
