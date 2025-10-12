# ⚡ البدء السريع - Cursor Full Stack AI IDE

## 🚀 النشر في 3 خطوات

### 1. تثبيت المتطلبات
```bash
# تثبيت Node.js 18+ (إذا لم يكن مثبتاً)
# تثبيت Git (إذا لم يكن مثبتاً)

# تثبيت Wrangler CLI
npm install -g wrangler
```

### 2. تسجيل الدخول إلى Cloudflare
```bash
wrangler login
```

### 3. النشر التلقائي
```bash
# انتقل إلى مجلد cloudflare
cd cloudflare

# شغل النشر بنقرة واحدة
./one-click-deploy.sh
```

## 🎯 النشر المتقدم

### مع subdomain مخصص
```bash
./auto-deploy.sh --subdomain my-ai-ide
```

### مع domain مخصص
```bash
./auto-deploy.sh --subdomain my-ai-ide --domain mydomain.com
```

### الإعداد الكامل
```bash
./complete-setup.sh
```

## 🔗 الوصول للتطبيق

بعد النشر، ستحصل على:

- **Frontend**: `https://cursor-frontend.pages.dev`
- **Backend**: `https://cursor-backend.workers.dev`
- **WebSocket**: `wss://cursor-backend.workers.dev`

## 🛠️ الاستخدام

1. **افتح Frontend URL**
2. **اضغط على Settings**
3. **أدخل API key لأي مزود AI**
4. **ابدأ التطوير مع AI!**

## 🆘 المساعدة

- **دليل الأتمتة**: `AUTOMATION_GUIDE.md`
- **إعداد مفصل**: `CLOUDFLARE_SETUP.md`
- **README**: `README.md`

---

**🎉 جاهز للاستخدام! استمتع بالتطوير مع AI! 🚀**