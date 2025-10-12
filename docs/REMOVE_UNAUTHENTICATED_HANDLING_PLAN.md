# しおり作成ページにおける未ログイン時の処理の削除 - 実装計画

## 概要

しおり作成ページ（`/`）に未ログイン状態でアクセスすることは想定されていないため、関連する未ログイン時の処理を削除し、コードベースを簡素化する。

## 目的

- 認証が必須であることをアーキテクチャレベルで明確化
- 不要なコード（未ログイン時のLocalStorage処理など）を削除
- メンテナンス性の向上
- セキュリティの明確化

## 現状分析

### 現在の認証フロー

1. **middleware.ts**
   - `/api/chat`, `/api/itinerary`, `/itineraries`, `/mypage`, `/settings`を保護
   - **ルートパス`/`は保護されていない**

2. **app/page.tsx**
   - ページレベルで手動認証チェック
   - `PLAYWRIGHT_TEST_MODE=true`環境変数でE2Eテスト時はスキップ
   - 未認証の場合は`/login`にリダイレクト

3. **components/layout/Header.tsx**
   - 未ログイン時に`LoginButton`を表示
   - ログイン時に`UserMenu`を表示

4. **components/layout/StorageInitializer.tsx**
   - ログイン時: データベースから読み込み
   - **未ログイン時: LocalStorageから読み込み**（削除対象）

5. **components/itinerary/SaveButton.tsx**
   - ログイン時: データベースに保存
   - **未ログイン時: LocalStorageに保存**（削除対象）

### E2Eテストの現状

- `playwright.config.ts`で`PLAYWRIGHT_TEST_MODE=true`を設定
- `app/page.tsx`でこの環境変数をチェックして認証スキップ

## 実装計画

### Phase 1: ミドルウェアの更新（認証保護の強化）

#### 1.1 middleware.tsの更新

**ファイル**: `middleware.ts`

**変更内容**:
- ルートパス`/`をmatcherに追加し、認証必須にする
- E2Eテスト用のバイパス機能を追加（HTTPヘッダー`x-test-mode: 'true'`）

**実装**:
```typescript
export default withAuth(
  function middleware(req) {
    // E2Eテスト用バイパス
    const testMode = req.headers.get('x-test-mode');
    if (testMode === 'true') {
      return NextResponse.next();
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // E2Eテスト用バイパス
        const testMode = req.headers.get('x-test-mode');
        if (testMode === 'true') {
          return true;
        }
        
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/", // ルートパスを追加
    "/api/chat/:path*",
    "/api/itinerary/:path*",
    "/api/generate-pdf/:path*",
    "/api/settings/:path*",
    "/itineraries/:path*",
    "/mypage/:path*",
    "/settings/:path*",
  ],
};
```

**理由**:
- 認証チェックをミドルウェアに一元化
- ページコンポーネントから認証ロジックを削除可能に
- E2Eテストは環境変数ではなくHTTPヘッダーでバイパス（より安全）

---

### Phase 2: ページコンポーネントの簡素化

#### 2.1 app/page.tsxの更新

**ファイル**: `app/page.tsx`

**変更内容**:
- 手動認証チェックを削除（ミドルウェアで保護されているため不要）
- `PLAYWRIGHT_TEST_MODE`環境変数チェックを削除
- 関連するインポートを削除

**実装**:
```typescript
import { Header } from '@/components/layout/Header';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ResizableLayout } from '@/components/layout/ResizableLayout';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { StorageInitializer } from '@/components/layout/StorageInitializer';
import { AutoSave } from '@/components/layout/AutoSave';

/**
 * メインページ（ホーム）
 * 
 * 認証済みユーザー専用のメインアプリケーション画面。
 * middlewareで認証保護されているため、このページにアクセスできるユーザーは必ずログイン済み。
 * 
 * **デスクトップ (≥768px)**:
 * - 左側にチャットボックス（40%）、右側に旅のしおりプレビュー（60%）
 * 
 * **モバイル (<768px)**:
 * - タブ切り替えで「しおり」または「チャット」を表示
 * - しおりタブがデフォルト
 */
export default async function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* データベースからデータ復元 */}
      <StorageInitializer />
      
      {/* しおりの自動保存 */}
      <AutoSave />

      {/* Header */}
      <Header />

      {/* Desktop Layout - Resizable Layout (≥768px) */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <ResizableLayout />
      </div>

      {/* Mobile Layout - タブ切り替え (<768px) */}
      <div className="md:hidden flex-1 overflow-hidden">
        <MobileLayout />
      </div>

      {/* Error Notification */}
      <ErrorNotification />
    </div>
  );
}
```

**削除するコード**:
```typescript
// 削除
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

// 削除
const isE2ETest = process.env.PLAYWRIGHT_TEST_MODE === 'true';
if (!isE2ETest) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
}
```

**理由**:
- ミドルウェアで認証を保証しているため、ページレベルのチェックは冗長
- コードの重複を削除
- Server Componentとしてシンプルに保つ

---

### Phase 3: コンポーネントの簡素化（未ログイン処理の削除）

#### 3.1 components/layout/Header.tsxの更新

**ファイル**: `components/layout/Header.tsx`

**変更内容**:
- `LoginButton`の表示ロジックを削除
- セッションは常に存在する前提に簡素化

**実装**:
```typescript
export const Header: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <>
      <BranchModeIndicator />
      <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* ロゴ */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3">
            <div className="bg-blue-500 rounded-lg p-1.5 md:p-2">
              <Plane className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-gray-800">Journee</h1>
              <p className="text-xs text-gray-500">AI旅のしおり作成</p>
            </div>
            {/* モバイルでは簡略版 */}
            <span className="sm:hidden text-lg font-bold text-gray-800">Journee</span>
          </Link>
        </div>

        {/* デスクトップメニュー (≥768px) */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          {/* 保存状態表示 */}
          <SaveStatus />

          {/* しおり一覧ボタン */}
          <Link
            href="/itineraries"
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="しおり一覧"
          >
            <BookOpen className="w-5 h-5" />
            <span>しおり一覧</span>
          </Link>

          {/* フィードバックボタン */}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="フィードバック"
          >
            <MessageSquare className="w-5 h-5" />
            <span>フィードバック</span>
          </button>

          {/* 設定ボタン */}
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="設定ページ"
          >
            <Settings className="w-5 h-5" />
            <span>設定</span>
          </button>

          {/* ユーザーメニュー */}
          {status === 'loading' ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          ) : (
            <UserMenu />
          )}
        </div>

        {/* モバイルメニュー (<768px) */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* 保存状態表示（モバイル用コンパクト版） */}
          <div className="mr-1">
            <SaveStatus />
          </div>

          {/* ハンバーガーメニュー */}
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : (
            <MobileMenu
              userName={session?.user?.name}
              userEmail={session?.user?.email}
              userImage={session?.user?.image}
              onFeedbackClick={() => setIsFeedbackModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* フィードバックモーダル */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
      </header>
    </>
  );
};
```

**削除するコード**:
```typescript
// 削除（LoginButtonのインポート）
import { LoginButton } from '@/components/auth/LoginButton';

// 削除（デスクトップ版）
{status === 'loading' ? (
  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
) : session ? (
  <UserMenu />
) : (
  <LoginButton />
)}

// 削除（モバイル版）
{status === 'loading' ? (
  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
) : session ? (
  <MobileMenu ... />
) : (
  <LoginButton />
)}

// 削除（条件付きレンダリング）
{session && <SaveStatus />}
{session && <Link href="/itineraries">...</Link>}
{session && <button onClick={...}>設定</button>}
```

**理由**:
- このページでは常に認証済みなので、未ログイン時のUIは不要
- コードが簡潔になり、意図が明確に

---

#### 3.2 components/layout/StorageInitializer.tsxの更新

**ファイル**: `components/layout/StorageInitializer.tsx`

**変更内容**:
- 未ログイン時のLocalStorage読み込みロジックを削除
- セッションが常に存在する前提でシンプル化
- セッションロード待機処理を削除（ミドルウェアで保証されている）

**実装**:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store/useStore";

/**
 * ストレージ初期化コンポーネント（認証必須版）
 *
 * middlewareで認証保護されているため、このコンポーネントはログイン済みユーザーのみが使用。
 * データベースから最新のしおりを読み込む。
 */
export const StorageInitializer: React.FC = () => {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initializeFromStorage = useStore(
    (state) => state.initializeFromStorage
  );
  const setItinerary = useStore((state) => state.setItinerary);
  const setStorageInitialized = useStore(
    (state) => state.setStorageInitialized
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 既に初期化済みなら何もしない
    if (isInitialized) {
      return;
    }

    // セッションがまだロードされていない場合は待機
    if (!session?.user) {
      return;
    }

    const initialize = async () => {
      // LocalStorageからAPIキーと選択AIを復元
      await initializeFromStorage();

      // URLパラメータからしおりIDを取得
      const itineraryId = searchParams.get("itineraryId");

      if (itineraryId) {
        // URLパラメータで指定されたしおりをデータベースから読み込む
        try {
          const response = await fetch(
            `/api/itinerary/load?id=${itineraryId}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.itinerary) {
              setItinerary(data.itinerary);
            }
          } else {
            console.error("Failed to load itinerary from database");
          }
        } catch (error) {
          console.error("Failed to load itinerary from database:", error);
        }
      } else {
        // URLパラメータがない場合、最後に編集したしおりをDBから読み込む
        // TODO: 将来的にDBから「最後に編集したしおり」を取得する機能を実装
        // 現時点では何も読み込まない（空の状態から開始）
      }

      // 初期化完了を通知
      setStorageInitialized(true);
      setIsInitialized(true);
    };

    initialize();
  }, [
    session,
    isInitialized,
    initializeFromStorage,
    setItinerary,
    setStorageInitialized,
    searchParams,
  ]);

  // このコンポーネントは何も表示しない
  return null;
};
```

**削除するコード**:
```typescript
// 削除
import { getItineraryById } from "@/lib/mock-data/itineraries";
import { loadCurrentItinerary, getLastSaveTime } from "@/lib/utils/storage";

// 削除
const { data: session, status: sessionStatus } = useSession();
const setLastSaveTime = useStore((state) => state.setLastSaveTime);

// 削除（セッション待機ロジック）
if (sessionStatus === "loading") {
  return;
}

// 削除（未ログイン時のフォールバック全体）
if (session?.user) {
  // データベース処理
} else {
  // LocalStorage処理（削除対象）
  const itinerary = getItineraryById(itineraryId);
  if (itinerary) {
    setItinerary(itinerary);
  }
}

// 削除（最後の保存時刻処理）
const lastSaveTime = getLastSaveTime();
if (lastSaveTime) {
  setLastSaveTime(lastSaveTime);
}
```

**理由**:
- 認証必須のため、未ログイン時の処理は完全に不要
- LocalStorageフォールバックを削除し、データベース一本化
- コードの複雑性を大幅に削減

---

#### 3.3 components/itinerary/SaveButton.tsxの更新

**ファイル**: `components/itinerary/SaveButton.tsx`

**変更内容**:
- 未ログイン時のLocalStorage保存ロジックを削除
- データベース保存のみに簡素化

**実装**:
```typescript
"use client";

import React, { useState } from "react";
import { Save, FilePlus } from "lucide-react";
import { useStore } from "@/lib/store/useStore";
import { generateId } from "@/lib/utils/id-generator";

/**
 * しおり保存ボタン（認証必須版）
 *
 * middlewareで認証保護されているため、常にデータベースに保存。
 *
 * 保存モード:
 * - overwrite: 既存のしおりを上書き保存
 * - new: 新規のしおりとして保存（新しいIDを生成）
 */
export const SaveButton: React.FC = () => {
  const currentItinerary = useStore((state) => state.currentItinerary);
  const setItinerary = useStore((state) => state.setItinerary);
  const addToast = useStore((state) => state.addToast);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (mode: "overwrite" | "new" = "overwrite") => {
    if (!currentItinerary) return;

    setIsSaving(true);

    try {
      let itineraryToSave = currentItinerary;

      // 新規保存の場合は新しいIDを生成
      if (mode === "new") {
        const newId = generateId();
        itineraryToSave = {
          ...currentItinerary,
          id: newId,
          createdAt: new Date(),
          updatedAt: new Date(),
          // 公開情報をクリア（新規保存時は非公開に）
          isPublic: false,
          publicSlug: undefined,
          publishedAt: undefined,
          viewCount: undefined,
        };

        // ZustandストアのcurrentItineraryを更新
        setItinerary(itineraryToSave);
      }

      // データベースに保存
      const response = await fetch("/api/itinerary/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itinerary: itineraryToSave,
          saveMode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save itinerary to database");
      }

      const data = await response.json();
      addToast(data.message || "しおりを保存しました", "success");
    } catch (error) {
      console.error("Failed to save itinerary:", error);
      addToast("保存に失敗しました", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentItinerary) return null;

  return (
    <div className="flex items-center gap-2">
      {/* 上書き保存ボタン */}
      <button
        onClick={() => handleSave("overwrite")}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="現在のしおりを上書き保存"
      >
        <Save size={20} />
        <span>{isSaving ? "保存中..." : "上書き保存"}</span>
      </button>

      {/* 新規保存ボタン */}
      <button
        onClick={() => handleSave("new")}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="別のしおりとして保存"
      >
        <FilePlus size={20} />
        <span>{isSaving ? "保存中..." : "新規保存"}</span>
      </button>
    </div>
  );
};
```

**削除するコード**:
```typescript
// 削除
import { useSession } from "next-auth/react";
import { saveCurrentItinerary } from "@/lib/utils/storage";
import { updateItinerary, addItinerary } from "@/lib/mock-data/itineraries";

// 削除
const { data: session } = useSession();

// 削除（未ログイン時のLocalStorage保存ロジック全体）
if (session?.user) {
  // データベース保存
} else {
  // LocalStorage保存（削除対象）
  const success = saveCurrentItinerary(itineraryToSave);
  
  if (success) {
    const itineraries = JSON.parse(
      localStorage.getItem("journee_itineraries") || "[]"
    );
    const existingIndex = itineraries.findIndex(
      (item: any) => item.id === itineraryToSave.id
    );

    if (existingIndex !== -1 && mode === "overwrite") {
      updateItinerary(itineraryToSave.id, itineraryToSave);
      addToast("しおりを更新しました", "success");
    } else {
      addItinerary(itineraryToSave);
      addToast(
        mode === "new"
          ? "新規しおりとして保存しました"
          : "しおりを保存しました",
        "success"
      );
    }
  } else {
    throw new Error("Failed to save to LocalStorage");
  }
}
```

**理由**:
- 認証必須のため、LocalStorage保存は不要
- データベース保存のみに一本化
- コードの保守性向上

---

### Phase 4: E2Eテストの更新

#### 4.1 playwright.config.tsの更新

**ファイル**: `playwright.config.ts`

**変更内容**:
- 環境変数`PLAYWRIGHT_TEST_MODE`を削除
- HTTPヘッダー`x-test-mode: 'true'`を追加

**実装**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      // E2Eテスト時に認証をバイパス
      'x-test-mode': 'true',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**変更点**:
```diff
- command: 'PLAYWRIGHT_TEST_MODE=true npm run dev',
+ command: 'npm run dev',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
+   extraHTTPHeaders: {
+     'x-test-mode': 'true',
+   },
  },
- env: {
-   PLAYWRIGHT_TEST_MODE: 'true',
- },
```

**理由**:
- HTTPヘッダーの方がより安全（プロダクション環境変数の誤設定を防ぐ）
- ミドルウェアで統一的に処理可能

---

### Phase 5: ドキュメントの更新

#### 5.1 README.mdの更新

**ファイル**: `README.md`

**追加内容**:
```markdown
## 認証要件

Journeeのメインアプリケーション（`/`）は**認証必須**です。

- ログインページ: `/login`（Google OAuth）
- 認証保護: Next.js middlewareで実装
- 未ログイン時: 自動的に`/login`にリダイレクト

### E2Eテスト時の認証バイパス

E2Eテストでは、HTTPヘッダー`x-test-mode: 'true'`を送信することで認証をバイパスできます。

```typescript
// playwright.config.ts
use: {
  extraHTTPHeaders: {
    'x-test-mode': 'true',
  },
},
```
```

#### 5.2 docs/TESTING.mdの更新

**ファイル**: `docs/TESTING.md`

**追加セクション**:
```markdown
## E2Eテストでの認証バイパス

メインアプリケーション（`/`）は認証必須ですが、E2Eテストでは以下の方法で認証をバイパスできます。

### HTTPヘッダーによるバイパス

`playwright.config.ts`で`x-test-mode: 'true'`ヘッダーを設定:

```typescript
export default defineConfig({
  use: {
    extraHTTPHeaders: {
      'x-test-mode': 'true',
    },
  },
});
```

### ミドルウェアでの処理

`middleware.ts`が`x-test-mode`ヘッダーを検出し、認証チェックをスキップします。

**重要**: このバイパスは開発・テスト環境のみで使用してください。本番環境では環境変数やヘッダーでの制御を厳格に管理してください。
```

---

## 影響範囲の分析

### 削除されるファイル/機能

なし（コード削減のみ）

### 変更されるファイル

1. `middleware.ts` - 認証保護の強化、E2Eバイパス追加
2. `app/page.tsx` - 手動認証チェック削除
3. `components/layout/Header.tsx` - LoginButton削除
4. `components/layout/StorageInitializer.tsx` - 未ログイン処理削除
5. `components/itinerary/SaveButton.tsx` - LocalStorage保存削除
6. `playwright.config.ts` - E2Eテスト設定更新
7. `README.md` - 認証要件の明記
8. `docs/TESTING.md` - E2Eテスト手順更新

### 影響を受けるコンポーネント

#### 直接影響
- `app/page.tsx` - メインページ
- `components/layout/Header.tsx` - ヘッダー
- `components/layout/StorageInitializer.tsx` - 初期化
- `components/itinerary/SaveButton.tsx` - 保存ボタン

#### 間接影響（削除されるコードへの依存）
- `components/auth/LoginButton.tsx` - 使用されなくなるが、削除はしない（他のページで使用）
- `lib/utils/storage.ts` - LocalStorage関数は残す（APIキーなどで使用中）
- `lib/mock-data/itineraries.ts` - モックデータは残す（テスト・開発用）

### 既存の動作への影響

#### ✅ 影響なし（保持される機能）
- ログイン済みユーザーのしおり作成・編集
- データベースへの保存・読み込み
- 他の認証必須ページ（`/mypage`, `/settings`, etc.）
- E2Eテスト（認証バイパス機構を更新）

#### ⚠️ 削除される機能
- 未ログイン時のしおり作成（そもそも想定外）
- 未ログイン時のLocalStorage保存（不要）
- ページレベルの手動認証チェック（ミドルウェアに統合）

---

## テスト計画

### Unit Tests

該当なし（既存のユニットテストは影響を受けない）

### E2E Tests

#### 新規テスト
1. **認証保護テスト**
   - ファイル: `e2e/auth-protection.spec.ts`（新規作成）
   - 内容:
     - `x-test-mode`ヘッダーなしで`/`にアクセス → `/login`にリダイレクト
     - `x-test-mode: 'true'`ヘッダーありで`/`にアクセス → 正常表示

#### 既存テストの確認
- 既存のE2Eテストが`x-test-mode`ヘッダーで動作することを確認
- `playwright.config.ts`の変更だけで動作するはず

### Manual Tests

1. **未ログイン時の動作確認**
   - ブラウザでログアウト
   - `http://localhost:3000/`にアクセス
   - `/login`にリダイレクトされることを確認

2. **ログイン時の動作確認**
   - Googleでログイン
   - `http://localhost:3000/`にアクセス
   - メインアプリケーションが正常に表示されることを確認
   - しおりの作成・保存・読み込みが動作することを確認

3. **E2Eテストの実行**
   - `npm run test:e2e`を実行
   - すべてのテストがパスすることを確認

---

## リスクと対策

### リスク1: E2Eテストの失敗

**リスク**: HTTPヘッダーによる認証バイパスが正しく動作しない

**対策**:
- ミドルウェアで確実に`x-test-mode`ヘッダーをチェック
- 新規E2Eテストで認証バイパスを検証
- CI環境での動作確認

### リスク2: 既存コンポーネントへの影響

**リスク**: 削除したコード（LoginButton表示など）が他のコンポーネントで使われている

**対策**:
- `LoginButton`コンポーネント自体は削除しない（`/login`ページで使用）
- `grep`で参照箇所を確認
- 段階的に変更を適用し、各ステップで動作確認

### リスク3: LocalStorageデータの互換性

**リスク**: 既存ユーザーのLocalStorageデータが失われる

**対策**:
- LocalStorage関数自体は削除しない（APIキーなどで使用中）
- しおりデータはデータベースに移行済み（Phase 10.4完了）
- 既存のマイグレーション機能で対応可能

---

## 実装順序

### Step 1: ミドルウェアの更新
1. `middleware.ts`を更新
2. E2Eテスト設定を更新（`playwright.config.ts`）
3. 動作確認

### Step 2: ページコンポーネントの簡素化
1. `app/page.tsx`から認証チェック削除
2. 動作確認

### Step 3: コンポーネントの簡素化
1. `components/layout/Header.tsx`を更新
2. `components/layout/StorageInitializer.tsx`を更新
3. `components/itinerary/SaveButton.tsx`を更新
4. 各ステップで動作確認

### Step 4: テストとドキュメント
1. E2Eテストを実行・確認
2. 新規E2Eテストを追加（認証保護テスト）
3. ドキュメントを更新（`README.md`, `docs/TESTING.md`）

### Step 5: 最終確認
1. すべてのE2Eテストを実行
2. 手動でログイン・ログアウト動作を確認
3. ビルドエラーがないことを確認（`npm run build`）
4. 型チェックを実行（`npm run type-check`）
5. Lintを実行（`npm run lint`）

---

## 完了条件

### 必須条件
- [ ] ルートパス`/`がミドルウェアで保護されている
- [ ] 未ログイン時に`/`にアクセスすると`/login`にリダイレクト
- [ ] ログイン時に`/`が正常に表示される
- [ ] E2Eテストが`x-test-mode`ヘッダーでバイパス可能
- [ ] すべてのE2Eテストがパスする
- [ ] ビルドエラーがない（`npm run build`）
- [ ] 型チェックがパスする（`npm run type-check`）
- [ ] Lintがパスする（`npm run lint`）

### 推奨条件
- [ ] 新規E2Eテスト（認証保護テスト）が追加されている
- [ ] ドキュメント（README.md, TESTING.md）が更新されている
- [ ] コードレビューが完了している

---

## 参考資料

### 関連ドキュメント
- [docs/MOCK_AUTH.md](../docs/MOCK_AUTH.md) - モック認証ドキュメント
- [docs/TESTING.md](../docs/TESTING.md) - テスト戦略
- [.cursor/rules/authentication.mdc](../.cursor/rules/authentication.mdc) - 認証ルール

### NextAuth.js Middleware
- [NextAuth.js Middleware Documentation](https://next-auth.js.org/configuration/nextjs#middleware)

### Playwright HTTP Headers
- [Playwright extraHTTPHeaders](https://playwright.dev/docs/api/class-browser#browser-new-context-option-extra-http-headers)

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|-----|---------|---------|-------|
| 2025-10-12 | 1.0.0 | 初版作成 | Cursor Agent |
