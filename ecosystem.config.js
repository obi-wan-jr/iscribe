module.exports = {
  apps: [{
    name: 'iscribe',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3008,
      AUDIO_OUTPUT_DIR: './output',
      TEMP_AUDIO_DIR: './uploads'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3008,
      AUDIO_OUTPUT_DIR: './output',
      TEMP_AUDIO_DIR: './uploads'
    },
    // PM2 specific configurations
    log_file: './logs/iscribe.log',
    out_file: './logs/iscribe-out.log',
    error_file: './logs/iscribe-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    
    // Resource monitoring
    node_args: '--max-old-space-size=1024',
    
    // Process management
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Auto-restart on file changes (disabled for production)
    ignore_watch: [
      'node_modules',
      'logs',
      'output',
      'uploads'
    ]
  }]
};
