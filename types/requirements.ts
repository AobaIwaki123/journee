/**
 * Phase 4.8: フェーズ移動処理の半自動化
 * 必要情報の充足度判定に関する型定義
 */

import type { ChatMessage } from './chat';
import type { ItineraryData, ItineraryPhase } from './itinerary';

/**
 * チェックリスト項目
 */
export interface RequirementChecklistItem {
  /** 項目ID */
  id: string;
  
  /** 項目名 */
  label: string;
  
  /** 説明 */
  description?: string;
  
  /** 必須項目かどうか */
  required: boolean;
  
  /** 充足状態 */
  status: 'empty' | 'partial' | 'filled';
  
  /** 抽出された値 */
  value?: any;
  
  /** 自動抽出関数 */
  extractor?: (messages: ChatMessage[], itinerary?: ItineraryData) => any;
}

/**
 * フェーズごとの要件
 */
export interface PhaseRequirements {
  /** フェーズ */
  phase: ItineraryPhase;
  
  /** 必須項目のリスト */
  requiredItems: string[];
  
  /** オプション項目のリスト */
  optionalItems: string[];
  
  /** 全チェックリスト項目 */
  items: RequirementChecklistItem[];
}

/**
 * チェックリストの状態
 */
export interface ChecklistStatus {
  /** 全体の充足率（0-100） */
  completionRate: number;
  
  /** 必須項目がすべて充足されているか */
  allRequiredFilled: boolean;
  
  /** 必須項目の充足数 */
  requiredFilled: number;
  
  /** 必須項目の総数 */
  requiredTotal: number;
  
  /** オプション項目の充足数 */
  optionalFilled: number;
  
  /** オプション項目の総数 */
  optionalTotal: number;
  
  /** 不足している必須項目のリスト */
  missingRequired: string[];
  
  /** 推奨される次のアクション */
  recommendedAction: 'proceed' | 'collect_more' | 'wait';
}

/**
 * ボタンの準備度レベル
 */
export type ButtonReadinessLevel = 'ready' | 'partial' | 'not_ready';

/**
 * ボタンの準備度
 */
export interface ButtonReadiness {
  /** 準備度レベル */
  level: ButtonReadinessLevel;
  
  /** ボタンのラベル */
  label: string;
  
  /** ボタンの色 */
  color: 'green' | 'blue' | 'gray';
  
  /** アニメーションの有無 */
  animate: boolean;
  
  /** ツールチップメッセージ */
  tooltip: string;
  
  /** 不足情報のリスト */
  missingInfo?: string[];
}