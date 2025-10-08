/**
 * GitHub Issue テンプレート生成
 */

import type { ProcessedFeedback } from '@/types/feedback';

/**
 * フィードバックからGitHub Issueの本文を生成
 */
export function generateIssueBody(feedback: ProcessedFeedback): string {
  const { original, structured } = feedback;
  
  // 優先度の絵文字
  const priorityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }[structured.priority] || '⚪';

  // カテゴリの絵文字
  const categoryEmoji = {
    bug: '🐛',
    feature: '💡',
    'ui-ux': '🎨',
    performance: '⚡',
    content: '📝',
    other: '📌'
  }[structured.category] || '📌';

  return `
${categoryEmoji} **カテゴリ**: ${structured.category}
${priorityEmoji} **優先度**: ${structured.priority}
📅 **報告日時**: ${original.context?.timestamp || new Date().toISOString()}

---

${structured.body}

---

## 🔍 環境情報

- **URL**: ${original.context?.url || 'N/A'}
- **ユーザーエージェント**: ${original.context?.userAgent || 'N/A'}
- **ユーザーID**: ${original.context?.userId || '未認証'}
${original.context?.viewport ? `- **画面サイズ**: ${original.context.viewport.width}x${original.context.viewport.height}` : ''}
${original.email ? `- **連絡先**: ${original.email}` : ''}

${structured.suggestedSolution ? `
## 💡 提案される解決策

${structured.suggestedSolution}
` : ''}

${structured.estimatedEffort ? `
## ⏱️ 推定工数

${structured.estimatedEffort}
` : ''}

---

## 📋 元のフィードバック

<details>
<summary>ユーザーの入力を表示</summary>

**タイトル**: ${original.title}

**詳細**:
${original.description}

</details>

---

> *このIssueはユーザーフィードバックシステムにより自動生成されました。*
> 
> *フィードバックを送信してくださったユーザーに感謝します！* 🙏
`;
}

/**
 * バグレポート用のテンプレート
 */
export function generateBugReportTemplate(feedback: ProcessedFeedback): string {
  const { original, structured } = feedback;

  return `
## 🐛 バグ報告

${structured.body}

## 📝 再現手順

1. [ユーザーの説明から抽出または手動で追記]

## 🎯 期待される動作

[期待される動作を記述]

## 🔴 実際の動作

[実際の動作を記述]

## 🔍 環境情報

- **URL**: ${original.context?.url || 'N/A'}
- **ブラウザ**: ${original.context?.userAgent || 'N/A'}
- **報告日時**: ${original.context?.timestamp || new Date().toISOString()}
- **ユーザーID**: ${original.context?.userId || '未認証'}

## 📎 追加情報

${original.description}

---

> *フィードバックを送信してくださったユーザーに感謝します！* 🙏
`;
}

/**
 * 機能リクエスト用のテンプレート
 */
export function generateFeatureRequestTemplate(feedback: ProcessedFeedback): string {
  const { original, structured } = feedback;

  return `
## 💡 機能リクエスト

${structured.body}

## 🎯 解決したい問題

[この機能が解決する問題]

## 💭 提案される解決策

${structured.suggestedSolution || '[解決策の提案]'}

## 🔄 代替案

[他に考えられる解決策があれば記述]

## 📊 優先度

${structured.priority}

${structured.estimatedEffort ? `
## ⏱️ 推定工数

${structured.estimatedEffort}
` : ''}

## 🔍 コンテキスト

- **URL**: ${original.context?.url || 'N/A'}
- **報告日時**: ${original.context?.timestamp || new Date().toISOString()}
- **ユーザーID**: ${original.context?.userId || '未認証'}

---

> *フィードバックを送信してくださったユーザーに感謝します！* 🙏
`;
}

/**
 * カテゴリに応じて適切なテンプレートを選択
 */
export function generateAppropriateTemplate(feedback: ProcessedFeedback): string {
  switch (feedback.structured.category) {
    case 'bug':
      return generateBugReportTemplate(feedback);
    case 'feature':
      return generateFeatureRequestTemplate(feedback);
    default:
      return generateIssueBody(feedback);
  }
}
