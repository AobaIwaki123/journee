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
7. [関数・トリガー](#関数トリガー)
8. [マイグレーション](#マイグレーション)

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
- **スキーマ定義**: [`lib/db/schema.sql`](/lib/db/schema.sql)
- **TypeScript型**: [`types/database.ts`](/types/database.ts)
- **リポジトリ**: [`lib/db/itinerary-repository.ts`](/lib/db/itinerary-repository.ts)
- **ドキュメント**: [`lib/db/README.md`](/lib/db/README.md)

---

## テーブル一覧

| テーブル名 | 説明 | 主要カラム | 関連テーブル |
|-----------|------|----------|-------------|
| **users** | ユーザー情報 | id, email, name, google_id | itineraries, user_settings |
| **itineraries** | しおり本体 | id, user_id, title, destination, phase | day_schedules, chat_messages |
| **day_schedules** | 日程詳細 | id, itinerary_id, day, status | tourist_spots |
| **tourist_spots** | 観光スポット | id, day_schedule_id, name, location | - |
| **chat_messages** | チャット履歴 | id, itinerary_id, role, content | - |
| **user_settings** | ユーザー設定 | id, user_id, ai_model_preference | - |

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

ユーザーの基本情報を管理。Google OAuth認証と連携。

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**カラム説明**:
- `id`: ユーザーUUID（主キー）
- `email`: メールアドレス（一意制約）
- `name`: ユーザー名
- `image`: プロフィール画像URL
- `google_id`: Google認証ID（一意制約）
- `created_at`, `updated_at`: タイムスタンプ

**インデックス**:
- `idx_users_email` - メール検索用
- `idx_users_google_id` - Google ID検索用

---

### 2. itineraries（しおり）

旅のしおり本体。フェーズ管理と公開設定を含む。

```sql
CREATE TABLE itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  duration INT,
  summary TEXT,
  total_budget DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'JPY',
  status VARCHAR(50) DEFAULT 'draft',
  
  -- 公開設定（Phase 5.5）
  is_public BOOLEAN DEFAULT FALSE,
  public_slug VARCHAR(50) UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INT DEFAULT 0,
  allow_pdf_download BOOLEAN DEFAULT TRUE,
  custom_message TEXT,
  
  -- 段階的作成（Phase 4）
  phase VARCHAR(50) DEFAULT 'initial',
  current_day INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**カラム説明**:
- `phase`: 作成フェーズ（`initial` → `collecting` → `skeleton` → `detailing` → `completed`）
- `status`: しおりステータス（`draft`, `completed`, `archived`）
- `is_public`: 公開フラグ（公開URLアクセス制御）
- `public_slug`: 公開URL用スラッグ（一意）
- `view_count`: 閲覧数カウンター

**インデックス**:
- `idx_itineraries_user_id` - ユーザー別検索
- `idx_itineraries_public_slug` - 公開URL検索
- `idx_itineraries_search` - 全文検索（GIN）

---

### 3. day_schedules（日程詳細）

各日の日程情報。詳細化プロセスで順次生成。

```sql
CREATE TABLE day_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day INT NOT NULL,
  date DATE,
  title VARCHAR(255),
  total_distance DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'draft',
  theme TEXT,
  is_loading BOOLEAN DEFAULT FALSE,
  error TEXT,
  progress INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(itinerary_id, day)
);
```

**カラム説明**:
- `day`: 日程番号（1日目、2日目...）
- `status`: 詳細化状態（`draft`, `skeleton`, `detailed`, `completed`）
- `is_loading`: AI詳細化処理中フラグ
- `progress`: 詳細化進捗（0-100%）
- `theme`: 日程テーマ（例: "京都の伝統を巡る"）

**複合ユニークキー**:
- `(itinerary_id, day)` - 同じしおりの同じ日は1つだけ

---

### 4. tourist_spots（観光スポット）

各日程の観光スポット・移動・食事など。

```sql
CREATE TABLE tourist_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_schedule_id UUID NOT NULL REFERENCES day_schedules(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_time TIME,
  duration INT,
  category VARCHAR(50),
  estimated_cost DECIMAL(10, 2),
  notes TEXT,
  image_url TEXT,
  
  -- 位置情報
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  location_place_id VARCHAR(255),
  
  -- 順序
  order_index INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**カラム説明**:
- `category`: カテゴリ（`sightseeing`, `dining`, `transportation`, `accommodation`, `other`）
- `location_*`: Google Maps連携用位置情報
- `order_index`: 表示順序（ドラッグ&ドロップで変更可能）

**インデックス**:
- `idx_tourist_spots_order` - 並び順検索

---

### 5. chat_messages（チャット履歴）

しおり作成時のAIとの対話履歴。

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**カラム説明**:
- `role`: メッセージ送信者（`user`, `assistant`）
- `content`: メッセージ本文（最大2000文字を想定）

---

### 6. user_settings（ユーザー設定）

ユーザーごとの設定・APIキー。

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  encrypted_claude_api_key TEXT,
  ai_model_preference VARCHAR(50) DEFAULT 'gemini',
  app_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**カラム説明**:
- `encrypted_claude_api_key`: 暗号化されたClaude APIキー（pgcrypto使用）
- `ai_model_preference`: デフォルトAIモデル（`gemini`, `claude`）
- `app_settings`: その他設定（JSONB、拡張可能）

---

## セキュリティ（RLS）

全てのテーブルでRow Level Security（RLS）が有効化されています。

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

親テーブル（itineraries）の所有権を継承:

```sql
CREATE POLICY "Users can view day schedules of their itineraries and public ones" 
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
-- ユーザーのしおり一覧（作成日順）
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
WHERE to_tsvector('simple', title || ' ' || destination) @@ to_tsquery('simple', '京都 & 温泉');
```

### 地理情報検索

```sql
-- 緯度経度による位置検索
CREATE INDEX idx_tourist_spots_location ON tourist_spots(location_lat, location_lng) 
  WHERE location_lat IS NOT NULL;
```

---

## 関数・トリガー

### 自動updated_at更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 全テーブルにトリガー設定
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itineraries_updated_at 
BEFORE UPDATE ON itineraries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 他テーブルも同様...
```

---

## マイグレーション

### LocalStorage → Supabaseマイグレーション

Phase 8で実装済み。初回ログイン時に自動実行。

**実装**: [`lib/db/migration.ts`](/lib/db/migration.ts)

```typescript
export async function migrateLocalStorageToDatabase(userId: string): Promise<void> {
  // 1. LocalStorageからしおりを読込
  const itineraries = loadItinerariesFromStorage();
  
  // 2. Supabaseへ保存
  for (const itinerary of itineraries) {
    await repository.createItinerary(userId, itinerary);
  }
  
  // 3. LocalStorageをクリア（ユーザー選択）
  if (shouldClearLocalStorage) {
    clearAllAppData();
  }
}
```

### スキーマ更新手順

1. `lib/db/schema.sql` を編集
2. Supabaseダッシュボードで実行（SQL Editor）
3. `types/database.ts` を更新
4. リポジトリ層を更新

---

## 開発ガイド

### TypeScript型定義

```typescript
import { Database } from '@/types/database';

type Itinerary = Database['public']['Tables']['itineraries']['Row'];
type ItineraryInsert = Database['public']['Tables']['itineraries']['Insert'];
type ItineraryUpdate = Database['public']['Tables']['itineraries']['Update'];
```

### クエリ例

```typescript
import { supabase } from '@/lib/db/supabase';

// しおり一覧取得（自分 + 公開）
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

// しおり作成
const { data: newItinerary, error } = await supabase
  .from('itineraries')
  .insert({
    user_id: userId,
    title: '京都3日間の旅',
    destination: '京都',
    duration: 3,
    phase: 'collecting'
  })
  .select()
  .single();
```

---

## 参考資料

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Setup Guide](/lib/db/README.md)

---

**作成日**: 2025-10-09  
**バージョン**: 1.0  
**Phase**: 8.1 完了

