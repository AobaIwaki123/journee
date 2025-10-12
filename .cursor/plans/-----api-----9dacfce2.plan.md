<!-- 9dacfce2-0fa4-4b96-960f-bbdf1f7f1c0a 9ee8dbb8-faab-4014-a118-6bdaa6f8b404 -->
# マイページAPI統合実装計画

関連Issue: [#164](https://github.com/AobaIwaki123/journee/issues/164)

## 現状の問題

### 1. ハードコードされたユーザー登録日

`components/mypage/UserProfile.tsx` では、すべてのユーザーに同じ登録日（2025-03-15）が表示されている。

```typescript
// 現在の実装
const registeredDate = new Date('2025-03-15');
```

**影響**: ユーザーごとの実際の登録日が反映されず、不正確な情報を表示している。

### 2. モックデータによる統計情報

`components/mypage/MyPageContent.tsx` では、`getMockUserStats()` を使用してダミーの統計データを表示している。

```typescript
// 現在の実装
const [userStats, setUserStats] = useState(getMockUserStats());
```

**影響**:

- 実際のしおりデータが統計に反映されない
- ユーザーが作成した旅行プランの実績を確認できない
- 訪問国数、総旅行日数、月別推移などが架空のデータ

### 3. 不完全なAPI

`app/api/user/me/route.ts` は基本的なユーザー情報のみを返し、`created_at` が含まれていない。

---

## あるべき姿

### 1. 動的なユーザー情報表示

データベースから取得した実際の登録日を各ユーザーに表示する。

### 2. リアルタイム統計情報

ユーザーが作成したしおりデータに基づいて、以下の統計を動的に計算・表示：

- しおり総数
- 訪問国数（重複なし）
- 総旅行日数
- 月別しおり作成推移（直近6ヶ月）
- 訪問国分布

### 3. 完全なAPI統合

- `/api/user/me`: ユーザーの登録日を含む完全なプロフィール情報
- `/api/user/stats`: データベースから計算された統計情報
- エラーハンドリングとフォールバック機能

---

## 今回実装する範囲

### Phase 1: 型定義の追加

**ファイル**: `types/auth.ts`

`UserMeResponse` 型に `createdAt` フィールドを追加する。

```typescript
export interface UserMeResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  googleId: string | null;
  createdAt: string; // 追加
}
```

### Phase 2: `/api/user/me` の拡張

**ファイル**: `app/api/user/me/route.ts`

レスポンスに `createdAt` を追加。

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

**依存確認**: `lib/auth/session.ts` の `getCurrentUser()` が `createdAt` を返すことを確認。

### Phase 3: `/api/user/stats` の新規作成

**ファイル**: `app/api/user/stats/route.ts` (新規)

ユーザーの統計情報を計算して返すエンドポイントを実装。

**レスポンス型**:

```typescript
interface UserStatsResponse {
  totalItineraries: number;
  totalCountries: number;
  totalDays: number;
  monthlyStats: { month: string; count: number }[];
  countryDistribution: { country: string; count: number; percent: number }[];
}
```

**実装内容**:

1. Supabaseからユーザーのしおりデータを取得
2. 訪問国数を計算（Set使用で重複削除）
3. 総旅行日数を集計
4. 月別しおり作成数を計算（直近6ヶ月）
5. 訪問国分布を降順でソート

**エッジケース**:

- しおり0件 → すべて0を返す
- `destination` null → 訪問国数にカウントしない
- `duration` null → 総旅行日数に加算しない

### Phase 4: `UserProfile.tsx` の更新

**ファイル**: `components/mypage/UserProfile.tsx`

props経由で `createdAt` を受け取り、ハードコードされた日付を削除。

```typescript
interface UserProfileProps {
  session: Session;
  createdAt?: string; // 追加
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
  
  // 既存のUIで使用
};
```

### Phase 5: `MyPageContent.tsx` の統合

**ファイル**: `components/mypage/MyPageContent.tsx`

1. `getMockUserStats()` の呼び出しを削除
2. `/api/user/stats` と `/api/user/me` を並列で呼び出し
3. `UserProfile` に `createdAt` を渡す
```typescript
const [userStats, setUserStats] = useState<UserStats | null>(null);
const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);

const loadData = async () => {
  const [itinerariesResult, statsResponse, userResponse] = await Promise.all([
    itineraryRepository.listItineraries(/* ... */),
    fetch('/api/user/stats'),
    fetch('/api/user/me'),
  ]);

  // しおり一覧
  setRecentItineraries(itinerariesResult.data);

  // 統計情報
  if (statsResponse.ok) {
    const stats = await statsResponse.json();
    setUserStats(stats);
  } else {
    setUserStats(getMockUserStats()); // フォールバック
  }

  // 登録日
  if (userResponse.ok) {
    const userData = await userResponse.json();
    setUserCreatedAt(userData.createdAt);
  }
};

// render
<UserProfile session={session} createdAt={userCreatedAt} />
<UserStats stats={userStats} />
```


### テスト計画

**APIテスト**:

- `/api/user/me` が `createdAt` を返すことを確認
- `/api/user/stats` が正しい統計を計算することを確認
- 未認証時に401エラーを返すことを確認
- エッジケース（しおり0件、null値）の処理

**UIテスト**:

- マイページで実際の登録日が表示される
- 実際の統計情報が表示される
- API失敗時にモックデータへフォールバック
- ローディング状態の表示

---

## 今後の展望

### 1. パフォーマンス最適化

- 統計情報のキャッシング（Next.js の `revalidate: 300` を活用）
- データベースインデックスの最適化
- 統計計算のバックグラウンド処理

### 2. 統計情報の拡張

- 平均予算の計算と表示
- 人気の行先ランキング
- 旅行頻度の可視化
- 年間カレンダービュー

### 3. データエクスポート機能

- 統計情報のPDFエクスポート
- CSVダウンロード機能
- しおり履歴のバックアップ

### 4. ソーシャル機能

- 他ユーザーとの統計比較
- 訪問国バッジシステム
- 旅行実績のシェア機能

### 5. 予測・推薦機能

- AIによる次の旅行先の推薦
- 季節ごとの旅行提案
- 予算に基づいた目的地サジェスト

### To-dos

- [ ] types/auth.ts に UserMeResponse 型を追加し、createdAt フィールドを定義
- [ ] app/api/user/me/route.ts を拡張して createdAt を返すようにする
- [ ] app/api/user/stats/route.ts を新規作成し、統計情報計算ロジックを実装
- [ ] components/mypage/UserProfile.tsx を更新し、props経由で createdAt を受け取る
- [ ] components/mypage/MyPageContent.tsx で実APIを呼び出し、モックデータ削除
- [ ] APIとUIの動作確認、エッジケースのテスト実施