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

### docker-compose直接実行

```bash
# コンテナ起動（デタッチモード）
docker-compose up -d

# コンテナ起動（ログ表示）
docker-compose up

# コンテナ停止
docker-compose down

# ログ確認
docker-compose logs -f app

# コンテナ内でコマンド実行
docker-compose exec app npm run lint
docker-compose exec app npm run build

# シェルに接続
docker-compose exec app sh
```

## 🔧 トラブルシューティング

### ポート3000が既に使用されている

```bash
# 既存のプロセスを確認
lsof -i :3000

# docker-compose.ymlのポート番号を変更
ports:
  - "3001:3000"  # 3001など別のポートに変更
```

### ホットリロードが動作しない

Dockerの設定で以下が有効になっています：
- ソースコードのボリュームマウント
- `WATCHPACK_POLLING=true` 環境変数

それでも動作しない場合：

```bash
# コンテナを再起動
npm run docker:restart
```

### node_modulesの問題

```bash
# コンテナとボリュームを削除して再構築
npm run docker:clean
npm run docker:build
npm run docker:start
```

### イメージを完全にクリーンビルド

```bash
# すべて削除
docker-compose down -v
docker rmi journee-app

# 再ビルド
docker-compose build --no-cache
docker-compose up -d
```

## 📂 Docker構成

### ファイル構成

```
workspace/
├── Dockerfile              # 開発用Dockerfile
├── Dockerfile.prod         # 本番用Dockerfile（Phase 11で使用）
├── docker-compose.yml      # Docker Compose設定
├── .dockerignore          # Docker除外ファイル
└── scripts/
    └── docker-dev.sh      # Docker管理スクリプト
```

### ボリュームマウント

- **ソースコード**: ホストとコンテナで同期（ホットリロード対応）
- **node_modules**: 匿名ボリューム（コンテナ内で独立管理）
- **.next**: 匿名ボリューム（ビルドキャッシュ）

## 🎯 開発フロー

### 通常の開発

```bash
# 1. コンテナ起動
npm run docker:start

# 2. ブラウザでアクセス
# http://localhost:3000

# 3. コードを編集
# エディタでファイルを編集すると自動でリロードされます

# 4. ログ確認
npm run docker:logs

# 5. 開発終了時
npm run docker:stop
```

### デバッグ

```bash
# コンテナ内でコマンド実行
docker-compose exec app npm run lint
docker-compose exec app npm run build

# シェルに接続してデバッグ
npm run docker:shell

# コンテナ内で
> npm run lint
> npm run build
> ls -la
```

### 依存パッケージの追加

```bash
# 方法1: ホストでpackage.jsonを編集後、コンテナを再ビルド
npm run docker:build
npm run docker:start

# 方法2: コンテナ内で直接インストール
docker-compose exec app npm install <package-name>
```

## 🏗️ 本番環境ビルド（Phase 11で使用）

```bash
# 本番用イメージをビルド
docker build -f Dockerfile.prod -t journee:prod .

# 本番用コンテナを起動
docker run -p 3000:3000 journee:prod
```

## 🌐 環境変数

`.env.local`ファイルで環境変数を設定：

```env
# 開発時は不要（Phase 3以降で使用）
GEMINI_API_KEY=your_gemini_api_key

# Phase 2以降で使用
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 📊 リソース使用状況の確認

```bash
# コンテナの状態
docker-compose ps

# リソース使用状況
docker stats journee-dev

# ディスク使用量
docker system df
```

## 🧹 クリーンアップ

```bash
# プロジェクトのコンテナとボリュームを削除
npm run docker:clean

# Docker全体のクリーンアップ（注意: 他のプロジェクトにも影響）
docker system prune -a --volumes
```

## ✅ メリット

- ✨ ローカル環境を汚さない
- 🔄 チーム全体で統一された開発環境
- 🚀 簡単なセットアップ
- 🐛 デバッグが容易
- 📦 依存関係の分離
- 🔒 本番環境に近い環境でのテスト

## 📚 参考資料

- [Next.js with Docker](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
