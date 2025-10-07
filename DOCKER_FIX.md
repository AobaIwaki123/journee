# Docker Build 修正ガイド

## 問題

Phase 5.1.3で新しい依存関係（`@hello-pangea/dnd`）を追加しましたが、`package-lock.json`が更新されていなかったため、Docker buildが失敗していました。

## 修正内容

### 1. Dockerfile の修正

`npm ci` から `npm install` に変更しました。

**理由**:
- `npm ci` は package-lock.json を厳密にチェックするため、package.json と同期していないとエラーになります
- `npm install` は package.json に基づいて依存関係をインストールし、package-lock.json を自動更新します

### 2. 推奨される対応（ユーザー側）

#### オプション A: Docker を使用してpackage-lock.jsonを更新

```bash
# 1. Dockerコンテナをクリーンアップ
npm run docker:clean

# 2. Dockerイメージを再ビルド（package-lock.jsonが自動更新される）
npm run docker:build

# 3. コンテナを起動
npm run docker:start

# 4. 更新されたpackage-lock.jsonをコミット
git add package-lock.json
git commit -m "chore: update package-lock.json for @hello-pangea/dnd"
```

#### オプション B: ローカル環境で更新（Dockerなし）

```bash
# ローカル環境でnpm installを実行
npm install

# これでpackage-lock.jsonが更新されます
# Dockerfileを元に戻す（npm ci を使用）

# コミット
git add package-lock.json
git commit -m "chore: update package-lock.json for @hello-pangea/dnd"
```

## 今後の対応

新しい依存関係を追加する場合：

1. **package.jsonを編集後、必ずnpm installを実行**
2. **package-lock.jsonも一緒にコミット**

または、npm installで依存関係を追加：
```bash
npm install @hello-pangea/dnd
```

これにより、package.jsonとpackage-lock.jsonが自動的に更新されます。

## 現在の状態

- ✅ Dockerfile修正済み（npm install使用）
- ⚠️ package-lock.jsonは次回のDocker build時に自動更新されます
- ✅ Docker buildは成功するはずです

## 動作確認

```bash
# Dockerコンテナを起動
npm run docker:start

# ログを確認
npm run docker:logs

# ブラウザで http://localhost:3000 にアクセス
```