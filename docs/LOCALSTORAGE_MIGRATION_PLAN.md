# localStorage移行実装計画

## 📋 概要

localStorageのセキュリティ懸念を解消し、よりモダンな方法でデータ管理を行うための実装計画です。

### 現状の課題

1. **セキュリティリスク**
   - XSS攻撃による漏洩リスク
   - ドメイン内の他のスクリプトからアクセス可能
   - 暗号化されていても、暗号化キーがクライアント側にある

2. **容量制限**
   - localStorageは5-10MBの容量制限
   - 大規模なしおりデータには不十分

3. **パフォーマンス**
   - 同期APIのため、大量データでUIがブロック

### 移行先の選択

| データ種別 | 現在 | 移行先 | 理由 |
|---------|------|-------|------|
| APIキー（Claude） | localStorage（暗号化） | **Supabase** | サーバーサイドで安全に管理、より強固な暗号化 |
| しおりデータ | localStorage + Supabase | **Supabase** | 既に実装済み、localStorageは削除 |
| UI設定（パネル幅など） | localStorage | **IndexedDB** | より大きな容量、非同期API、構造化データ |
| アプリ設定 | localStorage | **IndexedDB** | 同上 |
| Zustandストア永続化 | localStorage | **IndexedDB** | 同上 |
| 公開しおりキャッシュ | localStorage | **IndexedDB** | 同上 |

---

## 🎯 実装フェーズ

### Phase 1: IndexedDBラッパー実装（優先度: 高）

**目的**: localStorageの代替としてIndexedDBを使用するための基盤整備

#### 1.1 IndexedDBラッパークラスの作成

**ファイル**: `lib/utils/indexed-db.ts`

**実装内容**:
```typescript
/**
 * IndexedDBラッパークラス
 * - 非同期API
 * - 構造化データ対応
 * - トランザクション管理
 * - バージョン管理・マイグレーション対応
 */

export class JourneeDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'journee-db';
  private readonly VERSION = 1;

  // Object Stores
  private readonly STORES = {
    SETTINGS: 'settings',        // アプリ設定
    UI_STATE: 'ui_state',        // UI状態（パネル幅など）
    CACHE: 'cache',              // キャッシュデータ（公開しおりなど）
    STORE_STATE: 'store_state',  // Zustandストア永続化
  };

  async init(): Promise<void>;
  async set(store: string, key: string, value: any): Promise<void>;
  async get<T>(store: string, key: string): Promise<T | null>;
  async delete(store: string, key: string): Promise<void>;
  async clear(store: string): Promise<void>;
  async getAll<T>(store: string): Promise<T[]>;
}
```

**依存パッケージ**:
- `idb`（Jakearchibald's IndexedDB wrapper）: より使いやすいPromiseベースのAPI

```bash
npm install idb
```

#### 1.2 マイグレーションヘルパー

**ファイル**: `lib/utils/storage-migration.ts`

**実装内容**:
```typescript
/**
 * localStorageからIndexedDBへのマイグレーション
 */
export async function migrateLocalStorageToIndexedDB(): Promise<{
  success: boolean;
  migratedKeys: string[];
  errors: string[];
}>;

/**
 * 個別キーのマイグレーション
 */
export async function migrateKey(key: string, targetStore: string): Promise<boolean>;

/**
 * マイグレーション状況の確認
 */
export async function checkMigrationStatus(): Promise<{
  isCompleted: boolean;
  version: number;
}>;
```

---

### Phase 2: UI設定のIndexedDB移行（優先度: 高）

**対象データ**:
- パネル幅（`journee_panel_width`）
- 自動進行モード（`journee_auto_progress_mode`）
- 自動進行設定（`journee_auto_progress_settings`）
- 選択AI（`journee_selected_ai`）

#### 2.1 新しいストレージヘルパー作成

**ファイル**: `lib/utils/ui-storage.ts`

**実装内容**:
```typescript
import { journeeDB } from './indexed-db';

/**
 * UI状態管理（IndexedDB版）
 */

// パネル幅
export async function saveChatPanelWidth(width: number): Promise<boolean>;
export async function loadChatPanelWidth(): Promise<number>;

// 自動進行モード
export async function saveAutoProgressMode(enabled: boolean): Promise<boolean>;
export async function loadAutoProgressMode(): Promise<boolean>;

// 自動進行設定
export async function saveAutoProgressSettings(settings: AutoProgressSettings): Promise<boolean>;
export async function loadAutoProgressSettings(): Promise<AutoProgressSettings>;

// 選択AI
export async function saveSelectedAI(ai: AIModelId): Promise<boolean>;
export async function loadSelectedAI(): Promise<AIModelId>;
```

#### 2.2 useStore.tsの更新

**変更内容**:
- localStorage関数の呼び出しをIndexedDB版に置き換え
- 非同期化に伴うuseEffectの追加
- 初期化ロジックの変更

**例**:
```typescript
// Before
import { loadChatPanelWidth, saveChatPanelWidth } from '@/lib/utils/storage';
chatPanelWidth: loadChatPanelWidth(), // 同期

// After
import { loadChatPanelWidth, saveChatPanelWidth } from '@/lib/utils/ui-storage';
chatPanelWidth: 40, // デフォルト値

// useEffectで非同期初期化
useEffect(() => {
  loadChatPanelWidth().then(width => set({ chatPanelWidth: width }));
}, []);
```

---

### Phase 3: APIキーのSupabase移行（優先度: 高）

**目的**: Claude APIキーをサーバーサイドで安全に管理

#### 3.1 データベーススキーマの更新

**ファイル**: `lib/db/schema.sql`

**現状**:
- `user_settings`テーブルは既に存在
- `encrypted_claude_api_key TEXT`カラムも既に定義済み（136行目）
- `pgcrypto`エクステンションも既に有効化済み（328行目）

**追加作業**: なし（スキーマは準備完了）

**暗号化方法**:
APIエンドポイント側で`pgp_sym_encrypt/decrypt`関数を直接使用します。
環境変数`ENCRYPTION_KEY`を使用して暗号化します。

#### 3.2 APIエンドポイントの作成

**ファイル**: `app/api/user/api-keys/route.ts`

**実装内容**:
```typescript
import { getServerSession } from 'next-auth';
import { supabaseAdmin } from '@/lib/db/supabase';

// APIキーの保存
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { apiKey, provider } = await request.json();

  // Supabaseに暗号化保存（サーバーサイド）
  const { error } = await supabaseAdmin
    .from('user_settings')
    .upsert({
      user_id: session.user.id,
      encrypted_claude_api_key: apiKey, // pgcryptoで自動暗号化
    });

  return Response.json({ success: !error });
}

// APIキーの取得
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from('user_settings')
    .select('encrypted_claude_api_key')
    .eq('user_id', session.user.id)
    .single();

  return Response.json({ 
    apiKey: data?.encrypted_claude_api_key || null 
  });
}

// APIキーの削除
export async function DELETE(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({ encrypted_claude_api_key: null })
    .eq('user_id', session.user.id);

  return Response.json({ success: !error });
}
```

#### 3.3 クライアントサイドの更新

**ファイル**: `lib/utils/api-key-manager.ts`（新規）

**実装内容**:
```typescript
/**
 * APIキー管理（サーバー経由）
 */

export async function saveClaudeApiKey(apiKey: string): Promise<boolean> {
  const response = await fetch('/api/user/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, provider: 'claude' }),
  });
  const data = await response.json();
  return data.success;
}

export async function loadClaudeApiKey(): Promise<string> {
  const response = await fetch('/api/user/api-keys');
  const data = await response.json();
  return data.apiKey || '';
}

export async function removeClaudeApiKey(): Promise<boolean> {
  const response = await fetch('/api/user/api-keys', {
    method: 'DELETE',
  });
  const data = await response.json();
  return data.success;
}

export async function hasClaudeApiKey(): Promise<boolean> {
  const apiKey = await loadClaudeApiKey();
  return apiKey.length > 0;
}
```

#### 3.4 useStore.tsの更新

**変更内容**:
- `lib/utils/storage.ts`の代わりに`lib/utils/api-key-manager.ts`を使用
- 非同期化に伴うロジック変更

---

### Phase 4: Zustandストア永続化の移行（優先度: 中）

**対象**: `journee-storage`キーで保存されているストア状態

#### 4.1 Zustand永続化ミドルウェアの変更

**ファイル**: `lib/store/useStore.ts`

**変更内容**:
```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import { journeeDB } from '@/lib/utils/indexed-db';

// IndexedDBストレージの作成
const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await journeeDB.get('store_state', name);
    return value ? JSON.stringify(value) : null;
  },
  setItem: async (name: string, value: string) => {
    await journeeDB.set('store_state', name, JSON.parse(value));
  },
  removeItem: async (name: string) => {
    await journeeDB.delete('store_state', name);
  },
}));

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... 既存の状態定義
    }),
    {
      name: 'journee-storage',
      storage: indexedDBStorage, // IndexedDBを使用
      partialize: (state) => ({
        // 永続化する状態のみを選択
        currentItinerary: state.currentItinerary,
        settings: state.settings,
        // ... 必要な状態のみ
      }),
    }
  )
);
```

---

### Phase 5: localStorageキャッシュの削除（優先度: 中）

**対象**: 現在のしおり（`journee_current_itinerary`）、公開しおり（`journee_public_itineraries`）

#### 5.1 しおりデータの完全Supabase移行

**変更内容**:
- `lib/utils/storage.ts`の`saveCurrentItinerary`、`loadCurrentItinerary`を削除
- 代わりに`ItineraryRepository`を直接使用
- `useStore.ts`内のlocalStorage書き込みロジックを削除

**ファイル**: `lib/store/useStore.ts`

**変更箇所**:
```typescript
// Before: setItinerary内でlocalStorageに保存
setItinerary: (itinerary) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("journee-storage", JSON.stringify(newStorage));
    } catch (e) {
      console.error("Failed to save itinerary to localStorage:", e);
    }
  }
  set({ currentItinerary: itinerary });
},

// After: localStorage保存を削除、Supabaseのみ使用
setItinerary: (itinerary) => {
  set({ currentItinerary: itinerary });
  
  // 自動保存はAutoSaveコンポーネントで処理
},
```

#### 5.2 公開しおりのキャッシュをIndexedDBへ移行

**ファイル**: `lib/utils/public-itinerary-cache.ts`（新規）

**実装内容**:
```typescript
import { journeeDB } from './indexed-db';

/**
 * 公開しおりキャッシュ（IndexedDB版）
 */

export async function cachePublicItinerary(
  slug: string, 
  itinerary: ItineraryData
): Promise<boolean>;

export async function getCachedPublicItinerary(
  slug: string
): Promise<ItineraryData | null>;

export async function clearPublicItineraryCache(): Promise<void>;
```

---

### Phase 6: マイグレーション実装（優先度: 高）

**目的**: 既存ユーザーのデータを自動的に新しいストレージに移行

#### 6.1 マイグレーションコンポーネントの作成

**ファイル**: `components/migration/StorageMigration.tsx`（新規）

**実装内容**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { migrateLocalStorageToIndexedDB } from '@/lib/utils/storage-migration';

/**
 * localStorage → IndexedDB マイグレーション
 * 
 * 初回訪問時に自動実行
 */
export function StorageMigration() {
  const [migrationStatus, setMigrationStatus] = useState<
    'idle' | 'running' | 'completed' | 'error'
  >('idle');

  useEffect(() => {
    async function migrate() {
      // マイグレーション済みかチェック
      const status = await checkMigrationStatus();
      if (status.isCompleted) {
        setMigrationStatus('completed');
        return;
      }

      setMigrationStatus('running');

      try {
        const result = await migrateLocalStorageToIndexedDB();
        if (result.success) {
          setMigrationStatus('completed');
          console.log('Migration completed:', result.migratedKeys);
        } else {
          setMigrationStatus('error');
          console.error('Migration errors:', result.errors);
        }
      } catch (error) {
        setMigrationStatus('error');
        console.error('Migration failed:', error);
      }
    }

    migrate();
  }, []);

  // マイグレーション中のUI（オプション）
  if (migrationStatus === 'running') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-lg">データを移行中...</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

#### 6.2 ルートレイアウトへの追加

**ファイル**: `app/layout.tsx`

**変更内容**:
```typescript
import { StorageMigration } from '@/components/migration/StorageMigration';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <StorageMigration />
          <StorageInitializer />
          <AutoSave />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

---

### Phase 7: 環境変数の追加（優先度: 高）

**目的**: APIキー暗号化のための暗号化キーを環境変数で管理

#### 7.1 .env.localの更新

**追加内容**:
```env
# 既存のSupabase設定
NEXT_PUBLIC_SUPABASE_URL=https://wbyjomvjpsuqlbhyxomy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 新規: APIキー暗号化用のキー
ENCRYPTION_KEY=your_random_encryption_key_here
```

**生成方法**:
```bash
# 暗号化キーの生成（32文字のランダム文字列）
openssl rand -hex 32
```

#### 7.2 Kubernetes Secretの更新

**ファイル**: `k8s/secret.yml`

**追加内容**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: journee-secrets
type: Opaque
data:
  ENCRYPTION_KEY: <base64 encoded key>
```

---

### Phase 8: テスト実装（優先度: 中）

#### 8.1 ユニットテスト

**ファイル**: `lib/utils/__tests__/indexed-db.test.ts`

**テスト内容**:
```typescript
describe('JourneeDB', () => {
  it('should store and retrieve data', async () => {
    const db = new JourneeDB();
    await db.init();
    await db.set('settings', 'theme', 'dark');
    const theme = await db.get('settings', 'theme');
    expect(theme).toBe('dark');
  });

  it('should handle migration from localStorage', async () => {
    // localStorageにデータをセット
    localStorage.setItem('journee_selected_ai', 'claude');
    
    // マイグレーション実行
    const result = await migrateLocalStorageToIndexedDB();
    
    expect(result.success).toBe(true);
    expect(result.migratedKeys).toContain('journee_selected_ai');
    
    // IndexedDBから取得
    const db = new JourneeDB();
    const selectedAI = await db.get('ui_state', 'selected_ai');
    expect(selectedAI).toBe('claude');
  });
});
```

#### 8.2 E2Eテスト

**ファイル**: `e2e/storage-migration.spec.ts`

**テスト内容**:
```typescript
import { test, expect } from '@playwright/test';

test('should migrate localStorage to IndexedDB on first visit', async ({ page }) => {
  // localStorageにデータをセット
  await page.addInitScript(() => {
    localStorage.setItem('journee_panel_width', '45');
    localStorage.setItem('journee_selected_ai', 'gemini');
  });

  await page.goto('/');

  // マイグレーションが完了するまで待機
  await page.waitForTimeout(2000);

  // IndexedDBにデータが移行されたか確認
  const panelWidth = await page.evaluate(async () => {
    const db = await indexedDB.open('journee-db', 1);
    // ... IndexedDBから取得
  });

  expect(panelWidth).toBe(45);
});
```

---

### Phase 9: ドキュメント更新（優先度: 低）

#### 9.1 README.md更新

**追加内容**:
- IndexedDB使用の説明
- 環境変数`ENCRYPTION_KEY`の設定方法
- マイグレーション手順

#### 9.2 SCHEMA.md更新

**追加内容**:
- `user_settings`テーブルの`encrypted_claude_api_key`カラム説明
- 暗号化関数の仕様

#### 9.3 新規ドキュメント作成

**ファイル**: `docs/STORAGE.md`

**内容**:
```markdown
# データストレージ戦略

## 概要

Journeeでは3種類のストレージを使い分けています。

### 1. Supabase (PostgreSQL)
- **用途**: しおりデータ、ユーザー情報、APIキー（暗号化）
- **特徴**: サーバーサイド、永続化、複数デバイス同期

### 2. IndexedDB
- **用途**: UI設定、アプリ設定、キャッシュ
- **特徴**: クライアントサイド、大容量、非同期API

### 3. メモリ（Zustand）
- **用途**: 現在の状態、一時データ
- **特徴**: 高速、揮発性

## データ種別とストレージ選択

| データ | ストレージ | 理由 |
|--------|-----------|------|
| しおりデータ | Supabase | 永続化、同期必要 |
| APIキー | Supabase | 高いセキュリティ要求 |
| UI設定 | IndexedDB | ローカルのみ、大容量 |
| 現在の編集状態 | メモリ | 高速アクセス必要 |
```

---

## 🚀 実装スケジュール

### Week 1: 基盤整備
- [ ] Phase 1.1: IndexedDBラッパー実装
- [ ] Phase 1.2: マイグレーションヘルパー実装
- [ ] Phase 7: 環境変数追加

### Week 2: データ移行
- [ ] Phase 2: UI設定のIndexedDB移行
- [ ] Phase 3: APIキーのSupabase移行
- [ ] Phase 6: マイグレーション実装

### Week 3: 最適化とテスト
- [ ] Phase 4: Zustandストア永続化の移行
- [ ] Phase 5: localStorageキャッシュの削除
- [ ] Phase 8: テスト実装

### Week 4: ドキュメントと公開
- [ ] Phase 9: ドキュメント更新
- [ ] 本番環境デプロイ
- [ ] ユーザー告知

---

## ⚠️ 移行時の注意事項

### 1. 後方互換性
- 既存ユーザーのデータを失わない
- マイグレーション失敗時のフォールバック処理
- localStorageデータは一定期間保持（30日間）

### 2. パフォーマンス
- IndexedDB初期化の最適化（遅延ロード）
- 大量データのマイグレーション時の進捗表示
- マイグレーション中もアプリ使用可能に

### 3. セキュリティ
- 暗号化キーの安全な管理（環境変数）
- HTTPS通信の徹底
- XSS対策の継続

### 4. テスト
- 既存機能の回帰テスト
- マイグレーションシナリオのテスト
- 複数ブラウザでの動作確認

---

## 📊 期待される効果

### セキュリティ向上
- APIキーのサーバーサイド管理により漏洩リスク低減
- より強固な暗号化（PostgreSQLのpgcrypto）

### パフォーマンス向上
- 非同期APIによりUIブロッキング解消
- 大容量データの扱いが可能に

### ユーザー体験向上
- 複数デバイスでの設定同期（APIキー）
- より大きなしおりデータの作成可能

### 開発体験向上
- モダンなAPI（Promise、async/await）
- 型安全性の向上（TypeScript）
- テスト容易性の向上

---

## 🔗 参考資料

- [IndexedDB API - MDN](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API)
- [idb library - GitHub](https://github.com/jakearchibald/idb)
- [Supabase Database - Docs](https://supabase.com/docs/guides/database)
- [PostgreSQL pgcrypto - Docs](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

---

**最終更新**: 2025-10-12  
**作成者**: AI Agent  
**ステータス**: 計画段階
