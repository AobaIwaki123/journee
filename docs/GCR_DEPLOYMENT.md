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

デプロイ前に以下の環境変数を設定する必要があります：

```bash
# GCPプロジェクト設定
export GCP_PROJECT_ID="your-gcp-project-id"

# Next.jsのNEXT_PUBLIC_環境変数（ビルド時に必要）
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
export NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
export NEXT_PUBLIC_ENABLE_MOCK_AUTH="false"  # 本番環境ではfalse
```

**重要**: `NEXT_PUBLIC_`で始まる環境変数はビルド時にクライアントサイドコードにバンドルされるため、Dockerイメージビルド時に設定する必要があります。

`.zshrc`または`.bashrc`に追加しておくと便利です：

```bash
echo 'export GCP_PROJECT_ID="your-gcp-project-id"' >> ~/.zshrc
echo 'export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"' >> ~/.zshrc
echo 'export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"' >> ~/.zshrc
echo 'export NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"' >> ~/.zshrc
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

# ビルド（NEXT_PUBLIC_環境変数をビルド引数として渡す）
docker build \
  -f Dockerfile.prod \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" \
  --build-arg NEXT_PUBLIC_ENABLE_MOCK_AUTH="false" \
  -t gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG \
  .

# プッシュ
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:$TAG
```

### 環境変数

#### ビルド時に必要な環境変数（`NEXT_PUBLIC_`プレフィックス）

これらは`deploy-gcr.sh`実行前に設定が必要：

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps APIキー
- `NEXT_PUBLIC_ENABLE_MOCK_AUTH`: モック認証の有効化（本番では`false`）

#### ランタイム環境変数（K8s Secretで設定）

これらはK8sマニフェストで設定：

- `GEMINI_API_KEY`: Google Gemini APIキー
- `NEXTAUTH_URL`: アプリケーションのURL（例: `https://journee.aooba.net`）
- `NEXTAUTH_SECRET`: NextAuth.jsのシークレット（`openssl rand -base64 32`で生成）
- `GOOGLE_CLIENT_ID`: Google OAuth クライアントID
- `GOOGLE_CLIENT_SECRET`: Google OAuth クライアントシークレット
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key

#### 重要な注意事項

**Next.jsの環境変数の仕組み**:
- `NEXT_PUBLIC_`で始まる環境変数は、**ビルド時**にクライアントサイドのJavaScriptコードにハードコードされます
- ランタイムで環境変数を変更しても、すでにビルドされたコードには反映されません
- そのため、`NEXT_PUBLIC_`環境変数を変更する場合は、必ずDockerイメージの再ビルドが必要です

**セキュリティ**:
- `NEXT_PUBLIC_`環境変数はクライアントに公開されるため、機密情報を含めないでください
- APIキーやシークレットは、サーバーサイドのみで使用される環境変数として設定してください
