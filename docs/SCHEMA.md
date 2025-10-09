# データベーススキーマ（Supabase PostgreSQL）

Journeeプロジェクトのデータベーススキーマドキュメント

**最終更新**: 2025-10-09  
**Phase**: 8.1 完了

---

## 📋 目次

1. [概要](#概要)
2. [テーブル一覧](#テーブル一覧)
3. [ER図](#er図)
4. [テーブル詳細](#テーブル詳細)
5. [セキュリティ（RLS）](#セキュリティrls)
6. [インデックス戦略](#インデックス戦略)

---

## 概要

JourneeはSupabase（PostgreSQL）を使用してデータを永続化しています。

### 基本情報
- **データベース**: Supabase (PostgreSQL 15+)
- **URL**: `https://wbyjomvjpsuqlbhyxomy.supabase.co`
- **スキーマ**: `public`
- **セキュリティ**: Row Level Security (RLS) 有効化済み
- **拡張**: pgcrypto（APIキー暗号化用）

### ファイル構成
- **スキーマ定義**: [`lib/db/schema.sql`](../lib/db/schema.sql)
- **TypeScript型**: [`types/database.ts`](../types/database.ts)
- **リポジトリ**: [`lib/db/itinerary-repository.ts`](../lib/db/itinerary-repository.ts)

---

## テーブル一覧

| テーブル名 | 説明 | 主要カラム |
|-----------|------|----------|
| **users** | ユーザー情報 | id, email, name, google_id |
| **itineraries** | しおり本体 | id, user_id, title, destination, phase |
| **day_schedules** | 日程詳細 | id, itinerary_id, day, status |
| **tourist_spots** | 観光スポット | id, day_schedule_id, name, location |
| **chat_messages** | チャット履歴 | id, itinerary_id, role, content |
| **user_settings** | ユーザー設定 | id, user_id, ai_model_preference |

---

## ER図

```
┌─────────────┐
│   users     │
└─────┬───────┘
      │ 1
      │
      ├───────────────────────────┐
      │                           │
      │ N                         │ 1
┌─────▼──────────┐         ┌─────▼──────────┐
│  itineraries   │         │ user_settings  │
└─────┬──────────┘         └────────────────┘
      │ 1
      │
      ├──────────────┬─────────────┐
      │              │             │
      │ N            │ N           │
┌─────▼──────────┐  │      ┌──────▼─────────┐
│ day_schedules  │  │      │ chat_messages  │
└─────┬──────────┘  │      └────────────────┘
      │ 1           │
      │             │
      │ N           │
┌─────▼──────────┐  │
│ tourist_spots  │  │
└────────────────┘  │
```

---

## テーブル詳細

### 1. users（ユーザー）

Google OAuth認証と連携したユーザー基本情報。

**主要カラム**:
- `id` (UUID) - ユーザーUUID（主キー）
- `email` (VARCHAR) - メールアドレス（一意制約）
- `name` (VARCHAR) - ユーザー名
- `google_id` (VARCHAR) - Google認証ID（一意制約）
- `created_at`, `updated_at` (TIMESTAMP) - タイムスタンプ

**インデックス**:
- `idx_users_email` - メール検索用
- `idx_users_google_id` - Google ID検索用

---

### 2. itineraries（しおり）

旅のしおり本体。フェーズ管理と公開設定を含む。

**主要カラム**:
- `id` (UUID) - しおりUUID（主キー）
- `user_id` (UUID) - ユーザーID（外部キー）
- `title` (VARCHAR) - タイトル
- `destination` (VARCHAR) - 行き先
- `start_date`, `end_date` (DATE) - 旅行期間
- `duration` (INT) - 日数
- `phase` (VARCHAR) - 作成フェーズ（`initial` → `collecting` → `skeleton` → `detailing` → `completed`）
- `status` (VARCHAR) - しおりステータス（`draft`, `completed`, `archived`）
- `is_public` (BOOLEAN) - 公開フラグ
- `public_slug` (VARCHAR) - 公開URL用スラッグ（一意）
- `view_count` (INT) - 閲覧数

**インデックス**:
- `idx_itineraries_user_id` - ユーザー別検索
- `idx_itineraries_public_slug` - 公開URL検索
- `idx_itineraries_search` - 全文検索（GIN）

---

### 3. day_schedules（日程詳細）

各日の日程情報。詳細化プロセスで順次生成。

**主要カラム**:
- `id` (UUID) - 日程UUID（主キー）
- `itinerary_id` (UUID) - しおりID（外部キー）
- `day` (INT) - 日程番号（1日目、2日目...）
- `date` (DATE) - 日付
- `title` (VARCHAR) - 日程タイトル
- `status` (VARCHAR) - 詳細化状態（`draft`, `skeleton`, `detailed`, `completed`）
- `theme` (TEXT) - 日程テーマ（例: "京都の伝統を巡る"）
- `is_loading` (BOOLEAN) - AI詳細化処理中フラグ
- `progress` (INT) - 詳細化進捗（0-100%）

**制約**:
- `UNIQUE(itinerary_id, day)` - 同じしおりの同じ日は1つだけ

---

### 4. tourist_spots（観光スポット）

各日程の観光スポット・移動・食事など。

**主要カラム**:
- `id` (UUID) - スポットUUID（主キー）
- `day_schedule_id` (UUID) - 日程ID（外部キー）
- `name` (VARCHAR) - スポット名
- `description` (TEXT) - 説明
- `scheduled_time` (TIME) - 予定時刻
- `duration` (INT) - 滞在時間（分）
- `category` (VARCHAR) - カテゴリ（`sightseeing`, `dining`, `transportation`, `accommodation`, `other`）
- `estimated_cost` (DECIMAL) - 予算
- `location_lat`, `location_lng` (DECIMAL) - 緯度経度（Google Maps連携）
- `order_index` (INT) - 表示順序

**インデックス**:
- `idx_tourist_spots_order` - 並び順検索

---

### 5. chat_messages（チャット履歴）

しおり作成時のAIとの対話履歴。

**主要カラム**:
- `id` (UUID) - メッセージUUID（主キー）
- `itinerary_id` (UUID) - しおりID（外部キー）
- `role` (VARCHAR) - 送信者（`user`, `assistant`）
- `content` (TEXT) - メッセージ本文
- `created_at` (TIMESTAMP) - 送信日時

---

### 6. user_settings（ユーザー設定）

ユーザーごとの設定・APIキー。

**主要カラム**:
- `id` (UUID) - 設定UUID（主キー）
- `user_id` (UUID) - ユーザーID（外部キー、一意）
- `encrypted_claude_api_key` (TEXT) - 暗号化されたClaude APIキー
- `ai_model_preference` (VARCHAR) - デフォルトAIモデル（`gemini`, `claude`）
- `app_settings` (JSONB) - その他設定（拡張可能）

---

## セキュリティ（RLS）

全テーブルでRow Level Security（RLS）が有効化されています。

### 基本原則

1. **自己所有データのみアクセス**: `auth.uid() = user_id`
2. **公開データは全員閲覧可能**: `is_public = TRUE`
3. **管理者はバイパス**: `supabaseAdmin` クライアント使用時

### RLSポリシー例

#### itineraries テーブル

```sql
-- SELECT: 自分のしおり OR 公開しおり
CREATE POLICY "Users can view their own itineraries and public ones" 
ON itineraries FOR SELECT 
USING (user_id = auth.uid() OR is_public = TRUE);

-- INSERT: 自分のしおりのみ作成可能
CREATE POLICY "Users can insert their own itineraries" 
ON itineraries FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- UPDATE: 自分のしおりのみ更新可能
CREATE POLICY "Users can update their own itineraries" 
ON itineraries FOR UPDATE 
USING (user_id = auth.uid());

-- DELETE: 自分のしおりのみ削除可能
CREATE POLICY "Users can delete their own itineraries" 
ON itineraries FOR DELETE 
USING (user_id = auth.uid());
```

#### 子テーブル（day_schedules, tourist_spots）

親テーブルの所有権を継承:

```sql
CREATE POLICY "Users can view day schedules of their itineraries" 
ON day_schedules FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM itineraries 
    WHERE itineraries.id = day_schedules.itinerary_id 
    AND (itineraries.user_id = auth.uid() OR itineraries.is_public = TRUE)
  )
);
```

---

## インデックス戦略

### 一覧・検索最適化

```sql
-- ユーザーのしおり一覧
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX idx_itineraries_updated_at ON itineraries(updated_at DESC);

-- 公開しおり検索
CREATE INDEX idx_itineraries_public_slug ON itineraries(public_slug) 
  WHERE public_slug IS NOT NULL;
CREATE INDEX idx_itineraries_is_public ON itineraries(is_public) 
  WHERE is_public = TRUE;
```

### 全文検索（日本語対応）

```sql
-- タイトル・行き先・概要を全文検索
CREATE INDEX idx_itineraries_search ON itineraries 
USING GIN (to_tsvector('simple', 
  title || ' ' || COALESCE(destination, '') || ' ' || COALESCE(summary, '')
));
```

**使用例**:
```sql
SELECT * FROM itineraries
WHERE to_tsvector('simple', title || ' ' || destination) 
  @@ to_tsquery('simple', '京都 & 温泉');
```

### 地理情報検索

```sql
-- 緯度経度による位置検索
CREATE INDEX idx_tourist_spots_location ON tourist_spots(location_lat, location_lng) 
  WHERE location_lat IS NOT NULL;
```

---

## 開発ガイド

### TypeScript型定義

```typescript
import { Database } from '@/types/database';

type Itinerary = Database['public']['Tables']['itineraries']['Row'];
type ItineraryInsert = Database['public']['Tables']['itineraries']['Insert'];
```

### クエリ例

```typescript
import { supabase } from '@/lib/db/supabase';

// しおり一覧取得（ネストされたデータ）
const { data, error } = await supabase
  .from('itineraries')
  .select(`
    *,
    day_schedules (
      *,
      tourist_spots (*)
    )
  `)
  .order('updated_at', { ascending: false });
```

詳細は[lib/db/README.md](../lib/db/README.md)を参照。

---

## 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**作成日**: 2025-10-09  
**バージョン**: 1.0
