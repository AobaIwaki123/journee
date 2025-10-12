#!/bin/bash

# OGP画像生成テストスクリプト
# 
# 使用方法:
#   1. 開発サーバーを起動: npm run dev
#   2. このスクリプトを実行: bash scripts/test-ogp.sh

echo "🔍 OGP画像生成テスト"
echo "===================="
echo ""

# ポート確認
PORT=${1:-3000}
BASE_URL="http://localhost:$PORT"

echo "📍 テスト対象: $BASE_URL"
echo ""

# 開発サーバーの起動確認
echo "1️⃣ 開発サーバー接続確認..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|301\|302"; then
    echo "✅ 開発サーバーが起動しています"
else
    echo "❌ 開発サーバーに接続できません"
    echo "   → npm run dev で開発サーバーを起動してください"
    exit 1
fi
echo ""

# デフォルトOGP画像のテスト
echo "2️⃣ デフォルトOGP画像 (/api/og/default)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/og/default")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
CONTENT_TYPE=$(curl -s -I "$BASE_URL/api/og/default" | grep -i "content-type" | cut -d' ' -f2-)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTPステータス: $HTTP_CODE"
    echo "✅ Content-Type: $CONTENT_TYPE"
    
    # 画像サイズ確認
    IMAGE_SIZE=$(curl -s "$BASE_URL/api/og/default" | wc -c)
    echo "✅ 画像サイズ: $IMAGE_SIZE bytes"
    
    # キャッシュヘッダー確認
    CACHE_CONTROL=$(curl -s -I "$BASE_URL/api/og/default" | grep -i "cache-control" | cut -d' ' -f2-)
    echo "✅ Cache-Control: $CACHE_CONTROL"
else
    echo "❌ HTTPステータス: $HTTP_CODE"
    echo "   → エラーが発生しています"
fi
echo ""

# しおりOGP画像のテスト（存在する場合）
echo "3️⃣ しおりOGP画像 (/api/og?slug=test)..."
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/og?slug=test-slug")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTPステータス: $HTTP_CODE"
    echo "✅ しおりOGP画像の生成に成功"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  HTTPステータス: $HTTP_CODE (Not Found)"
    echo "   → test-slug のしおりが存在しません（正常な動作）"
else
    echo "❌ HTTPステータス: $HTTP_CODE"
fi
echo ""

# メタデータ確認
echo "4️⃣ ページのメタデータ確認..."

# トップページ
echo "   📄 トップページ (/)..."
if curl -s "$BASE_URL" | grep -q 'property="og:image".*content="/api/og/default"'; then
    echo "   ✅ デフォルトOGP画像が設定されています"
else
    echo "   ⚠️  OGP画像のメタタグが見つかりません"
fi

# マイページ（認証なしなのでリダイレクトされる可能性あり）
echo "   📄 マイページ (/mypage)..."
if curl -s -L "$BASE_URL/mypage" | grep -q 'property="og:image"'; then
    echo "   ✅ OGP画像のメタタグがあります"
else
    echo "   ℹ️  認証が必要なページです"
fi

# しおり一覧
echo "   📄 しおり一覧 (/itineraries)..."
if curl -s "$BASE_URL/itineraries" | grep -q 'property="og:image".*content="/api/og/default"'; then
    echo "   ✅ デフォルトOGP画像が設定されています"
else
    echo "   ⚠️  OGP画像のメタタグが見つかりません"
fi

echo ""
echo "✨ テスト完了"
echo ""
echo "📋 次のステップ:"
echo "   1. ブラウザで以下のURLにアクセスして画像を確認:"
echo "      → $BASE_URL/api/og/default"
echo ""
echo "   2. OGP検証ツールでテスト:"
echo "      → https://developers.facebook.com/tools/debug/"
echo "      → https://cards-dev.twitter.com/validator"
echo ""
echo "   3. 公開しおりがある場合:"
echo "      → $BASE_URL/api/og?slug=YOUR_SLUG"
echo ""
