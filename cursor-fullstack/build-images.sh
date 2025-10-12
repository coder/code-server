#!/bin/bash

echo "🐳 Building Cursor Full Stack AI IDE Docker Images..."

# Create workspace directory
mkdir -p workspace

# Build backend image
echo "📦 Building Backend Image..."
cd packages/backend/claudable
docker build -t cursor-backend:latest .
cd ../..

# Build frontend image
echo "📦 Building Frontend Image..."
cd packages/frontend/cursor-web
docker build -t cursor-frontend:latest .
cd ../..

# Build complete system image
echo "📦 Building Complete System Image..."
cat > Dockerfile.complete << 'EOF'
FROM nginx:alpine

# Copy built frontend
COPY --from=cursor-frontend:latest /usr/share/nginx/html /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Install Node.js and dependencies for backend
RUN apk add --no-cache nodejs npm

# Copy backend
COPY --from=cursor-backend:latest /app /app/backend

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Create startup script
RUN cat > /start.sh << 'SCRIPT'
#!/bin/sh
# Start backend
cd /app/backend && node dist/index.js &
# Start nginx
nginx -g "daemon off;"
SCRIPT

RUN chmod +x /start.sh

EXPOSE 80 3001 8080

CMD ["/start.sh"]
EOF

docker build -f Dockerfile.complete -t cursor-fullstack:latest .

echo "✅ All images built successfully!"
echo ""
echo "📦 Available Images:"
echo "   cursor-backend:latest"
echo "   cursor-frontend:latest" 
echo "   cursor-fullstack:latest"
echo ""
echo "🚀 To run the complete system:"
echo "   docker run -p 80:80 -p 3001:3001 -p 8080:8080 cursor-fullstack:latest"
echo ""
echo "🔗 Or use docker-compose:"
echo "   docker compose up -d"