# HTMLスライド作成計画 - ブランチごとの独立環境構築

## 概要
blog/ISOLATED_BRANCH_ENV.mdをもとに、技術プレゼンテーション用のHTMLスライドを作成します。

## 技術仕様

### デザインコンセプト
- **モダンでミニマル**：シンプルで読みやすいデザイン
- **技術者向け**：コードブロックとアーキテクチャ図を重視
- **レスポンシブ**：デスクトップでの表示に最適化
- **キーボード操作**：矢印キー（←→）でスライド移動
- **プログレスバー**：現在位置を視覚化

### 使用技術
- **HTML/CSS/JavaScript のみ**（ライブラリ不要）
- **アニメーション**：CSS transitionsでスムーズな遷移
- **シンタックスハイライト**：highlight.jsを CDN から読み込み
- **フォント**：Google Fonts (Inter, JetBrains Mono)

## スライド構成（全18ページ）

### 1. タイトルスライド (slide_01.html)
- メインタイトル
- サブタイトル
- 記事テーマの絵文字アイコン ⚡
- 簡潔な説明

### 2. 問題提起 (slide_02.html)
- 「ブランチを切り替えるたびに儀式」の問題
- git checkout → npm install → サーバー起動の繰り返し
- 時間の無駄を視覚化

### 3. ソリューション概要 (slide_03.html)
- ブランチごとに独立した環境を自動構築
- 固有のURLを割り当て
- ブランチ移動不要

### 4. メリット一覧 (slide_04.html)
- 複数PRの同時レビュー
- 独立したURLでの確認
- AI駆動開発との親和性
- ステークホルダーへの共有が簡単

### 5. 具体的な問題 (slide_05.html)
- 5つのブランチを管理する例
- ローカル環境での地獄
- ポート競合やメモリ不足

### 6. 独立環境の利点 (slide_06.html)
- feature-auth.example.com
- feature-comments.example.com
- 各ブランチが常時稼働

### 7. AI駆動開発の時代 (slide_07.html)
- 開発速度の向上
- 確認作業のスケーリング
- 10-20ブランチの同時管理

### 8. システム概要 (slide_08.html)
- アーキテクチャ図（ASCII art）
- GitHub → GitHub Actions → Docker → GCR → ArgoCD → Kubernetes

### 9. 技術スタック (slide_09.html)
- Kubernetes
- ArgoCD
- Cloudflare Tunnel Controller
- Google Container Registry
- GitHub Actions

### 10. ワークフロー (slide_10.html)
- 8ステップのフロー図
- ブランチプッシュから公開URLまで

### 11. 前提条件 (slide_11.html)
- Kubernetesクラスタ
- Cloudflareアカウント
- GCPアカウント
- 必要な環境変数

### 12. セットアップオプション (slide_12.html)
- 自前クラスタ（ミニPC/Raspberry Pi）
- GKE
- EKS
- 各オプションのメリット・デメリット

### 13. ArgoCDセットアップ (slide_13.html)
- インストール手順
- APIトークン作成
- コード例

### 14. Cloudflare Tunnel Controller (slide_14.html)
- なぜ使うのか
- 圧倒的なメリット
- ドメイン自動発行の仕組み

### 15. 実装：マニフェスト管理 (slide_15.html)
- ディレクトリ構成
- ブランチハッシュの生成
- リソース名の変換

### 16. 実装：GitHub Actions (slide_16.html)
- push.ymlの役割
- イメージビルド → マニフェスト生成 → デプロイ
- 主要なコードスニペット

### 17. 運用方法 (slide_17.html)
- ブランチのライフサイクル
- レビュー時の流れ
- コスト管理とクリーンアップ

### 18. まとめ (slide_18.html)
- 実現できたこと
- 参考リンク
- k8s-clusterリポジトリへのリンク

## 共通機能

### navigation.js
```javascript
// キーボード操作
// スライド番号の表示
// プログレスバー更新
```

### styles.css
```css
/* 共通スタイル */
/* コードブロックのスタイリング */
/* アニメーション定義 */
```

## デザインガイドライン

### カラーパレット
- **背景**: `#0f172a` (dark slate)
- **テキスト**: `#f1f5f9` (light gray)
- **アクセント**: `#3b82f6` (blue)
- **セカンダリ**: `#8b5cf6` (purple)
- **ハイライト**: `#10b981` (green)

### タイポグラフィ
- **見出し**: Inter, 700-900 weight
- **本文**: Inter, 400-500 weight
- **コード**: JetBrains Mono, 400 weight

### レイアウト
- **最大幅**: 1200px
- **パディング**: 40px
- **行間**: 1.6-1.8

### アニメーション
- **スライド遷移**: 0.5s ease-in-out
- **フェードイン**: 0.3s ease-out
- **ホバー効果**: 0.2s ease

## ファイル構造

```
slides/ISOLATED_BRANCH_ENV/
├── README.md (this file)
├── index.html (ランディング/ナビゲーションページ)
├── slides/
│   ├── slide_01.html
│   ├── slide_02.html
│   ├── ...
│   └── slide_18.html
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── navigation.js
│   └── images/ (必要に応じて)
└── deploy/ (デプロイ用設定、必要に応じて)
```

## 実装手順

1. **共通ファイルの作成**
   - styles.css: 全スライド共通のスタイル
   - navigation.js: スライド移動ロジック

2. **スライドの作成**（順次）
   - slide_01.html から slide_18.html まで
   - 各スライドは独立したHTMLファイル
   - 共通のCSS/JSを読み込む

3. **index.htmlの作成**
   - 全スライドへのリンク
   - プレゼンテーションの概要

4. **動作確認**
   - ローカルでの表示確認
   - キーボード操作の動作確認
   - レスポンシブ対応の確認

5. **デプロイ準備**
   - GitHub Pagesなどへのデプロイ準備
   - OGP設定（必要に応じて）

## デプロイオプション

- **GitHub Pages**: 最も簡単
- **Cloudflare Pages**: 高速
- **Netlify**: 簡単な設定

## 今後の拡張

- [ ] PDFエクスポート機能
- [ ] プレゼンテーションモード（時間表示）
- [ ] スピーカーノート機能
- [ ] テーマの切り替え（ダーク/ライト）
- [ ] アニメーション効果の追加
