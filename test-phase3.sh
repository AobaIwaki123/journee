#!/bin/bash

###############################################################################
# Phase 3 統合テストスクリプト
# 
# このスクリプトはPhase 3のAI統合機能をテストします。
# 
# 使用方法:
#   1. 開発サーバーを起動: npm run dev
#   2. 別のターミナルでこのスクリプトを実行: ./test-phase3.sh
###############################################################################

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# テスト結果のカウンター
PASSED=0
FAILED=0
TOTAL=0

# ヘッダー
echo ""
echo "=========================================="
echo "🧪 Phase 3 統合テスト"
echo "=========================================="
echo ""

# テスト関数
test_api() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local data=$4
  local expected=${5:-200}
  
  ((TOTAL++))
  echo -n "  [$TOTAL] $name... "
  
  if [ -z "$data" ]; then
    response=$(curl -s -o /tmp/test-response.json -w "%{http_code}" -X $method $url 2>/dev/null)
  else
    response=$(curl -s -o /tmp/test-response.json -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" $url 2>/dev/null)
  fi
  
  if [ "$response" == "$expected" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌ FAILED (Expected: $expected, Got: $response)${NC}"
    ((FAILED++))
    return 1
  fi
}

# 環境変数チェック
echo "📋 Step 1: Environment Check"
echo "=========================================="

if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local file not found!${NC}"
  echo "Please create .env.local with GEMINI_API_KEY"
  exit 1
fi

if ! grep -q "GEMINI_API_KEY" .env.local; then
  echo -e "${RED}❌ GEMINI_API_KEY not found in .env.local!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ .env.local exists${NC}"
echo -e "${GREEN}✅ GEMINI_API_KEY is set${NC}"
echo ""

# サーバーチェック
echo "🚀 Step 2: Server Check"
echo "=========================================="

if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo -e "${RED}❌ Server is not running!${NC}"
  echo ""
  echo "Please start the server with:"
  echo "  npm run dev"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Server is running on http://localhost:3000${NC}"
echo ""

# APIテスト
echo "🔌 Step 3: API Endpoint Tests"
echo "=========================================="

test_api "Health check" "http://localhost:3000/api/health"

test_api "Chat API - Simple greeting" \
  "http://localhost:3000/api/chat" \
  "POST" \
  '{"message":"こんにちは","stream":false}'

test_api "Chat API - Travel planning" \
  "http://localhost:3000/api/chat" \
  "POST" \
  '{"message":"東京で3日間の旅行計画を立てたいです","stream":false}'

echo ""

# レスポンス内容チェック
echo "📝 Step 4: Response Content Tests"
echo "=========================================="

((TOTAL++))
echo -n "  [$TOTAL] Checking chat response format... "

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"テスト","stream":false}' \
  -o /tmp/test-response.json 2>/dev/null

if command -v jq &> /dev/null; then
  if jq -e '.message' /tmp/test-response.json > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAILED (No 'message' field)${NC}"
    ((FAILED++))
  fi
else
  echo -e "${YELLOW}⚠️  SKIPPED (jq not installed)${NC}"
fi

echo ""

# ストリーミングテスト
echo "📡 Step 5: Streaming Test"
echo "=========================================="

((TOTAL++))
echo -n "  [$TOTAL] Checking streaming response... "

response=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"テスト","stream":true}' \
  --max-time 10 2>/dev/null | head -n 1)

if [[ $response == data:* ]]; then
  echo -e "${GREEN}✅ PASSED${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ FAILED (No streaming data)${NC}"
  ((FAILED++))
fi

echo ""

# エラーハンドリングテスト
echo "🛡️  Step 6: Error Handling Tests"
echo "=========================================="

test_api "Empty message" \
  "http://localhost:3000/api/chat" \
  "POST" \
  '{"message":"","stream":false}' \
  "400"

test_api "Invalid request (no message)" \
  "http://localhost:3000/api/chat" \
  "POST" \
  '{"stream":false}' \
  "400"

echo ""

# 結果サマリー
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo ""
echo "  Total Tests:  $TOTAL"
echo -e "  ${GREEN}Passed:       $PASSED${NC}"
echo -e "  ${RED}Failed:       $FAILED${NC}"
echo ""

# 成功率を計算
if [ $TOTAL -gt 0 ]; then
  success_rate=$((PASSED * 100 / TOTAL))
  echo "  Success Rate: $success_rate%"
  echo ""
fi

# 最終判定
if [ $FAILED -eq 0 ]; then
  echo "=========================================="
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  echo "=========================================="
  echo ""
  echo "✅ Phase 3 integration is working correctly!"
  echo ""
  exit 0
else
  echo "=========================================="
  echo -e "${YELLOW}⚠️  Some tests failed${NC}"
  echo "=========================================="
  echo ""
  echo "Please check the following:"
  echo "  1. Server is running (npm run dev)"
  echo "  2. GEMINI_API_KEY is valid"
  echo "  3. Check server logs for errors"
  echo ""
  exit 1
fi
