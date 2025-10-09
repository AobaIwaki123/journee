# Database (Supabase) - Phase 8-11

## 📋 セットアップ手順

### 1. Supabaseプロジェクト確認

既存のSupabaseプロジェクト: `https://wbyjomvjpsuqlbhyxomy.supabase.co`

### 2. スキーマの適用

Supabaseダッシュボードにアクセス:
1. Project Settings → Database → SQL Editor
2. `lib/db/schema.sql` の内容をコピー&ペースト
3. 実行（Run）

### 3. 環境変数の設定

`.env.local` ファイルに以下を追加:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wbyjomvjpsuqlbhyxomy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**APIキーの取得方法**:
1. Supabaseダッシュボード → Project Settings → API
2. `anon public` キーをコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `service_role` キーをコピー → `SUPABASE_SERVICE_ROLE_KEY`

### 4. 接続テスト

```bash
npm run dev
```

ブラウザコンソールで以下を実行:
```javascript
import { testSupabaseConnection } from '@/lib/db/supabase';
await testSupabaseConnection(); // true が返ればOK
```

---

## 📊 データベーススキーマ

### テーブル一覧

1. **users** - ユーザー情報
2. **itineraries** - しおりデータ
3. **day_schedules** - 日程詳細
4. **tourist_spots** - 観光スポット
5. **chat_messages** - チャット履歴
6. **user_settings** - ユーザー設定
7. **comments** - しおりコメント（Phase 11）

### ER図

```
users (1) ─── (N) itineraries
                 │
                 ├─── (N) day_schedules
                 │         │
                 │         └─── (N) tourist_spots
                 │
                 ├─── (N) chat_messages
                 │
                 └─── (N) comments (Phase 11)

users (1) ─── (1) user_settings
users (1) ─── (N) comments (optional)
```

---

## 🔒 セキュリティ

### Row Level Security (RLS)

全てのテーブルでRLSが有効化されています。

**基本ルール**:
- ユーザーは自分のデータのみアクセス可能
- 公開しおり（`is_public = TRUE`）は誰でも閲覧可能
- `auth.uid()` で現在のユーザーIDを取得

**例**: itinerariesテーブル
```sql
-- SELECT: 自分のしおり OR 公開しおり
CREATE POLICY "Users can view their own itineraries and public ones" ON itineraries
  FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);

-- INSERT: 自分のしおりのみ作成可能
CREATE POLICY "Users can insert their own itineraries" ON itineraries
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

**例**: commentsテーブル（Phase 11）
```sql
-- SELECT: 全員が公開しおりのコメントを閲覧可能
CREATE POLICY "Anyone can view comments on public itineraries" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = comments.itinerary_id 
      AND itineraries.is_public = TRUE
    )
  );

-- INSERT: 認証ユーザーと匿名ユーザーが公開しおりにコメント投稿可能
CREATE POLICY "Anyone can insert comments on public itineraries" ON comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = comments.itinerary_id 
      AND itineraries.is_public = TRUE
    )
  );
```

### APIキーの暗号化

Claude APIキーは `pgcrypto` 拡張で暗号化して保存:

```sql
-- 暗号化して保存
UPDATE user_settings
SET encrypted_claude_api_key = pgp_sym_encrypt('api_key', 'encryption_key');

-- 復号化して取得
SELECT pgp_sym_decrypt(encrypted_claude_api_key::bytea, 'encryption_key') 
FROM user_settings;
```

---

## 🛠️ 開発ガイド

### Supabaseクライアントの使用

**クライアントサイド**:
```typescript
import { supabase } from '@/lib/db/supabase';

const { data, error } = await supabase
  .from('itineraries')
  .select('*')
  .eq('user_id', userId);
```

**サーバーサイド（Admin権限）**:
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

const { data, error } = await supabaseAdmin
  .from('itineraries')
  .select('*'); // RLSをバイパス
```

### トランザクション

```typescript
import { supabase } from '@/lib/db/supabase';

// トランザクション的な操作
const { data: itinerary, error: itineraryError } = await supabase
  .from('itineraries')
  .insert({ title, user_id })
  .select()
  .single();

if (itineraryError) throw itineraryError;

const { error: dayError } = await supabase
  .from('day_schedules')
  .insert({ itinerary_id: itinerary.id, day: 1 });

if (dayError) {
  // ロールバック（手動削除）
  await supabase.from('itineraries').delete().eq('id', itinerary.id);
  throw dayError;
}
```

---

## 📝 マイグレーション

### LocalStorageからSupabaseへ

`lib/db/migration.ts` に実装:

```typescript
export async function migrateLocalStorageToDatabase(userId: string): Promise<void> {
  // 1. LocalStorageからしおりを読込
  const itineraries = loadItinerariesFromStorage();
  
  // 2. Supabaseへ保存
  for (const itinerary of itineraries) {
    await repository.createItinerary(userId, itinerary);
  }
  
  // 3. LocalStorageをクリア（オプション）
  clearAllAppData();
}
```

### 実行タイミング

- 初回ログイン時に自動実行
- ユーザーに確認ダイアログ表示
- マイグレーション完了後に通知

---

## 🧪 テスト

### ユニットテスト

```typescript
import { ItineraryRepository } from '@/lib/db/itinerary-repository';

describe('ItineraryRepository', () => {
  it('should create itinerary', async () => {
    const repository = new ItineraryRepository();
    const itinerary = await repository.createItinerary(userId, data);
    expect(itinerary.id).toBeDefined();
  });
});
```

### 統合テスト

```bash
npm run test:e2e
```

---

## 📚 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**最終更新**: 2025-10-09  
**Phase**: 11 完了（コメント機能実装済み）
