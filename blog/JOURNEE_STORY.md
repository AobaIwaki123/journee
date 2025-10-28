---
title: "AIと会話して旅のしおりが作れるアプリを2週間で作った話 - 技術選定から本番リリースまで"
emoji: "🚀"
type: "tech"
topics: ["個人開発", "Next.js", "AI", "Supabase", "ポエム"]
published: false
---

## 「旅行の計画、めんどくさくない？」から始まった

友人との何気ない会話がきっかけだった。

「来月、京都行くんだけど、しおり作るのめんどくさいんだよね」

確かに。Google スプレッドシートに観光スポットをリストアップして、地図のリンクを貼って、時間を調整して...。情報を整理する作業に時間を取られて、肝心の「どこに行くか考える楽しみ」が減ってしまう。

**「AIと会話しながら、自然にしおりができたら楽しいんじゃない？」**

この一言から、Journee の開発が始まった。

## 「まず動くものを」- 最初の48時間

個人開発で一番大事なのは、完璧を目指さないこと。まずは最小限の機能で動くものを作る。

最初の週末で実装したのは：
- Next.js + TypeScript のセットアップ
- Google Gemini API との連携
- 基本的なチャット UI
- LocalStorage での保存

**コード例：最初のストリーミング実装**
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message } = await req.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Gemini APIをストリーミングで呼び出し
      for await (const chunk of geminiStream) {
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });
  
  return new Response(stream);
}
```

動いた瞬間、画面にAIの返答がリアルタイムで流れていく様子を見て、「これはイケる」と確信した。

## 最初の壁：「しおりの構造化」問題

すぐに問題が発覚した。

AIの返答は自然言語。でも、しおりは構造化されたデータが必要。

**試行錯誤の連続：**
1. **最初のアプローチ**：AIに「JSONで返して」とお願い
   - 結果：たまにMarkdownで返ってくる 😇
   
2. **次のアプローチ**：プロンプトを厳格に
   - 結果：融通が効かなくなる
   
3. **最終的な解決策**：段階的なフロー設計
   - 情報収集 → 骨組み作成 → 詳細化
   - 各フェーズで必要な情報を明確に定義
   - チェックリスト形式で進捗を管理

**実装したフェーズ管理：**
```typescript
type ItineraryPhase = 
  | 'initial'           // 初期状態
  | 'gathering_info'    // 情報収集中
  | 'creating_skeleton' // 骨組み作成中
  | 'detailing'         // 詳細化中
  | 'completed';        // 完成

// AIがチェックリストを確認しながら質問
const requirements = {
  destination: false,
  duration: false,
  budget: false,
  interests: false,
};
```

この設計により、AIとの対話が自然になり、ユーザーも何を答えればいいか分かりやすくなった。

## 「リアルタイムで更新される感覚」を追求

技術的に一番こだわったのが、**チャットしながらしおりが更新される体験**。

当初は「返答が来たら更新」だったが、これだと待ち時間が長い。

**改善策：**
- ストリーミングレスポンスの活用
- 各チャンクをパースしながらUIを更新
- 楽観的UI更新（Optimistic UI）の実装

```typescript
// フロントエンドでのストリーミング処理
const response = await fetch('/api/chat', { method: 'POST', body });
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  appendStreamingMessage(chunk); // リアルタイム表示
}
```

この実装により、「AIが考えている様子が見える」体験が実現できた。

## データベース統合の決断 - 「LocalStorageだけじゃ不安」

1週間運用してみて気づいた。

**LocalStorageの限界：**
- ブラウザのキャッシュクリアでデータが消える
- デバイス間で同期できない
- 共有機能が実装できない

Supabase を選んだ理由：
- PostgreSQL ベースで安心
- Row Level Security で簡単にセキュリティ設定
- リアルタイムサブスクリプションも使える
- 無料枠が充実

**段階的マイグレーション：**
```typescript
// 既存ユーザーのデータを失わないように
const localData = localStorage.getItem('itineraries');
if (localData && user) {
  // Supabaseに移行を提案
  showMigrationPrompt();
}
```

## 一番苦労した「公開機能」

しおりを友達と共有したい。当然の要求だった。

**実装した機能：**
1. 公開URLの生成（スラッグベース）
2. 動的OGP画像生成
3. コメント機能

特に OGP 画像の動的生成は楽しかった：

```tsx
// app/api/og/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(req: Request) {
  const { title, destination } = parseParams(req.url);
  
  return new ImageResponse(
    <div style={{ /* 美しいデザイン */ }}>
      <h1>{title}</h1>
      <p>{destination}</p>
    </div>
  );
}
```

Twitter でシェアされた時に、ちゃんと画像が表示されるのを見た時は感動した。

## インフラ構築 - 「個人開発でもKubernetes」

本番環境は自宅の Kubernetes クラスタ（ミニPC3台）にデプロイ。

**なぜKubernetes？**
- 将来的なスケールに対応
- CI/CDの練習
- ブランチごとの環境分離（別のブログで詳しく書いた）

**構成：**
- Kubernetes + ArgoCD
- Cloudflare Tunnel でドメイン発行
- GitHub Actions で自動デプロイ

正直、個人開発には過剰かもしれない。でも、学びは多かった。

## 2週間で学んだこと

### 技術面
- **ストリーミングAPI の実装パターン**：Next.js App Router での実践
- **AI プロンプトエンジニアリング**：構造化データを安定して取得する方法
- **段階的な状態管理**：フェーズベースのフロー設計
- **Supabase の実践的な使い方**：RLS の設定からリアルタイム機能まで

### 個人開発の進め方
- **完璧を目指さない**：まず動くものを作る
- **ユーザーフィードバックを早めに**：友人に使ってもらう
- **技術選定は慎重に**：でも、学びたい技術に挑戦するのもあり
- **ドキュメントを書く**：未来の自分のために

## 現在とこれから

現在、Journee は以下の機能を提供している：
- AIとの対話でしおり作成
- リアルタイムプレビュー
- インライン編集
- 公開・共有機能
- PDF出力
- モバイル対応（PWA）

**今後追加したい機能：**
- 多言語対応
- グループでの共同編集
- 旅行後の思い出記録
- より詳細な予算管理

## 最後に

「旅行の計画、めんどくさくない？」という何気ない会話から始まったこのプロジェクト。

2週間という短期間で、ここまで形にできたのは、モダンな技術スタックと、素晴らしいOSSコミュニティのおかげ。

個人開発の醍醐味は、**自分が欲しいものを、自分で作れること**。

もしあなたも「こんなアプリがあったらいいな」と思ったら、まずは週末の48時間で動くプロトタイプを作ってみてほしい。

完璧じゃなくていい。動くものがあれば、そこから全てが始まる。

---

**Journee を使ってみる：** https://journee.example.com  
**GitHubリポジトリ：** https://github.com/AobaIwaki123/journee

この記事が、誰かの「作ってみよう」の一歩になれば嬉しい。

質問やフィードバックがあれば、コメントや Twitter でお気軽にどうぞ！

---

**開発期間**: 2週間  
**使用技術**: Next.js 14, TypeScript, Supabase, Google Gemini API, Kubernetes  
**コード行数**: 約 8,000 行

