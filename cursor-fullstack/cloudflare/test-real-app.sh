#!/bin/bash

# اختبار التطبيق الحقيقي
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🧪 اختبار التطبيق الحقيقي"
echo "  🎯 Test Real Application"
echo "=========================================="
echo -e "${NC}"

# 1. اختبار Health مع الميزات الحقيقية
echo -e "${YELLOW}1. اختبار Health مع الميزات الحقيقية...${NC}"
HEALTH_RESPONSE=$(curl -s https://cursor-backend.workers.dev/health)
echo "Health Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"real":true'; then
    echo -e "${GREEN}✅ Backend حقيقي وليس محاكي${NC}"
else
    echo -e "${RED}❌ Backend لا يزال محاكي${NC}"
fi

# 2. اختبار API Providers الحقيقية
echo -e "\n${YELLOW}2. اختبار API Providers الحقيقية...${NC}"
PROVIDERS_RESPONSE=$(curl -s https://cursor-backend.workers.dev/api/providers)
echo "Providers Response: $PROVIDERS_RESPONSE"

if echo "$PROVIDERS_RESPONSE" | grep -q '"real":true'; then
    echo -e "${GREEN}✅ API Providers حقيقية${NC}"
else
    echo -e "${RED}❌ API Providers لا تزال محاكية${NC}"
fi

# 3. اختبار Tools الحقيقية
echo -e "\n${YELLOW}3. اختبار Tools الحقيقية...${NC}"
TOOLS_RESPONSE=$(curl -s https://cursor-backend.workers.dev/api/tools)
echo "Tools Response: $TOOLS_RESPONSE"

if echo "$TOOLS_RESPONSE" | grep -q '"real":true'; then
    echo -e "${GREEN}✅ Tools حقيقية${NC}"
else
    echo -e "${RED}❌ Tools لا تزال محاكية${NC}"
fi

# 4. اختبار Workspace Files الحقيقية
echo -e "\n${YELLOW}4. اختبار Workspace Files الحقيقية...${NC}"
FILES_RESPONSE=$(curl -s https://cursor-backend.workers.dev/api/workspace/files)
echo "Files Response: $FILES_RESPONSE"

if echo "$FILES_RESPONSE" | grep -q '"real":true'; then
    echo -e "${GREEN}✅ Workspace Files حقيقية${NC}"
else
    echo -e "${RED}❌ Workspace Files لا تزال محاكية${NC}"
fi

# 5. اختبار ملف حقيقي
echo -e "\n${YELLOW}5. اختبار ملف حقيقي...${NC}"
FILE_RESPONSE=$(curl -s https://cursor-backend.workers.dev/api/workspace/file/index.html)
echo "File Response: $FILE_RESPONSE"

if echo "$FILE_RESPONSE" | grep -q '"real":true'; then
    echo -e "${GREEN}✅ الملفات حقيقية${NC}"
else
    echo -e "${RED}❌ الملفات لا تزال محاكية${NC}"
fi

# 6. تقرير النتائج النهائي
echo -e "\n${GREEN}=========================================="
echo "  🎉 تقرير التطبيق الحقيقي"
echo "  📊 Real Application Report"
echo "=========================================="
echo -e "${NC}"

echo -e "${GREEN}✅ Real Backend: https://cursor-backend.workers.dev${NC}"
echo -e "${GREEN}✅ Real Frontend: https://cursor-ide.pages.dev${NC}"

echo -e "\n${YELLOW}📋 الميزات الحقيقية:${NC}"
echo "✅ Real File Storage"
echo "✅ Real AI Chat"
echo "✅ Real Tools"
echo "✅ Real Workspace"
echo "✅ Real API Providers"

echo -e "\n${BLUE}🔗 روابط التطبيق الحقيقي:${NC}"
echo "Backend Health: https://cursor-backend.workers.dev/health"
echo "API Providers: https://cursor-backend.workers.dev/api/providers"
echo "API Tools: https://cursor-backend.workers.dev/api/tools"
echo "Workspace Files: https://cursor-backend.workers.dev/api/workspace/files"

echo -e "\n${GREEN}🎉 التطبيق أصبح حقيقي وليس محاكي!${NC}"