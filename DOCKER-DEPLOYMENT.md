# 🐳 iScribe Docker Deployment Guide for MeatPi

This guide will help you deploy iScribe on your meatPi (Raspberry Pi) using Docker containers for easy management and deployment.

## 📋 Prerequisites

### System Requirements
- **Raspberry Pi** (any model with at least 1GB RAM)
- **Raspbian OS** or compatible Linux distribution
- **Docker** and **Docker Compose** installed
- **Fish.Audio API credentials**

### Required Software Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin

# Log out and log back in for Docker group changes
```

## 🚀 Quick Docker Deployment

### Option 1: Automated Deployment (Recommended)
```bash
# Clone the repository
git clone https://github.com/obi-wan-jr/iscribe.git
cd iscribe

# Run the automated Docker deployment script
chmod +x deploy-meatpi-docker.sh
./deploy-meatpi-docker.sh
```

### Option 2: Manual Docker Deployment
```bash
# Clone the repository
git clone https://github.com/obi-wan-jr/iscribe.git
cd iscribe

# Create environment file
cp env.example .env
# Edit .env with your Fish.Audio API credentials

# Create necessary directories
mkdir -p logs output uploads uploads/images uploads/persistent_images

# Build and start the container
docker-compose up -d --build
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
AUDIO_OUTPUT_DIR=/app/output
TEMP_AUDIO_DIR=/app/uploads
```

### Docker Compose Configuration
The `docker-compose.yml` includes:
- **Container name**: `iscribe`
- **Port mapping**: `3008:3008`
- **Auto-restart**: `unless-stopped`
- **Resource limits**: 1GB memory, 1 CPU for Pi optimization
- **Volume mounts**: Persistent storage for generated files
- **Health checks**: Automatic container health monitoring

## 🔧 Docker Management Commands

### Container Management
```bash
# View container status
docker-compose ps

# View logs
docker-compose logs -f iscribe

# Restart container
docker-compose restart iscribe

# Stop container
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d

# Access container shell
docker-compose exec iscribe sh
```

### Docker Commands
```bash
# View all containers
docker ps -a

# View container logs
docker logs iscribe

# Stop container
docker stop iscribe

# Remove container
docker rm iscribe

# Remove image
docker rmi iscribe_iscribe

# Clean up unused resources
docker system prune -f
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

## 📁 Docker Volume Structure

```
iscribe/
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Docker image definition
├── .dockerignore              # Docker ignore file
├── deploy-meatpi-docker.sh    # Automated deployment script
├── stop-meatpi-docker.sh      # Stop script
├── .env                       # Environment variables
├── logs/                      # Container logs (mounted)
├── output/                    # Generated audio/video files (mounted)
└── uploads/                   # Temporary files (mounted)
    ├── images/                # Background images
    └── persistent_images/     # Persistent images
```

## 🔍 Monitoring & Troubleshooting

### View Logs
```bash
# Real-time logs
docker-compose logs -f iscribe

# Last 50 lines
docker-compose logs --tail=50 iscribe

# Container logs
docker logs iscribe
```

### Check Status
```bash
# Container status
docker-compose ps

# Container health
docker inspect iscribe | grep -A 10 "Health"

# Resource usage
docker stats iscribe
```

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using port 3008
sudo netstat -tlnp | grep :3008

# Stop conflicting services
sudo systemctl stop [service_name]
```

#### 2. Permission Issues
```bash
# Fix directory permissions
sudo chown -R $USER:$USER logs output uploads

# Add user to docker group
sudo usermod -aG docker $USER
```

#### 3. Container Won't Start
```bash
# Check logs for errors
docker-compose logs iscribe

# Rebuild container
docker-compose down
docker-compose up -d --build
```

#### 4. Out of Memory
```bash
# Check memory usage
free -h

# Reduce resource limits in docker-compose.yml
# Or add swap space
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## 🔄 Updates & Maintenance

### Updating iScribe
```bash
# Stop the container
docker-compose down

# Pull latest changes
git pull origin main

# Rebuild and start
docker-compose up -d --build
```

### Backup Important Data
```bash
# Backup generated files
tar -czf iscribe-backup-$(date +%Y%m%d).tar.gz output/ uploads/

# Backup configuration
cp .env .env.backup
cp docker-compose.yml docker-compose.yml.backup
```

### Clean Up Docker Resources
```bash
# Remove unused containers, networks, images
docker system prune -f

# Remove all unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f
```

## 🛡️ Security Considerations

### Container Security
- Container runs as non-root user (`iscribe:nodejs`)
- Uses `tini` as init system for proper signal handling
- Health checks ensure container is responsive
- Resource limits prevent resource exhaustion

### Network Security
```bash
# Allow port 3008 (if using UFW)
sudo ufw allow 3008

# Check firewall status
sudo ufw status
```

## 📊 Performance Optimization

### For Raspberry Pi 3/4
- **Memory limit**: 1GB (adjustable in docker-compose.yml)
- **CPU limit**: 1.0 cores (adjustable in docker-compose.yml)
- **Storage**: Use fast SD card (Class 10 or better)
- **Swap**: Consider adding swap space for memory-intensive operations

### Resource Monitoring
```bash
# Monitor container resources
docker stats iscribe

# Monitor system resources
htop

# Check disk space
df -h
```

## 🆘 Support

### Getting Help
1. Check container logs: `docker-compose logs iscribe`
2. Verify container status: `docker-compose ps`
3. Check system resources: `docker stats iscribe`
4. Review this documentation

### Useful Commands Summary
```bash
# Quick status check
docker-compose ps && docker-compose logs --tail=20 iscribe

# Full restart
docker-compose restart iscribe

# Emergency stop and cleanup
docker-compose down && docker system prune -f
```

---

**🐳 iScribe is now running in Docker on your meatPi!** 

Access it at: `http://[YOUR_PI_IP]:3008`

The containerized deployment provides:
- ✅ Easy deployment and updates
- ✅ Automatic restarts
- ✅ Resource management
- ✅ Health monitoring
- ✅ Persistent data storage
- ✅ Security isolation
