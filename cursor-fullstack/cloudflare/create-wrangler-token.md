# 🔑 إنشاء توكن مخصص لـ wrangler

## 📋 **الخطوات:**

### **1. اذهب إلى Cloudflare Dashboard:**
- [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)

### **2. اضغط "Create Token"**

### **3. اختر "Custom token"**

### **4. أضف هذه الصلاحيات:**
```
Account:Read
Zone:Read
Cloudflare Workers:Edit
Cloudflare KV Storage:Edit
Cloudflare Pages:Edit
Cloudflare R2:Edit
```

### **5. اختر الحساب:**
```
Thailand.2528hho@gmail.com's Account
```

### **6. أضف هذه الموارد:**
```
Account:Thailand.2528hho@gmail.com's Account
Zone:All zones
```

### **7. احفظ التوكن الجديد**

## 🚀 **استخدام التوكن الجديد:**

```bash
export CLOUDFLARE_API_TOKEN=your_new_token_here
wrangler whoami
wrangler deploy
wrangler pages deploy dist --project-name cursor-ide
```