# 🍓 Raspberry Pi Deployment Guide

## Quick Setup Commands

### 1. Prepare Your Pi
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install FFmpeg
```bash
sudo apt install ffmpeg -y
```

### 4. Transfer Code to Pi
From your Windows machine to Pi:
```bash
scp -r M:\audibible pi@YOUR_PI_IP:/home/pi/
```

### 5. Setup on Pi
```bash
cd /home/pi/audibible
chmod +x setup-pi.sh
./setup-pi.sh
```

### 6. Configure Credentials
```bash
nano .env
```
Edit the file with your actual Fish.Audio credentials:
```env
FISH_AUDIO_API_KEY=yo5147a845f325472fa3539dcf24406ccf
FISH_AUDIO_VOICE_MODEL_ID=you2939fcf1e9224fe9ac0839f1e2b26c50
PORT=3005
```

### 7. Start the Application
```bash
./start.sh
```

## Access Your Application

- **Local access**: `http://localhost:3005`
- **Network access**: `http://YOUR_PI_IP:3005`
- **Find your Pi IP**: `hostname -I`

## Running as a Service (Optional)

To run Audibible automatically on boot:

### Create systemd service:
```bash
sudo nano /etc/systemd/system/audibible.service
```

Add this content:
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

## Firewall Configuration

If you have a firewall enabled, allow port 3005:
```bash
sudo ufw allow 3005
```

## Performance Tips for Pi

1. **Use SD Card Class 10** or better for faster I/O
2. **Enable GPU memory split** if needed: `sudo raspi-config` → Advanced → Memory Split → 64
3. **Monitor resources** during transcription: `htop`
4. **Consider external storage** for audio files if generating many

## Troubleshooting

### Check logs:
```bash
# If running manually
npm start

# If running as service
sudo journalctl -u audibible -f
```

### Common issues:
- **Port already in use**: Change PORT in .env file
- **Permission errors**: Make sure pi user owns the files: `sudo chown -R pi:pi /home/pi/audibible`
- **FFmpeg not found**: Reinstall with `sudo apt install ffmpeg -y`

## Network Access

To access from other devices on your network:
1. Find your Pi's IP: `hostname -I`
2. Open browser to: `http://PI_IP_ADDRESS:3005`
3. Configure Fish.Audio credentials through the web interface

## Security Notes

- Change default Pi password: `sudo passwd pi`
- Consider using HTTPS if exposing to internet
- Keep system updated: `sudo apt update && sudo apt upgrade`

---

Your Audibible server is now ready to create seamless Bible audio! 🎵📖
