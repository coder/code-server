# 🚀 Cursor Full Stack AI IDE - Frontend

## 📋 نظرة عامة

هذا هو الـ Frontend لتطبيق Cursor Full Stack AI IDE، مبني بـ React + Vite + Monaco Editor.

## 🚀 النشر السريع على Cloudflare Pages

### 1. إنشاء مستودع منفصل

```bash
# إنشاء مستودع جديد للـ Frontend
gh repo create cursor-ide-frontend --public

# نسخ الملفات
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
   - **Root directory**: `/` (root)

### 3. إضافة متغيرات البيئة

في Cloudflare Pages Dashboard، أضف:

```bash
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev
VITE_APP_NAME=Cursor Full Stack AI IDE
VITE_APP_VERSION=1.0.0
```

## 🛠️ التطوير المحلي

### تثبيت التبعيات

```bash
npm install
```

### تشغيل خادم التطوير

```bash
npm run dev
```

### بناء للإنتاج

```bash
npm run build
```

### معاينة البناء

```bash
npm run preview
```

## 🎯 الميزات

### Monaco Editor
- ✅ محرر كود متقدم من Microsoft
- ✅ دعم 50+ لغة برمجة
- ✅ IntelliSense واقتراحات ذكية
- ✅ Multi-cursor editing
- ✅ Find & Replace
- ✅ Code folding
- ✅ Bracket matching
- ✅ Custom themes

### واجهة المستخدم
- ✅ Sidebar مع مستكشف الملفات
- ✅ Status bar مع معلومات النظام
- ✅ Chat panel مع AI integration
- ✅ Tools panel مع أدوات التطوير
- ✅ Notifications system
- ✅ Responsive design

### AI Integration
- ✅ 5 مزودي AI (OpenAI, Anthropic, Google, Mistral, OpenRouter)
- ✅ Real-time chat
- ✅ Code generation
- ✅ Code explanation
- ✅ Bug fixing

### Development Tools
- ✅ File operations
- ✅ Terminal integration
- ✅ Git integration
- ✅ Package management
- ✅ Code search
- ✅ Docker support

## 🔧 الإعداد

### متغيرات البيئة

```bash
# Backend URLs
VITE_BACKEND_URL=https://cursor-backend.workers.dev
VITE_WS_URL=wss://cursor-backend.workers.dev

# App Configuration
VITE_APP_NAME=Cursor Full Stack AI IDE
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=A complete AI-powered development environment

# Feature Flags
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_TOOLS=true
VITE_ENABLE_TERMINAL=true
VITE_ENABLE_GIT=true

# AI Providers
VITE_DEFAULT_AI_PROVIDER=openai
VITE_AI_PROVIDERS=openai,anthropic,google,mistral,openrouter

# Editor Configuration
VITE_EDITOR_THEME=vs-dark
VITE_EDITOR_FONT_SIZE=14
VITE_EDITOR_TAB_SIZE=2
VITE_EDITOR_WORD_WRAP=on
```

## 📁 هيكل المشروع

```
frontend/
├── public/                 # ملفات عامة
│   ├── _headers           # رؤوس HTTP
│   ├── _redirects         # قواعد إعادة التوجيه
│   ├── manifest.json      # PWA manifest
│   ├── robots.txt         # SEO
│   └── sitemap.xml        # Sitemap
├── src/                   # الكود المصدري
│   ├── components/        # مكونات React
│   │   ├── MonacoEditor.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ChatAssistant.tsx
│   │   ├── ProviderForm.tsx
│   │   ├── ToolPanel.tsx
│   │   ├── StatusBar.tsx
│   │   └── Notification.tsx
│   ├── App.tsx           # المكون الرئيسي
│   ├── main.tsx          # نقطة الدخول
│   └── index.css         # الأنماط
├── package.json          # التبعيات
├── vite.config.js        # إعدادات Vite
├── tailwind.config.js    # إعدادات Tailwind
├── tsconfig.json         # إعدادات TypeScript
└── README.md            # هذا الملف
```

## 🎨 التصميم

### الألوان
- **Background**: `#1e1e1e`
- **Sidebar**: `#252526`
- **Border**: `#3c3c3c`
- **Text**: `#cccccc`
- **Accent**: `#007acc`

### الخطوط
- **Monospace**: Fira Code, Consolas, Monaco
- **Sans-serif**: Segoe UI, Tahoma, Geneva, Verdana

### الاستجابة
- **Desktop**: 1920px+
- **Tablet**: 768px - 1919px
- **Mobile**: 320px - 767px

## 🔒 الأمان

### Content Security Policy
```html
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: https:; 
connect-src 'self' https://*.workers.dev wss://*.workers.dev;
```

### Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## 📊 الأداء

### التحسينات
- ✅ Code splitting
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Gzip compression
- ✅ CDN caching
- ✅ Service worker

### المقاييس
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

## 🚀 النشر

### Cloudflare Pages
```bash
# بناء المشروع
npm run build

# نشر على Cloudflare Pages
wrangler pages deploy dist --project-name cursor-ide
```

### GitHub Pages
```bash
# بناء المشروع
npm run build

# نشر على GitHub Pages
npm install -g gh-pages
gh-pages -d dist
```

### Vercel
```bash
# تثبيت Vercel CLI
npm install -g vercel

# نشر
vercel --prod
```

## 🔧 استكشاف الأخطاء

### مشكلة: البناء فشل
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

### مشكلة: Monaco Editor لا يعمل
```bash
# التأكد من تثبيت التبعيات
npm install @monaco-editor/react
```

### مشكلة: Tailwind CSS لا يعمل
```bash
# إعادة بناء Tailwind
npx tailwindcss -i ./src/index.css -o ./dist/output.css --watch
```

## 📞 الدعم

- **GitHub Issues**: [Report a bug](https://github.com/your-username/cursor-ide-frontend/issues)
- **Documentation**: [Full docs](https://cursor-ide.pages.dev/docs)
- **Community**: [Discord](https://discord.gg/cursor-ide)

## 📄 الترخيص

MIT License - انظر [LICENSE](LICENSE) للتفاصيل.

---

**🎉 استمتع بالتطوير مع Cursor Full Stack AI IDE!**