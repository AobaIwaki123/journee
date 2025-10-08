/**
 * Phase 4.8改善: 会話マネージャー
 * LLM主導の対話フローを管理
 */

import type { ItineraryPhase } from '@/types/itinerary';
import type { ChatMessage } from '@/types/chat';
import {
  Question,
  QuestionCategory,
  PHASE_QUESTION_QUEUES,
  sortQuestionsByPriority,
  filterQuestions,
} from '../requirements/question-queue';

/**
 * 抽出情報のキャッシュ
 */
export interface ExtractionCache {
  destination?: string;
  duration?: number;
  travelers?: { count: number; type?: string };
  interests?: string[];
  budget?: number;
  pace?: string;
  specificSpots?: string[];
  mealPreferences?: string[];
  accommodation?: string;
  lastUpdated?: Date;
}

/**
 * 充足度ステータス
 */
export interface CompletionStatus {
  requiredFilled: boolean;
  optionalFilled: number;
  totalOptional: number;
  completionRate: number;
  missingRequired: string[];
  missingOptional: string[];
}

/**
 * プロンプトヒント
 */
export interface PromptHint {
  extractedInfo: ExtractionCache;
  completionStatus: CompletionStatus;
  nextQuestion: Question | null;
  shouldTransition: boolean;
  transitionMessage?: string;
}

/**
 * 会話マネージャー
 * 質問キューを管理し、LLM主導の対話をサポート
 */
export class ConversationManager {
  private phase: ItineraryPhase;
  private questionQueue: Question[];
  private askedQuestions: Set<QuestionCategory>;
  private extractionCache: ExtractionCache;
  
  constructor(phase: ItineraryPhase, extractionCache: ExtractionCache = {}) {
    this.phase = phase;
    this.extractionCache = extractionCache;
    this.askedQuestions = new Set();
    this.questionQueue = [];
    
    this.initialize();
  }
  
  /**
   * 初期化
   */
  private initialize(): void {
    const config = PHASE_QUESTION_QUEUES[this.phase];
    if (!config) {
      this.questionQueue = [];
      return;
    }
    
    // 質問をフィルタリングして優先度順にソート
    const filtered = filterQuestions(config.questions, this.extractionCache);
    this.questionQueue = sortQuestionsByPriority(filtered);
  }
  
  /**
   * 質問キューを更新（抽出情報が変わったとき）
   */
  public updateCache(newInfo: Partial<ExtractionCache>): void {
    this.extractionCache = {
      ...this.extractionCache,
      ...newInfo,
      lastUpdated: new Date(),
    };
    
    // キャッシュが更新されたら質問を再フィルタリング
    this.initialize();
  }
  
  /**
   * チャット履歴から質問済みのカテゴリを推定
   */
  public loadAskedQuestionsFromHistory(messages: ChatMessage[]): void {
    // 各カテゴリのキーワードマッピング
    const categoryKeywords: Record<QuestionCategory, string[]> = {
      travelers: ['誰と', '一人', 'カップル', '家族', '友人', '友達', '同行者'],
      interests: ['興味', '観光', 'グルメ', '自然', '歴史', 'ショッピング', '好き'],
      budget: ['予算', '円', '万円', 'お金', '費用'],
      pace: ['ペース', 'のんびり', 'ゆっくり', 'アクティブ', '忙しい'],
      specific_spots: ['行きたい', '訪れたい', '見たい', '場所', 'スポット'],
      meal_preferences: ['食事', '食べたい', 'レストラン', '料理', '避けたい'],
      accommodation: ['宿泊', 'ホテル', '旅館', '民泊', '泊まる'],
    };
    
    // AIのメッセージから質問済みかチェック
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => msg.content.includes(kw) && msg.content.includes('？'))) {
            this.askedQuestions.add(category as QuestionCategory);
          }
        }
      }
    }
  }
  
  /**
   * 次に聞くべき質問を取得
   */
  public getNextQuestion(): Question | null {
    // 未質問の質問を探す
    for (const question of this.questionQueue) {
      if (!this.askedQuestions.has(question.category)) {
        return question;
      }
    }
    
    return null;
  }
  
  /**
   * 質問を質問済みとしてマーク
   */
  public markAsAsked(category: QuestionCategory): void {
    this.askedQuestions.add(category);
  }
  
  /**
   * 全ての質問が完了したか
   */
  public allQuestionsAsked(): boolean {
    const unansweredQuestions = this.questionQueue.filter(
      q => !this.askedQuestions.has(q.category)
    );
    
    return unansweredQuestions.length === 0;
  }
  
  /**
   * 充足度を計算
   */
  public calculateCompletionStatus(): CompletionStatus {
    const required = ['destination', 'duration'];
    const optional = ['travelers', 'interests', 'budget', 'pace', 'specificSpots'];
    
    const missingRequired = required.filter(key => !this.extractionCache[key as keyof ExtractionCache]);
    const filledOptional = optional.filter(key => {
      const value = this.extractionCache[key as keyof ExtractionCache];
      return value !== undefined && value !== null && 
             (!Array.isArray(value) || value.length > 0);
    });
    
    const requiredFilled = missingRequired.length === 0;
    const optionalFilled = filledOptional.length;
    const totalOptional = optional.length;
    const completionRate = requiredFilled 
      ? (optionalFilled / totalOptional) * 100
      : 0;
    
    return {
      requiredFilled,
      optionalFilled,
      totalOptional,
      completionRate,
      missingRequired,
      missingOptional: optional.filter(key => !filledOptional.includes(key)),
    };
  }
  
  /**
   * LLMへのプロンプトヒントを生成
   */
  public getPromptHint(): PromptHint {
    const nextQuestion = this.getNextQuestion();
    const status = this.calculateCompletionStatus();
    const shouldTransition = status.requiredFilled && status.completionRate >= 60;
    
    let transitionMessage: string | undefined;
    if (shouldTransition && this.allQuestionsAsked()) {
      transitionMessage = '十分な情報が揃いました。「骨組みを作成」ボタンを押してください。';
    }
    
    return {
      extractedInfo: this.extractionCache,
      completionStatus: status,
      nextQuestion,
      shouldTransition,
      transitionMessage,
    };
  }
  
  /**
   * LLMへのシステムプロンプト補足を生成
   */
  public getSystemPromptSupplement(): string {
    const hint = this.getPromptHint();
    
    let supplement = '\n\n【現在の情報収集状況】\n';
    
    // 抽出済み情報
    supplement += '収集済み情報:\n';
    if (hint.extractedInfo.destination) {
      supplement += `- 行き先: ${hint.extractedInfo.destination}\n`;
    }
    if (hint.extractedInfo.duration) {
      supplement += `- 日数: ${hint.extractedInfo.duration}日間\n`;
    }
    if (hint.extractedInfo.travelers) {
      supplement += `- 同行者: ${hint.extractedInfo.travelers.type || hint.extractedInfo.travelers.count + '人'}\n`;
    }
    if (hint.extractedInfo.interests && hint.extractedInfo.interests.length > 0) {
      supplement += `- 興味: ${hint.extractedInfo.interests.join('、')}\n`;
    }
    if (hint.extractedInfo.budget) {
      supplement += `- 予算: ${hint.extractedInfo.budget}円\n`;
    }
    
    // 次に聞くべき質問
    if (hint.nextQuestion) {
      supplement += `\n【次に聞くべき質問】\n`;
      supplement += `${hint.nextQuestion.question}\n`;
      supplement += `※自然な会話の流れで質問してください。\n`;
    }
    
    // 遷移提案
    if (hint.transitionMessage) {
      supplement += `\n【重要】\n${hint.transitionMessage}\n`;
    }
    
    return supplement;
  }
  
  /**
   * フォローアップメッセージを取得
   */
  public getFollowUpMessage(category: QuestionCategory, answer: string): string | null {
    const question = this.questionQueue.find(q => q.category === category);
    if (!question || !question.followUp) {
      return null;
    }
    
    if (typeof question.followUp === 'function') {
      return question.followUp(answer);
    }
    
    return question.followUp;
  }
}
