# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Install tini for proper signal handling
RUN apk add --no-cache tini

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV PORT=3008
# Expose port
EXPOSE 3008
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3008/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use tini as init system
ENTRYPOINT ["tini", "--"]

# Start the application
CMD ["node", "server.js"]
