# Cloudflare Setup - Cursor Full Stack AI IDE

## 🌐 إعداد Cloudflare للعمل مع التطبيق

هذا الدليل يوضح كيفية إعداد التطبيق للعمل على Cloudflare Workers وPages.

## 🚀 البدء السريع

### 1. تثبيت المتطلبات
```bash
# تثبيت Wrangler CLI
npm install -g wrangler

# تسجيل الدخول إلى Cloudflare
wrangler login
```

### 2. نشر التطبيق
```bash
# تشغيل سكريبت النشر
./deploy.sh --subdomain your-subdomain

# أو مع domain مخصص
./deploy.sh --subdomain your-subdomain --domain yourdomain.com
```

## 📦 هيكل المشروع

```
cloudflare/
├── wrangler.toml              # إعدادات Cloudflare
├── deploy.sh                  # سكريبت النشر
├── README.md                  # هذا الملف
├── CLOUDFLARE_SETUP.md        # دليل الإعداد المفصل
├── backend/                   # Backend (Workers)
│   ├── index.js              # Main worker code
│   └── websocket-do.js       # WebSocket Durable Object
└── frontend/                  # Frontend (Pages)
    ├── package.json          # Frontend dependencies
    ├── vite.config.js        # Vite configuration
    └── src/                  # React source code
        ├── App.tsx           # Main app component
        └── components/       # React components
```

## 🔧 الميزات

### Backend (Cloudflare Workers)
- **5 AI Providers**: OpenAI, Anthropic, Google, Mistral, OpenRouter
- **18+ Tools**: File operations, Git, Terminal, Docker, NPM
- **WebSocket Support**: Real-time communication with Durable Objects
- **KV Storage**: API keys and session data
- **R2 Storage**: File storage and workspace
- **Global Edge**: Deployed to 200+ locations worldwide

### Frontend (Cloudflare Pages)
- **React + Vite**: Modern frontend framework
- **Monaco Editor**: VS Code editor experience
- **Real-time Chat**: WebSocket communication
- **Tool Panel**: Interactive tool execution
- **Status Bar**: Real-time system information
- **Responsive Design**: Works on all devices

## 🚀 النشر

### النشر التلقائي
```bash
# نشر مع subdomain افتراضي
./deploy.sh

# نشر مع subdomain مخصص
./deploy.sh --subdomain my-cursor-ide

# نشر مع domain مخصص
./deploy.sh --subdomain my-cursor-ide --domain mydomain.com
```

### النشر اليدوي
```bash
# نشر Backend
cd backend
wrangler deploy

# نشر Frontend
cd frontend
npm run build
wrangler pages deploy dist
```

## 🌍 الروابط

بعد النشر، سيكون التطبيق متاحاً على:

### Backend (Workers)
- **URL**: `https://cursor-backend.your-subdomain.workers.dev`
- **WebSocket**: `wss://cursor-backend.your-subdomain.workers.dev`
- **Health Check**: `https://cursor-backend.your-subdomain.workers.dev/health`

### Frontend (Pages)
- **URL**: `https://cursor-frontend.your-subdomain.pages.dev`
- **Custom Domain**: `https://cursor-frontend.yourdomain.com` (if configured)

## ⚙️ الإعداد

### 1. متغيرات البيئة
```bash
# إضافة متغيرات البيئة للBackend
wrangler secret put NODE_ENV
wrangler secret put CORS_ORIGIN

# إضافة متغيرات البيئة للFrontend
wrangler pages secret put VITE_BACKEND_URL
wrangler pages secret put VITE_WS_URL
```

### 2. Storage
```bash
# إعداد KV Storage
wrangler kv:namespace create "API_KEYS"
wrangler kv:namespace create "FILE_STORAGE"

# إعداد R2 Storage
wrangler r2 bucket create cursor-files
```

### 3. Durable Objects
```bash
# إعداد WebSocket Durable Object
wrangler durable-object create WebSocketDO
```

## 📊 الأداء

### Cloudflare Edge
- **Global CDN**: 200+ locations worldwide
- **Low Latency**: < 50ms response time
- **High Availability**: 99.99% uptime
- **Auto Scaling**: Handles traffic spikes

### Workers Performance
- **Cold Start**: ~50ms
- **Throughput**: 100,000 requests/second
- **Memory**: 128MB per request
- **CPU Time**: 10ms per request

### Pages Performance
- **Build Time**: ~2-3 minutes
- **Deploy Time**: ~1-2 minutes
- **Cache**: Global edge caching
- **Compression**: Automatic gzip/brotli

## 🔒 الأمان

### Cloudflare Security
- **DDoS Protection**: Automatic mitigation
- **WAF**: Web Application Firewall
- **SSL/TLS**: Automatic certificate management
- **Rate Limiting**: Built-in protection

### Application Security
- **API Key Storage**: Encrypted in KV Storage
- **CORS**: Configured for your domain
- **Input Validation**: All inputs validated
- **Error Handling**: Secure error messages

## 📈 المراقبة

### Cloudflare Analytics
- **Request Metrics**: Requests, errors, latency
- **Bandwidth**: Data transfer statistics
- **Cache Hit Rate**: CDN performance
- **Security Events**: Threats blocked

### Application Logs
```bash
# عرض logs للBackend
wrangler tail cursor-backend

# عرض logs للFrontend
wrangler pages tail cursor-frontend
```

## 🔧 استكشاف الأخطاء

### مشاكل شائعة
1. **WebSocket Connection Failed**
   - تحقق من Durable Object configuration
   - تأكد من WebSocket URL صحيح

2. **API Keys Not Working**
   - تحقق من KV Storage configuration
   - تأكد من API key format صحيح

3. **File Operations Failed**
   - تحقق من R2 Storage configuration
   - تأكد من permissions صحيحة

### حل المشاكل
```bash
# فحص حالة Workers
wrangler whoami

# فحص logs
wrangler tail cursor-backend --format=pretty

# فحص KV Storage
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID
```

## 🎯 أفضل الممارسات

### 1. Code Organization
- استخدم modules منفصلة
- نظم الكود في مجلدات منطقية
- استخدم TypeScript للtype safety

### 2. Error Handling
- معالجة جميع الأخطاء
- إرجاع رسائل خطأ واضحة
- استخدام try-catch blocks

### 3. Performance
- استخدم caching عند الإمكان
- قلل من حجم البيانات المرسلة
- استخدم compression

## 📞 الدعم

### Cloudflare Support
- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Pages Documentation](https://developers.cloudflare.com/pages/)

### Community
- [Cloudflare Community](https://community.cloudflare.com/)
- [Discord Server](https://discord.gg/cloudflaredev)
- [GitHub Issues](https://github.com/cloudflare/workers)

## 🎉 النشر النهائي

### 1. Production Deployment
```bash
# نشر مع إعدادات production
./deploy.sh --subdomain production --domain yourdomain.com
```

### 2. Custom Domain Setup
```bash
# إضافة custom domain
wrangler custom-domains add cursor-backend.yourdomain.com
wrangler custom-domains add cursor-frontend.yourdomain.com
```

### 3. SSL Certificate
- Cloudflare SSL مفعل تلقائياً
- دعم HTTP/2 وHTTP/3
- أمان عالي

---

**تطبيق Cursor Full Stack AI IDE جاهز للعمل على Cloudflare! 🚀**

**استمتع بأداء عالي وأمان متقدم! 🌍**