# localStorage移行実装ガイド

> ✅ **実装完了**: 全フェーズ（Phase 1-7）の実装が完了しました！

## 📊 移行の概要

| 項目 | Before | After |
|------|--------|-------|
| **UI設定** | localStorage（同期） | IndexedDB（非同期） |
| **しおりデータ** | localStorage | Zustand persist → IndexedDB |
| **APIキー** | localStorage（暗号化） | Supabase（サーバー側暗号化） |
| **容量** | 5-10MB | 実質無制限 |
| **セキュリティ** | XSS脆弱性あり | サーバーサイド暗号化 |

## ✅ 実装完了項目

### Phase 1: IndexedDBラッパー実装 ✅
- ファイル: `lib/utils/indexed-db.ts`
- 4つのストア: `ui_state`, `settings`, `cache`, `store_state`

### Phase 2: UI設定のIndexedDB移行 ✅
- ファイル: `lib/utils/ui-storage.ts`
- パネル幅、AI選択、自動進行設定等をIndexedDBで管理

### Phase 3: APIキーのSupabase移行 ✅
- **APIエンドポイント**: `app/api/user/api-keys/route.ts`
- **データベース関数**: `lib/db/functions.sql`（pgcryptoで暗号化）
- **クライアント管理**: `lib/utils/api-key-manager.ts`

### Phase 4: Zustandストア永続化の移行 ✅
- ファイル: `lib/store/useStore.ts`
- IndexedDBストレージアダプターを実装
- `onRehydrateStorage`でハイドレーション対策

### Phase 5: localStorage直接アクセスの削除 ✅
- `lib/store/useStore.ts`内のlocalStorage操作を全削除
- Zustand persistに完全委譲

### Phase 6: マイグレーション実装 ✅
- **マイグレーションヘルパー**: `lib/utils/storage-migration.ts`
- **マイグレーションUI**: `components/migration/StorageMigration.tsx`
- 初回訪問時に自動実行

### Phase 7: 環境変数の追加 ✅
- `.env.local.example`に`ENCRYPTION_KEY`を追加
- 暗号化キー生成: `openssl rand -hex 32`

---

## 🔧 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`:
```env
# 暗号化キーの生成と設定
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### 3. データベース関数の適用

Supabase SQL Editorで`lib/db/functions.sql`を実行:
- `save_encrypted_api_key()`
- `get_decrypted_api_key()`

### 4. 動作確認

ブラウザDevTools → Application → IndexedDB → `journee-db`

---

## 🎯 実装完了のまとめ

### 達成したこと

**セキュリティ向上** 🔒
- APIキーがサーバーサイドで暗号化管理（pgcrypto）
- XSS攻撃リスクの大幅低減

**パフォーマンス向上** ⚡
- 非同期API（IndexedDB）によるUIブロッキング解消
- 大量データでも快適に動作

**容量拡大** 💾
- localStorageの5-10MB制限を回避
- 実質無制限のストレージ

**ユーザー体験向上** ✨
- 透過的な自動マイグレーション
- データ損失のリスク最小化

### アーキテクチャ図

```
[クライアント]
├─ IndexedDB
│  ├─ ui_state (パネル幅、選択AI等)
│  ├─ settings (アプリ設定)
│  ├─ cache (公開しおりキャッシュ)
│  └─ store_state (Zustandストア永続化)
│
└─ API経由 → [サーバー] → [Supabase]
                           ├─ user_settings (暗号化APIキー)
                           └─ itineraries (しおりデータ)
```

---

## ⚠️ 注意事項

### 1. 暗号化キーの管理
- **絶対に**コミットしない
- 本番環境とローカル環境で異なるキーを使用

### 2. 後方互換性
- マイグレーションは自動実行
- localStorageデータは30日間保持

### 3. ブラウザ対応
- IndexedDBは全モダンブラウザで対応
- Safari Private Browsingでは制限あり

---

## 📚 参考資料

- [IndexedDB API - MDN](https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API)
- [idb library - GitHub](https://github.com/jakearchibald/idb)
- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

---

**最終更新**: 2025-10-12  
**ステータス**: ✅ 全フェーズ実装完了
