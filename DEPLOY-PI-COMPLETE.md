# 🍓 Complete Raspberry Pi Deployment Guide

## Quick Deployment Overview

1. **Transfer code** from Windows to Pi
2. **Install dependencies** (Node.js, FFmpeg)
3. **Configure credentials** 
4. **Start the application**

---

## 📁 Step 1: Transfer Code to Your Pi

### Option A: SCP Transfer (Recommended)
From your Windows PowerShell/Command Prompt:

```powershell
# Replace YOUR_PI_IP with your Pi's actual IP address
scp -r M:\audibible pi@YOUR_PI_IP:/home/pi/

# Example: scp -r M:\audibible pi@192.168.1.100:/home/pi/
```

### Option B: USB Drive Transfer
1. Copy the entire `M:\audibible` folder to a USB drive
2. Insert USB into Pi
3. Copy from USB to Pi:
```bash
sudo mount /dev/sda1 /mnt
cp -r /mnt/audibible /home/pi/
sudo umount /mnt
```

### Option C: GitHub/Git Transfer
If you have the code in a Git repository:
```bash
cd /home/pi
git clone YOUR_REPOSITORY_URL
cd audibible
```

---

## 🔧 Step 2: SSH into Your Pi and Setup

SSH into your Raspberry Pi:
```bash
ssh pi@YOUR_PI_IP
```

Then run these commands:

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js (Latest LTS)
```bash
# Install Node.js from NodeSource
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install FFmpeg and Image Processing Libraries
```bash
# Install FFmpeg for audio/video processing
sudo apt install ffmpeg -y

# Install additional libraries for Sharp (image processing)
sudo apt install libvips-dev -y

# Verify installations
ffmpeg -version
vips --version
```

---

## ⚙️ Step 3: Configure Audibible

Navigate to your project:
```bash
cd /home/pi/audibible
```

### Make setup script executable and run it:
```bash
chmod +x setup-pi.sh
./setup-pi.sh
```

This script will:
- Install Node.js dependencies
- Create necessary directories
- Set up environment file
- Verify system requirements

### Configure your Fish.Audio credentials:
```bash
nano .env
```

Edit the file with your actual credentials:
```env
FISH_AUDIO_API_KEY=yo5147a845f325472fa3539dcf24406ccf
FISH_AUDIO_VOICE_MODEL_ID=you2939fcf1e9224fe9ac0839f1e2b26c50
PORT=3005
AUDIO_OUTPUT_DIR=./output
TEMP_AUDIO_DIR=./uploads
```

Save and exit (Ctrl+X, Y, Enter)

---

## 🚀 Step 4: Start Audibible

### Start the application:
```bash
./start.sh
```

Or manually:
```bash
npm start
```

You should see:
```
🎵 Audibible server running on http://localhost:3005
📁 Audio output directory: ./output
🔧 Fish.Audio configured: true
```

---

## 🌐 Step 5: Access Your Application

### Find your Pi's IP address:
```bash
hostname -I
```

### Access Audibible:
- **From Pi browser**: `http://localhost:3005`
- **From other devices**: `http://YOUR_PI_IP:3005`
- **Example**: `http://192.168.1.100:3005`

---

## 🔄 Step 6: Run as a Service (Optional but Recommended)

To make Audibible start automatically on boot:

### Create systemd service:
```bash
sudo nano /etc/systemd/system/audibible.service
```

### Add this content:
```ini
[Unit]
Description=Audibible Bible Audio Transcription
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/audibible
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Enable and start the service:
```bash
sudo systemctl enable audibible
sudo systemctl start audibible
sudo systemctl status audibible
```

### Service management commands:
```bash
# Check status
sudo systemctl status audibible

# Stop service
sudo systemctl stop audibible

# Start service
sudo systemctl start audibible

# Restart service
sudo systemctl restart audibible

# View logs
sudo journalctl -u audibible -f
```

---

## 🔥 Step 7: Test Your Installation

### 1. Open browser to your Pi IP:
```
http://YOUR_PI_IP:3005
```

### 2. Configure Fish.Audio credentials in the web interface

### 3. Test with a short chapter:
- Book: **Jude** (only 1 chapter, very short)
- Chapter: **1**
- Version: **WEB** (World English Bible)
- Sentences per part: **5**

### 4. Expected result:
- Audio starts with: "Jude, Chapter 1."
- Followed by complete chapter content
- Download link appears when complete

### 5. Test Video Creation (Optional):
- Upload a background image (any JPEG/PNG)
- Check "Create MP4 video with background image"  
- Same settings as above
- Should create both MP3 and MP4 files

---

## 🛠️ Troubleshooting

### Common Issues:

**"Command not found" errors:**
```bash
# Reload shell profile
source ~/.bashrc
# Or check if Node.js is in PATH
which node
which npm
```

**Permission errors:**
```bash
# Fix ownership
sudo chown -R pi:pi /home/pi/audibible
chmod +x start.sh setup-pi.sh
```

**Port already in use:**
```bash
# Check what's using port 3005
sudo netstat -tulpn | grep 3005
# Kill process if needed
sudo kill -9 PROCESS_ID
```

**FFmpeg not found:**
```bash
# Reinstall FFmpeg
sudo apt update
sudo apt install ffmpeg -y
```

**Sharp/Image processing errors:**
```bash
# Install image processing dependencies
sudo apt install libvips-dev libjpeg-dev libpng-dev -y
# Rebuild Sharp
cd /home/pi/audibible
npm rebuild sharp
```

**Fish.Audio API errors:**
- Verify your API key and voice model ID are correct
- Check internet connection
- Test credentials in the web interface

### Check logs:
```bash
# If running manually
cd /home/pi/audibible
npm start

# If running as service
sudo journalctl -u audibible -f
```

---

## 📊 Performance Tips for Pi

### Monitor resources during transcription:
```bash
htop
```

### For better performance:
1. **Use Class 10 SD card** or better
2. **Enable GPU memory split** (optional):
   ```bash
   sudo raspi-config
   # Advanced Options > Memory Split > 64
   ```
3. **Keep Pi cool** - ensure good ventilation
4. **Close unnecessary programs** during transcription

---

## 🔒 Security Notes

### Change default Pi password:
```bash
sudo passwd pi
```

### Basic firewall (optional):
```bash
sudo ufw enable
sudo ufw allow 3005
sudo ufw allow ssh
```

---

## 🎉 You're Ready!

Once deployed, your Audibible server will:
- ✅ Create seamless Bible audio with chapter introductions
- ✅ Support WEB and 19 other Bible versions  
- ✅ Process complete chapters in manageable parts
- ✅ Generate MP4 videos with background images
- ✅ Provide file management interface for audio and video
- ✅ Run automatically on Pi startup (if service is enabled)

**Access your application at: `http://YOUR_PI_IP:3005`**

Start creating professional Bible audio for your YouTube content! 🎵📖
