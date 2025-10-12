# マイページAPI統合 実装計画

## 概要

マイページで表示されるユーザー情報および統計情報を、モックデータから実際のAPIデータに置き換えます。

## 背景・目的

現在のマイページは、ユーザーの登録日や旅行統計情報にハードコードされた値やモックデータを使用しています。本PRの目的は、これらの情報をデータベースから動的に取得し、ユーザーに正確なデータを提供することです。

## 現状分析

### 現在の実装状態

#### 1. ユーザープロフィール (`components/mypage/UserProfile.tsx`)
- **問題**: 登録日がハードコード (`const registeredDate = new Date('2025-03-15')`)
- **影響**: すべてのユーザーに同じ登録日が表示される
- **必要な変更**: `/api/user/me` から `created_at` を取得して表示

#### 2. ユーザー統計 (`components/mypage/MyPageContent.tsx`)
- **問題**: `getMockUserStats()` を使用してモックデータを表示
- **影響**: 実際のしおりデータが反映されない
- **必要な変更**: 新しいAPIエンドポイント `/api/user/stats` を作成し、実データを計算

#### 3. 既存API (`app/api/user/me/route.ts`)
- **現状**: `id`, `email`, `name`, `image`, `googleId` のみ返却
- **必要な追加**: `created_at` フィールドの追加

### データベーススキーマ確認

```sql
-- usersテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- itinerariesテーブル
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255),
  start_date DATE,
  end_date DATE,
  duration INT,
  -- ... その他のフィールド
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 実装計画

### Phase 1: 型定義の更新

#### ファイル: `types/auth.ts`

**変更内容**: API レスポンス型に `created_at` を追加

```typescript
/**
 * /api/user/me レスポンス型
 */
export interface UserMeResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  googleId: string | null;
  createdAt: string; // ISO 8601形式
}
```

**理由**: TypeScript の型安全性を保つため、API レスポンスの型を事前に定義

---

### Phase 2: `/api/user/me` の拡張

#### ファイル: `app/api/user/me/route.ts`

**変更内容**: ユーザーの登録日 (`created_at`) を含むようにAPIレスポンスを拡張

**変更前**:
```typescript
return NextResponse.json({
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
  googleId: user.googleId,
});
```

**変更後**:
```typescript
return NextResponse.json({
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
  googleId: user.googleId,
  createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
});
```

**依存関係**: 
- `getCurrentUser()` が `createdAt` を返すことを確認
- 必要に応じて `lib/auth/session.ts` の `getCurrentUser()` を更新

---

### Phase 3: `/api/user/stats` の新規作成

#### ファイル: `app/api/user/stats/route.ts` (新規作成)

**目的**: ユーザーのしおり統計情報を計算して返す新しいAPIエンドポイント

**レスポンス型**:
```typescript
interface UserStatsResponse {
  totalItineraries: number;      // しおり総数
  totalCountries: number;         // 訪問国数（重複なし）
  totalDays: number;              // 総旅行日数
  monthlyStats: MonthlyStats[];   // 月別しおり作成数
  countryDistribution: CountryDistribution[]; // 訪問国分布
}

interface MonthlyStats {
  month: string;  // YYYY-MM形式
  count: number;  // しおり作成数
}

interface CountryDistribution {
  country: string;
  count: number;
  percent: number; // 割合（0.0 - 1.0）
}
```

**実装概要**:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/db/supabase";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // 1. しおり総数を取得
    const { count: totalItineraries } = await supabase
      .from('itineraries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 2. 全しおりデータを取得（統計計算用）
    const { data: itineraries, error } = await supabase
      .from('itineraries')
      .select('destination, duration, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 3. 訪問国数を計算（重複削除）
    const countries = new Set(
      itineraries
        .map(i => i.destination)
        .filter((d): d is string => d !== null && d !== '')
    );
    const totalCountries = countries.size;

    // 4. 総旅行日数を計算
    const totalDays = itineraries.reduce(
      (sum, i) => sum + (i.duration || 0),
      0
    );

    // 5. 月別しおり作成数を計算
    const monthlyMap = new Map<string, number>();
    itineraries.forEach(itinerary => {
      if (itinerary.created_at) {
        const month = itinerary.created_at.substring(0, 7); // YYYY-MM
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      }
    });

    // 直近6ヶ月分のデータを生成（データがない月は0）
    const monthlyStats: MonthlyStats[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toISOString().substring(0, 7);
      monthlyStats.push({
        month,
        count: monthlyMap.get(month) || 0,
      });
    }

    // 6. 訪問国分布を計算
    const countryMap = new Map<string, number>();
    itineraries.forEach(itinerary => {
      if (itinerary.destination) {
        countryMap.set(
          itinerary.destination,
          (countryMap.get(itinerary.destination) || 0) + 1
        );
      }
    });

    const countryDistribution: CountryDistribution[] = Array.from(
      countryMap.entries()
    )
      .map(([country, count]) => ({
        country,
        count,
        percent: totalItineraries ? count / totalItineraries : 0,
      }))
      .sort((a, b) => b.count - a.count); // 降順ソート

    // レスポンス返却
    return NextResponse.json({
      totalItineraries: totalItineraries || 0,
      totalCountries,
      totalDays,
      monthlyStats,
      countryDistribution,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
```

**エッジケース処理**:
- しおりが0件の場合: すべて0を返す
- `destination` が null の場合: 訪問国数にカウントしない
- `duration` が null の場合: 総旅行日数に加算しない
- 月別データ: 直近6ヶ月分を必ず返す（データがない月は `count: 0`）

---

### Phase 4: `UserProfile.tsx` の更新

#### ファイル: `components/mypage/UserProfile.tsx`

**変更内容**: ハードコードされた登録日を削除し、`/api/user/me` から取得した実際の登録日を表示

**変更前**:
```typescript
const registeredDate = new Date('2025-03-15');
const formattedDate = registeredDate.toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

**変更後**:
```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Calendar } from 'lucide-react';
import type { Session } from 'next-auth';

interface UserProfileProps {
  session: Session;
}

export const UserProfile: React.FC<UserProfileProps> = ({ session }) => {
  const { user } = session;
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setCreatedAt(data.createdAt);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '読み込み中...';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* ... 既存のUI ... */}
      <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">
          {isLoading ? '読み込み中...' : `${formattedDate} 登録`}
        </span>
      </div>
      {/* ... */}
    </div>
  );
};
```

**代替案（props経由で渡す）**:
```typescript
interface UserProfileProps {
  session: Session;
  createdAt?: string; // 親コンポーネントから渡す
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  session, 
  createdAt 
}) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '登録日不明';
  
  // ...
};
```

**推奨**: 親コンポーネント（`MyPageContent.tsx`）で一度だけAPIを呼び、props経由で渡す方が効率的

---

### Phase 5: `MyPageContent.tsx` の更新

#### ファイル: `components/mypage/MyPageContent.tsx`

**変更内容**: 
1. `getMockUserStats()` の呼び出しを削除
2. 新規作成した `/api/user/stats` エンドポイントから統計情報を取得
3. `/api/user/me` から取得した `createdAt` を `UserProfile` に渡す

**変更前**:
```typescript
const [userStats, setUserStats] = useState(getMockUserStats());

const loadData = async () => {
  // ...
  setUserStats(getMockUserStats()); // モックデータ
};
```

**変更後**:
```typescript
const [userStats, setUserStats] = useState<UserStats | null>(null);
const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
const [isLoadingStats, setIsLoadingStats] = useState(true);

const loadData = async () => {
  if (!session?.user) {
    setRecentItineraries(getMockRecentItineraries());
    setUserStats(getMockUserStats());
    setIsLoading(false);
    return;
  }

  try {
    // 並列で実行
    const [itinerariesResult, statsResponse, userResponse] = await Promise.all([
      itineraryRepository.listItineraries(
        session.user.id,
        {},
        'updated_at',
        'desc',
        { page: 1, pageSize: 6 }
      ),
      fetch('/api/user/stats'),
      fetch('/api/user/me'),
    ]);

    // しおり一覧
    setRecentItineraries(itinerariesResult.data);

    // ユーザー統計
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      setUserStats(stats);
    } else {
      console.error('Failed to fetch user stats');
      setUserStats(getMockUserStats()); // フォールバック
    }

    // ユーザー情報（登録日）
    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUserCreatedAt(userData.createdAt);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    setRecentItineraries(getMockRecentItineraries());
    setUserStats(getMockUserStats());
  } finally {
    setIsLoading(false);
    setIsLoadingStats(false);
  }
};

// ...

return (
  <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-8">
      {session && (
        <UserProfile session={session} createdAt={userCreatedAt} />
      )}

      {isLoadingStats ? (
        <div>統計情報を読み込み中...</div>
      ) : userStats ? (
        <UserStats stats={userStats} />
      ) : (
        <div>統計情報の取得に失敗しました</div>
      )}

      {/* 最近のしおり */}
      {/* ... */}
    </div>
  </PullToRefresh>
);
```

**エラーハンドリング**:
- API呼び出しが失敗した場合、モックデータにフォールバック
- ローディング状態を適切に表示

---

## 実装順序

1. **型定義の更新** (`types/auth.ts`)
   - `UserMeResponse` 型を追加

2. **バックエンドAPI拡張** (`app/api/user/me/route.ts`)
   - `created_at` を返すように変更
   - `lib/auth/session.ts` の `getCurrentUser()` を確認・必要なら更新

3. **新規APIエンドポイント作成** (`app/api/user/stats/route.ts`)
   - ユーザー統計を計算するロジックを実装
   - エッジケースを処理

4. **フロントエンド更新** (`components/mypage/UserProfile.tsx`)
   - props経由で `createdAt` を受け取る
   - ハードコードされた日付を削除

5. **統合** (`components/mypage/MyPageContent.tsx`)
   - `/api/user/stats` を呼び出し
   - `/api/user/me` から `createdAt` を取得
   - `UserProfile` に `createdAt` を渡す
   - モックデータ呼び出しを削除

6. **テスト**
   - 各APIエンドポイントの動作確認
   - UI表示の確認
   - エラーケースの確認

---

## テスト計画

### 1. APIエンドポイントのテスト

#### `/api/user/me`
- [ ] 認証済みユーザーで呼び出し → `createdAt` が含まれる
- [ ] 未認証で呼び出し → 401エラー
- [ ] `createdAt` が正しいISO 8601形式

#### `/api/user/stats`
- [ ] しおりが0件のユーザー → すべて0を返す
- [ ] しおりが複数件あるユーザー → 正しい統計が返る
- [ ] 訪問国が重複している場合 → 重複なしでカウント
- [ ] `destination` が null のしおり → 訪問国数にカウントしない
- [ ] `duration` が null のしおり → 総旅行日数に加算しない
- [ ] 月別データが直近6ヶ月分返る
- [ ] 訪問国分布が降順でソートされている
- [ ] 未認証で呼び出し → 401エラー

### 2. UIの動作確認

- [ ] マイページで実際の登録日が表示される
- [ ] 実際のしおり統計が表示される
- [ ] しおりが0件の場合も適切に表示される
- [ ] プルトゥリフレッシュで統計が再取得される
- [ ] API呼び出し中はローディング表示
- [ ] APIエラー時にモックデータへフォールバック

### 3. パフォーマンステスト

- [ ] `/api/user/stats` の応答時間 < 1秒
- [ ] 大量のしおり（100件以上）でも問題なく動作
- [ ] 並列API呼び出しが正しく動作

---

## 考慮事項

### パフォーマンス最適化

1. **キャッシング**
   - 統計情報は頻繁に変わらないため、Next.js のキャッシュ設定を活用
   ```typescript
   export const revalidate = 300; // 5分間キャッシュ
   ```

2. **インデックスの確認**
   - `itineraries` テーブルの `user_id` にインデックスが存在することを確認
   - `created_at` フィールドにインデックスが必要か検討

3. **クエリ最適化**
   - 統計計算に必要な最小限のフィールドのみ取得
   - `select('destination, duration, created_at')`

### セキュリティ

- RLS（Row Level Security）により、ユーザーは自分のしおりのみアクセス可能
- API エンドポイントで `getCurrentUser()` による認証チェック必須

### エラーハンドリング

- API呼び出し失敗時はモックデータにフォールバック
- ユーザーに適切なエラーメッセージを表示
- コンソールエラーをログに記録

### 将来の拡張性

- 統計情報のさらなる追加（平均予算、人気の行先など）
- グラフのカスタマイズオプション
- 統計情報のエクスポート機能

---

## リリース計画

1. **Phase 1-2**: 型定義とAPIの拡張（破壊的変更なし）
2. **Phase 3**: 新規APIエンドポイント作成（独立して動作）
3. **Phase 4-5**: フロントエンドの更新（ユーザーに変更が見える）
4. **動作確認**: 開発環境で十分にテスト
5. **本番リリース**: 段階的にロールアウト

---

## 依存関係

### 必要なパッケージ（既にインストール済み）
- `@supabase/supabase-js`: データベース接続
- `next-auth`: 認証
- `recharts`: グラフ描画

### 必要なデータベース設定
- `users` テーブルに `created_at` フィールドが存在すること
- `itineraries` テーブルに `destination`, `duration`, `created_at` フィールドが存在すること
- Row Level Security (RLS) が適切に設定されていること

---

## まとめ

本実装計画により、マイページのモック実装部分を実際のAPIデータに置き換え、ユーザーに正確で動的な情報を提供できるようになります。

**主な変更点**:
1. `/api/user/me` に `createdAt` を追加
2. `/api/user/stats` を新規作成（統計情報の計算）
3. `UserProfile.tsx` でハードコードされた登録日を削除
4. `MyPageContent.tsx` でモックデータの呼び出しを削除し、実APIを使用

**期待される成果**:
- ユーザーごとに正確な登録日が表示される
- 実際のしおりデータに基づいた統計情報が表示される
- データベースとの統合により、動的で信頼性の高いUIを実現
