#!/bin/bash

# سكريبت مبسط لنشر التطبيق على Cloudflare
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🚀 نشر تطبيق Cursor AI IDE"
echo "  📦 على Cloudflare"
echo "=========================================="
echo -e "${NC}"

# التحقق من وجود الرمز المميز
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ خطأ: لم يتم تعيين CLOUDFLARE_API_TOKEN${NC}"
    echo ""
    echo "يرجى تعيين الرمز المميز:"
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    echo ""
    echo "أو إنشاء رمز جديد من:"
    echo "https://dash.cloudflare.com/profile/api-tokens"
    exit 1
fi

echo -e "${GREEN}✅ تم تعيين الرمز المميز${NC}"

# التحقق من المصادقة
echo -e "${YELLOW}التحقق من المصادقة...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ فشل في المصادقة${NC}"
    echo "يرجى التحقق من صحة الرمز المميز وصلاحياته"
    exit 1
fi

echo -e "${GREEN}✅ تم التحقق من المصادقة بنجاح${NC}"

# بناء الواجهة الأمامية
echo -e "${YELLOW}بناء الواجهة الأمامية...${NC}"
cd frontend
npm run build
echo -e "${GREEN}✅ تم بناء الواجهة الأمامية بنجاح${NC}"

# محاولة نشر Backend
echo -e "${YELLOW}محاولة نشر Backend...${NC}"
cd ..
if wrangler deploy --env="" 2>/dev/null; then
    echo -e "${GREEN}✅ تم نشر Backend بنجاح${NC}"
    BACKEND_DEPLOYED=true
else
    echo -e "${YELLOW}⚠️  فشل في نشر Backend - قد تكون الصلاحيات غير كافية${NC}"
    BACKEND_DEPLOYED=false
fi

# محاولة نشر Frontend
echo -e "${YELLOW}محاولة نشر Frontend...${NC}"
cd frontend
if wrangler pages deploy dist --project-name cursor-ide 2>/dev/null; then
    echo -e "${GREEN}✅ تم نشر Frontend بنجاح${NC}"
    FRONTEND_DEPLOYED=true
else
    echo -e "${YELLOW}⚠️  فشل في نشر Frontend - قد تكون الصلاحيات غير كافية${NC}"
    FRONTEND_DEPLOYED=false
fi

cd ..

# عرض النتائج
echo -e "\n${GREEN}=========================================="
echo "  📊 نتائج النشر"
echo "=========================================="
echo -e "${NC}"

if [ "$BACKEND_DEPLOYED" = true ]; then
    echo -e "${GREEN}✅ Backend: https://cursor-backend.workers.dev${NC}"
    echo -e "   WebSocket: wss://cursor-backend.workers.dev"
    echo -e "   Health: https://cursor-backend.workers.dev/health"
else
    echo -e "${RED}❌ Backend: فشل في النشر${NC}"
fi

if [ "$FRONTEND_DEPLOYED" = true ]; then
    echo -e "${GREEN}✅ Frontend: https://cursor-ide.pages.dev${NC}"
else
    echo -e "${RED}❌ Frontend: فشل في النشر${NC}"
fi

# نصائح إضافية
if [ "$BACKEND_DEPLOYED" = false ] || [ "$FRONTEND_DEPLOYED" = false ]; then
    echo -e "\n${YELLOW}💡 نصائح لحل المشكلة:${NC}"
    echo "1. تأكد من تفعيل خدمة R2 في Cloudflare Dashboard"
    echo "2. أنشئ رمز مميز جديد بالصلاحيات التالية:"
    echo "   - Cloudflare Workers:Edit"
    echo "   - Cloudflare Pages:Edit"
    echo "   - Account:Read"
    echo "   - Zone:Read"
    echo "3. أو جرب النشر اليدوي عبر Dashboard"
fi

echo -e "\n${GREEN}=========================================="
echo "  🎉 انتهى النشر! 🎉"
echo "=========================================="
echo -e "${NC}"