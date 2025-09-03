const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

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

// API Routes
const { router: apiRoutes } = require('./routes/api');
app.use('/api', apiRoutes);

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
      console.log(`🎵 tScribe server running on http://localhost:${PORT}`);
      console.log(`📁 Audio output directory: ${process.env.AUDIO_OUTPUT_DIR || './output'}`);
      console.log(`🔧 Fish.Audio configured: ${!!(process.env.FISH_AUDIO_API_KEY && process.env.FISH_AUDIO_VOICE_MODEL_ID)}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
