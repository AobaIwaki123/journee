#!/bin/bash

# GCR デプロイスクリプト
# 使い方: ./scripts/deploy-gcr.sh [tag]
# 例: ./scripts/deploy-gcr.sh v1.0.0

set -e

# デフォルト値
PROJECT_ID=${GCP_PROJECT_ID:-"my-docker-471807"}
IMAGE_NAME="journee"
TAG=${1:-"latest"}

echo "🚀 GCR デプロイ開始"
echo "================================"
echo "📦 プロジェクト: $PROJECT_ID"
echo "🏷️  イメージ名: $IMAGE_NAME"
echo "🔖 タグ: $TAG"
echo "================================"

# ビルド
echo ""
echo "📦 Dockerイメージをビルド中..."
docker build -f Dockerfile.prod -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG .

# プッシュ
echo ""
echo "☁️  GCRにプッシュ中..."
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG

# 完了
echo ""
echo "✅ デプロイ完了！"
echo "📍 イメージ: gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG"
echo ""
echo "🚢 Cloud Runにデプロイするには:"
echo "gcloud run deploy journee \\"
echo "  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG \\"
echo "  --platform managed \\"
echo "  --region asia-northeast1 \\"
echo "  --allow-unauthenticated \\"
echo "  --set-env-vars \"GEMINI_API_KEY=your-api-key,NEXTAUTH_URL=https://your-domain.com,NEXTAUTH_SECRET=your-secret\""

