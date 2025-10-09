# 🐳 Docker開発環境

Journeeのローカル開発環境をDockerで構築する手順です。ローカル環境を汚さずに開発できます。

## 📋 必要な環境

- Docker Desktop (Mac/Windows) または Docker Engine (Linux)
- Docker Compose v2+

## 🚀 クイックスタート

### 1. 環境変数の設定

```bash
# .env.exampleから.env.localを作成
cp .env.example .env.local

# .env.localを編集（必要に応じて）
# 現時点ではデフォルト値のままでOK
```

### 2. Dockerコンテナの起動

```bash
# npmスクリプトを使用（推奨）
npm run docker:start

# または直接docker-composeを使用
docker-compose up -d
```

### 3. アプリケーションにアクセス

ブラウザで以下にアクセス：
**http://localhost:3000**

## 📝 よく使うコマンド

### npmスクリプト経由（推奨）

```bash
# コンテナ起動
npm run docker:start

# コンテナ停止
npm run docker:stop

# コンテナ再起動
npm run docker:restart

# ログ確認
npm run docker:logs

# コンテナ内のシェルに接続
npm run docker:shell

# イメージ再ビルド
npm run docker:build

# コンテナとボリュームを削除（クリーンアップ）
npm run docker:clean

# コンテナの状態確認
npm run docker:status
```
