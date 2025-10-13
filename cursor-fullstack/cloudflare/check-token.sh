#!/bin/bash

# سكريبت للتحقق من حالة التوكن
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🔍 فحص حالة التوكن"
echo "  📊 Cloudflare API Token Check"
echo "=========================================="
echo -e "${NC}"

# التحقق من وجود التوكن
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ خطأ: لم يتم تعيين CLOUDFLARE_API_TOKEN${NC}"
    echo ""
    echo "يرجى تعيين التوكن:"
    echo "export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

echo -e "${GREEN}✅ تم تعيين التوكن${NC}"

# التحقق من المصادقة
echo -e "${YELLOW}التحقق من المصادقة...${NC}"
if wrangler whoami &> /dev/null; then
    echo -e "${GREEN}✅ تم التحقق من المصادقة بنجاح${NC}"
    wrangler whoami
else
    echo -e "${RED}❌ فشل في المصادقة${NC}"
    echo "يرجى التحقق من صحة التوكن وصلاحياته"
    exit 1
fi

# التحقق من مساحات KV
echo -e "\n${YELLOW}التحقق من مساحات KV...${NC}"
if wrangler kv:namespace list &> /dev/null; then
    echo -e "${GREEN}✅ يمكن الوصول إلى مساحات KV${NC}"
    wrangler kv:namespace list
else
    echo -e "${RED}❌ لا يمكن الوصول إلى مساحات KV${NC}"
fi

# التحقق من R2
echo -e "\n${YELLOW}التحقق من R2...${NC}"
if wrangler r2 bucket list &> /dev/null; then
    echo -e "${GREEN}✅ يمكن الوصول إلى R2${NC}"
    wrangler r2 bucket list
else
    echo -e "${YELLOW}⚠️  لا يمكن الوصول إلى R2 - قد تكون الخدمة غير مفعلة${NC}"
fi

# التحقق من Workers
echo -e "\n${YELLOW}التحقق من Workers...${NC}"
if wrangler workers list &> /dev/null; then
    echo -e "${GREEN}✅ يمكن الوصول إلى Workers${NC}"
    wrangler workers list
else
    echo -e "${RED}❌ لا يمكن الوصول إلى Workers${NC}"
fi

# التحقق من Pages
echo -e "\n${YELLOW}التحقق من Pages...${NC}"
if wrangler pages project list &> /dev/null; then
    echo -e "${GREEN}✅ يمكن الوصول إلى Pages${NC}"
    wrangler pages project list
else
    echo -e "${RED}❌ لا يمكن الوصول إلى Pages${NC}"
fi

echo -e "\n${GREEN}=========================================="
echo "  📊 انتهى الفحص"
echo "=========================================="
echo -e "${NC}"

# نصائح
echo -e "${YELLOW}💡 نصائح:${NC}"
echo "1. إذا فشل التحقق من المصادقة، تأكد من صحة التوكن"
echo "2. إذا فشل التحقق من R2، فعّل الخدمة من Dashboard"
echo "3. إذا فشل التحقق من Workers/Pages، تأكد من صلاحيات التوكن"
echo "4. للتوكن الجديد، استخدم:"
echo "   export CLOUDFLARE_API_TOKEN=your_new_token"
echo "   ./check-token.sh"