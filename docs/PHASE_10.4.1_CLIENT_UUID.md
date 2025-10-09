# Phase 10.4.1: クライアント側UUID統合

## 概要
クライアント側で生成したUUIDをそのままデータベースに保存する仕組みに変更しました。これにより、ID不一致による重複作成バグを解決し、よりシンプルで一貫性のある設計になりました。

## 問題点（修正前）

### 発生していたバグ
1. チャットでしおり作成 → クライアント側でUUID生成（例: `abc-123-def`）
2. 保存ボタンクリック → DB保存時にサーバー側で新しいUUID生成（例: `xyz-789-ghi`）
3. クライアント側の `currentItinerary.id` は古いまま（`abc-123-def`）
4. 再度保存ボタンクリック → DBに存在しないIDで検索 → 新規作成と判定
5. **結果**: 同じしおりが重複して保存される

### 根本原因
- クライアント側: `crypto.randomUUID()` で UUID v4 を生成
- サーバー側（DB）: `DEFAULT gen_random_uuid()` で独自に UUID を生成
- **ID不一致** → 同じエンティティが異なるIDで管理される

## 解決策

### 設計変更
**クライアント側で生成したUUIDをそのままDBに保存**

- しおり（`itineraries`）
- 日程（`day_schedules`）
- 観光スポット（`tourist_spots`）

すべてのエンティティで、クライアント側のIDを保持します。

## 変更内容

### 1. データベーススキーマ（`lib/db/schema.sql`）

```sql
-- 修正前
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- 修正後
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY, -- クライアント側で生成されたUUIDを使用
  ...
);
```

**変更点**:
- `DEFAULT gen_random_uuid()` を削除
- クライアント側から明示的にIDを指定する設計に変更

同様の変更を以下のテーブルにも適用：
- `day_schedules`
- `tourist_spots`

### 2. 型定義（`types/itinerary.ts`）

```typescript
export interface DaySchedule {
  id?: string; // Phase 10.4.1: UUID（DB保存時に必要）
  day: number;
  date?: string;
  // ...
}
```

**変更点**:
- `DaySchedule` に `id` フィールドを追加（オプション）
- DB保存時にクライアント側のIDを渡せるようにした

### 3. AI プロンプト処理（`lib/ai/prompts.ts`）

```typescript
// スケジュールのマージ処理
mergedSchedule = updates.schedule.map((newDay, index) => {
  const existingDay = baseData.schedule[index];

  const spots = newDay.spots.map((spot) => ({
    ...spot,
    id: spot.id || generateId(),
  }));

  return {
    ...existingDay,
    ...newDay,
    id: newDay.id || existingDay?.id || generateId(), // DayScheduleにもIDを付与
    spots,
  };
});
```

**変更点**:
- `DaySchedule` にも UUID を生成するように変更
- 既存のIDがあればそれを使用、なければ新規生成

### 4. リポジトリ（`lib/db/itinerary-repository.ts`）

#### createItinerary

```typescript
const { data: dbItinerary, error: itineraryError } = await client
  .from("itineraries")
  .insert({
    id: itinerary.id, // クライアントのIDを保持
    user_id: userId,
    title: itinerary.title,
    // ...
  })
  .select()
  .single();
```

**変更点**:
- `id: itinerary.id` を明示的に指定
- クライアント側のUUIDをそのまま使用

同様の変更を以下にも適用：
- `day_schedules` の作成時に `id: day.id` を追加
- `tourist_spots` の作成時に `id: spot.id` を追加

#### dbToDaySchedule

```typescript
private dbToDaySchedule(
  dbDay: DbDaySchedule,
  spots: TouristSpot[]
): DaySchedule {
  return {
    id: dbDay.id, // IDを含める
    day: dbDay.day,
    // ...
  };
}
```

**変更点**:
- DB から読み込んだ `id` をクライアント側の型にも含める

### 5. SaveButton（`components/itinerary/SaveButton.tsx`）

```typescript
// Phase 10.4.1: クライアント側のUUIDをそのまま使用するため、ID更新処理は不要
const response = await fetch('/api/itinerary/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ itinerary: currentItinerary }),
});

const data = await response.json();
addToast(data.message || 'しおりを保存しました', 'success');
// currentItinerary.id はそのまま有効（DB側でも同じIDが使用される）
```

**変更点**:
- ID更新処理を削除
- コメントで設計意図を明記

## メリット

### 1. ID一貫性
- クライアント ↔ DB でIDが常に一致
- 同じエンティティが同じIDで管理される

### 2. バグ修正
- 重複作成の問題が根本解決
- 既存チェックが正しく機能する

### 3. シンプル化
- ID変換・更新ロジックが不要
- コードが読みやすく保守しやすい

### 4. オフライン対応の基盤
- 将来的にオフライン編集 → 同期がしやすい
- クライアント側でIDを管理できる

### 5. パフォーマンス向上
- ID更新のための追加クエリ不要
- ネットワーク往復が減る

## データフロー

```
【修正前】
チャット → UUID生成 (abc-123)
           ↓
保存 → DB保存 (xyz-789に変更) ← 問題！
           ↓
クライアント側のIDは古いまま (abc-123)

【修正後】
チャット → UUID生成 (abc-123)
           ↓
保存 → DB保存 (abc-123のまま) ← 一貫性！
           ↓
クライアント側のIDも同じ (abc-123)
```

## マイグレーション

### 既存データベースへの適用

既存のSupabaseデータベースに新しいスキーマを適用する場合：

```sql
-- DEFAULT句を削除するALTER文
ALTER TABLE itineraries 
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE day_schedules 
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE tourist_spots 
  ALTER COLUMN id DROP DEFAULT;
```

**注意**:
- 既存データには影響しません（既存のUUIDはそのまま）
- 新規作成時のみ、明示的にIDを指定する必要があります
- クライアント側で必ずIDを生成してから保存してください

## テスト

### 手動テスト手順

1. **新規しおり作成**
   ```
   1. チャットでしおり作成
   2. 保存ボタンをクリック
   3. しおり一覧ページで表示を確認
   4. 同じしおりを再度保存
   5. 重複が発生しないことを確認
   ```

2. **ID一貫性確認**
   ```
   1. チャットでしおり作成
   2. ブラウザのDevToolsでcurrentItinerary.idを確認
   3. 保存後、DBのidと一致することを確認
   4. しおり一覧から編集して再保存
   5. IDが変わらないことを確認
   ```

3. **公開処理との統合**
   ```
   1. しおり作成（未保存）
   2. 直接公開ボタンをクリック
   3. DBに保存され、公開されることを確認
   4. クライアント側のIDとDB側のIDが一致することを確認
   ```

## 関連ファイル

- `lib/db/schema.sql` - DBスキーマ定義
- `lib/db/itinerary-repository.ts` - CRUD操作
- `types/itinerary.ts` - 型定義
- `lib/ai/prompts.ts` - AI応答処理
- `components/itinerary/SaveButton.tsx` - 保存UI
- `lib/utils/id-generator.ts` - UUID生成

## 今後の展開

### オフライン対応（将来）
クライアント側でIDを管理できるようになったため、以下の機能が実装しやすくなりました：

1. **オフライン編集**
   - ネットワーク無しでしおり作成
   - クライアント側でUUID生成
   - オンライン復帰時に同期

2. **楽観的UI更新**
   - 保存前に即座にUI反映
   - バックグラウンドでDB保存
   - IDの整合性を保証

3. **競合解決**
   - 複数デバイスでの編集
   - IDベースでマージ戦略を実装

## まとめ

クライアント側のUUIDをそのままDBに保存する設計に変更することで：

✅ **バグ修正**: 重複作成の問題を根本解決
✅ **シンプル化**: コードが読みやすく保守しやすい
✅ **一貫性**: クライアント ↔ DB でIDが常に一致
✅ **将来性**: オフライン対応の基盤が整った

この設計変更により、Journeeアプリケーションのデータ管理がより堅牢になりました。

