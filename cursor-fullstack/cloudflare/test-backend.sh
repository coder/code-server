#!/bin/bash

echo "🔍 اختبار الباكيند..."

echo "1. اختبار /health:"
curl -s https://cursor-backend.workers.dev/health

echo -e "\n\n2. اختبار /api/providers:"
curl -s https://cursor-backend.workers.dev/api/providers

echo -e "\n\n3. اختبار /api/tools:"
curl -s https://cursor-backend.workers.dev/api/tools

echo -e "\n\n4. اختبار /api/workspace/files:"
curl -s https://cursor-backend.workers.dev/api/workspace/files

echo -e "\n\n✅ انتهى الاختبار"