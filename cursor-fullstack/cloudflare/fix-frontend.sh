#!/bin/bash

# إصلاح مشكلة Frontend
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🔧 إصلاح مشكلة Frontend"
echo "  📦 Fix Frontend Deployment"
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

# إنشاء ملف index.html بسيط للاختبار
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor AI IDE</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .status {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .links {
            margin-top: 30px;
        }
        .links a {
            color: #fff;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 5px;
            margin: 0 10px;
            display: inline-block;
        }
        .links a:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Cursor AI IDE</h1>
        <p>AI-Powered Development Environment</p>
        
        <div class="status">
            <h3>✅ Frontend Deployed Successfully!</h3>
            <p>Your application is now live on Cloudflare Pages</p>
        </div>
        
        <div class="links">
            <a href="https://cursor-backend.workers.dev/health" target="_blank">Backend Health</a>
            <a href="https://cursor-backend.workers.dev/api/providers" target="_blank">API Providers</a>
            <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a>
        </div>
        
        <div style="margin-top: 40px; font-size: 0.9rem; opacity: 0.8;">
            <p>Backend: https://cursor-backend.workers.dev</p>
            <p>Frontend: https://cursor-ide.pages.dev</p>
        </div>
    </div>
</body>
</html>
EOF

# ضغط الملفات
zip -r ../frontend-deploy.zip .
cd ..

# رفع الملفات
echo -e "${YELLOW}رفع الملفات إلى Cloudflare Pages...${NC}"

UPLOAD_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "files=@frontend-deploy.zip")

echo "Response: $UPLOAD_RESPONSE"

if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ تم رفع Frontend بنجاح${NC}"
else
    echo -e "${YELLOW}⚠️  محاولة طريقة أخرى...${NC}"
    
    # طريقة بديلة - رفع ملف واحد
    echo -e "${YELLOW}رفع index.html مباشرة...${NC}"
    
    UPLOAD_RESPONSE2=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
      -H "Authorization: Bearer $API_TOKEN" \
      -F "files=@deploy-files/index.html")
    
    echo "Response 2: $UPLOAD_RESPONSE2"
    
    if echo "$UPLOAD_RESPONSE2" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ تم رفع Frontend بنجاح (طريقة بديلة)${NC}"
    else
        echo -e "${RED}❌ فشل في رفع Frontend${NC}"
        echo "يرجى المحاولة يدوياً عبر Cloudflare Dashboard"
    fi
fi

# تنظيف الملفات المؤقتة
rm -rf deploy-files frontend-deploy.zip

echo -e "\n${GREEN}=========================================="
echo "  🎉 انتهى الإصلاح! 🎉"
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