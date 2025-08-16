# 🔧 Installing Sharp on Raspberry Pi

## Current Status
✅ **Audio Transcription**: Working perfectly  
⚠️ **Video Creation**: Disabled (Sharp not installed)

## Quick Fix - Install Sharp

### Option 1: Automated Fix (Recommended)
```bash
# Run the automated fix script
chmod +x fix-sharp.sh
./fix-sharp.sh
```

### Option 2: Manual Installation
```bash
# Stop the server
pkill -f "node server.js"

# Install system dependencies
sudo apt update
sudo apt install -y \
    libvips-dev \
    libjpeg-dev \
    libpng-dev \
    libwebp-dev \
    libgif-dev \
    build-essential \
    python3-dev

# Clean install Node.js dependencies
rm -rf node_modules package-lock.json
npm cache clean --force

# Install with Sharp built from source
npm install
npm install sharp --build-from-source
```

### Option 3: Alternative Sharp Installation
```bash
# If the above fails, try pre-built binaries
npm install sharp --platform=linux --arch=arm64

# Or force a rebuild
npm rebuild sharp
```

## Test Installation

### 1. Test Sharp in Node.js
```bash
node -e "
const sharp = require('sharp');
console.log('Sharp version:', sharp.versions);
console.log('✅ Sharp working!');
"
```

### 2. Restart Audibible
```bash
./start.sh
```

### 3. Check Web Interface
- Open `http://YOUR_PI_IP:3005`
- Video section should be enabled (not grayed out)
- No warning message about Sharp

## What Each Option Does

### **System Dependencies**
- `libvips-dev`: Core image processing library
- `libjpeg-dev`: JPEG support
- `libpng-dev`: PNG support  
- `libwebp-dev`: WebP support
- `build-essential`: Compilation tools

### **Sharp Installation**
- `--build-from-source`: Compiles Sharp for your specific Pi architecture
- `--platform=linux --arch=arm64`: Uses pre-built ARM64 binary
- `npm rebuild`: Recompiles existing installation

## Common Issues & Solutions

### Issue: "gyp: No Xcode or CLT version detected"
```bash
# Install build tools
sudo apt install build-essential python3-dev
```

### Issue: "sharp: Installation failed" 
```bash
# Try with specific Python version
npm config set python python3
npm install sharp --build-from-source
```

### Issue: "libvips not found"
```bash
# Install VIPS development libraries
sudo apt install libvips-dev libvips-tools
```

### Issue: Memory errors during compilation
```bash
# Increase swap space temporarily
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Install Sharp
npm install sharp --build-from-source

# Remove swap file after installation
sudo swapoff /swapfile
sudo rm /swapfile
```

## Verification Steps

### 1. Sharp Version Check
```bash
node -e "console.log(require('sharp').versions)"
```
Should output something like:
```
{
  vips: '8.12.2',
  sharp: '0.32.6'
}
```

### 2. Image Processing Test
```bash
node -e "
const sharp = require('sharp');
sharp({
  create: {
    width: 100,
    height: 100,
    channels: 3,
    background: { r: 255, g: 0, b: 0 }
  }
})
.jpeg()
.toBuffer()
.then(() => console.log('✅ Sharp image processing works!'))
.catch(err => console.error('❌ Sharp test failed:', err));
"
```

### 3. Video Feature Test
1. Restart server: `./start.sh`
2. Open web interface
3. Try uploading an image
4. Check "Create MP4 video" option
5. Start transcription

## What Happens After Installation

### ✅ **Video Features Enabled**
- Upload background images
- Create HD MP4 videos (1920x1080)
- Professional text overlays
- YouTube-ready content

### 🎬 **Video Workflow**
1. Upload your channel artwork as background
2. Configure Bible chapter (book, chapter, version)
3. Check "Create MP4 video with background image"
4. Start transcription
5. Download both MP3 and MP4 files

### 📊 **File Outputs**
- `Genesis_1_WEB_2024-01-01.mp3` - Audio file
- `Genesis_1_WEB_VIDEO_2024-01-01.mp4` - Video file

## If Sharp Installation Keeps Failing

### Temporary Workaround
Your audio transcription works perfectly without Sharp:
- ✅ Chapter introductions
- ✅ Complete Bible processing
- ✅ All 20 Bible versions
- ✅ MP3 file generation
- ✅ File management

### Alternative: Use a Different Device
If Sharp won't install on your Pi:
1. Generate audio on Pi
2. Create videos on a more powerful machine
3. Use FFmpeg directly to combine audio + image

## Performance Notes

### **Pi 4 (4GB+)**: Usually works well with Sharp
### **Pi 3/Older**: May struggle with compilation, consider:
- Using pre-built binaries
- Increasing swap space
- Building on a faster machine

---

**Try the automated fix script first - it handles most common installation issues automatically!** 🔧

Run: `./fix-sharp.sh` then restart with `./start.sh`
