#!/bin/bash

API_TOKEN="avRH6WSd0ueXkJqbQpDdnseVo9fy-fUSIJ1pdrWC"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"
PROJECT_NAME="cursor-ide"

echo "رفع Frontend إلى Cloudflare Pages..."

# رفع الملفات مباشرة
cd frontend/dist

# رفع index.html
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/assets/index.html" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @index.html

# رفع CSS
if [ -f "assets/index.css" ]; then
  curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/assets/index.css" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: text/css" \
    --data-binary @assets/index.css
fi

# رفع JS
if [ -f "assets/index.js" ]; then
  curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/assets/index.js" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/javascript" \
    --data-binary @assets/index.js
fi

echo "تم رفع Frontend بنجاح!"
echo "Frontend URL: https://cursor-ide.pages.dev"
