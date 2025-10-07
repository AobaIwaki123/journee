# Phase 4.3: プロンプトシステムの改善 - 実装完了レポート

## 📋 実装概要

Phase 4「段階的旅程構築システム」の第三段階として、フェーズに応じた適切なプロンプトを生成する機能を実装しました。

**実施日**: 2025-10-07  
**対象フェーズ**: Phase 4.3  
**主な変更ファイル**: `lib/ai/prompts.ts`

---

## ✅ 実装内容

### 1. 段階的構築用システムプロンプト

#### 1.1 `INCREMENTAL_SYSTEM_PROMPT`

Phase 4専用のシステムプロンプトを新規作成しました。

**特徴**:
- 段階的な旅程構築フローを明確に定義
- 各フェーズでの振る舞いを指定
- JSONフォーマットの例を骨組み・詳細化の2パターン用意
- 一度に全てを決めない原則を強調

**構成**:
```
1. 段階的構築のフロー説明
   - collecting（基本情報収集）
   - skeleton（骨組み作成）
   - detailing（日程詳細化）
   - completed（完成）

2. 各フェーズでの振る舞い
   - collecting: ヒアリングに専念、具体的提案はしない
   - skeleton: テーマ・エリアのみ提案
   - detailing: 具体的なスポット・時間を提案
   - completed: 微調整のみ

3. JSONフォーマット例
   - 骨組み作成時: phase, schedule[].theme, status: "skeleton"
   - 詳細化時: phase, currentDay, schedule[].spots[]

4. 重要な原則
   - 段階を飛ばさない
   - ユーザーのペースに合わせる
   - 各段階で適切な粒度
```

---

### 2. フェーズ別プロンプト生成関数

#### 2.1 `createSkeletonPrompt(itinerary)`

骨組み作成フェーズ用のプロンプトを生成します。

**引数**:
- `itinerary: ItineraryData` - 基本情報が含まれたしおりデータ

**生成内容**:
```typescript
createSkeletonPrompt({
  destination: '東京',
  duration: 3,
  summary: '歴史と現代が融合する東京を満喫',
  // ...
})

// 生成されるプロンプト:
// 【骨組み作成フェーズ】
// ユーザーから以下の基本情報を受け取りました：
// - 行き先: 東京
// - 期間: 3日間
// - 旅行の概要: 歴史と現代が融合する東京を満喫
// 
// 次のステップとして、各日の**大まかなテーマ・エリア**を提案してください。
// 
// 【注意事項】
// - 具体的な観光スポット名は**まだ出さない**でください
// - 各日のテーマ・エリアのみを提案（例: "浅草・スカイツリー周辺"）
// ...
```

**期待される効果**:
- AIが具体的なスポット名を出さず、テーマのみを提案
- 各日の大まかな方向性が決まる

---

#### 2.2 `createDayDetailPrompt(itinerary, targetDay)`

指定された日の詳細化プロンプトを生成します。

**引数**:
- `itinerary: ItineraryData` - 骨組みが含まれたしおりデータ
- `targetDay: number` - 詳細化する日（1, 2, 3...）

**生成内容**:
```typescript
createDayDetailPrompt(itinerary, 1)

// 生成されるプロンプト:
// 【日程詳細化フェーズ】
// 現在、1日目の詳細を作成しています。
// 
// 【1日目の骨組み】
// - テーマ: 浅草・スカイツリー周辺
// - タイトル: 下町情緒を楽しむ
// 
// 【タスク】
// 1日目の具体的なスケジュールを作成してください：
// 1. **実在する観光スポット**を提案
// 2. **訪問時刻**（scheduledTime）を設定
// 3. **滞在時間**（duration）を現実的に設定
// ...
```

**期待される効果**:
- 指定された日のみに集中した詳細なスケジュール作成
- 時間、費用、カテゴリなど必要な情報がすべて含まれる

---

#### 2.3 `createNextStepPrompt(currentPhase, itinerary?)`

現在のフェーズから次のステップへ進むよう促すプロンプトを生成します。

**引数**:
- `currentPhase: ItineraryPhase` - 現在のフェーズ
- `itinerary?: ItineraryData` - しおりデータ（オプション）

**生成内容（フェーズ別）**:

##### collecting フェーズ
```
【情報収集】
まだ基本情報が不足しています。以下の情報を教えてください：

- 行き先（どこに行きたいですか？）
- 旅行期間（何日間の旅行ですか？）
- 旅行の目的や興味（どんなことをしたいですか？）

これらの情報が揃えば、旅程の骨組みを作成できます。
```

##### skeleton フェーズ
```
【骨組み確認】
各日の大まかなテーマは決まりました。
次のステップでは、1日ずつ具体的な観光スポットと時間を決めていきます。

準備ができたら「次へ」または「1日目を詳しく」とお伝えください。
```

##### detailing フェーズ（途中）
```
【1日目完了】
1日目の詳細が決まりました。

次は2日目の詳細を作成しましょうか？
または、1日目の内容を修正したい場合はお知らせください。
```

##### detailing フェーズ（最終日完了）
```
【全日程完了】
おめでとうございます！3日間の旅程がすべて完成しました。

何か修正したい点があればお知らせください。
問題なければ、この旅のしおりは完成です！
```

##### completed フェーズ
```
【旅のしおり完成】
旅のしおりが完成しました！

必要に応じて微調整や変更も可能です。
何かご要望があればお気軽にお知らせください。
```

**期待される効果**:
- ユーザーが次に何をすべきか明確
- 進捗状況が分かりやすい
- 適切なタイミングで次のステップへ誘導

---

#### 2.4 `getSystemPromptForPhase(phase)`

フェーズに応じた適切なシステムプロンプトを選択します。

**引数**:
- `phase: ItineraryPhase` - 現在のフェーズ

**返り値**:
- `initial`: `SYSTEM_PROMPT`（通常版）
- その他: `INCREMENTAL_SYSTEM_PROMPT`（段階的構築版）

**使用例**:
```typescript
const systemPrompt = getSystemPromptForPhase('skeleton');
// → INCREMENTAL_SYSTEM_PROMPT が返る

const systemPrompt = getSystemPromptForPhase('initial');
// → SYSTEM_PROMPT が返る
```

---

## 🎯 使用例

### 実際のチャットAPI統合（Phase 4.5で実装予定）

```typescript
import { useStore } from '@/lib/store/useStore';
import {
  getSystemPromptForPhase,
  createSkeletonPrompt,
  createDayDetailPrompt,
  createNextStepPrompt,
} from '@/lib/ai/prompts';

async function handleChatMessage(userMessage: string) {
  const { planningPhase, currentItinerary, currentDetailingDay } = useStore.getState();
  
  // 1. フェーズに応じたシステムプロンプトを選択
  const systemPrompt = getSystemPromptForPhase(planningPhase);
  
  // 2. フェーズに応じた追加プロンプトを生成
  let additionalPrompt = '';
  
  switch (planningPhase) {
    case 'skeleton':
      if (currentItinerary) {
        additionalPrompt = createSkeletonPrompt(currentItinerary);
      }
      break;
      
    case 'detailing':
      if (currentItinerary && currentDetailingDay) {
        additionalPrompt = createDayDetailPrompt(currentItinerary, currentDetailingDay);
      }
      break;
  }
  
  // 3. 「次へ」というキーワードを検出した場合
  if (userMessage.includes('次へ') || userMessage.includes('次')) {
    const nextStepPrompt = createNextStepPrompt(planningPhase, currentItinerary);
    additionalPrompt += '\n\n' + nextStepPrompt;
  }
  
  // 4. AIにリクエスト送信
  const response = await sendToAI({
    systemPrompt,
    additionalPrompt,
    userMessage,
    history: messages,
  });
  
  return response;
}
```

---

## 🧪 テスト

### テストファイル

`lib/ai/__tests__/prompts.test.ts` にテストケースを定義しました。

#### テストケース一覧

1. **createSkeletonPrompt テスト**
   - 基本情報が正しく含まれているか
   - 骨組み作成の指示が明確か
   - JSON出力形式が指定されているか

2. **createDayDetailPrompt テスト**
   - 対象日が明確か
   - テーマが含まれているか
   - 詳細化タスクが列挙されているか

3. **createNextStepPrompt テスト**
   - 各フェーズで適切な誘導メッセージが生成されるか
   - 不足情報の確認が行われるか

4. **getSystemPromptForPhase テスト**
   - フェーズに応じて正しいシステムプロンプトが選択されるか

### 手動テスト方法

ブラウザの開発者ツールで以下を実行:

```javascript
// テスト関数を読み込み
import { runAllTests, demonstratePromptGeneration } from '@/lib/ai/__tests__/prompts.test';

// 全テストを実行
runAllTests();

// プロンプト生成の実演
demonstratePromptGeneration();
```

または、コンソールで直接:

```javascript
// グローバルに公開されたテスト関数を使用
window.Phase4PromptTests.runAllTests();
window.Phase4PromptTests.demonstratePromptGeneration();
```

---

## 🎯 期待される効果

### 1. AI応答の品質向上
- フェーズに応じた**適切な粒度**の提案
- 段階を飛ばさない**一貫性のある**対話

### 2. ユーザー体験の向上
- 明確な**次のステップ**の提示
- 進捗状況が**分かりやすい**
- **圧倒されない**適度な情報量

### 3. 開発者体験の向上
- プロンプト管理が**一元化**
- 各フェーズのロジックが**明確**
- テストが**容易**

---

## 📊 プロンプトの比較

| フェーズ | 使用プロンプト | 主な目的 | AI出力例 |
|---------|--------------|---------|---------|
| **initial** | SYSTEM_PROMPT | 通常の対話 | 基本情報のヒアリング |
| **collecting** | INCREMENTAL_SYSTEM_PROMPT | 基本情報収集 | 「何日間の旅行ですか？」 |
| **skeleton** | INCREMENTAL_SYSTEM_PROMPT + createSkeletonPrompt | 骨組み作成 | 「1日目: 浅草周辺<br>2日目: 渋谷周辺」 |
| **detailing** | INCREMENTAL_SYSTEM_PROMPT + createDayDetailPrompt | 日程詳細化 | 「10:00 浅草寺<br>12:00 ランチ」 |
| **completed** | INCREMENTAL_SYSTEM_PROMPT | 微調整 | 「修正箇所を教えてください」 |

---

## 🔄 次のステップ（Phase 4.4以降）

### Phase 4.4: UIコンポーネントの追加
- [ ] `PlanningProgress` コンポーネント（進捗インジケーター）
- [ ] `QuickActions` コンポーネント（「次へ」ボタン）
- [ ] `ItineraryPreview` にプログレス表示を統合

### Phase 4.5: APIの拡張
- [ ] チャットAPIにフェーズ判定ロジックを統合
- [ ] プロンプト関数を実際のAPI呼び出しで使用
- [ ] 「次へ」キーワードの自動検出実装

### Phase 4.6: しおりマージロジックの改善
- [ ] 骨組み段階のマージ処理（theme, statusの保持）
- [ ] 日程詳細化のマージ処理（既存の日を保持）

---

## 📁 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `lib/ai/prompts.ts` | ✅ INCREMENTAL_SYSTEM_PROMPT 追加<br>✅ createSkeletonPrompt 実装<br>✅ createDayDetailPrompt 実装<br>✅ createNextStepPrompt 実装<br>✅ getSystemPromptForPhase 実装 |
| `lib/ai/__tests__/prompts.test.ts` | ✅ テストケース定義<br>✅ モックデータ作成<br>✅ 実演関数作成 |
| `docs/PHASE4_3_PROMPT_SYSTEM.md` | ✅ 実装レポート作成 |

---

## 📌 重要なポイント

1. **段階的な指示**: AIに一度に全てを求めず、段階的に指示
2. **明確な制約**: 各フェーズで「やってはいけないこと」を明示
3. **JSONフォーマット**: 期待される出力形式を具体例で示す
4. **ユーザー誘導**: 次のステップが明確になるよう促す

---

## 🌟 実装のハイライト

### プロンプトエンジニアリングの工夫

1. **段階の明示化**
   - 各フェーズの目的と制約を明確に定義
   - AIが「やるべきこと」と「やってはいけないこと」を理解

2. **具体例の提示**
   - JSONフォーマットを具体例で示す
   - 会話の例を提示して期待する応答スタイルを誘導

3. **文脈の提供**
   - 現在のフェーズ、進捗状況を明示
   - 他の日の情報も提供して一貫性を保つ

4. **柔軟性の確保**
   - ユーザーの要望に応じてフェーズを戻れる
   - 修正・調整を常に受け付ける

---

**Phase 4.3 完了**: ✅  
**次のフェーズ**: Phase 4.4（UIコンポーネントの追加）

**関連ドキュメント**:
- [Phase 4.1 型定義の拡張](./PHASE4_1_TYPE_EXTENSIONS.md)
- [Phase 4.2 状態管理の拡張](./PHASE4_2_STATE_MANAGEMENT.md)
- [Phase 4 使用ガイド](./PHASE4_USAGE_GUIDE.md)