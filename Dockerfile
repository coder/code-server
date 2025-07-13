FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source
COPY . .

# Install dependencies and build
RUN yarn install --frozen-lockfile
RUN yarn build:vscode
RUN yarn build

# Create statik directories
RUN mkdir -p /root/.statik/{keys,db,extensions,userdata}

# Expose ports
EXPOSE 8080 8081 50443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/healthz || exit 1

# Start Statik-Server
CMD ["./startup.sh"]
