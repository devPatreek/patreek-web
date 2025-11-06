#!/bin/bash

# Test script to check article endpoint
ARTICLE_ID=156287
BASE_URL="https://patreekbackend-env.eba-ifvfvi7q.us-east-1.elasticbeanstalk.com"

echo "Testing article endpoint for ID: $ARTICLE_ID"
echo "=========================================="
echo ""

# Test with verbose output
echo "1. Testing with -v (verbose):"
curl -v --max-time 10 "$BASE_URL/api/v1/feeds/$ARTICLE_ID" \
  -H "Accept: application/json" \
  2>&1 | head -30

echo ""
echo "=========================================="
echo ""

# Test with -i (include headers)
echo "2. Testing with -i (include headers):"
curl -i --max-time 10 "$BASE_URL/api/v1/feeds/$ARTICLE_ID" \
  -H "Accept: application/json" \
  2>&1 | head -30

echo ""
echo "=========================================="
echo ""

# Test just status code
echo "3. Testing just status code:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/api/v1/feeds/$ARTICLE_ID" -H "Accept: application/json")
echo "HTTP Status Code: $HTTP_CODE"

echo ""
echo "=========================================="
echo ""

# Check if article is in public feed
echo "4. Checking if article appears in public feed list:"
curl -s "$BASE_URL/api/v1/feeds/public" \
  -H "Accept: application/json" \
  | grep -o "\"id\":$ARTICLE_ID" && echo "Found in public feed!" || echo "Not found in public feed"

