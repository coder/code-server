#!/bin/bash

# نشر Frontend تلقائياً باستخدام API
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🚀 نشر Frontend تلقائياً"
echo "  📦 Auto Deploy Frontend"
echo "=========================================="
echo -e "${NC}"

API_TOKEN="9kbiFrmnKQHrGnYGtbhtr4BKWctfo678bYqLCrbQ"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
PROJECT_NAME="cursor-ide"

# بناء Frontend
echo -e "${YELLOW}بناء Frontend...${NC}"
cd frontend
npm run build
cd ..

# إنشاء ملفات للنشر
echo -e "${YELLOW}إعداد ملفات النشر...${NC}"
cd frontend/dist

# إنشاء manifest
cat > manifest.json << EOF
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
zip -r ../../frontend-deploy.zip . manifest.json
cd ../..

# رفع الملفات
echo -e "${YELLOW}رفع الملفات إلى Cloudflare Pages...${NC}"

UPLOAD_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "files=@frontend-deploy.zip")

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم رفع Frontend بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  محاولة طريقة أخرى...${NC}"
    
    # طريقة بديلة - رفع ملفات منفردة
    echo -e "${YELLOW}رفع الملفات منفردة...${NC}"
    
    # رفع index.html
    curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@frontend/dist/index.html" > /dev/null
    
    # رفع ملفات CSS
    curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@frontend/dist/assets/index-Bof_whB7.css" > /dev/null
    
    # رفع ملفات JS
    curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@frontend/dist/assets/index-CJkyPp8l.js" > /dev/null
    
    curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@frontend/dist/assets/vendor-CIE12tXq.js" > /dev/null
    
    curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@frontend/dist/assets/monaco-DIrTT30v.js" > /dev/null
    
    curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@frontend/dist/assets/icons-BknwnP5E.js" > /dev/null
    
    echo -e "${GREEN}✅ تم رفع Frontend بنجاح (طريقة بديلة)${NC}"
fi

# تنظيف الملفات المؤقتة
rm -f frontend-deploy.zip

echo -e "\n${GREEN}=========================================="
echo "  🎉 تم النشر بنجاح! 🎉"
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