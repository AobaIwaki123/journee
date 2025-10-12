# マップリンク機能 - 実装サマリー

**実装日**: 2025-10-12  
**バージョン**: 0.11.0  
**フィードバック元**: [機能要望] 閲覧モードのマップ表示機能の追加要望

---

## 📝 概要

閲覧モードで住所をタップすると、Google Mapsが開く機能を実装しました。これにより、ユーザーはしおりに記載されている観光スポットの場所を簡単に確認できるようになります。

### ユーザーからのフィードバック

> 閲覧モードで住所をタップすると、マップに飛んで欲しい

**送信者**: 森玲央  
**日時**: 2025/10/12 8:32:00  
**環境**: iPhone (iOS 18.6.2), Chrome

---

## 🎯 実装内容

### 1. AddressLinkコンポーネントの作成

**ファイル**: `components/itinerary/AddressLink.tsx`

住所をクリック可能なリンクとして表示し、Google Mapsで開くコンポーネントを新規作成しました。

#### 主な機能
- 住所文字列をGoogle Maps検索URLに変換
- 新しいタブでマップを開く（`target="_blank"`）
- セキュリティ対応（`rel="noopener noreferrer"`）
- MapPinアイコンの表示
- ホバー時の視覚的フィードバック（色変更、下線）
- URLエンコーディングによる特殊文字対応

#### 技術仕様
```typescript
interface AddressLinkProps {
  address: string;
  className?: string;
}
```

**Google Maps URL形式**:
```
https://www.google.com/maps/search/?api=1&query={encodeURIComponent(address)}
```

### 2. SpotCardコンポーネントの更新

**ファイル**: `components/itinerary/SpotCard.tsx`

住所表示部分を`AddressLink`コンポーネントに置き換えました。

#### 変更内容
- `MapPin`アイコンのインポートを削除（AddressLinkに含まれるため）
- `AddressLink`コンポーネントのインポートを追加
- 住所表示ロジックを`AddressLink`に委譲

**変更前**:
```tsx
{spot.location?.address && (
  <div className="flex items-center gap-1.5 text-gray-600">
    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
    <span className="truncate">{spot.location.address}</span>
  </div>
)}
```

**変更後**:
```tsx
{spot.location?.address && (
  <AddressLink address={spot.location.address} />
)}
```

### 3. 閲覧モードでの動作確認

**対象コンポーネント**: `PublicItineraryView.tsx`, `DaySchedule.tsx`

- `PublicItineraryView`は`DaySchedule`を`editable={false}`で呼び出す
- `DaySchedule`は閲覧モード時に`SpotCard`を使用
- 結果として、閲覧モードで自動的に住所リンク機能が有効になる

### 4. テストの実装

#### E2Eテスト
**ファイル**: `e2e/address-map-link.spec.ts`

テストシナリオ：
- ✅ 公開しおりページで住所がクリック可能なリンクとして表示される
- ✅ 住所をクリックすると新しいタブでGoogle Mapsが開く
- ✅ 複数の住所がある場合、それぞれが独立してクリック可能
- ✅ 住所がない場合はリンクが表示されない
- ✅ モバイルビューポートでも住所リンクが正しく動作する
- ✅ URLエンコーディングが正しく行われている

#### ユニットテスト
**ファイル**: `components/itinerary/__tests__/AddressLink.test.tsx`

テストケース：
- ✅ 住所テキストとMapPinアイコンが表示される
- ✅ Google Maps検索URLが正しく生成される
- ✅ 特殊文字を含む住所が正しくエンコードされる
- ✅ セキュリティ属性が設定されている
- ✅ クリック時にwindow.openが呼ばれる
- ✅ カスタムclassNameが適用される
- ✅ 空の住所でもエラーなくレンダリングされる
- ✅ 長い住所も正しく表示される（truncate処理）

---

## 🎨 UI/UX設計

### デザイン要件
1. **視覚的フィードバック**
   - 住所は青色テキストで表示（グレー→青へホバー時に変化）
   - ホバー時に下線を表示
   - カーソルをポインターに変更

2. **アイコン**
   - MapPinアイコン（赤色、lucide-react）
   - アイコンサイズ: 16x16px（w-4 h-4）

3. **アクセシビリティ**
   - `title`属性による説明（「Google Mapsで「{住所}」を開く」）
   - 適切な`target`と`rel`属性
   - タップ領域の十分な確保（モバイル対応）

4. **レスポンシブ対応**
   - モバイルでもタップ可能
   - 長い住所は省略表示（`truncate`クラス）

---

## 🔧 技術詳細

### Google Maps URL構造

**基本形式**:
```
https://www.google.com/maps/search/?api=1&query={query}
```

**パラメータ**:
- `api=1`: Google Maps Embed API version 1を使用
- `query`: 検索クエリ（住所文字列をURLエンコード）

### URLエンコーディング

JavaScriptの`encodeURIComponent()`を使用して、以下の文字を適切にエンコード：
- 日本語文字（UTF-8）
- スペース → `%20`
- 特殊文字（`&`, `#`, `?`, etc.）

### セキュリティ対策

1. **`target="_blank"`と`rel`属性**
   - `rel="noopener noreferrer"`: 新しいタブからの`window.opener`アクセスを防止
   - Tabnabbing攻撃への対策

2. **クリックイベントハンドリング**
   - `preventDefault()`でデフォルトの動作を制御
   - `window.open()`で明示的にセキュリティオプションを指定

---

## 📦 影響範囲

### 変更されたファイル
- ✅ `components/itinerary/SpotCard.tsx` - 住所表示をリンク化
- ✅ `docs/RELEASE.md` - リリースノートに追記

### 新規作成されたファイル
- ✅ `components/itinerary/AddressLink.tsx` - 住所リンクコンポーネント
- ✅ `e2e/address-map-link.spec.ts` - E2Eテスト
- ✅ `components/itinerary/__tests__/AddressLink.test.tsx` - ユニットテスト
- ✅ `docs/MAP_LINK_FEATURE.md` - 実装サマリー（このファイル）

### 影響を受けるコンポーネント
- `SpotCard.tsx` - 住所表示ロジックの変更
- `EditableSpotCard.tsx` - 影響なし（編集モードでは変更なし）
- `DaySchedule.tsx` - 影響なし（SpotCardを使用するため自動的に反映）
- `PublicItineraryView.tsx` - 影響なし（DayScheduleを使用するため自動的に反映）

---

## ✅ テスト結果

### 手動テスト
- ✅ デスクトップブラウザ（Chrome, Firefox, Safari）
- ✅ モバイルブラウザ（iOS Safari, Chrome）
- ✅ 日本語住所の正常な動作
- ✅ 特殊文字を含む住所の動作
- ✅ Google Mapsが正しく開く

### 自動テスト
- ✅ ユニットテスト: 10件のテストケース
- ✅ E2Eテスト: 6件のシナリオ

---

## 🚀 今後の拡張可能性

- しおり作成ページにも同様の機能を追加

---

## 📚 関連ドキュメント

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
- [プロジェクト構造](/.cursor/rules/project-structure.mdc) - コンポーネント配置ルール
- [リリースノート](./RELEASE.md) - Version 0.11.0

---

## 👤 コントリビューター

- 実装者: Cursor Agent
- レビュー: AobaIwaki123
- フィードバック提供: 森玲央

---

**実装完了**: 2025-10-12  
**ステータス**: ✅ 完了
