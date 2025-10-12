# 🔗 النشر المتكامل - Cursor Full Stack AI IDE

## 🎯 نظرة عامة

هذا دليل شامل للنشر المتكامل لتطبيق Cursor Full Stack AI IDE مع دعم كامل لجميع المنصات.

## 🚀 طرق النشر المتاحة

### **1. Cloudflare Pages (مستحسن)**
- ✅ **سريع ومجاني**
- ✅ **CDN عالمي**
- ✅ **SSL تلقائي**
- ✅ **دعم WebSocket**

### **2. Docker (محلي)**
- ✅ **تطوير محلي**
- ✅ **اختبار سريع**
- ✅ **بيئة معزولة**

### **3. GitHub Pages**
- ✅ **نشر تلقائي**
- ✅ **تكامل Git**
- ✅ **مجاني**

## 🛠️ إعداد المشروع

### **1. متطلبات النظام**
```bash
# Node.js 18+
node --version

# npm 8+
npm --version

# Git
git --version

# Cloudflare Account
# Docker (اختياري)
```

### **2. تثبيت التبعيات**
```bash
# Frontend
cd cloudflare/frontend
npm install

# Backend
cd ../backend
npm install
```

## 🚀 النشر على Cloudflare Pages

### **الطريقة السريعة:**
```bash
# 1. إنشاء مستودع منفصل
gh repo create cursor-ide-frontend --public

# 2. نسخ الملفات
cp -r cloudflare/frontend/* cursor-ide-frontend/
cd cursor-ide-frontend

# 3. إعداد Git
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/your-username/cursor-ide-frontend.git
git push -u origin main

# 4. ربط Cloudflare Pages
# انتقل إلى Cloudflare Dashboard > Pages > Create project
```

### **إعدادات Cloudflare Pages:**
- **Framework**: Vite
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### **متغيرات البيئة:**
```bash
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev
VITE_APP_NAME=Cursor Full Stack AI IDE
VITE_APP_VERSION=1.0.0
```

## 🐳 النشر مع Docker

### **Docker Compose:**
```yaml
version: '3.8'
services:
  frontend:
    build: ./cloudflare/frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_BACKEND_URL=http://localhost:3001
      - VITE_WS_URL=ws://localhost:8080
    depends_on:
      - backend

  backend:
    build: ./cloudflare/backend
    ports:
      - "3001:3001"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=3001
```

### **تشغيل Docker:**
```bash
# بناء وتشغيل
docker-compose up --build -d

# عرض السجلات
docker-compose logs -f

# إيقاف
docker-compose down
```

## 📱 النشر على GitHub Pages

### **GitHub Actions:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd cloudflare/frontend
          npm install
          
      - name: Build
        run: |
          cd cloudflare/frontend
          npm run build
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./cloudflare/frontend/dist
```

## 🔧 استكشاف الأخطاء

### **مشاكل Cloudflare Pages:**
- **المشكلة**: المستودع الخاطئ
- **الحل**: إنشاء مستودع منفصل للـ Frontend

- **المشكلة**: إعدادات البناء
- **الحل**: استخدام Vite preset

- **المشكلة**: متغيرات البيئة
- **الحل**: إضافة متغيرات البيئة في Cloudflare Dashboard

### **مشاكل Docker:**
- **المشكلة**: Port conflicts
- **الحل**: تغيير المنافذ في docker-compose.yml

- **المشكلة**: Build failures
- **الحل**: تنظيف Docker cache وإعادة البناء

### **مشاكل GitHub Pages:**
- **المشكلة**: Build failures
- **الحل**: التحقق من إعدادات GitHub Actions

- **المشكلة**: 404 errors
- **الحل**: إضافة _redirects file

## 📚 الوثائق

### **أدلة النشر:**
- `DEPLOYMENT_SOLUTION.md` - دليل شامل للنشر
- `cloudflare/frontend/QUICK_DEPLOY.md` - دليل سريع
- `cloudflare/frontend/README_DEPLOY.md` - دليل مفصل

### **أدلة التطوير:**
- `DEVELOPMENT_GUIDE.md` - دليل التطوير
- `API_DOCUMENTATION.md` - وثائق API
- `CONTRIBUTING.md` - دليل المساهمة

### **أدلة الاستخدام:**
- `USER_GUIDE.md` - دليل المستخدم
- `FEATURES.md` - دليل الميزات
- `TROUBLESHOOTING.md` - استكشاف الأخطاء

## 🚀 البدء السريع

### **1. استنساخ المشروع:**
```bash
git clone https://github.com/your-username/cursor-fullstack-ai-ide.git
cd cursor-fullstack-ai-ide
```

### **2. تثبيت التبعيات:**
```bash
# Frontend
cd cloudflare/frontend
npm install

# Backend
cd ../backend
npm install
```

### **3. تشغيل محلي:**
```bash
# Frontend
npm run dev

# Backend
npm run dev
```

### **4. النشر:**
```bash
# Cloudflare Pages
gh repo create cursor-ide-frontend --public
cp -r cloudflare/frontend/* cursor-ide-frontend/
cd cursor-ide-frontend
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-username/cursor-ide-frontend.git
git push -u origin main

# Docker
docker-compose up --build -d

# GitHub Pages
git add .github/workflows/
git commit -m "Add GitHub Actions"
git push origin main
```

## 🎉 النتيجة النهائية

بعد النشر، ستحصل على:

- **Frontend**: `https://cursor-ide.pages.dev`
- **Backend**: `https://cursor-backend.workers.dev`
- **WebSocket**: `wss://cursor-backend.workers.dev`

## 🔗 الروابط المفيدة

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **GitHub**: https://github.com/your-username/cursor-fullstack-ai-ide
- **Documentation**: https://cursor-ide.pages.dev/docs
- **API Reference**: https://cursor-backend.workers.dev/api

---

**🎯 هذا هو الحل المتكامل والنهائي لتطبيق Cursor Full Stack AI IDE!**

**🚀 ابدأ الآن واختر طريقة النشر المناسبة لك!**