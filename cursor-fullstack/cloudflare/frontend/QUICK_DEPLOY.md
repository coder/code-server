# ⚡ النشر السريع - Cursor Full Stack AI IDE

## 🚨 المشكلة الحالية

Cloudflare Pages يحاول بناء code-server بدلاً من مشروعنا بسبب المستودع المرتبط.

## ✅ الحل السريع

### 1. إنشاء مستودع منفصل للـ Frontend

```bash
# إنشاء مستودع جديد للـ Frontend
gh repo create cursor-ide-frontend --public

# نسخ ملفات الـ Frontend
cp -r cloudflare/frontend/* cursor-ide-frontend/
cd cursor-ide-frontend

# إعداد Git
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/your-username/cursor-ide-frontend.git
git push -u origin main
```

### 2. ربط Cloudflare Pages

1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر **Pages** > **Create a project**
3. اختر **Connect to Git**
4. اختر المستودع الجديد `cursor-ide-frontend`
5. إعدادات البناء:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### 3. إضافة متغيرات البيئة

```bash
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev
```

## 🚀 النشر التلقائي

### استخدام سكريبت النشر

```bash
cd cloudflare/frontend
./one-click-deploy.sh
```

### النشر اليدوي

```bash
# بناء المشروع
npm run build

# نشر على Cloudflare Pages
wrangler pages deploy dist --project-name cursor-ide
```

## 🎯 النتيجة المتوقعة

بعد النشر، ستحصل على:

- **Frontend**: `https://cursor-ide.pages.dev`
- **Backend**: `https://cursor-backend.workers.dev`
- **WebSocket**: `wss://cursor-backend.workers.dev`

## 🔧 استكشاف الأخطاء

### مشكلة: المستودع الخاطئ
**الحل**: إنشاء مستودع منفصل للـ Frontend

### مشكلة: إعدادات البناء
**الحل**: استخدام Vite preset في Cloudflare Pages

### مشكلة: متغيرات البيئة
**الحل**: إضافة متغيرات البيئة في Cloudflare Dashboard

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
# 1. إنشاء مستودع Frontend
gh repo create cursor-ide-frontend --public

# 2. نسخ الملفات
cp -r cloudflare/frontend/* cursor-ide-frontend/
cd cursor-ide-frontend

# 3. إعداد Git
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-username/cursor-ide-frontend.git
git push -u origin main

# 4. ربط Cloudflare Pages
# انتقل إلى Cloudflare Dashboard > Pages > Create project
# اختر المستودع الجديد
# إعدادات: Vite, npm run build, dist

# 5. إضافة متغيرات البيئة
# VITE_BACKEND_URL=https://cursor-backend.workers.dev
# VITE_WS_URL=wss://cursor-backend.workers.dev
```

---

**🎯 هذا الحل سيضمن نشر التطبيق بنجاح على Cloudflare Pages!**