#!/bin/bash

# نشر مبسط باستخدام Cloudflare API
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🚀 نشر مبسط للتطبيق"
echo "  📦 Simple API Deployment"
echo "=========================================="
echo -e "${NC}"

API_TOKEN="9kbiFrmnKQHrGnYGtbhtr4BKWctfo678bYqLCrbQ"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
WORKER_NAME="cursor-backend"

# إنشاء Worker
echo -e "${YELLOW}إنشاء Worker...${NC}"

WORKER_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @backend/worker.js)

if echo "$WORKER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم إنشاء Worker بنجاح${NC}"
else
    echo -e "${RED}❌ فشل في إنشاء Worker${NC}"
    echo "Response: $WORKER_RESPONSE"
    exit 1
fi

# تفعيل Worker
echo -e "${YELLOW}تفعيل Worker...${NC}"

ROUTE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/routes" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"pattern":"cursor-backend.workers.dev/*","script":"cursor-backend"}')

if echo "$ROUTE_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم تفعيل Worker بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل في تفعيل Route - قد يكون موجود بالفعل${NC}"
    echo "Response: $ROUTE_RESPONSE"
fi

# بناء الواجهة الأمامية
echo -e "${YELLOW}بناء الواجهة الأمامية...${NC}"
cd frontend
npm run build
cd ..

# إنشاء Pages project
echo -e "${YELLOW}إنشاء Pages project...${NC}"

PAGES_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"cursor-ide","production_branch":"main"}')

if echo "$PAGES_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم إنشاء Pages project بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل في إنشاء Pages project - قد يكون موجود بالفعل${NC}"
    echo "Response: $PAGES_RESPONSE"
fi

# رفع ملفات الواجهة الأمامية
echo -e "${YELLOW}رفع ملفات الواجهة الأمامية...${NC}"

# إنشاء zip file
cd frontend/dist
zip -r ../../frontend-files.zip .
cd ../..

# رفع الملفات
UPLOAD_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/cursor-ide/deployments" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "files=@frontend-files.zip")

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم رفع ملفات الواجهة الأمامية بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل في رفع الملفات - جرب النشر اليدوي${NC}"
    echo "Response: $UPLOAD_RESPONSE"
fi

# تنظيف الملفات المؤقتة
rm -f frontend-files.zip

echo -e "\n${GREEN}=========================================="
echo "  🎉 انتهى النشر! 🎉"
echo "=========================================="
echo -e "${NC}"

echo -e "${GREEN}✅ Backend: https://$WORKER_NAME.workers.dev${NC}"
echo -e "${GREEN}✅ Frontend: https://cursor-ide.pages.dev${NC}"

echo -e "\n${YELLOW}📋 الخطوات التالية:${NC}"
echo "1. 🌐 افتح التطبيق: https://cursor-ide.pages.dev"
echo "2. 🔑 قم بتكوين مفاتيح API للمزودين"
echo "3. 🧪 اختبر وظائف التطبيق"
echo "4. 📊 راقب الأداء في Cloudflare Dashboard"

echo -e "\n${BLUE}🔗 روابط مفيدة:${NC}"
echo "Backend Health: https://$WORKER_NAME.workers.dev/health"
echo "API Providers: https://$WORKER_NAME.workers.dev/api/providers"
echo "Cloudflare Dashboard: https://dash.cloudflare.com"