# 🥩 iScribe MeatPi Deployment Guide

This guide will help you deploy iScribe on your meatPi (Raspberry Pi) using PM2 for process management.

## 📋 Prerequisites

### System Requirements
- **Raspberry Pi** (any model with at least 1GB RAM)
- **Raspbian OS** or compatible Linux distribution
- **Node.js 16+** installed
- **FFmpeg** for audio/video processing
- **Fish.Audio API credentials**

### Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt install -y ffmpeg

# Install PM2 globally
sudo npm install -g pm2
```

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)
```bash
# Clone the repository
git clone https://github.com/obi-wan-jr/iscribe.git
cd iscribe

# Run the automated deployment script
chmod +x start-meatpi.sh
./start-meatpi.sh
```

### Option 2: Manual Deployment
```bash
# Clone the repository
git clone https://github.com/obi-wan-jr/iscribe.git
cd iscribe

# Install dependencies
npm install

# Create environment file
cp env.example .env
# Edit .env with your Fish.Audio API credentials

# Create necessary directories
mkdir -p logs output uploads uploads/images uploads/persistent_images

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## ⚙️ Configuration

### Environment Variables (.env file)
```bash
# Fish.Audio API Configuration
FISH_AUDIO_API_KEY=your_fish_audio_api_key_here
FISH_AUDIO_VOICE_MODEL_ID=your_custom_voice_model_id_here

# Server Configuration
PORT=3008

# File Storage
AUDIO_OUTPUT_DIR=./output
TEMP_AUDIO_DIR=./uploads

# Application Settings
MAX_CONCURRENT_REQUESTS=3
CHUNK_SIZE_LIMIT=4500
```

### PM2 Configuration (ecosystem.config.js)
The PM2 configuration includes:
- **Process name**: `iscribe`
- **Port**: `3008`
- **Auto-restart**: Enabled
- **Memory limit**: 1GB
- **Logging**: Configured with rotation
- **Resource monitoring**: Enabled

## 🔧 Management Commands

### PM2 Commands
```bash
# View status
pm2 status

# View logs
pm2 logs iscribe

# Restart service
pm2 restart iscribe

# Stop service
pm2 stop iscribe

# Monitor resources
pm2 monit

# Save current processes
pm2 save

# Reload configuration
pm2 reload ecosystem.config.js
```

### Service Management
```bash
# Start iScribe
pm2 start ecosystem.config.js

# Stop iScribe
pm2 stop iscribe

# Delete iScribe process
pm2 delete iscribe

# Restart iScribe
pm2 restart iscribe
```

## 🌐 Accessing iScribe

### Local Access
- **URL**: `http://localhost:3008`
- **Local network**: `http://[PI_IP_ADDRESS]:3008`

### Finding Your Pi's IP Address
```bash
# Get IP address
hostname -I

# Or use
ip addr show | grep inet
```

## 📁 Directory Structure

```
iscribe/
├── ecosystem.config.js          # PM2 configuration
├── start-meatpi.sh             # Automated deployment script
├── server.js                   # Main application
├── package.json                # Dependencies
├── .env                        # Environment variables
├── logs/                       # PM2 logs
│   ├── iscribe.log
│   ├── iscribe-out.log
│   └── iscribe-error.log
├── output/                     # Generated audio/video files
├── uploads/                    # Temporary files
│   ├── images/                 # Background images
│   └── persistent_images/      # Persistent images
└── public/                     # Web interface
```

## 🔍 Monitoring & Troubleshooting

### View Logs
```bash
# Real-time logs
pm2 logs iscribe

# Log files
tail -f logs/iscribe.log
tail -f logs/iscribe-error.log
```

### Check Status
```bash
# PM2 status
pm2 status

# System resources
pm2 monit

# Process details
pm2 show iscribe
```

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3008
sudo netstat -tlnp | grep :3008

# Kill process if needed
sudo kill -9 [PID]
```

#### 2. FFmpeg Not Found
```bash
# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
```

#### 3. Memory Issues
```bash
# Check memory usage
free -h

# Restart if needed
pm2 restart iscribe
```

#### 4. Permission Issues
```bash
# Fix permissions
sudo chown -R pi:pi /path/to/iscribe
chmod -R 755 /path/to/iscribe
```

## 🔄 Updates & Maintenance

### Updating iScribe
```bash
# Stop the service
pm2 stop iscribe

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Restart the service
pm2 start ecosystem.config.js
```

### Backup Important Data
```bash
# Backup generated files
tar -czf iscribe-backup-$(date +%Y%m%d).tar.gz output/ uploads/

# Backup configuration
cp .env .env.backup
cp ecosystem.config.js ecosystem.config.js.backup
```

## 🛡️ Security Considerations

### Firewall Configuration
```bash
# Allow port 3008 (if using UFW)
sudo ufw allow 3008

# Check firewall status
sudo ufw status
```

### Access Control
- iScribe runs on port 3008 by default
- No authentication is required (single-user application)
- Consider using a reverse proxy (nginx) for production use

## 📊 Performance Optimization

### For Raspberry Pi 3/4
- **Memory**: Ensure at least 1GB available
- **Storage**: Use fast SD card (Class 10 or better)
- **CPU**: Monitor usage during video generation

### Resource Monitoring
```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Check disk space
df -h
```

## 🆘 Support

### Getting Help
1. Check the logs: `pm2 logs iscribe`
2. Verify configuration: `pm2 show iscribe`
3. Check system resources: `pm2 monit`
4. Review this documentation

### Useful Commands Summary
```bash
# Quick status check
pm2 status && pm2 logs iscribe --lines 20

# Full restart
pm2 restart iscribe && pm2 save

# Emergency stop
pm2 stop iscribe && pm2 delete iscribe
```

---

**🎵 iScribe is now running on your meatPi!** 

Access it at: `http://[YOUR_PI_IP]:3008`
