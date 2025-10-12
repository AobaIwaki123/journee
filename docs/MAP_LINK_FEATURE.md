# 住所マップリンク機能

## 概要

Version 0.11.0で実装された、しおり内の住所をクリックしてGoogle Mapsで表示する機能のドキュメントです。

## 機能説明

### 基本動作

- しおりの各スポットに表示される住所をクリックすると、Google Mapsで該当の住所を検索します
- 新しいタブでマップが開くため、元のしおりページはそのまま保持されます
- デスクトップ・モバイル両対応で、どのデバイスでも使用可能です

### 対応ページ

1. **メインページ（編集モード）**: `/`
   - EditableSpotCardで住所がリンク化されています
   
2. **公開しおりページ（閲覧モード）**: `/share/[slug]`
   - SpotCardで住所がリンク化されています

## 実装詳細

### AddressLinkコンポーネント

#### ファイルパス
```
components/itinerary/AddressLink.tsx
```

#### Props

```typescript
interface AddressLinkProps {
  address: string;        // 表示する住所（必須）
  className?: string;     // カスタムCSSクラス
  showIcon?: boolean;     // MapPinアイコンの表示/非表示（デフォルト: true）
}
```

#### 使用例

```tsx
import { AddressLink } from '@/components/itinerary/AddressLink';

// 基本的な使用方法
<AddressLink address="東京都渋谷区渋谷1-1-1" />

// アイコンなし
<AddressLink address="京都府京都市東山区清水1丁目294" showIcon={false} />

// カスタムクラス
<AddressLink 
  address="大阪府大阪市中央区大阪城1-1" 
  className="text-lg font-bold"
/>
```

### Google Maps URL生成

住所は以下の形式でGoogle Maps Search APIに渡されます：

```
https://www.google.com/maps/search/?api=1&query={URLエンコードされた住所}
```

#### URL生成の特徴

- 住所は自動的にURLエンコードされます
- 日本語・英語・特殊文字に対応
- スペースや括弧なども正しく処理されます

### セキュリティ

- `target="_blank"`で新しいタブを開く
- `rel="noopener,noreferrer"`でセキュリティを確保
- XSS対策として住所はエスケープ処理されます

## UI/UX設計

### ビジュアルデザイン

- **アイコン**: MapPin（赤色）+ ExternalLink（グレー、ホバー時に表示）
- **ホバー効果**: 
  - テキスト色が青に変化（`hover:text-blue-600`）
  - 下線が表示（`hover:underline`）
  - ExternalLinkアイコンがフェードイン
- **カーソル**: ポインターカーソルで明確にクリック可能であることを示す

### アクセシビリティ

- **role**: `button`（クリック可能な要素）
- **title属性**: 「"住所"をGoogle Mapsで開く」と説明
- **キーボード操作**: フォーカス可能で、Enterキーでも動作
- **スクリーンリーダー**: 適切なセマンティックHTML使用

### レスポンシブ対応

- **モバイル**: タッチ操作に最適化、タップ領域は十分な大きさ
- **タブレット**: デスクトップと同様の表示
- **小画面**: 長い住所は`truncate`で省略表示

## 統合されたコンポーネント

### SpotCard.tsx

読み取り専用のスポットカード（公開しおりで使用）

**変更内容**:
```tsx
// 以前
<div className="flex items-center gap-1.5 text-gray-600">
  <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
  <span className="truncate">{spot.location.address}</span>
</div>

// 変更後
<AddressLink address={spot.location.address} />
```

### EditableSpotCard.tsx

編集可能なスポットカード（メインページで使用）

**変更内容**: SpotCardと同様にAddressLinkコンポーネントを使用

## テスト

### ユニットテスト

**ファイル**: `components/itinerary/__tests__/AddressLink.test.tsx`

**テストケース**:
- 住所テキストの表示
- アイコンの表示/非表示
- Google Maps URLの生成
- URLエンコーディング
- クリックイベント
- カスタムクラスの適用
- title属性の設定
- 特殊文字を含む住所の処理
- 長い住所のtruncate処理

### E2Eテスト

**ファイル**: `e2e/address-map-link.spec.ts`

**テストシナリオ**:
- 住所リンクの表示確認
- 新しいタブでGoogle Mapsが開くことを確認
- マップアイコンの表示確認
- 公開しおりページでの動作確認
- 複数の住所がある場合の動作確認
- ホバー時のカーソル変化確認
- 編集モードでの動作確認
- モバイルビューでの動作確認
- 日本語以外の住所の動作確認

## 使用技術

- **React**: コンポーネントフレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **lucide-react**: アイコン（MapPin, ExternalLink）
- **Next.js**: フレームワーク

## ブラウザ互換性

- **Chrome/Edge**: 完全対応
- **Safari**: 完全対応
- **Firefox**: 完全対応
- **モバイルブラウザ**: iOS Safari、Chrome、Android Chrome対応

## 今後の拡張案

### Phase 2（将来の機能）

1. **座標情報対応**
   - 住所だけでなく緯度経度も保存し、より正確な位置表示

2. **マップアプリ選択**
   - Google Maps以外（Apple Maps、Yahoo!マップなど）も選択可能に

3. **埋め込みマップ**
   - ポップアップでマップを埋め込み表示

4. **ルート案内**
   - 現在地からのルート案内リンク

5. **近隣スポット連携**
   - 複数スポットをまとめてマップ表示

## トラブルシューティング

### 住所が正しく検索されない

- 住所が曖昧な場合、Google Mapsが複数の候補を表示することがあります
- より詳細な住所（番地、ビル名など）を含めると精度が向上します

### モバイルでタップできない

- タップ領域が小さすぎる場合は、カスタムクラスでパディングを追加してください

### 新しいタブが開かない

- ブラウザのポップアップブロッカーが有効になっている可能性があります
- ユーザーに設定変更を案内してください

## 参考リンク

- [Google Maps URLs API](https://developers.google.com/maps/documentation/urls/get-started)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Best Practices](https://react.dev/learn)

---

**実装日**: 2025-10-12  
**担当**: Cursor AI Agent  
**バージョン**: 0.11.0
