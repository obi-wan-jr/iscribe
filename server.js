const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

// tScribe backend configuration
const TSCRIBE_API_URL = process.env.TSCRIBE_API_URL || 'http://localhost:3003';

// Create axios instance for tScribe API
const tscribeApi = axios.create({
    baseURL: TSCRIBE_API_URL,
    timeout: 30000
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check if tScribe is available
        let tscribeStatus = 'unavailable';
        try {
            const tscribeHealth = await tscribeApi.get('/api/health');
            tscribeStatus = tscribeHealth.data.status || 'available';
        } catch (error) {
            console.log('tScribe not available:', error.message);
        }

        res.json({
            status: 'ok',
            message: 'iScribe frontend is running',
            timestamp: new Date().toISOString(),
            services: {
                tscribe: tscribeStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Streaming-safe reverse proxy for all other /api requests to tScribe
app.use('/api', createProxyMiddleware({
    target: TSCRIBE_API_URL,
    changeOrigin: true,
    ws: true,
    secure: false,
    logLevel: 'warn',
    onError: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(502).json({
            success: false,
            error: 'Bad gateway',
            message: 'Failed to reach tScribe backend',
        });
    },
    // Preserve original path (/api/*) as tScribe expects the /api prefix
    pathRewrite: (path) => path,
    onProxyReq: (proxyReq, req) => {
        // Forward original headers useful for auth/cookies/streaming
        if (req.headers['accept']) {
            proxyReq.setHeader('accept', req.headers['accept']);
        }
    }
}));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
app.listen(PORT, () => {
    console.log(`🎵 iScribe frontend running on http://localhost:${PORT}`);
    console.log(`🔗 Connecting to tScribe backend: ${TSCRIBE_API_URL}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
});
