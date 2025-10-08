# テストデバッグガイド

## 1. テスト実行コマンド

```bash
# 詳細なエラー情報を表示
npm run test:e2e -- --reporter=list

# または、UIモードで実行（推奨）
npm run test:e2e:ui
```

## 2. よくある問題と解決策

### 問題1: ブラウザがインストールされていない
```bash
# ブラウザを再インストール
npx playwright install chromium
```

### 問題2: 開発サーバーが起動しない
```bash
# ポート3000が使用中の場合
lsof -ti:3000 | xargs kill -9

# 手動で開発サーバーを起動してテスト
npm run dev
# 別のターミナルで
npm run test:e2e
```

### 問題3: 認証エラー
環境変数が設定されていない可能性があります。

`.env.local`ファイルを確認：
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 問題4: キャッシュの問題
```bash
# Next.jsのキャッシュをクリア
rm -rf .next
npm run build

# Playwrightのキャッシュをクリア
rm -rf test-results playwright-report
```

## 3. エラーログの確認方法

### スクリーンショットを確認
```bash
# test-resultsディレクトリ内のスクリーンショットを確認
ls -la test-results/*/
```

### HTMLレポートを開く
```bash
npx playwright show-report
```

### デバッグモードで実行
```bash
npm run test:e2e:debug
```

## 4. 実際のエラー内容を確認

以下のコマンドを実行して、出力をすべてコピーしてください：

```bash
npm run test:e2e 2>&1 | tee test-output.log
cat test-output.log
```

## 5. システム情報の確認

```bash
# Node.jsバージョン
node -v

# npmバージョン
npm -v

# Playwrightバージョン
npx playwright --version

# OSバージョン
uname -a
```

## 6. テストを個別に実行

```bash
# 1つずつテストを実行
npx playwright test e2e/map-toggle.spec.ts:12 --debug
npx playwright test e2e/map-toggle.spec.ts:25 --debug
npx playwright test e2e/map-toggle.spec.ts:83 --debug
```

## 現在のステータス

私の環境では全てのテストが成功しています：
- ✓ しおりが存在しない場合、地図切り替えボタンは表示されない
- ✓ 位置情報なしのしおりの場合、地図切り替えボタンは表示されない
- ✓ 位置情報ありのしおりの場合、地図切り替えボタンが表示される
- ✓ 地図切り替えボタンのクリック動作
- ✓ hasLocations関数のデバッグ

もし上記の対応で解決しない場合は、実際のエラーメッセージをお送りください。
