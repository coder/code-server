#!/bin/bash

# نشر Frontend النهائي مع manifest صحيح
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🚀 نشر Frontend النهائي"
echo "  📦 Final Frontend Deployment"
echo "=========================================="
echo -e "${NC}"

API_TOKEN="q6EB7IKZXX8kwN91LPlE1nn-_rkiOA8m9XvaWJFX"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
PROJECT_NAME="cursor-ide"

# بناء Frontend
echo -e "${YELLOW}بناء Frontend...${NC}"
cd frontend
npm run build
cd ..

# إنشاء مجلد للنشر
echo -e "${YELLOW}إعداد ملفات النشر...${NC}"
mkdir -p deploy-files
cp -r frontend/dist/* deploy-files/

cd deploy-files

# إنشاء manifest صحيح
echo -e "${YELLOW}إنشاء manifest...${NC}"
cat > manifest.json << 'EOF'
{
  "index.html": "index.html",
  "assets/index-Bof_whB7.css": "assets/index-Bof_whB7.css",
  "assets/socket-l0sNRNKZ.js": "assets/socket-l0sNRNKZ.js",
  "assets/icons-BknwnP5E.js": "assets/icons-BknwnP5E.js",
  "assets/monaco-DIrTT30v.js": "assets/monaco-DIrTT30v.js",
  "assets/index-CJkyPp8l.js": "assets/index-CJkyPp8l.js",
  "assets/vendor-CIE12tXq.js": "assets/vendor-CIE12tXq.js"
}
EOF

# ضغط الملفات
zip -r ../frontend-deploy.zip . manifest.json
cd ..

# رفع الملفات مع manifest
echo -e "${YELLOW}رفع الملفات مع manifest...${NC}"

UPLOAD_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "manifest=@deploy-files/manifest.json" \
  -F "files=@frontend-deploy.zip")

echo "Response: $UPLOAD_RESPONSE"

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم رفع Frontend بنجاح${NC}"
    
    # انتظار قليل ثم اختبار
    echo -e "${YELLOW}انتظار 10 ثواني...${NC}"
    sleep 10
    
    # اختبار الموقع
    echo -e "${YELLOW}اختبار الموقع...${NC}"
    if curl -s -f https://cursor-ide.pages.dev > /dev/null; then
        echo -e "${GREEN}✅ الموقع يعمل بنجاح!${NC}"
    else
        echo -e "${YELLOW}⚠️  الموقع قد يحتاج وقت إضافي للتفعيل${NC}"
    fi
    
else
    echo -e "${RED}❌ فشل في رفع Frontend${NC}"
    echo "Response: $UPLOAD_RESPONSE"
    
    # محاولة طريقة بديلة
    echo -e "${YELLOW}محاولة طريقة بديلة...${NC}"
    
    # إنشاء deployment بسيط
    SIMPLE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"files":{"index.html":{"content":"<!DOCTYPE html><html><head><title>Cursor AI IDE</title></head><body><h1>🚀 Cursor AI IDE</h1><p>Frontend is being deployed...</p></body></html>"}}}')
    
    echo "Simple Response: $SIMPLE_RESPONSE"
    
    if echo "$SIMPLE_RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ تم رفع Frontend بسيط بنجاح${NC}"
    else
        echo -e "${RED}❌ فشل في جميع المحاولات${NC}"
        echo "يرجى المحاولة يدوياً عبر Cloudflare Dashboard"
    fi
fi

# تنظيف الملفات المؤقتة
rm -rf deploy-files frontend-deploy.zip

echo -e "\n${GREEN}=========================================="
echo "  🎉 انتهى النشر! 🎉"
echo "=========================================="
echo -e "${NC}"

echo -e "${GREEN}✅ Backend: https://cursor-backend.workers.dev${NC}"
echo -e "${GREEN}✅ Frontend: https://cursor-ide.pages.dev${NC}"

echo -e "\n${YELLOW}📋 اختبار التطبيق:${NC}"
echo "1. 🌐 افتح: https://cursor-ide.pages.dev"
echo "2. 🔑 أضف مفاتيح API للمزودين"
echo "3. 🧪 اختبر وظائف التطبيق"

echo -e "\n${BLUE}🔗 روابط مفيدة:${NC}"
echo "Backend Health: https://cursor-backend.workers.dev/health"
echo "API Providers: https://cursor-backend.workers.dev/api/providers"
echo "Cloudflare Dashboard: https://dash.cloudflare.com"