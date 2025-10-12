# إعداد Cloudflare - Cursor Full Stack AI IDE

## 🌐 إعداد Cloudflare للعمل مع التطبيق

هذا الدليل يوضح كيفية إعداد التطبيق للعمل على Cloudflare Workers وPages.

## 🚀 المتطلبات

### 1. حساب Cloudflare
- سجل في [Cloudflare](https://cloudflare.com)
- تأكد من تفعيل Workers وPages

### 2. أدوات التطوير
```bash
# تثبيت Wrangler CLI
npm install -g wrangler

# تسجيل الدخول إلى Cloudflare
wrangler login
```

## 📦 إعداد المشروع

### 1. إعداد Backend (Workers)
```bash
# الانتقال إلى مجلد Backend
cd cloudflare/backend

# تثبيت التبعيات
npm install

# نشر Worker
wrangler deploy
```

### 2. إعداد Frontend (Pages)
```bash
# الانتقال إلى مجلد Frontend
cd cloudflare/frontend

# تثبيت التبعيات
npm install

# بناء المشروع
npm run build

# نشر إلى Pages
wrangler pages deploy dist
```

## 🔧 إعداد الخدمات

### 1. إعداد Durable Objects
```bash
# إنشاء Durable Object
wrangler durable-object create WebSocketDO
```

### 2. إعداد KV Storage
```bash
# إنشاء KV namespace
wrangler kv:namespace create "API_KEYS"
wrangler kv:namespace create "API_KEYS" --preview

# إضافة معرفات KV إلى wrangler.toml
```

### 3. إعداد R2 Storage
```bash
# إنشاء R2 bucket
wrangler r2 bucket create cursor-files
wrangler r2 bucket create cursor-files-preview
```

## 🌍 إعداد النطاق

### 1. إعداد Subdomain
```bash
# إعداد subdomain للBackend
wrangler subdomain set cursor-backend

# إعداد subdomain للFrontend
wrangler subdomain set cursor-frontend
```

### 2. إعداد Custom Domain (اختياري)
```bash
# إضافة custom domain
wrangler custom-domains add cursor-backend.yourdomain.com
wrangler custom-domains add cursor-frontend.yourdomain.com
```

## ⚙️ متغيرات البيئة

### Backend Environment Variables
```bash
# إضافة متغيرات البيئة
wrangler secret put NODE_ENV
wrangler secret put CORS_ORIGIN
wrangler secret put API_KEYS_NAMESPACE_ID
wrangler secret put FILE_STORAGE_BUCKET_NAME
```

### Frontend Environment Variables
```bash
# إضافة متغيرات البيئة للFrontend
wrangler pages secret put VITE_BACKEND_URL
wrangler pages secret put VITE_WS_URL
```

## 🚀 نشر التطبيق

### 1. نشر Backend
```bash
cd cloudflare/backend
wrangler deploy
```

### 2. نشر Frontend
```bash
cd cloudflare/frontend
npm run build
wrangler pages deploy dist
```

### 3. إعداد DNS
```bash
# إضافة DNS records
wrangler dns create cursor-backend.yourdomain.com A 192.0.2.1
wrangler dns create cursor-frontend.yourdomain.com A 192.0.2.1
```

## 🔗 روابط التطبيق

بعد النشر، سيكون التطبيق متاحاً على:

### Backend (Workers)
- **URL**: `https://cursor-backend.YOUR_SUBDOMAIN.workers.dev`
- **WebSocket**: `wss://cursor-backend.YOUR_SUBDOMAIN.workers.dev`

### Frontend (Pages)
- **URL**: `https://cursor-frontend.YOUR_SUBDOMAIN.pages.dev`
- **Custom Domain**: `https://cursor-frontend.yourdomain.com`

## 📊 مراقبة الأداء

### 1. Cloudflare Analytics
- انتقل إلى Cloudflare Dashboard
- اختر Workers & Pages
- عرض الإحصائيات والأداء

### 2. Logs
```bash
# عرض logs للBackend
wrangler tail cursor-backend

# عرض logs للFrontend
wrangler pages tail cursor-frontend
```

## 🔒 الأمان

### 1. CORS Configuration
```javascript
// في wrangler.toml
[env.production.vars]
CORS_ORIGIN = "https://cursor-frontend.YOUR_SUBDOMAIN.pages.dev"
```

### 2. Rate Limiting
```javascript
// إضافة rate limiting
const rateLimiter = new RateLimiter({
  limit: 100,
  windowMs: 60000
});
```

### 3. API Key Security
```javascript
// تخزين API keys في KV Storage
await env.API_KEYS.put(`key_${provider}_${userId}`, apiKey);
```

## 🚀 التحسينات

### 1. Caching
```javascript
// إضافة caching للاستجابات
const cache = caches.default;
const cacheKey = new Request(url, request);
const cachedResponse = await cache.match(cacheKey);
```

### 2. Compression
```javascript
// ضغط الاستجابات
const response = new Response(compressedBody, {
  headers: {
    'Content-Encoding': 'gzip',
    'Content-Type': 'application/json'
  }
});
```

### 3. CDN
- Cloudflare CDN مفعل تلقائياً
- تحسين الأداء عالمياً
- تقليل زمن الاستجابة

## 🔧 استكشاف الأخطاء

### 1. مشاكل الاتصال
```bash
# فحص حالة Workers
wrangler whoami

# فحص logs
wrangler tail cursor-backend --format=pretty
```

### 2. مشاكل WebSocket
```javascript
// فحص WebSocket connection
if (ws.readyState === WebSocket.OPEN) {
  console.log('WebSocket connected');
} else {
  console.log('WebSocket not connected');
}
```

### 3. مشاكل Storage
```bash
# فحص KV Storage
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# فحص R2 Storage
wrangler r2 bucket list
```

## 📈 الأداء

### 1. Cold Start
- **Workers**: ~50ms
- **Pages**: ~100ms
- **Durable Objects**: ~200ms

### 2. Throughput
- **Workers**: 100,000 requests/second
- **Pages**: 10,000 requests/second
- **WebSocket**: 1,000 concurrent connections

### 3. Storage
- **KV**: 1GB per namespace
- **R2**: 10GB free tier
- **Durable Objects**: 128MB per object

## 🎯 أفضل الممارسات

### 1. Code Organization
```javascript
// تنظيم الكود في modules
import { handleAIChat } from './ai-handlers.js';
import { executeTool } from './tool-handlers.js';
```

### 2. Error Handling
```javascript
// معالجة الأخطاء
try {
  const result = await processRequest(request);
  return new Response(JSON.stringify(result));
} catch (error) {
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500
  });
}
```

### 3. Monitoring
```javascript
// إضافة monitoring
console.log('Request processed:', {
  method: request.method,
  url: request.url,
  timestamp: new Date().toISOString()
});
```

## 🎉 النشر النهائي

### 1. Production Deployment
```bash
# نشر Backend
cd cloudflare/backend
wrangler deploy --env production

# نشر Frontend
cd cloudflare/frontend
npm run build
wrangler pages deploy dist --project-name cursor-frontend
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

## 📞 الدعم

### 1. Cloudflare Support
- [Cloudflare Documentation](https://developers.cloudflare.com/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Pages Documentation](https://developers.cloudflare.com/pages/)

### 2. Community
- [Cloudflare Community](https://community.cloudflare.com/)
- [Discord Server](https://discord.gg/cloudflaredev)
- [GitHub Issues](https://github.com/cloudflare/workers)

---

**تطبيق Cursor Full Stack AI IDE جاهز للعمل على Cloudflare! 🚀**

**استمتع بأداء عالي وأمان متقدم! 🌍**