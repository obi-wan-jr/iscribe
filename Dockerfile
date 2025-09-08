# iScribe Docker Container
# Multi-stage build for optimized production image

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    vips \
    tini

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S iscribe -u 1001

# Set working directory
WORKDIR /app

# Copy built dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=iscribe:nodejs . .

# Create necessary directories
RUN mkdir -p logs output uploads uploads/images uploads/persistent_images && \
    chown -R iscribe:nodejs logs output uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3008
ENV AUDIO_OUTPUT_DIR=/app/output
ENV TEMP_AUDIO_DIR=/app/uploads

# Expose port
EXPOSE 3008

# Switch to non-root user
USER iscribe

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3008/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "server.js"]
