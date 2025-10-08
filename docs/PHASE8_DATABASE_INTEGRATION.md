# Phase 8: データベース統合 - 実装計画

## 📋 概要

**目的**: LocalStorageからSupabaseデータベースへ移行し、永続的なデータ保存とマルチデバイス同期を実現

**実装期間**: Week 15-16（推定）

**技術スタック**:
- **データベース**: Supabase（PostgreSQL）
- **クライアント**: @supabase/supabase-js
- **認証**: NextAuth.js（既存）との統合
- **マイグレーション**: 段階的移行（LocalStorage → Database）

---

## 🗄️ データベーススキーマ設計

### テーブル構成

#### 1. `users` - ユーザー情報
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

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

#### 2. `itineraries` - しおりデータ
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
  status VARCHAR(50) DEFAULT 'draft', -- draft, completed, archived
  
  -- Phase 5.5: 公開設定
  is_public BOOLEAN DEFAULT FALSE,
  public_slug VARCHAR(50) UNIQUE,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INT DEFAULT 0,
  allow_pdf_download BOOLEAN DEFAULT TRUE,
  custom_message TEXT,
  
  -- Phase 4: 段階的作成システム
  phase VARCHAR(50) DEFAULT 'initial', -- initial, collecting, skeleton, detailing, completed
  current_day INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_itineraries_created_at ON itineraries(created_at DESC);
CREATE INDEX idx_itineraries_updated_at ON itineraries(updated_at DESC);
CREATE INDEX idx_itineraries_public_slug ON itineraries(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX idx_itineraries_is_public ON itineraries(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_itineraries_status ON itineraries(status);
```

#### 3. `day_schedules` - 日程詳細
```sql
CREATE TABLE day_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day INT NOT NULL,
  date DATE,
  title VARCHAR(255),
  total_distance DECIMAL(10, 2), -- km
  total_cost DECIMAL(10, 2), -- 円
  status VARCHAR(50) DEFAULT 'draft', -- draft, skeleton, detailed, completed
  theme TEXT,
  is_loading BOOLEAN DEFAULT FALSE,
  error TEXT,
  progress INT DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 複合ユニークキー（同じしおりの同じ日は1つだけ）
  UNIQUE(itinerary_id, day)
);

-- インデックス
CREATE INDEX idx_day_schedules_itinerary_id ON day_schedules(itinerary_id);
CREATE INDEX idx_day_schedules_day ON day_schedules(itinerary_id, day);
```

#### 4. `tourist_spots` - 観光スポット
```sql
CREATE TABLE tourist_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_schedule_id UUID NOT NULL REFERENCES day_schedules(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_time TIME, -- HH:mm
  duration INT, -- 分
  category VARCHAR(50), -- sightseeing, dining, transportation, accommodation, other
  estimated_cost DECIMAL(10, 2),
  notes TEXT,
  image_url TEXT,
  
  -- 位置情報
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  location_place_id VARCHAR(255),
  
  -- 順序（並び順）
  order_index INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_tourist_spots_day_schedule_id ON tourist_spots(day_schedule_id);
CREATE INDEX idx_tourist_spots_order ON tourist_spots(day_schedule_id, order_index);
CREATE INDEX idx_tourist_spots_location ON tourist_spots(location_lat, location_lng) WHERE location_lat IS NOT NULL;
```

#### 5. `chat_messages` - チャット履歴
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_chat_messages_itinerary_id ON chat_messages(itinerary_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(itinerary_id, created_at DESC);
```

#### 6. `user_settings` - ユーザー設定
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- AI設定
  encrypted_claude_api_key TEXT,
  ai_model_preference VARCHAR(50) DEFAULT 'gemini', -- gemini, claude
  
  -- アプリケーション設定（JSON）
  app_settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
```

---

## 🔧 実装フェーズ

### Phase 8.1: Supabaseセットアップ ✅

#### 8.1.1 パッケージインストール
```bash
npm install @supabase/supabase-js
```

#### 8.1.2 環境変数設定
`.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wbyjomvjpsuqlbhyxomy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 8.1.3 Supabaseクライアント作成
`lib/db/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイド用（Service Role Key使用）
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

#### 8.1.4 データベーススキーマ作成
Supabaseダッシュボードで上記のSQLを実行

#### 8.1.5 Row Level Security (RLS) 設定
```sql
-- ユーザーは自分のしおりのみアクセス可能
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own itineraries"
  ON itineraries FOR SELECT
  USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY "Users can insert their own itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own itineraries"
  ON itineraries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own itineraries"
  ON itineraries FOR DELETE
  USING (user_id = auth.uid());

-- 同様に他のテーブルにもRLSを設定
```

---

### Phase 8.2: データベースストレージの実装

#### 8.2.1 型定義の拡張
`types/database.ts`:
```typescript
export interface Database {
  public: {
    Tables: {
      users: { /* ... */ };
      itineraries: { /* ... */ };
      day_schedules: { /* ... */ };
      tourist_spots: { /* ... */ };
      chat_messages: { /* ... */ };
      user_settings: { /* ... */ };
    };
  };
}
```

#### 8.2.2 データベースクライアントの実装
`lib/db/itinerary-repository.ts`:
```typescript
import { supabase, supabaseAdmin } from './supabase';
import type { ItineraryData } from '@/types/itinerary';

export class ItineraryRepository {
  // しおりの作成
  async createItinerary(userId: string, itinerary: ItineraryData): Promise<ItineraryData>;
  
  // しおりの読込
  async getItinerary(itineraryId: string, userId: string): Promise<ItineraryData | null>;
  
  // しおり一覧の取得
  async listItineraries(userId: string, filters?: ItineraryFilters): Promise<ItineraryData[]>;
  
  // しおりの更新
  async updateItinerary(itineraryId: string, userId: string, updates: Partial<ItineraryData>): Promise<ItineraryData>;
  
  // しおりの削除
  async deleteItinerary(itineraryId: string, userId: string): Promise<boolean>;
  
  // 公開しおりの取得（スラッグベース）
  async getPublicItinerary(slug: string): Promise<ItineraryData | null>;
  
  // 閲覧数のインクリメント
  async incrementViewCount(slug: string): Promise<void>;
}
```

#### 8.2.3 トランザクション処理
複数テーブルの同時更新（しおり + 日程 + スポット）をトランザクションで処理

---

### Phase 8.3: モックストレージからの移行

#### 8.3.1 APIルートの更新

**現状**: `/app/api/itinerary/save/route.ts`
```typescript
// LocalStorage使用（モック版）
import { loadItinerariesFromStorage, saveItinerariesToStorage } from '@/lib/mock-data/itineraries';
```

**移行後**:
```typescript
// データベース使用
import { ItineraryRepository } from '@/lib/db/itinerary-repository';

const repository = new ItineraryRepository();
await repository.updateItinerary(id, userId, itinerary);
```

#### 8.3.2 データマイグレーション機能
`lib/db/migration.ts`:
```typescript
/**
 * LocalStorageからSupabaseへデータを移行
 */
export async function migrateLocalStorageToDatabase(userId: string): Promise<void> {
  // 1. LocalStorageからしおりデータを読込
  // 2. Supabaseへ保存
  // 3. 成功したらLocalStorageをクリア（オプション）
}
```

#### 8.3.3 後方互換性の確保
- LocalStorageが利用可能な場合は引き続きフォールバック
- 段階的移行（ユーザーの初回ログイン時に自動マイグレーション）

---

### Phase 8.4: しおり管理機能の強化

#### 8.4.1 高度な検索・フィルター
```typescript
interface ItineraryFilters {
  status?: 'draft' | 'completed' | 'archived';
  startDate?: Date;
  endDate?: Date;
  destination?: string;
  search?: string; // タイトル・目的地での検索
}

// フルテキスト検索（PostgreSQL）
CREATE INDEX idx_itineraries_search ON itineraries 
  USING GIN (to_tsvector('japanese', title || ' ' || destination || ' ' || COALESCE(summary, '')));
```

#### 8.4.2 ソート機能
```typescript
type SortBy = 'created_at' | 'updated_at' | 'title' | 'start_date';
type SortOrder = 'asc' | 'desc';
```

#### 8.4.3 ページネーション
```typescript
interface PaginationOptions {
  page: number;
  pageSize: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 🚀 実装ステップ

### ステップ1: 環境構築（8.1）
- [ ] Supabaseプロジェクト確認
- [ ] パッケージインストール
- [ ] 環境変数設定
- [ ] スキーマ作成（SQL実行）
- [ ] RLS設定

### ステップ2: データベースクライアント実装（8.2）
- [ ] Supabaseクライアント作成
- [ ] 型定義拡張
- [ ] ItineraryRepository実装
- [ ] ユニットテスト作成

### ステップ3: API移行（8.3）
- [ ] `/api/itinerary/save` 更新
- [ ] `/api/itinerary/load` 更新
- [ ] `/api/itinerary/list` 更新
- [ ] `/api/itinerary/delete` 実装
- [ ] `/api/itinerary/publish` 更新（DB対応）
- [ ] マイグレーション機能実装

### ステップ4: しおり管理強化（8.4）
- [ ] 検索・フィルター実装
- [ ] ソート機能実装
- [ ] ページネーション実装
- [ ] UIコンポーネント更新

### ステップ5: テスト・デバッグ
- [ ] E2Eテスト（しおり作成 → 保存 → 読込）
- [ ] マイグレーションテスト
- [ ] パフォーマンステスト
- [ ] エラーハンドリング確認

---

## 📊 マイグレーション戦略

### 段階的移行

#### フェーズ1: デュアルストレージ（2週間）
- データベース実装完了
- LocalStorage + Database 両方に保存
- 読込はDatabaseを優先、フォールバックでLocalStorage

#### フェーズ2: 自動マイグレーション（1週間）
- 初回ログイン時に自動マイグレーション実行
- LocalStorageのデータをDatabaseへコピー
- ユーザーへの通知表示

#### フェーズ3: Database完全移行（1週間）
- LocalStorageへの保存を停止
- Databaseのみ使用
- LocalStorageは緊急時のバックアップのみ

---

## 🔒 セキュリティ考慮事項

### Row Level Security (RLS)
- ユーザーは自分のデータのみアクセス可能
- 公開しおりは `is_public = TRUE` の場合のみ閲覧可能

### APIキーの暗号化
- Claude APIキーはpgcrypto拡張で暗号化
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 暗号化して保存
UPDATE user_settings
SET encrypted_claude_api_key = pgp_sym_encrypt('api_key', 'encryption_key');

-- 復号化して取得
SELECT pgp_sym_decrypt(encrypted_claude_api_key::bytea, 'encryption_key') 
FROM user_settings;
```

### レート制限
- Supabase Rate Limitingの活用
- API Routeレベルでの追加制限

---

## 📈 パフォーマンス最適化

### インデックス戦略
- 頻繁に検索されるカラムにインデックス作成済み
- 複合インデックスの活用（user_id + created_at等）

### クエリ最適化
- JOIN の最適化
- N+1問題の回避（eager loading）
- ページネーションによるデータ量削減

### キャッシング
- React Query / SWR の活用
- Supabase Realtime でのリアルタイム更新

---

## 🧪 テスト計画

### ユニットテスト
- ItineraryRepository の各メソッド
- データマイグレーション機能

### 統合テスト
- APIルートの動作確認
- データベースとの連携

### E2Eテスト
- しおり作成フロー
- 公開・共有機能
- マイグレーション

---

## 📝 ドキュメント

### API仕様書
- エンドポイント一覧
- リクエスト・レスポンス形式
- エラーコード

### データベーススキーマ図
- ER図の作成
- テーブル関連の説明

### マイグレーションガイド
- ユーザー向けの移行手順
- トラブルシューティング

---

## 🎯 成功基準

- [ ] LocalStorageからSupabaseへの完全移行
- [ ] データ損失ゼロ
- [ ] ページロード時間 < 2秒
- [ ] エラー率 < 1%
- [ ] マイグレーション成功率 > 95%
- [ ] ユーザーフィードバック: 満足度 > 80%

---

**最終更新**: 2025-10-08  
**ステータス**: 計画中 → 実装開始準備完了
