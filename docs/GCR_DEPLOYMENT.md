# GCR デプロイガイド

このドキュメントでは、Journeeアプリケーションを Google Container Registry (GCR) にデプロイする手順を説明します。

## 前提条件

- Google Cloud SDK (`gcloud`) がインストールされていること
- Docker がインストールされていること
- GCPプロジェクトが作成されていること
- GCRへのアクセス権限があること

## 初回セットアップ

### 1. gcloud 認証

```bash
# Googleアカウントにログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# Docker認証を設定
gcloud auth configure-docker
```

### 2. 環境変数の設定

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
```

`.zshrc`または`.bashrc`に追加しておくと便利です：

```bash
echo 'export GCP_PROJECT_ID="your-gcp-project-id"' >> ~/.zshrc
source ~/.zshrc
```

## デプロイ方法

### 方法1: NPMスクリプトを使用（推奨）

```bash
# latestタグでデプロイ
npm run deploy:gcr

# 特定のバージョンタグでデプロイ
./scripts/deploy-gcr.sh v1.0.0
```

### 方法2: 手動コマンド

```bash
# 環境変数を設定
export PROJECT_ID="your-gcp-project-id"
export IMAGE_NAME="journee"
export TAG="latest"

# ビルド
docker build -f Dockerfile.prod -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG .

# プッシュ
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG
```

## Cloud Run へのデプロイ

GCRにイメージをプッシュした後、Cloud Runにデプロイできます：

```bash
gcloud run deploy journee \
  --image gcr.io/YOUR_PROJECT_ID/journee:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=your-api-key,NEXTAUTH_URL=https://your-domain.com,NEXTAUTH_SECRET=your-secret,GOOGLE_CLIENT_ID=your-client-id,GOOGLE_CLIENT_SECRET=your-client-secret"
```

### 環境変数

必須の環境変数：

- `GEMINI_API_KEY`: Google Gemini APIキー
- `NEXTAUTH_URL`: アプリケーションのURL（例: `https://journee-xxx.run.app`）
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット（`openssl rand -base64 32`で生成）
- `GOOGLE_CLIENT_ID`: Google OAuth クライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuth クライアントシークレット

## トラブルシューティング

### ビルドエラー: "Spread types may only be created from object types"

このエラーは修正済みです（`lib/utils/storage.ts`の型エラー修正）。最新のコードを使用してください。

### 認証エラー

```bash
# 認証情報を更新
gcloud auth login
gcloud auth configure-docker
```

### プッシュが遅い場合

- ネットワーク接続を確認
- 不要なレイヤーがキャッシュされている場合は、`--no-cache`オプションでビルド：

```bash
docker build --no-cache -f Dockerfile.prod -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG .
```

## バージョン管理のベストプラクティス

1. **セマンティックバージョニングを使用**
   ```bash
   ./scripts/deploy-gcr.sh v1.0.0
   ```

2. **latestタグは開発用、本番は明示的なバージョンタグを使用**
   ```bash
   # 開発環境
   ./scripts/deploy-gcr.sh latest
   
   # 本番環境
   ./scripts/deploy-gcr.sh v1.0.0
   ```

3. **重要なリリースではイメージをタグ付けして保持**
   ```bash
   # 複数のタグを付ける
   docker tag gcr.io/$PROJECT_ID/journee:v1.0.0 gcr.io/$PROJECT_ID/journee:stable
   docker push gcr.io/$PROJECT_ID/journee:stable
   ```

## コスト最適化

- 古いイメージを定期的に削除
- [GCR Lifecycle Policies](https://cloud.google.com/container-registry/docs/managing-images#deleting_images) を設定

```bash
# 古いイメージを一覧表示
gcloud container images list-tags gcr.io/$PROJECT_ID/journee

# 特定のイメージを削除
gcloud container images delete gcr.io/$PROJECT_ID/journee:TAG --quiet
```

## 関連ドキュメント

- [Google Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Standalone Output](https://nextjs.org/docs/advanced-features/output-file-tracing)

