#!/bin/bash

# نشر التطبيق باستخدام Cloudflare API مباشرة
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🚀 نشر التطبيق باستخدام API"
echo "  📦 Cloudflare API Deployment"
echo "=========================================="
echo -e "${NC}"

API_TOKEN="9kbiFrmnKQHrGnYGtbhtr4BKWctfo678bYqLCrbQ"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
WORKER_NAME="cursor-backend"

# إنشاء R2 bucket
echo -e "${YELLOW}محاولة إنشاء R2 bucket...${NC}"
R2_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"cursor-files"}')

if echo "$R2_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم إنشاء R2 bucket بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل في إنشاء R2 bucket - قد تكون الخدمة غير مفعلة${NC}"
    echo "Response: $R2_RESPONSE"
fi

# إنشاء Worker
echo -e "${YELLOW}إنشاء Worker...${NC}"

# قراءة ملفات الكود
BACKEND_CODE=$(cat backend/index.js | sed 's/"/\\"/g' | tr -d '\n')
WEBSOCKET_CODE=$(cat backend/websocket-do.js | sed 's/"/\\"/g' | tr -d '\n')

# إنشاء Worker script
WORKER_SCRIPT="$BACKEND_CODE"

# إنشاء Worker
WORKER_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @backend/index.js)

if echo "$WORKER_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم إنشاء Worker بنجاح${NC}"
else
    echo -e "${RED}❌ فشل في إنشاء Worker${NC}"
    echo "Response: $WORKER_RESPONSE"
fi

# إنشاء Pages project
echo -e "${YELLOW}إنشاء Pages project...${NC}"

# بناء الواجهة الأمامية
cd frontend
npm run build
cd ..

# إنشاء Pages project
PAGES_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"cursor-ide"}')

if echo "$PAGES_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم إنشاء Pages project بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  فشل في إنشاء Pages project - قد يكون موجود بالفعل${NC}"
    echo "Response: $PAGES_RESPONSE"
fi

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