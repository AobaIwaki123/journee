# Journee

AIとともに旅のしおりを作成するアプリケーション

![](./images/toppage.png)

## 📋 プロジェクト概要

Journeeは、AIアシスタントと対話しながら旅行計画を立て、美しい旅のしおりを自動生成するWebアプリケーションです。チャット形式で旅行の希望を伝えるだけで、AIが最適な旅程を提案し、リアルタイムで旅のしおりを作成します。

## ✨ 主な機能

- **AIチャット機能**: 左側のチャットボックスでAIと対話しながら旅行計画を作成
- **リアルタイムプレビュー**: 右側に旅のしおりをリアルタイムでレンダリング
- **Googleログイン**: Googleアカウントで簡単ログイン
- **一時保存機能**: 作成中のしおりをユーザーごとに自動保存
- **PDF出力**: 完成した旅のしおりをPDFとして保存・印刷
- **レスポンシブデザイン**: モバイル対応の最適化されたレイアウト
- **AIモデル選択**: 基本はGemini API、本格利用時はClaude APIに切り替え可能
- **APIキー管理**: UI上からClaudeのAPIキーを登録・管理

## 🔧 開発環境セットアップ

### 🐳 Docker環境（推奨）

ローカル環境を汚さずに開発できます。

```bash
# リポジトリのクローン
git clone <repository-url>
cd journee

# 環境変数の設定
cp .env.example .env.local

# Dockerコンテナの起動
npm run docker:start

# ブラウザでアクセス
# http://localhost:3000
```

**詳細は [DOCKER.md](./DOCKER.md) を参照してください。**

### ローカル環境

```bash
# リポジトリのクローン
git clone <repository-url>
cd journee

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localにAPIキーを設定

# 開発サーバーの起動
npm run dev
```

### 必要な環境変数
```
# AI API
GEMINI_API_KEY=your_gemini_api_key

# 認証
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key

# データベース（Phase 9以降）
DATABASE_URL=your_database_url
```

## 📄 ライセンス

MIT

## 👥 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

---

**最終更新**: 2025-10-07
