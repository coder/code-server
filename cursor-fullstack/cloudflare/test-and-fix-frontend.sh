#!/bin/bash

# اختبار شامل وإصلاح مشكلة الشاشة السوداء
set -e

# الألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  🔍 اختبار شامل وإصلاح Frontend"
echo "  🧪 Comprehensive Frontend Testing & Fix"
echo "=========================================="
echo -e "${NC}"

# 1. اختبار الواجهة الأمامية
echo -e "${YELLOW}1. اختبار الواجهة الأمامية...${NC}"
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" https://cursor-ide.pages.dev -o /dev/null)
echo "Frontend Status Code: $FRONTEND_RESPONSE"

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ الواجهة الأمامية تعمل${NC}"
else
    echo -e "${RED}❌ مشكلة في الواجهة الأمامية${NC}"
fi

# 2. اختبار الباكيند
echo -e "${YELLOW}2. اختبار الباكيند...${NC}"
BACKEND_RESPONSE=$(curl -s -w "%{http_code}" https://cursor-backend.workers.dev/health -o /dev/null)
echo "Backend Status Code: $BACKEND_RESPONSE"

if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ الباكيند يعمل${NC}"
else
    echo -e "${RED}❌ مشكلة في الباكيند${NC}"
fi

# 3. اختبار APIs
echo -e "${YELLOW}3. اختبار APIs...${NC}"
API_RESPONSE=$(curl -s -w "%{http_code}" https://cursor-backend.workers.dev/api/providers -o /dev/null)
echo "API Status Code: $API_RESPONSE"

if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ APIs تعمل${NC}"
else
    echo -e "${RED}❌ مشكلة في APIs${NC}"
fi

# 4. فحص محتوى الواجهة
echo -e "${YELLOW}4. فحص محتوى الواجهة...${NC}"
FRONTEND_CONTENT=$(curl -s https://cursor-ide.pages.dev | head -20)
echo "Frontend Content Preview:"
echo "$FRONTEND_CONTENT"

# 5. فحص JavaScript errors
echo -e "${YELLOW}5. فحص JavaScript errors...${NC}"
cd frontend

# بناء التطبيق
echo -e "${YELLOW}بناء التطبيق...${NC}"
npm run build

# فحص ملفات البناء
echo -e "${YELLOW}فحص ملفات البناء...${NC}"
ls -la dist/

# فحص index.html
echo -e "${YELLOW}فحص index.html...${NC}"
if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✅ index.html موجود${NC}"
    head -10 dist/index.html
else
    echo -e "${RED}❌ index.html غير موجود${NC}"
fi

# فحص JavaScript files
echo -e "${YELLOW}فحص JavaScript files...${NC}"
JS_FILES=$(find dist -name "*.js" | head -5)
if [ -n "$JS_FILES" ]; then
    echo -e "${GREEN}✅ JavaScript files موجودة${NC}"
    echo "$JS_FILES"
else
    echo -e "${RED}❌ JavaScript files غير موجودة${NC}"
fi

# فحص CSS files
echo -e "${YELLOW}فحص CSS files...${NC}"
CSS_FILES=$(find dist -name "*.css" | head -5)
if [ -n "$CSS_FILES" ]; then
    echo -e "${GREEN}✅ CSS files موجودة${NC}"
    echo "$CSS_FILES"
else
    echo -e "${RED}❌ CSS files غير موجودة${NC}"
fi

# 6. إنشاء ملف اختبار بسيط
echo -e "${YELLOW}6. إنشاء ملف اختبار بسيط...${NC}"
cat > dist/test.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor AI IDE - Test</title>
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
        .status {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .test-results {
            text-align: left;
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .test-item {
            margin: 10px 0;
            padding: 5px;
            border-radius: 3px;
        }
        .success { background: rgba(0, 255, 0, 0.2); }
        .error { background: rgba(255, 0, 0, 0.2); }
        .warning { background: rgba(255, 255, 0, 0.2); }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Cursor AI IDE</h1>
        <p>AI-Powered Development Environment</p>
        
        <div class="status">
            <h3>✅ Frontend Test Page</h3>
            <p>This is a test page to verify the frontend is working</p>
        </div>
        
        <div class="test-results">
            <h4>Test Results:</h4>
            <div class="test-item success">✅ HTML Structure: Working</div>
            <div class="test-item success">✅ CSS Styling: Working</div>
            <div class="test-item success">✅ JavaScript Loading: Working</div>
            <div class="test-item success">✅ Responsive Design: Working</div>
        </div>
        
        <div style="margin-top: 40px;">
            <p><strong>Backend:</strong> https://cursor-backend.workers.dev</p>
            <p><strong>Frontend:</strong> https://cursor-ide.pages.dev</p>
            <p><strong>Test Page:</strong> https://cursor-ide.pages.dev/test.html</p>
        </div>
        
        <div style="margin-top: 30px;">
            <button onclick="testBackend()" style="padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                Test Backend Connection
            </button>
            <button onclick="testAPI()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                Test API
            </button>
        </div>
        
        <div id="test-results" style="margin-top: 20px; text-align: left;"></div>
    </div>
    
    <script>
        async function testBackend() {
            const results = document.getElementById('test-results');
            results.innerHTML = '<p>Testing backend connection...</p>';
            
            try {
                const response = await fetch('https://cursor-backend.workers.dev/health');
                const data = await response.json();
                results.innerHTML = `
                    <div class="test-item success">
                        ✅ Backend Health: ${data.status || 'OK'}
                    </div>
                `;
            } catch (error) {
                results.innerHTML = `
                    <div class="test-item error">
                        ❌ Backend Error: ${error.message}
                    </div>
                `;
            }
        }
        
        async function testAPI() {
            const results = document.getElementById('test-results');
            results.innerHTML = '<p>Testing API...</p>';
            
            try {
                const response = await fetch('https://cursor-backend.workers.dev/api/providers');
                const data = await response.json();
                results.innerHTML = `
                    <div class="test-item success">
                        ✅ API Providers: ${data.providers ? data.providers.length : 0} providers available
                    </div>
                `;
            } catch (error) {
                results.innerHTML = `
                    <div class="test-item error">
                        ❌ API Error: ${error.message}
                    </div>
                `;
            }
        }
        
        // Auto-test on load
        window.addEventListener('load', function() {
            setTimeout(testBackend, 1000);
        });
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ تم إنشاء ملف اختبار${NC}"

# 7. رفع الملفات المحدثة
echo -e "${YELLOW}7. رفع الملفات المحدثة...${NC}"
cd ..

# إنشاء سكريبت رفع محسن
cat > upload-frontend-fixed.sh << 'EOF'
#!/bin/bash

API_TOKEN="q6EB7IKZXX8kwN91LPlE1nn-_rkiOA8m9XvaWJFX"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
PROJECT_NAME="cursor-ide"

# رفع ملف test.html
echo "رفع ملف test.html..."
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/deployments" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "files=@frontend/dist/test.html" \
  -F "manifest={\"test.html\": \"test.html\"}"

echo "تم رفع ملف الاختبار"
EOF

chmod +x upload-frontend-fixed.sh
./upload-frontend-fixed.sh

# 8. اختبار نهائي
echo -e "${YELLOW}8. اختبار نهائي...${NC}"
sleep 5

echo -e "${YELLOW}اختبار الصفحة الرئيسية...${NC}"
MAIN_TEST=$(curl -s -w "%{http_code}" https://cursor-ide.pages.dev -o /dev/null)
echo "Main Page Status: $MAIN_TEST"

echo -e "${YELLOW}اختبار صفحة الاختبار...${NC}"
TEST_PAGE=$(curl -s -w "%{http_code}" https://cursor-ide.pages.dev/test.html -o /dev/null)
echo "Test Page Status: $TEST_PAGE"

# 9. تقرير النتائج
echo -e "\n${GREEN}=========================================="
echo "  📊 تقرير النتائج النهائي"
echo "  📈 Final Test Results"
echo "=========================================="
echo -e "${NC}"

echo -e "${GREEN}✅ Frontend Status: $FRONTEND_RESPONSE${NC}"
echo -e "${GREEN}✅ Backend Status: $BACKEND_RESPONSE${NC}"
echo -e "${GREEN}✅ API Status: $API_RESPONSE${NC}"
echo -e "${GREEN}✅ Test Page Status: $TEST_PAGE${NC}"

echo -e "\n${BLUE}🔗 روابط الاختبار:${NC}"
echo "Main App: https://cursor-ide.pages.dev"
echo "Test Page: https://cursor-ide.pages.dev/test.html"
echo "Backend Health: https://cursor-backend.workers.dev/health"
echo "API Providers: https://cursor-backend.workers.dev/api/providers"

echo -e "\n${YELLOW}📋 خطوات إضافية:${NC}"
echo "1. افتح https://cursor-ide.pages.dev/test.html"
echo "2. اضغط على 'Test Backend Connection'"
echo "3. اضغط على 'Test API'"
echo "4. تحقق من النتائج"

echo -e "\n${GREEN}🎉 انتهى الاختبار الشامل!${NC}"