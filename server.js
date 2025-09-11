const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;
const TSCRIBE_API_URL = process.env.TSCRIBE_API_URL || 'http://localhost:3003';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure required directories exist
const ensureDirectories = async () => {
  const dirs = [
    process.env.AUDIO_OUTPUT_DIR || './output',
    process.env.TEMP_AUDIO_DIR || './uploads',
    './public'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check aggregates backend availability
app.get('/api/health', async (req, res) => {
  try {
    let tscribeStatus = 'unavailable';
    try {
      const r = await axios.get(new URL('/api/health', TSCRIBE_API_URL).toString(), { timeout: 5000 });
      tscribeStatus = r.data?.status || 'available';
    } catch (e) {}
    res.json({
      status: 'ok',
      message: 'iScribe frontend is running',
      timestamp: new Date().toISOString(),
      services: { tscribe: tscribeStatus }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Health check failed', error: error.message });
  }
});

// Streaming-safe reverse proxy to tScribe backend
app.use('/api', createProxyMiddleware({
  target: TSCRIBE_API_URL,
  changeOrigin: true,
  ws: true,
  secure: false,
  logLevel: 'warn',
  onError: (err, req, res) => {
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: 'Bad gateway', message: 'Failed to reach tScribe backend' });
    }
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await ensureDirectories();
    app.listen(PORT, () => {
      console.log(`🎵 iScribe server running on http://localhost:${PORT}`);
      console.log(`📁 Audio output directory: ${process.env.AUDIO_OUTPUT_DIR || './output'}`);
      console.log(`🔧 Fish.Audio configured: ${!!(process.env.FISH_AUDIO_API_KEY && process.env.FISH_AUDIO_VOICE_MODEL_ID)}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
