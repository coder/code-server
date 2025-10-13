#!/bin/bash

echo "🔍 اختبار سريع للتطبيق..."

# اختبار الواجهة الأمامية
echo "1. اختبار الواجهة الأمامية..."
curl -s https://cursor-ide.pages.dev | head -5

# اختبار الباكيند
echo "2. اختبار الباكيند..."
curl -s https://cursor-backend.workers.dev/health

echo "3. اختبار APIs..."
curl -s https://cursor-backend.workers.dev/api/providers

echo "✅ انتهى الاختبار"