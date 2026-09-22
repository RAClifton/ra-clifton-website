#!/bin/bash

set -e

echo "🔍 Vercel Deployment Verification Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get inputs
read -p "Enter Vercel preview URL (e.g., https://ra-clifton-website-abc.vercel.app): " PREVIEW_URL
read -p "Enter admin token (e.g., rac_insights_...): " TOKEN

PREVIEW_URL="${PREVIEW_URL%/}"  # Remove trailing slash
PROD_URL="https://raclifton.com"

echo ""
echo "Testing Preview Deployment: $PREVIEW_URL"
echo "========================================"

# Test 1: Check if preview is up
echo ""
echo "1. Checking if preview deployment is live..."
if curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL" > /tmp/status.txt; then
  STATUS=$(cat /tmp/status.txt)
  if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Preview is live (HTTP 200)${NC}"
  else
    echo -e "${RED}✗ Preview returned HTTP $STATUS${NC}"
  fi
fi

# Test 2: Insights listing (public, no auth needed)
echo ""
echo "2. Testing GET /api/insights (public)..."
RESPONSE=$(curl -s "$PREVIEW_URL/api/insights")
if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
  COUNT=$(echo "$RESPONSE" | jq '.insights | length')
  echo -e "${GREEN}✓ API responding. Found $COUNT published insights${NC}"
else
  echo -e "${RED}✗ API not responding or invalid JSON${NC}"
  echo "Response: $RESPONSE"
fi

# Test 3: Create insight (requires token)
echo ""
echo "3. Testing POST /api/insights (admin, requires token)..."
CREATE_RESPONSE=$(curl -s -X POST "$PREVIEW_URL/api/insights" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "production-verify-'$(date +%s)'",
    "title": "Production Verification Test",
    "body": "This insight was created during production verification.",
    "author": "Deployment Verification"
  }')

if echo "$CREATE_RESPONSE" | jq . > /dev/null 2>&1; then
  INSIGHT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')
  if [ -n "$INSIGHT_ID" ]; then
    echo -e "${GREEN}✓ Successfully created insight (ID: ${INSIGHT_ID:0:8}...)${NC}"
    VERIFY_SLUG=$(echo "$CREATE_RESPONSE" | jq -r '.slug')
  else
    ERROR=$(echo "$CREATE_RESPONSE" | jq -r '.error // "Unknown error"')
    echo -e "${RED}✗ Failed to create: $ERROR${NC}"
  fi
else
  echo -e "${RED}✗ Invalid response${NC}"
  echo "Response: $CREATE_RESPONSE"
fi

# Test 4: Listing page
echo ""
echo "4. Testing /insights listing page..."
LISTING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL/insights")
if [ "$LISTING_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Listing page loads (HTTP 200)${NC}"
else
  echo -e "${RED}✗ Listing page returned HTTP $LISTING_STATUS${NC}"
fi

# Test 5: Detail page
echo ""
echo "5. Testing /insights/[slug] detail page..."
DETAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL/insights/ai-strategy-small-business")
if [ "$DETAIL_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Detail page loads (HTTP 200)${NC}"
else
  echo -e "${RED}✗ Detail page returned HTTP $DETAIL_STATUS${NC}"
fi

# Summary
echo ""
echo "========================================"
echo "✅ Verification Complete!"
echo ""
echo "Next steps:"
echo "1. Review the results above"
echo "2. If all tests passed:"
echo "   - Go to Vercel Deployments"
echo "   - Click 'Promote to Production'"
echo "   - Wait for production build to complete"
echo "3. Test production:"
echo "   curl -s https://raclifton.com/api/insights | jq '.insights | length'"
echo ""
