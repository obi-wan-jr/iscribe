#!/bin/bash

# Audibible Raspberry Pi Setup Script
echo "🍓 Setting up Audibible on Raspberry Pi..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the audibible directory."
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads output

# Copy environment file
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        echo "⚙️ Creating .env file from example..."
        cp env.example .env
        echo "✅ .env file created. Please edit it with your actual credentials."
    else
        echo "⚠️ No env.example found. You'll need to create .env manually."
    fi
fi

# Make startup script executable
chmod +x start.sh

# Check FFmpeg installation
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg is installed"
else
    echo "❌ FFmpeg not found. Installing..."
    sudo apt update
    sudo apt install ffmpeg -y
fi

# Check and install image processing dependencies
echo "📸 Installing image processing dependencies..."
sudo apt install -y libvips-dev libjpeg-dev libpng-dev

# Verify image processing
if command -v vips &> /dev/null; then
    echo "✅ Image processing libraries installed"
else
    echo "⚠️ VIPS not found, but dependencies are installed"
fi

# Check Node.js installation
echo "📋 System Check:"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "FFmpeg version: $(ffmpeg -version | head -n 1)"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Fish.Audio credentials"
echo "2. Run: ./start.sh"
echo "3. Open browser to: http://your-pi-ip:3005"
echo ""
