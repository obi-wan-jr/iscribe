# 🔧 FFmpeg MP3 Codec Fix

## The Issue
The error `Audio codec mp3 is not available` means your FFmpeg installation doesn't include MP3 encoding support.

## Quick Fix for Raspberry Pi

### 1. SSH into your Pi and run:
```bash
# Uninstall current FFmpeg
sudo apt remove ffmpeg -y

# Update package list
sudo apt update

# Install FFmpeg with full codec support
sudo apt install ffmpeg -y

# Alternative if above doesn't work:
# sudo apt install ffmpeg-full -y
```

### 2. Verify MP3 support:
```bash
ffmpeg -codecs | grep mp3
```

You should see lines like:
```
 DEA.L. mp3                  MP3 (MPEG audio layer 3)
 D.A.L. mp3float             MP3 (MPEG audio layer 3)
```

### 3. Test the diagnostic tool:
```bash
cd /home/pi/audibible
node diagnose-ffmpeg.js
```

This will check if MP3 encoding is working.

## If Standard Installation Doesn't Work

### Option 1: Try Different Package
```bash
sudo apt install libavcodec-extra -y
sudo apt install ffmpeg -y
```

### Option 2: Install from Snap (if available)
```bash
sudo snap install ffmpeg
```

### Option 3: Compile from Source (last resort)
```bash
# Install build dependencies
sudo apt install build-essential yasm cmake libtool libc6 libc6-dev unzip wget libnuma1 libnuma-dev -y

# Download and compile FFmpeg with libmp3lame
wget https://ffmpeg.org/releases/ffmpeg-4.4.tar.bz2
tar -xjf ffmpeg-4.4.tar.bz2
cd ffmpeg-4.4

# Configure with MP3 support
./configure --enable-libmp3lame --enable-shared --disable-static
make -j4
sudo make install

# Update library path
sudo ldconfig
```

## Updated Application Code

I've already updated your Audibible code with:

1. **Better codec handling**: Uses `libmp3lame` instead of `mp3`
2. **Fallback method**: If complex audio merging fails, it tries a simpler approach
3. **Better error handling**: More detailed error messages
4. **Diagnostic tool**: `diagnose-ffmpeg.js` to check your setup

## Test After Fix

1. **Restart your Audibible server**:
   ```bash
   cd /home/pi/audibible
   npm start
   ```
   
   You should see: `🎵 Audibible server running on http://localhost:3005`

2. **Try a simple transcription**:
   - Book: **Jude** (very short)
   - Chapter: **1**
   - Version: **WEB**
   - Sentences per part: **5**

3. **Check the logs** for any remaining errors

## Diagnostic Commands

```bash
# Check FFmpeg version and build info
ffmpeg -version

# List available codecs
ffmpeg -codecs | grep -E "(mp3|lame)"

# Test MP3 encoding
ffmpeg -f lavfi -i anullsrc=channel_layout=mono:sample_rate=22050 -t 1 -c:a libmp3lame test.mp3

# Run Audibible FFmpeg diagnostic
node diagnose-ffmpeg.js
```

## If You're Still Having Issues

1. **Check the exact error message** in your Audibible logs
2. **Run the diagnostic tool**: `node diagnose-ffmpeg.js`
3. **Try a different audio format** (we can modify the code to use WAV instead of MP3 temporarily)

The updated code should now work with most FFmpeg installations! 🎵
