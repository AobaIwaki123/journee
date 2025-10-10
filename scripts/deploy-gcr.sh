#!/bin/bash

# GCR デプロイスクリプト
# 使い方: ./scripts/deploy-gcr.sh [tag]
# 例: ./scripts/deploy-gcr.sh v1.0.0

set -e

# デフォルト値
PROJECT_ID=${GCP_PROJECT_ID:-"my-docker-471807"}
IMAGE_NAME="journee"
TAG=${1:-"latest"}

# 環境変数のチェック
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ エラー: NEXT_PUBLIC_SUPABASE_URL が設定されていません"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ エラー: NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" ]; then
  echo "❌ エラー: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません"
  exit 1
fi

echo "🚀 GCR デプロイ開始"
echo "================================"
echo "📦 プロジェクト: $PROJECT_ID"
echo "🏷️  イメージ名: $IMAGE_NAME"
echo "🔖 タグ: $TAG"
echo "================================"

# ビルド
echo ""
echo "📦 Dockerイメージをビルド中..."
docker build \
  -f Dockerfile.prod \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" \
  --build-arg NEXT_PUBLIC_ENABLE_MOCK_AUTH="${NEXT_PUBLIC_ENABLE_MOCK_AUTH:-false}" \
  -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG \
  .

# プッシュ
echo ""
echo "☁️  GCRにプッシュ中..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG
