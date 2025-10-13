#!/bin/bash

# Setup Cloudflare services using API
set -e

API_TOKEN="hRLCKWr1enn1_qvQlpQJjEuSbIZ13LpoKHo-v5nF"
ACCOUNT_ID="76f5b050419f112f1e9c5fbec1b3970d"

echo "Setting up Cloudflare services..."

# Create KV Namespaces
echo "Creating KV Namespaces..."

# API_KEYS namespace
echo "Creating API_KEYS namespace..."
API_KEYS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"API_KEYS"}')

echo "API_KEYS Response: $API_KEYS_RESPONSE"

# FILE_STORAGE_KV namespace
echo "Creating FILE_STORAGE_KV namespace..."
FILE_STORAGE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"FILE_STORAGE_KV"}')

echo "FILE_STORAGE_KV Response: $FILE_STORAGE_RESPONSE"

# SESSIONS namespace
echo "Creating SESSIONS namespace..."
SESSIONS_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/storage/kv/namespaces" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"title":"SESSIONS"}')

echo "SESSIONS Response: $SESSIONS_RESPONSE"

# Create R2 Buckets
echo "Creating R2 Buckets..."

# cursor-files bucket
echo "Creating cursor-files bucket..."
R2_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/r2/buckets" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"cursor-files"}')

echo "R2 Response: $R2_RESPONSE"

echo "Setup complete!"