# よく使うコマンド一覧

## 開発コマンド

### 起動・ビルド
```bash
npm run dev              # 開発サーバー起動（http://localhost:3000）
npm run build            # 本番ビルド
npm start                # 本番モードで起動
```

### コード品質チェック
```bash
npm run lint             # ESLintによるLint
npm run type-check       # TypeScript型チェック（ビルドなし）
```

### テスト実行
```bash
npm test                 # Jestユニットテスト実行
npm run test:watch       # テストをwatchモードで実行
npm run test:coverage    # カバレッジ付きテスト

npm run test:e2e         # Playwright E2Eテスト
npm run test:e2e:ui      # E2EテストをUIモードで実行
npm run test:e2e:debug   # E2Eテストをデバッグモードで実行

npm run test:all         # すべてのテスト実行（ユニット + E2E）
```

## Docker関連

```bash
npm run docker:start     # Docker開発環境起動
npm run docker:stop      # Docker環境停止
npm run docker:restart   # Docker環境再起動
npm run docker:logs      # ログ表示
npm run docker:shell     # コンテナ内シェル起動
npm run docker:build     # イメージ再ビルド
npm run docker:clean     # クリーンアップ
npm run docker:status    # 稼働状況確認
```

## デプロイ・リリース

```bash
npm run deploy:gcr       # Google Cloud Runへデプロイ
npm run release          # バージョンタグ付け
npm run k8s:clean        # Kubernetesマニフェストクリーンアップ
```

## データベース関連

```bash
npm run seed:mock-users  # モックユーザーデータシード
```

## よく使うgitコマンド（Darwin/macOS）

```bash
git status               # 変更状態確認
git diff                 # 差分確認
git add .                # すべての変更をステージング
git commit -m "message"  # コミット
git push                 # プッシュ
git pull                 # プル

git log --oneline        # コミット履歴（簡易）
git branch               # ブランチ一覧
git checkout -b branch   # 新規ブランチ作成・切り替え
```

## Darwin/macOS システムコマンド

```bash
ls -la                   # ファイル一覧（隠しファイル含む）
cd directory             # ディレクトリ移動
pwd                      # カレントディレクトリ表示
cat file                 # ファイル内容表示
grep "pattern" file      # パターン検索
find . -name "*.ts"      # ファイル検索
open .                   # Finderで現在のディレクトリを開く
```

## タスク完了時の推奨コマンド

```bash
# 1. 型チェック
npm run type-check

# 2. Lint
npm run lint

# 3. テスト（適宜）
npm run test             # ユニットテストのみ
npm run test:e2e         # E2Eテストのみ
npm run test:all         # すべてのテスト

# 4. ビルド確認
npm run build
```

## 環境変数

開発時に必要な環境変数は `.env.local` に設定:

```bash
# Google Gemini API
GEMINI_API_KEY=your_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```
