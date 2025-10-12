# localStorage移行実装ガイド

## ✅ 実装完了項目

### Phase 1: IndexedDBラッパー実装 ✅
- ファイル: `lib/utils/indexed-db.ts`
- `journeeDB`シングルトンインスタンス
- 4つのストア: `ui_state`, `settings`, `cache`, `store_state`
- 非同期API（Promise）
- 型安全性（TypeScript）

### Phase 2: UI設定のIndexedDB移行 ✅
- ファイル: `lib/utils/ui-storage.ts`
- 以下の関数を実装:
  - `saveChatPanelWidth` / `loadChatPanelWidth`
  - `saveAutoProgressMode` / `loadAutoProgressMode`
  - `saveAutoProgressSettings` / `loadAutoProgressSettings`
  - `saveSelectedAI` / `loadSelectedAI`
  - `saveAppSettings` / `loadAppSettings`
- IndexedDB非対応時のフォールバック（メモリキャッシュ）

### Phase 3: APIキーのSupabase移行 ✅
- **APIエンドポイント**: `app/api/user/api-keys/route.ts`
  - POST: APIキー保存（暗号化）
  - GET: APIキー取得（復号化）
  - DELETE: APIキー削除
  
- **データベース関数**: `lib/db/functions.sql`
  - `save_encrypted_api_key()`: pgcryptoで暗号化保存
  - `get_decrypted_api_key()`: pgcryptoで復号化取得
  
- **クライアント管理**: `lib/utils/api-key-manager.ts`
  - `saveClaudeApiKey()`
  - `loadClaudeApiKey()`
  - `removeClaudeApiKey()`
  - `hasClaudeApiKey()`

### Phase 6: マイグレーション実装 ✅
- **マイグレーションヘルパー**: `lib/utils/storage-migration.ts`
  - `migrateLocalStorageToIndexedDB()`: 全データ移行
  - `checkMigrationStatus()`: 移行状況確認
  - `cleanupOldLocalStorageData()`: 旧データクリーンアップ（30日後）
  
- **マイグレーションコンポーネント**: `components/migration/StorageMigration.tsx`
  - 初回訪問時に自動実行
  - プログレス表示
  - エラーハンドリング
  
- **統合**: `app/layout.tsx`に追加

### Phase 7: 環境変数の追加 ✅
- `.env.local.example`に`ENCRYPTION_KEY`を追加
- `k8s/secret.template.yml`に`ENCRYPTION_KEY`を追加
- 暗号化キー生成方法: `openssl rand -hex 32`

---

## 🔧 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

新しい依存関係:
- `idb` - IndexedDB Promise wrapper

### 2. 環境変数の設定

#### ローカル開発環境

`.env.local`を作成:

```bash
cp .env.local.example .env.local
```

以下の変数を設定:

```env
# 暗号化キーの生成
openssl rand -hex 32

# .env.localに追加
ENCRYPTION_KEY=生成された32文字のランダム文字列
```

#### 本番環境（Kubernetes）

```bash
# 暗号化キーの生成
ENCRYPTION_KEY=$(openssl rand -hex 32)

# k8s/secret.ymlを作成（テンプレートをコピー）
cp k8s/secret.template.yml k8s/secret.yml

# 手動で編集するか、sedで置換
sed -i "s/YOUR_ENCRYPTION_KEY/$ENCRYPTION_KEY/g" k8s/secret.yml
```

### 3. データベース関数の適用

Supabase SQL Editorで`lib/db/functions.sql`を実行:

```sql
-- 5. APIキーの暗号化保存
CREATE OR REPLACE FUNCTION save_encrypted_api_key(...) ...

-- 6. APIキーの復号化取得
CREATE OR REPLACE FUNCTION get_decrypted_api_key(...) ...
```

または、Supabase CLIを使用:

```bash
supabase db push
```

### 4. 動作確認

#### IndexedDBの確認

ブラウザDevTools → Application → IndexedDB → `journee-db`

以下のストアが作成されているはずです:
- `ui_state`
- `settings`
- `cache`
- `store_state`

#### マイグレーションの確認

初回訪問時に:
1. localStorageのデータが自動的にIndexedDBに移行される
2. マイグレーション完了フラグが`localStorage`に保存される (`journee_migration_completed`)

Console出力例:
```
✅ Migration completed successfully
Migrated keys: ["journee_panel_width", "journee_selected_ai", ...]
Skipped keys: ["journee_claude_api_key"]
```

#### APIキー暗号化の確認

1. ログイン
2. 設定ページでClaude APIキーを保存
3. Supabase → user_settings テーブルで確認
   - `encrypted_claude_api_key`カラムに暗号化されたbase64文字列が保存される
4. ページをリロードしても復元されることを確認

---

## 📋 残タスク（Phase 4, 5）

### Phase 4: Zustandストア永続化の移行

**影響範囲**: `lib/store/useStore.ts`

現在のZustand永続化は`localStorage`を使用しています。これをIndexedDBに移行します。

**実装方法**:
```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import { journeeDB } from '@/lib/utils/indexed-db';

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
    (set, get) => ({ /* ... */ }),
    {
      name: 'journee-storage',
      storage: indexedDBStorage,
    }
  )
);
```

**注意**: Zustand v4の非同期ストレージ対応を確認してください。

### Phase 5: localStorageキャッシュの削除

**対象**:
- `lib/store/useStore.ts`内の直接的な`localStorage`アクセス
  - `setItinerary()`メソッド（362-380行目）
  - `updateItinerary()`メソッド（405-422行目）

**変更内容**:
これらのメソッドからlocalStorageへの直接保存を削除し、Zustand persistに委譲します。

**変更前**:
```typescript
setItinerary: (itinerary) => {
  // LocalStorageに保存
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("journee-storage", JSON.stringify(newStorage));
    } catch (e) {
      console.error("Failed to save itinerary to localStorage:", e);
    }
  }
  
  set({ currentItinerary: itinerary });
},
```

**変更後**:
```typescript
setItinerary: (itinerary) => {
  set({ currentItinerary: itinerary });
  // Zustand persistが自動的にIndexedDBに保存
},
```

---

## 🧪 テスト

### ユニットテスト

```typescript
// lib/utils/__tests__/indexed-db.test.ts
describe('JourneeDB', () => {
  it('should store and retrieve data', async () => {
    await journeeDB.init();
    await journeeDB.set('ui_state', 'test_key', 'test_value');
    const value = await journeeDB.get('ui_state', 'test_key');
    expect(value).toBe('test_value');
  });
});

// lib/utils/__tests__/storage-migration.test.ts
describe('Storage Migration', () => {
  it('should migrate localStorage to IndexedDB', async () => {
    localStorage.setItem('journee_panel_width', '45');
    const result = await migrateLocalStorageToIndexedDB();
    expect(result.success).toBe(true);
    expect(result.migratedKeys).toContain('journee_panel_width');
  });
});
```

### E2Eテスト

```typescript
// e2e/storage-migration.spec.ts
test('should migrate data on first visit', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('journee_panel_width', '45');
  });
  
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  // IndexedDBにデータが移行されたか確認
  const panelWidth = await page.evaluate(async () => {
    const db = await indexedDB.open('journee-db', 1);
    // ... 確認処理
  });
  
  expect(panelWidth).toBe(45);
});
```

---

## 🚀 デプロイ

### 1. Supabaseへの関数適用

```bash
# Supabase SQL Editorで実行
lib/db/functions.sql
```

### 2. 環境変数の設定

**Vercel**:
```bash
vercel env add ENCRYPTION_KEY
```

**Kubernetes**:
```bash
kubectl apply -f k8s/secret.yml
```

### 3. アプリケーションのデプロイ

```bash
npm run build
npm run deploy
```

---

## ⚠️ 注意事項

### 1. 暗号化キーの管理

- **絶対に**コミットしない
- 本番環境とローカル環境で異なるキーを使用
- キーをローテーションする場合は、既存のAPIキーを再暗号化する必要がある

### 2. 後方互換性

- マイグレーションは自動的に実行される
- localStorageデータは30日間保持（`cleanupOldLocalStorageData()`で削除）
- 既存ユーザーのデータ損失を防ぐため、十分なテスト期間を設ける

### 3. ブラウザ対応

- IndexedDBは全モダンブラウザで対応
- Safari Private Browsingでは制限あり（フォールバック機能で対応）
- IE11は非対応（プロジェクトではサポート外）

### 4. パフォーマンス

- IndexedDBは非同期APIのため、初期ロード時に若干の遅延が発生する可能性
- 大量データの場合、マイグレーション時間を考慮
- プログレスバーで進行状況を表示

---

## 📚 参考資料

- [IndexedDB API - MDN](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API)
- [idb library - GitHub](https://github.com/jakearchibald/idb)
- [PostgreSQL pgcrypto - Docs](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

---

## 🔄 ロールバック手順

もし問題が発生した場合:

### 1. マイグレーション無効化

`app/layout.tsx`から`<StorageMigration />`を削除

### 2. 旧コードへの復元

```bash
git revert <commit-hash>
```

### 3. データ復旧

localStorageデータは30日間保持されているため、ユーザーは引き続き利用可能

---

**最終更新**: 2025-10-12  
**ステータス**: Phase 1-3, 6-7 実装完了 / Phase 4-5 保留
