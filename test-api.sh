#!/bin/bash

echo "Testing backend API connectivity..."
echo ""

API_BASE="https://patreekbackend-env.eba-ifvfvi7q.us-east-1.elasticbeanstalk.com"

echo "1. Testing public feeds endpoint..."
curl -s --max-time 15 "${API_BASE}/api/v1/feeds/public" | head -20
echo ""
echo ""

echo "2. Testing specific article (ID: 156264)..."
curl -s --max-time 15 "${API_BASE}/api/v1/feeds/public/156264" | head -50
echo ""
echo ""

echo "3. Testing with verbose output for article 156264..."
curl -v --max-time 15 "${API_BASE}/api/v1/feeds/public/156264" 2>&1 | head -40

