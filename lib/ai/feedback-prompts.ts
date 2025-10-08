/**
 * フィードバック処理用のLLM統合
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { FeedbackInput, ProcessedFeedback } from '@/types/feedback';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const FEEDBACK_PROCESSING_PROMPT = `
あなたはソフトウェア開発プロジェクトのプロダクトマネージャーです。
ユーザーからのフィードバックを受け取り、GitHub Issueとして適切に整形してください。

# タスク
1. フィードバックの内容を分析
2. カテゴリと優先度を判定
3. 適切なGitHub Issue形式に変換
4. 開発者が理解しやすいように構造化

# カテゴリの説明
- bug: バグ報告（動作がおかしい、エラーが出る）
- feature: 機能リクエスト（新しい機能の提案）
- ui-ux: UI/UX改善（使いにくい、わかりにくい）
- performance: パフォーマンス（遅い、重い）
- content: コンテンツ（AIの応答、テキストの改善）
- other: その他

# 優先度の判定基準
- critical: システムが使用不可能、データ損失の可能性
- high: 主要機能に大きな影響、多数のユーザーに影響
- medium: 特定の機能に影響、回避策がある
- low: 軽微な問題、改善提案

# 出力要件
- タイトルは簡潔に（50文字以内）
- 本文はMarkdown形式で構造化
- 適切なGitHubラベルを提案（最大5つ）
- 日本語で記述

# 本文の構成
## 概要
簡潔な問題の説明

## 再現手順（バグの場合）
1. ...
2. ...

## 期待される動作
何が起こるべきか

## 実際の動作
実際に何が起こったか

## 環境情報
- URL: ...
- ブラウザ: ...

## 追加情報
その他の関連情報

# 出力形式
必ずJSON形式で出力してください。JSON以外の文字は含めないでください:
{
  "category": "bug|feature|ui-ux|performance|content|other",
  "priority": "low|medium|high|critical",
  "labels": ["label1", "label2", "label3"],
  "title": "整形されたタイトル",
  "body": "整形された本文（Markdown形式）",
  "estimatedEffort": "工数の推定（オプション、例: 小、中、大、または具体的な時間）",
  "suggestedSolution": "提案される解決策（オプション）"
}
`;

/**
 * フィードバックをLLMで処理してGitHub Issue形式に変換
 */
export async function processFeedbackWithLLM(
  feedback: FeedbackInput
): Promise<ProcessedFeedback> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,  // 一貫性のある出力のため低めに設定
        maxOutputTokens: 2000,
      }
    });

    // プロンプトの構築
    const userInput = `
# ユーザー入力
カテゴリ: ${feedback.category}
タイトル: ${feedback.title}
詳細: ${feedback.description}

# コンテキスト情報
URL: ${feedback.context?.url || 'N/A'}
ユーザーID: ${feedback.context?.userId || '未認証'}
タイムスタンプ: ${feedback.context?.timestamp || new Date().toISOString()}
ユーザーエージェント: ${feedback.context?.userAgent || 'N/A'}

上記のフィードバックを分析し、GitHub Issueとして整形してください。
`;

    const result = await model.generateContent(
      FEEDBACK_PROCESSING_PROMPT + '\n\n' + userInput
    );
    
    const response = await result.response;
    const text = response.text();

    // JSONをパース
    // コードブロックで囲まれている場合もあるため、それを除去
    let jsonText = text.trim();
    
    // ```json ... ``` を除去
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
    }
    
    // JSON部分のみを抽出
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSONレスポンスが見つかりません');
    }

    const structured = JSON.parse(jsonMatch[0]);

    // バリデーション
    if (!structured.category || !structured.priority || !structured.title || !structured.body) {
      throw new Error('必須フィールドが不足しています');
    }

    return {
      original: feedback,
      structured: {
        category: structured.category,
        priority: structured.priority,
        labels: structured.labels || [structured.category, 'user-feedback'],
        title: structured.title,
        body: structured.body,
        estimatedEffort: structured.estimatedEffort,
        suggestedSolution: structured.suggestedSolution,
      }
    };

  } catch (error) {
    console.error('LLM processing error:', error);
    
    // フォールバック: 基本的な構造化
    // LLMが失敗した場合でもフィードバックを受け付けられるようにする
    return {
      original: feedback,
      structured: {
        category: feedback.category,
        priority: 'medium',
        labels: [feedback.category, 'user-feedback', 'auto-processed'],
        title: feedback.title.length > 50 ? feedback.title.substring(0, 47) + '...' : feedback.title,
        body: `## 概要\n\n${feedback.description}\n\n## 環境情報\n\n- URL: ${feedback.context?.url || 'N/A'}\n- ユーザーエージェント: ${feedback.context?.userAgent || 'N/A'}\n- タイムスタンプ: ${feedback.context?.timestamp || 'N/A'}`,
      }
    };
  }
}

/**
 * フィードバック処理のテスト用関数
 */
export async function testFeedbackProcessing(feedback: FeedbackInput): Promise<void> {
  console.log('=== Testing Feedback Processing ===');
  console.log('Input:', JSON.stringify(feedback, null, 2));
  
  const processed = await processFeedbackWithLLM(feedback);
  
  console.log('\nProcessed:', JSON.stringify(processed, null, 2));
  console.log('=== Test Complete ===');
}
