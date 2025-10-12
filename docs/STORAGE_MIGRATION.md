# localStorage移行実装ガイド

> ⚠️ **重要**: Zustand persistの使用を検討する場合は、[Zustand persistの初期レンダリング問題](#️-重要-zustand-persistの初期レンダリング問題)を必ずご確認ください。

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

> ⚠️ **重要**: この変更を実装する前に、必ず下記の[Zustand persistの初期レンダリング問題](#️-重要-zustand-persistの初期レンダリング問題)をお読みください。LocalStorageの同期アクセスとは異なる挙動になります。

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

### ⚠️ 重要: Zustand persistの初期レンダリング問題

**問題点**:
Zustand persistミドルウェアは非同期的にストレージから状態を復元するため、以下の問題が発生する可能性があります：

1. **初期レンダリング時の空状態**
   - アプリ起動直後、ストレージから状態が復元される前に、初期値（空の状態）でレンダリングされる
   - `currentItinerary: null`のような初期値が一瞬表示される可能性がある

2. **ハイドレーションミスマッチ（SSR環境）**
   - Next.jsのApp Routerではサーバー側レンダリングとクライアント側の状態が異なる
   - サーバー: 初期値、クライアント: 復元された値 → ハイドレーションエラー

3. **レース条件**
   - コンポーネントマウント時に状態がまだ復元されていない
   - データに依存するロジックが正しく動作しない可能性

**現在のlocalStorage直接アクセスとの違い**:
```typescript
// 現在の実装（同期的）
const savedItinerary = localStorage.getItem('journee-storage');
// すぐに使用可能

// Zustand persist（非同期的）
const { currentItinerary } = useStore(); // 初回は空の可能性
```

**対策方法**:

#### 対策1: ハイドレーション完了を待つ
```typescript
import { useStore } from '@/lib/store/useStore';
import { useState, useEffect } from 'react';

export function MyComponent() {
  const [isHydrated, setIsHydrated] = useState(false);
  const currentItinerary = useStore((state) => state.currentItinerary);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  if (!isHydrated) {
    return <LoadingSpinner />;
  }
  
  return <div>{/* 復元完了後のUI */}</div>;
}
```

#### 対策2: Zustand persistのonRehydrateStorageを使用
```typescript
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'journee-storage',
      storage: indexedDBStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate:', error);
        } else {
          console.log('Rehydration complete');
          // 復元完了フラグを立てる
          state?.setStorageInitialized(true);
        }
      },
    }
  )
);
```

#### 対策3: 既存のStorageInitializerコンポーネントを活用
現在のプロジェクトには`components/layout/StorageInitializer.tsx`があり、これを拡張してハイドレーション待機を実装できます。

**推奨アプローチ**:
1. Phase 4でpersistを導入する際、必ず`onRehydrateStorage`コールバックを実装
2. 既存の`isStorageInitialized`フラグを活用し、復元完了を管理
3. 重要なコンポーネント（ItineraryPreview等）ではハイドレーション完了を確認
4. E2Eテストで初期レンダリング時の状態を確認

**テスト項目**:
```typescript
// e2e/storage-hydration.spec.ts
test('should not show empty state during hydration', async ({ page }) => {
  // 状態を保存
  await page.evaluate(() => {
    localStorage.setItem('journee-storage', JSON.stringify({
      state: { currentItinerary: { /* データ */ } }
    }));
  });
  
  // ページリロード
  await page.reload();
  
  // 空状態が表示されないことを確認
  await expect(page.locator('[data-testid="empty-itinerary"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="itinerary-content"]')).toBeVisible();
});
```

### Phase 5: localStorageキャッシュの削除

**対象**:
- `lib/store/useStore.ts`内の直接的な`localStorage`アクセス
  - `setItinerary()`メソッド（362-380行目）
  - `updateItinerary()`メソッド（405-422行目）

**変更内容**:
これらのメソッドからlocalStorageへの直接保存を削除し、Zustand persistに委譲します。

> ⚠️ **注意**: Phase 4で説明した初期レンダリング問題への対策が完了していることを確認してから、この変更を実施してください。

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
  - 詳細は「[🔐 暗号化キーのローテーション](#-暗号化キーのローテーション)」セクションを参照

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

## 🔐 暗号化キーのローテーション

### 概要

セキュリティベストプラクティスとして、暗号化キーは定期的にローテーション（変更）する必要があります。
暗号化キーを変更すると、既存のキーで暗号化されたAPIキーは復号化できなくなるため、適切な手順で移行を行う必要があります。

### 問題点

現在の実装では、`ENCRYPTION_KEY`を変更すると：
- ❌ 既存のAPIキーが復号化できなくなる
- ❌ ユーザーがAPIキーを再入力する必要がある
- ❌ データ損失のリスク

### ローテーション戦略

本プロジェクトでは**複数キー対応方式**を推奨します：
- ✅ 新旧両方のキーを同時にサポート
- ✅ ユーザーログイン時に自動的に新キーで再暗号化
- ✅ データ損失のリスクを最小化
- ✅ ダウンタイムなし

### 実装手順

#### Step 1: データベース関数の更新

`lib/db/functions.sql`に以下の関数を追加（既存の関数を置き換え）：

```sql
-- 複数キー対応の復号化関数（フォールバック機能付き）
CREATE OR REPLACE FUNCTION get_decrypted_api_key(
  p_user_id UUID,
  p_encryption_key TEXT,
  p_encryption_key_old TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  encrypted_key TEXT;
  decrypted_key TEXT;
BEGIN
  -- 暗号化されたAPIキーを取得
  SELECT encrypted_claude_api_key INTO encrypted_key
  FROM user_settings
  WHERE user_id = p_user_id;
  
  -- レコードがない、またはAPIキーが設定されていない場合
  IF encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 現在のキーで復号化を試みる
  BEGIN
    decrypted_key := pgp_sym_decrypt(decode(encrypted_key, 'base64')::bytea, p_encryption_key);
    RETURN decrypted_key;
  EXCEPTION WHEN OTHERS THEN
    -- 現在のキーで失敗した場合、旧キーを試す
    IF p_encryption_key_old IS NOT NULL THEN
      BEGIN
        decrypted_key := pgp_sym_decrypt(decode(encrypted_key, 'base64')::bytea, p_encryption_key_old);
        
        -- 旧キーで成功した場合、新しいキーで再暗号化
        UPDATE user_settings
        SET encrypted_claude_api_key = encode(pgp_sym_encrypt(decrypted_key, p_encryption_key), 'base64'),
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        RAISE NOTICE 'Re-encrypted API key for user % with new key', p_user_id;
        RETURN decrypted_key;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to decrypt API key with both keys for user %: %', p_user_id, SQLERRM;
        RETURN NULL;
      END;
    ELSE
      RAISE WARNING 'Failed to decrypt API key for user %: %', p_user_id, SQLERRM;
      RETURN NULL;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Supabase SQL Editorで上記のSQLを実行してください。

#### Step 2: APIエンドポイントの更新

`app/api/user/api-keys/route.ts`の`GET`関数を更新：

```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { apiKey: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      console.error('Supabase Admin is not available');
      return NextResponse.json(
        { apiKey: null, error: 'Database not configured' },
        { status: 503 }
      );
    }

    const admin = supabaseAdmin;

    // 環境変数から暗号化キーを取得
    const encryptionKey = process.env.ENCRYPTION_KEY;
    const encryptionKeyOld = process.env.ENCRYPTION_KEY_OLD; // 移行期間のみ

    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY is not set');
      return NextResponse.json(
        { apiKey: null, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // 旧キーも渡す（自動再暗号化のため）
    const { data, error } = await (admin as any).rpc('get_decrypted_api_key', {
      p_user_id: session.user.id,
      p_encryption_key: encryptionKey,
      p_encryption_key_old: encryptionKeyOld || null,
    });

    if (error) {
      console.error('Failed to load API key:', error);
      return NextResponse.json(
        { apiKey: null, error: 'Failed to load API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ apiKey: data || null });
  } catch (error) {
    console.error('GET /api/user/api-keys error:', error);
    return NextResponse.json(
      { apiKey: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Step 3: 新しい暗号化キーの生成

```bash
# 新しいキーを生成
NEW_KEY=$(openssl rand -hex 32)
echo "新しい暗号化キー: $NEW_KEY"

# 安全な場所に保存（パスワードマネージャーなど）
```

#### Step 4: 環境変数の更新

**ローカル開発環境**（`.env.local`）:
```env
# 新キー（書き込み用）
ENCRYPTION_KEY=<new_key>

# 旧キー（読み取り専用、移行期間のみ）
ENCRYPTION_KEY_OLD=<old_key>
```

**本番環境**（Kubernetes）:
```yaml
# k8s/secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: journee-secrets
type: Opaque
stringData:
  ENCRYPTION_KEY: "<new_key>"
  ENCRYPTION_KEY_OLD: "<old_key>"
```

```bash
# Secretを適用
kubectl apply -f k8s/secret.yml

# Podを再起動して環境変数を反映
kubectl rollout restart deployment/journee
```

#### Step 5: アプリケーションのデプロイ

```bash
# コードをデプロイ
git add app/api/user/api-keys/route.ts
git commit -m "feat: support encryption key rotation"
git push

# Kubernetes環境の場合、自動的にデプロイされる
```

#### Step 6: 移行期間

この期間中、以下が自動的に実行されます：
1. ユーザーがログイン
2. APIキーの読み込み時に旧キーで復号化を試みる
3. 成功した場合、新キーで自動的に再暗号化
4. ユーザーには透過的に処理される

- 本番環境にデプロイされていないため、テストユーザーのみ対応で済みます

#### Step 7: 旧キーの削除

移行期間終了後（全ユーザーが少なくとも1回ログインした後）：

**環境変数を更新**:
```env
# .env.local
ENCRYPTION_KEY=<new_key>
# ENCRYPTION_KEY_OLD を削除
```

```yaml
# k8s/secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: journee-secrets
type: Opaque
stringData:
  ENCRYPTION_KEY: "<new_key>"
  # ENCRYPTION_KEY_OLD を削除
```

```bash
# Secretを適用
kubectl apply -f k8s/secret.yml
kubectl rollout restart deployment/journee
```

**データベース関数のクリーンアップ**（オプション）:

旧キー対応のロジックを削除して、シンプルな実装に戻すこともできます。
ただし、将来のローテーションのために残しておくことを推奨します。

### ベストプラクティス

#### 1. 事前準備
- ✅ データベースのバックアップを取得

#### 2. 実行タイミング
- ✅ 監視体制の整備

#### 3. 監視
- ✅ エラーログの確認
- ✅ 再暗号化の進捗追跡

#### 4. ドキュメント化
- ✅ 実施日時の記録
- ✅ 使用したキーの管理（安全な場所に）
- ✅ 次回ローテーションの予定

### トラブルシューティング

#### 問題: ユーザーがAPIキーを読み込めない

**原因**: 
- 旧キーが環境変数に設定されていない
- データベース関数が更新されていない

**解決方法**:
```bash
# 環境変数を確認
kubectl get secret journee-secrets -o yaml

# データベース関数を確認
# Supabase SQL Editorで実行
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'get_decrypted_api_key';
```

#### 問題: 再暗号化が進まない

**原因**: 
- ユーザーがログインしていない
- APIキーの読み込みが発生していない

**解決方法**:
- 一括再暗号化スクリプトを使用
- メール通知でユーザーに再ログインを促す

#### 問題: 一部のユーザーのキーが復号化できない

**原因**: 
- データ破損
- 異なる暗号化キーで暗号化されている

**解決方法**:
1. ユーザーに再入力を依頼
2. 影響を受けたユーザーを特定：
```sql
-- 復号化できないユーザーを特定
SELECT u.id, u.email, us.user_id
FROM users u
JOIN user_settings us ON u.id = us.user_id
WHERE us.encrypted_claude_api_key IS NOT NULL;
```

### セキュリティ考慮事項

1. **キーの保管**: 
   - パスワードマネージャーや秘密管理サービスを使用
   - 複数の場所にバックアップ
   - アクセス権限の制限

2. **ローテーション頻度**: 
   - 推奨：6ヶ月〜1年に1回
   - セキュリティインシデント時は即座に実施

3. **監査ログ**: 
   - キーローテーション実施の記録
   - アクセスログの保持
   - 異常検知の設定

4. **旧キーの破棄**: 
   - 移行完了後は安全に削除
   - 記録からも削除（ログファイルなど）
   - バックアップも考慮

---

## 📚 参考資料

- [IndexedDB API - MDN](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API)
- [idb library - GitHub](https://github.com/jakearchibald/idb)
- [PostgreSQL pgcrypto - Docs](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Encryption Key Rotation Best Practices - OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

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
**追記**: 暗号化キーローテーション手順を追加（2025-10-12）
