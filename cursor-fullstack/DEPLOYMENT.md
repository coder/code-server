# Deployment Guide - Cursor Full Stack AI IDE

## 🚀 Production Deployment Options

### 1. Docker Deployment (Recommended)

#### Local Docker Deployment
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/cursor-fullstack-ai-ide.git
cd cursor-fullstack-ai-ide

# Build and start
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

#### Production Docker Deployment
```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up --build -d

# With custom environment
export NODE_ENV=production
export VITE_BACKEND_URL=https://your-domain.com
export VITE_WS_URL=wss://your-domain.com
docker compose -f docker-compose.prod.yml up --build -d
```

### 2. Cloud Platform Deployment

#### AWS Deployment
```bash
# Using AWS ECS
aws ecs create-cluster --cluster-name cursor-ide-cluster
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster cursor-ide-cluster --service-name cursor-ide-service --task-definition cursor-ide:1

# Using AWS App Runner
# Create apprunner.yaml configuration
# Deploy via AWS Console or CLI
```

#### Google Cloud Platform
```bash
# Using Cloud Run
gcloud run deploy cursor-ide-backend --source ./packages/backend/claudable
gcloud run deploy cursor-ide-frontend --source ./packages/frontend/cursor-web

# Using GKE
kubectl apply -f k8s/
```

#### Azure Deployment
```bash
# Using Azure Container Instances
az container create --resource-group myResourceGroup --name cursor-ide --image your-registry/cursor-fullstack:latest

# Using Azure App Service
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name cursor-ide --deployment-container-image-name your-registry/cursor-fullstack:latest
```

### 3. VPS/Server Deployment

#### Ubuntu/Debian Server
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/cursor-fullstack-ai-ide.git
cd cursor-fullstack-ai-ide
docker compose up --build -d
```

#### CentOS/RHEL Server
```bash
# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy
git clone https://github.com/YOUR_USERNAME/cursor-fullstack-ai-ide.git
cd cursor-fullstack-ai-ide
docker compose up --build -d
```

## 🔧 Environment Configuration

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
WS_PORT=8080
CORS_ORIGIN=https://your-domain.com
```

#### Frontend (.env)
```bash
VITE_BACKEND_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
VITE_APP_NAME=Cursor Full Stack AI IDE
```

#### Docker Compose Environment
```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - WS_PORT=8080
  - VITE_BACKEND_URL=https://your-domain.com
  - VITE_WS_URL=wss://your-domain.com
```

## 🌐 Domain and SSL Setup

### 1. Domain Configuration
```bash
# Point your domain to your server IP
# A record: your-domain.com -> YOUR_SERVER_IP
# CNAME: www.your-domain.com -> your-domain.com
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # code-server
    location /code-server/ {
        proxy_pass http://localhost:8081/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring and Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor Docker containers
docker stats

# View application logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f code-server
```

### 2. Log Management
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/cursor-ide

# Add:
/var/log/cursor-ide/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 3. Health Checks
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:5173

# code-server health check
curl http://localhost:8081
```

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# iptables (CentOS/RHEL)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8081 -j ACCEPT
```

### 2. Docker Security
```bash
# Run containers as non-root user
docker compose exec backend adduser --disabled-password --gecos '' appuser
docker compose exec backend chown -R appuser:appuser /app

# Use Docker secrets for sensitive data
echo "your-api-key" | docker secret create api_key -
```

### 3. Application Security
```bash
# Set secure headers in Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 🚀 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/cursor-fullstack-ai-ide
          git pull origin main
          docker compose down
          docker compose up --build -d
```

## 📈 Performance Optimization

### 1. Docker Optimization
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### 2. Nginx Optimization
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Application Optimization
```javascript
// Enable clustering for Node.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start your application
}
```

## 🔄 Backup and Recovery

### 1. Database Backup
```bash
# Backup workspace data
tar -czf workspace-backup-$(date +%Y%m%d).tar.gz workspace/

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/cursor-ide"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/workspace-$DATE.tar.gz workspace/
find $BACKUP_DIR -name "workspace-*.tar.gz" -mtime +7 -delete
```

### 2. Container Backup
```bash
# Backup Docker volumes
docker run --rm -v cursor-fullstack_workspace:/data -v $(pwd):/backup alpine tar czf /backup/workspace-backup.tar.gz -C /data .
```

## 📞 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
sudo lsof -i :3001
sudo kill -9 PID
```

2. **Docker Build Fails**
```bash
docker system prune -f
docker compose down -v
docker compose up --build -d
```

3. **SSL Certificate Issues**
```bash
sudo certbot renew --dry-run
sudo nginx -t
sudo systemctl reload nginx
```

4. **Memory Issues**
```bash
# Increase Docker memory limit
docker compose down
docker system prune -f
docker compose up --build -d
```

## 🎯 Production Checklist

- [ ] Domain configured and SSL certificate installed
- [ ] Firewall configured
- [ ] Docker containers running
- [ ] Nginx configured and running
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance optimization applied
- [ ] CI/CD pipeline configured

---

**Your Cursor Full Stack AI IDE is now production-ready! 🚀**