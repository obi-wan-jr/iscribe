#!/bin/bash

# Fix Sharp Installation on Raspberry Pi
echo "🔧 Fixing Sharp installation on Raspberry Pi..."

# Stop any running server
echo "Stopping any running servers..."
pkill -f "node server.js" 2>/dev/null || true

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install required system dependencies for Sharp
echo "📸 Installing image processing system dependencies..."
sudo apt install -y \
    libvips-dev \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libgif-dev \
    librsvg2-dev \
    libgsf-1-dev \
    build-essential \
    python3 \
    python3-dev

# Remove existing node_modules to force clean install
echo "🧹 Cleaning existing node_modules..."
rm -rf node_modules package-lock.json

# Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Install dependencies with specific Sharp configuration for Pi
echo "📦 Installing dependencies with Pi-specific Sharp build..."
npm install

# If Sharp still fails, try platform-specific installation
if ! node -e "require('sharp')" 2>/dev/null; then
    echo "⚠️ Standard Sharp install failed, trying platform-specific install..."
    
    # Remove Sharp specifically
    npm uninstall sharp
    
    # Install Sharp with platform-specific binary
    npm install sharp --platform=linux --arch=arm64
    
    # If that fails, try building from source
    if ! node -e "require('sharp')" 2>/dev/null; then
        echo "🔨 Building Sharp from source..."
        npm install sharp --build-from-source
    fi
fi

# Verify Sharp installation
echo "🧪 Testing Sharp installation..."
if node -e "const sharp = require('sharp'); console.log('Sharp version:', sharp.versions);" 2>/dev/null; then
    echo "✅ Sharp installed successfully!"
else
    echo "❌ Sharp installation failed. Trying alternative approach..."
    
    # Last resort: install without video features
    echo "🔄 Installing without video processing temporarily..."
    npm uninstall sharp
    
    echo "📝 Creating temporary Sharp stub..."
    mkdir -p node_modules/sharp
    cat > node_modules/sharp/index.js << 'EOF'
// Temporary Sharp stub for systems without native support
module.exports = function() {
    throw new Error('Sharp/Video processing not available on this system. Audio-only mode.');
};
module.exports.versions = { sharp: 'stub' };
EOF
    
    echo "⚠️ Video processing disabled. Audio transcription will work normally."
    echo "To enable video features later, run: npm install sharp --build-from-source"
fi

echo ""
echo "🎉 Setup complete! Try starting the server again:"
echo "   ./start.sh"
echo ""
