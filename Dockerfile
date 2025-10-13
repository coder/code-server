# Multi-stage build for code-server
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (skip VS Code submodule deps to avoid kerberos issues)
RUN SKIP_SUBMODULE_DEPS=1 npm ci

# Copy source code
COPY src/ ./src/
COPY ci/ ./ci/

# Build the application
RUN npm run build

# Create release package
RUN npm run release

# Production stage
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    bash \
    curl

# Create app user
RUN addgroup -g 1000 -S app && \
    adduser -u 1000 -S app -G app

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/release ./

# Install production dependencies
RUN npm install --omit=dev --unsafe-perm

# Create data directory
RUN mkdir -p /home/app/.local/share/code-server && \
    chown -R app:app /home/app/.local/share/code-server

# Switch to app user
USER app

# Expose port
EXPOSE 8080

# Set environment variables
ENV PASSWORD=""
ENV SUDO_PASSWORD=""
ENV PROXY_DOMAIN=""
ENV PORT="8080"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start code-server
CMD ["node", "out/node/entry.js", "--bind-addr", "0.0.0.0:8080", "--auth", "none"]
