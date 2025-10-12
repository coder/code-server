# 🚀 دليل التثبيت والنشر - Cursor Full Stack AI IDE

## 📋 نظرة عامة

هذا دليل شامل لتثبيت ونشر تطبيق Cursor Full Stack AI IDE على Cloudflare Pages.

## 🚀 النشر السريع

### 1. النشر بنقرة واحدة

```bash
cd cloudflare/frontend
./one-click-deploy.sh
```

### 2. النشر المتقدم

```bash
cd cloudflare/frontend
./deploy.sh
```

## 🛠️ التثبيت اليدوي

### 1. تثبيت المتطلبات

```bash
# تثبيت Node.js 18+
# تثبيت npm 8+

# تثبيت Wrangler CLI
npm install -g wrangler
```

### 2. تسجيل الدخول إلى Cloudflare

```bash
wrangler login
```

### 3. تثبيت التبعيات

```bash
cd cloudflare/frontend
npm install
```

### 4. بناء المشروع

```bash
npm run build
```

### 5. نشر على Cloudflare Pages

```bash
wrangler pages deploy dist --project-name cursor-ide
```

## 🔧 إعداد Cloudflare Pages

### 1. إنشاء مشروع جديد

1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر **Pages** > **Create a project**
3. اختر **Connect to Git**
4. اختر المستودع الخاص بك
5. إعدادات البناء:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### 2. إضافة متغيرات البيئة

```bash
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev
VITE_APP_NAME=Cursor Full Stack AI IDE
VITE_APP_VERSION=1.0.0
```

## 🌍 النتيجة المتوقعة

بعد النشر، ستحصل على:

- **Frontend**: `https://cursor-ide.pages.dev`
- **Backend**: `https://cursor-backend.workers.dev`
- **WebSocket**: `wss://cursor-backend.workers.dev`

## 🔧 استكشاف الأخطاء

### مشكلة: Wrangler غير مثبت
```bash
npm install -g wrangler
```

### مشكلة: غير مسجل الدخول
```bash
wrangler login
```

### مشكلة: البناء فشل
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### مشكلة: النشر فشل
```bash
wrangler pages project create cursor-ide
wrangler pages deploy dist --project-name cursor-ide
```

## 📋 خطوات النشر النهائية

### 1. إعداد المستودع
```bash
# إنشاء مستودع جديد
gh repo create cursor-ide-frontend --public

# نسخ الملفات
cp -r cloudflare/frontend/* cursor-ide-frontend/
cd cursor-ide-frontend

# إعداد Git
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/cursor-ide-frontend.git
git push -u origin main
```

### 2. ربط Cloudflare Pages
1. انتقل إلى Cloudflare Dashboard
2. Pages > Create a project
3. Connect to Git
4. اختر المستودع الجديد
5. إعدادات البناء:
   - Framework: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`

### 3. إضافة متغيرات البيئة
```bash
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev
```

### 4. النشر
- Cloudflare Pages سيبني المشروع تلقائياً
- ستحصل على رابط مباشر للتطبيق

## 🎉 النتيجة النهائية

تطبيق Cursor Full Stack AI IDE سيكون متاحاً على:

- **Frontend**: `https://cursor-ide.pages.dev`
- **Backend**: `https://cursor-backend.workers.dev`
- **WebSocket**: `wss://cursor-backend.workers.dev`

## 🚀 البدء السريع

```bash
# 1. النشر بنقرة واحدة
cd cloudflare/frontend
./one-click-deploy.sh

# 2. أو النشر المتقدم
cd cloudflare/frontend
./deploy.sh

# 3. أو النشر اليدوي
cd cloudflare/frontend
npm install
npm run build
wrangler pages deploy dist --project-name cursor-ide
```

---

**🎯 هذا الحل سيضمن نشر التطبيق بنجاح على Cloudflare Pages!**