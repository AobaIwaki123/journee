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

### 環境変数

必須の環境変数：

- `GEMINI_API_KEY`: Google Gemini APIキー
- `NEXTAUTH_URL`: アプリケーションのURL（例: `https://journee-xxx.run.app`）
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット（`openssl rand -base64 32`で生成）
- `GOOGLE_CLIENT_ID`: Google OAuth クライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuth クライアントシークレット
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps APIキー
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key
