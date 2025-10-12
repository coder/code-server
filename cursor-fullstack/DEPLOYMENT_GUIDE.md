# 🚀 Cursor Full Stack AI IDE - Cloudflare Pages Deployment Guide

## 📋 Prerequisites

- Cloudflare account (free tier is sufficient)
- GitHub account (for repository hosting)
- Node.js 18+ installed locally

## 🎯 Quick Deployment Steps

### 1. Prepare the Repository

```bash
# Clone or download this project
git clone <your-repo-url>
cd cursor-fullstack

# Build the frontend
cd cloudflare/frontend
npm install
npm run build

# Copy built files to deployment package
cd ../..
cp -r cloudflare/frontend/dist/* deployment-package/
```

### 2. Create GitHub Repository

1. Create a new repository on GitHub
2. Upload the contents of `deployment-package/` folder
3. Commit and push to the main branch

### 3. Deploy to Cloudflare Pages

1. **Go to Cloudflare Dashboard**
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to "Pages" in the sidebar

2. **Create New Project**
   - Click "Create a project"
   - Choose "Connect to Git"
   - Select your GitHub repository

3. **Configure Build Settings**
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty for root)

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   VITE_BACKEND_URL=https://cursor-backend.workers.dev
   VITE_WS_URL=wss://cursor-backend.workers.dev
   VITE_APP_NAME=Cursor Full Stack AI IDE
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for the build to complete

### 4. Deploy Backend (Optional)

If you want to deploy the backend as well:

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate**
   ```bash
   wrangler login
   ```

3. **Deploy Backend**
   ```bash
   cd cloudflare/backend
   wrangler deploy
   ```

## 🔧 Configuration Files

### cloudflare-pages.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rootDirectory": ".",
  "installCommand": "npm install",
  "framework": "vite",
  "nodeVersion": "18",
  "environmentVariables": {
    "NODE_ENV": "production",
    "VITE_BACKEND_URL": "https://cursor-backend.workers.dev",
    "VITE_WS_URL": "wss://cursor-backend.workers.dev",
    "VITE_APP_NAME": "Cursor Full Stack AI IDE",
    "VITE_APP_VERSION": "1.0.0"
  }
}
```

### _headers
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://cursor-backend.workers.dev wss://cursor-backend.workers.dev;
```

### _redirects
```
# SPA fallback
/*    /index.html   200

# API proxy
/api/*    https://cursor-backend.workers.dev/api/:splat    200
```

## 🌐 Custom Domain Setup

1. **Add Custom Domain in Cloudflare Pages**
   - Go to your Pages project
   - Click "Custom domains"
   - Add your domain

2. **Update DNS Records**
   - Add CNAME record pointing to your Pages URL
   - Or use Cloudflare's nameservers

## 🔒 Security Considerations

- The app uses Content Security Policy (CSP) headers
- CORS is configured for API access
- XSS protection is enabled
- Frame embedding is disabled

## 🧪 Testing Your Deployment

1. **Frontend Test**
   - Visit your Pages URL
   - Check if the interface loads correctly
   - Test Monaco Editor functionality

2. **Backend Test** (if deployed)
   - Visit `https://your-backend.workers.dev/health`
   - Should return JSON with status: "healthy"

## 🚨 Troubleshooting

### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript errors

### Runtime Errors
- Verify environment variables are set
- Check browser console for errors
- Ensure CORS is properly configured

### Performance Issues
- Enable Cloudflare's CDN
- Use Cloudflare's image optimization
- Enable Brotli compression

## 📊 Monitoring

- Use Cloudflare Analytics for traffic insights
- Monitor Core Web Vitals
- Set up uptime monitoring

## 🔄 Updates

To update your deployment:
1. Push changes to your GitHub repository
2. Cloudflare Pages will automatically rebuild and deploy
3. Changes will be live within minutes

## 🎉 Success!

Your Cursor Full Stack AI IDE should now be live and accessible at your Cloudflare Pages URL!

### Next Steps:
1. Configure AI provider API keys in the app
2. Test all functionality
3. Set up custom domain (optional)
4. Monitor performance and usage

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.