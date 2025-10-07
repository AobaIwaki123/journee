# 🚀 Journee クイックスタート

## 🐳 Docker環境（推奨）

**ローカル環境を汚さずに開発できます！**

### 前提条件
- Docker Desktop がインストールされていること
  - [Mac版ダウンロード](https://www.docker.com/products/docker-desktop)
  - [Windows版ダウンロード](https://www.docker.com/products/docker-desktop)

### セットアップ（3ステップ）

```bash
# 1. 環境変数ファイルの作成
cp .env.example .env.local

# 2. Dockerコンテナの起動
npm run docker:start

# 3. ブラウザでアクセス
# http://localhost:3000
```

### よく使うコマンド

```bash
# コンテナ起動
npm run docker:start

# ログ確認
npm run docker:logs

# コンテナ停止
npm run docker:stop

# コンテナ再起動
npm run docker:restart

# コンテナ内のシェルに接続
npm run docker:shell

# コンテナとボリュームを削除（クリーンアップ）
npm run docker:clean
```

詳細は [DOCKER.md](./DOCKER.md) を参照してください。

---

## 💻 ローカル環境

Dockerを使わずにローカルで直接開発する場合。

### 前提条件
- Node.js 18+ がインストールされていること

### セットアップ

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 環境変数ファイルの作成
cp .env.example .env.local

# 3. 開発サーバーの起動
npm run dev

# 4. ブラウザでアクセス
# http://localhost:3000
```

### 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lint
npm run lint

# 本番モードで起動
npm run build
npm run start
```

---

## ✅ 動作確認

ブラウザで http://localhost:3000 にアクセスすると：

1. **ヘッダー**: "Journee" ロゴとログインボタンが表示される
2. **左側（40%）**: チャットボックス
   - メッセージを入力してAIと対話（現在はモックレスポンス）
   - AIモデル選択ドロップダウン
3. **右側（60%）**: 旅のしおりプレビュー
   - 初期状態は空（カレンダーアイコンとプレースホルダー）
   - Phase 3のAI統合後に実際のデータが表示される

## 🎯 次のステップ

Phase 1（基礎構築）は完了しています！

次は以下を実装予定：
- **Phase 2**: NextAuth.jsによるGoogleログイン認証
- **Phase 3**: Gemini APIとのAI統合
- **Phase 4**: 一時保存機能（LocalStorage）

## 🆘 トラブルシューティング

### Dockerでポート3000が使えない

```bash
# docker-compose.ymlを編集
ports:
  - "3001:3000"  # 別のポートに変更
```

### ローカルでポート3000が使えない

```bash
# プロセスを確認
lsof -i :3000

# または別のポートで起動
PORT=3001 npm run dev
```

### node_modulesの問題（Docker）

```bash
# クリーンアップして再構築
npm run docker:clean
npm run docker:build
npm run docker:start
```

### node_modulesの問題（ローカル）

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📚 ドキュメント

- [README.md](./README.md) - プロジェクト全体の詳細
- [DOCKER.md](./DOCKER.md) - Docker環境の詳細ガイド

## 🤝 サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
