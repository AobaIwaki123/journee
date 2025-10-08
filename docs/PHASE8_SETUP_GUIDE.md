# Phase 8: データベース統合 - セットアップガイド

## 🎯 目的

このガイドでは、Phase 8で実装したSupabaseデータベース統合機能のセットアップ方法を説明します。

---

## ✅ 前提条件

- Node.js 18+ がインストールされていること
- npm 9+ がインストールされていること
- Googleアカウント（Supabase登録用）
- Phase 1-7の実装が完了していること

---

## 📝 セットアップ手順

### ステップ1: Supabaseプロジェクトの確認・作成

#### 既存プロジェクトの確認
プロジェクトには既にSupabaseプロジェクトが設定されています：
- URL: `https://wbyjomvjpsuqlbhyxomy.supabase.co`

#### 新規作成する場合
1. [Supabase](https://supabase.com/) にアクセス
2. 「Start your project」をクリック
3. Googleアカウントでサインイン
4. 「New project」をクリック
5. 以下を入力：
   - **Name**: journee（または任意の名前）
   - **Database Password**: 強固なパスワードを設定（保存しておく）
   - **Region**: Northeast Asia (Tokyo) 推奨
6. 「Create new project」をクリック
7. プロジェクトの準備が完了するまで待つ（1-2分）

---

### ステップ2: APIキーの取得

1. Supabaseダッシュボードで作成したプロジェクトを開く
2. 左サイドバーから **Settings** → **API** をクリック
3. 以下の2つのキーをコピー：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **注意**: `service_role` キーは非常に強力な権限を持つため、**絶対に公開しないでください**。

---

### ステップ3: 環境変数の設定

1. プロジェクトルートに `.env.local` ファイルを作成（既にある場合は編集）

```bash
cp .env.example .env.local
```

2. `.env.local` に以下を追加：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. `xxxxx` と `eyJ...` を実際のプロジェクトURL・キーに置き換える

---

### ステップ4: SQLスクリプトの実行

#### 4.1 スキーマ作成

1. Supabaseダッシュボードで **SQL Editor** を開く
2. 「New query」をクリック
3. `lib/db/schema.sql` の内容を全てコピー＆ペースト
4. 「Run」をクリックして実行
5. エラーがないことを確認

#### 4.2 RPC関数作成

1. 同じく **SQL Editor** で新しいクエリを作成
2. `lib/db/functions.sql` の内容を全てコピー＆ペースト
3. 「Run」をクリックして実行
4. エラーがないことを確認

#### 確認方法

- **Table Editor** で以下のテーブルが作成されていることを確認：
  - `users`
  - `itineraries`
  - `day_schedules`
  - `tourist_spots`
  - `chat_messages`
  - `user_settings`

---

### ステップ5: パッケージのインストール

```bash
npm install @supabase/supabase-js
```

（既にインストール済みの場合はスキップ）

---

### ステップ6: アプリケーションの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く

---

### ステップ7: 接続テスト

#### 7.1 ブラウザコンソールで確認

1. ブラウザのデベロッパーツールを開く（F12）
2. Consoleタブを開く
3. 以下を入力して実行：

```javascript
import { testSupabaseConnection } from '@/lib/db/supabase';
await testSupabaseConnection();
```

4. `true` が返ればOK！

#### 7.2 ログインして確認

1. アプリケーションにGoogleアカウントでログイン
2. LocalStorageにしおりデータがある場合、マイグレーションプロンプトが表示される
3. 「今すぐ移行」をクリックしてマイグレーション実行
4. 成功メッセージが表示されればOK！

---

## 🧪 動作確認

### 1. しおりの作成

1. チャットでAIに旅程を作成してもらう
2. しおりが自動的にデータベースに保存される

### 2. しおりの一覧表示

1. ヘッダーの「しおり一覧」をクリック
2. 作成したしおりが表示される

### 3. しおりの編集

1. しおり一覧から任意のしおりを開く
2. タイトルやスポット情報を編集
3. 変更が自動的にデータベースに保存される

### 4. しおりの削除

1. しおり一覧で削除ボタンをクリック
2. 確認ダイアログで「削除」をクリック
3. しおりとその関連データ（日程、スポット、チャット）が削除される

### 5. しおりの公開

1. しおり編集画面で「共有」ボタンをクリック
2. 公開設定を有効化
3. 公開URLが生成される
4. URLをコピーして別のブラウザで開く
5. しおりが表示される（編集不可）

---

## 🔍 トラブルシューティング

### エラー: "Missing Supabase environment variables"

**原因**: 環境変数が設定されていない

**解決方法**:
1. `.env.local` ファイルが存在するか確認
2. 環境変数が正しく設定されているか確認
3. 開発サーバーを再起動（`npm run dev`）

---

### エラー: "Failed to create itinerary"

**原因**: RLSポリシーが正しく設定されていない、またはユーザー認証が失敗している

**解決方法**:
1. Supabaseダッシュボードで **Authentication** → **Users** を確認
2. ログインしたユーザーが存在するか確認
3. **Table Editor** → **itineraries** → **RLS** タブで以下のポリシーが有効か確認：
   - "Users can insert their own itineraries"
   - "Users can view their own itineraries and public ones"

---

### エラー: "Migration failed"

**原因**: LocalStorageのデータ形式が不正、またはネットワークエラー

**解決方法**:
1. ブラウザのコンソールでエラーログを確認
2. LocalStorageをクリアして再試行：
   ```javascript
   localStorage.clear();
   ```
3. 手動でしおりを作成して動作確認

---

### SQLエラー: "relation does not exist"

**原因**: テーブルが作成されていない

**解決方法**:
1. Supabaseダッシュボードの **SQL Editor** で以下を実行：
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. テーブル一覧が表示されない場合、`lib/db/schema.sql` を再実行

---

### パフォーマンスが遅い

**原因**: インデックスが作成されていない、または大量のデータ

**解決方法**:
1. `lib/db/schema.sql` のインデックス作成部分が実行されているか確認
2. Supabaseダッシュボードの **Database** → **Indexes** で確認
3. クエリを最適化（ページネーション、フィルター使用）

---

## 📚 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## ✅ チェックリスト

セットアップが正しく完了したか確認：

- [ ] Supabaseプロジェクトが作成されている
- [ ] APIキーを取得し、`.env.local` に設定した
- [ ] `lib/db/schema.sql` を実行してテーブルが作成された
- [ ] `lib/db/functions.sql` を実行してRPC関数が作成された
- [ ] `@supabase/supabase-js` パッケージがインストールされている
- [ ] アプリケーションが起動できる（`npm run dev`）
- [ ] 接続テストが成功する（`testSupabaseConnection()`）
- [ ] ログインできる
- [ ] しおりを作成できる
- [ ] しおりが一覧に表示される
- [ ] しおりを編集・削除できる
- [ ] しおりを公開できる

全てチェックが入れば、Phase 8のセットアップは完了です！🎉

---

**最終更新**: 2025-10-08  
**次のステップ**: [Phase 9: 最適化・テスト](./PHASE9_OPTIMIZATION_TESTING.md)
