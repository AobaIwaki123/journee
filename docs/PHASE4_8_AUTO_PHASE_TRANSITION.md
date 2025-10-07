# Phase 4.8: フェーズ移動処理の半自動化 - 設計書

## 📋 概要

チャット内容から自動的に必要情報の充足度を判定し、次のフェーズへ進むタイミングを視覚的に示すシステムを実装します。ユーザーが適切なタイミングで次のステップへ進めるよう、インテリジェントなガイダンスを提供します。

**目的**: 
- 情報不足による不完全なしおり生成を防ぐ
- ユーザーが適切なタイミングで次のフェーズへ進める
- 柔軟性を保ちつつ、スマートなガイダンスを提供

---

## 🎯 主要機能

### 1. 情報充足度の自動判定
- チャット履歴から旅行情報を抽出
- 各フェーズで必要な情報の有無をチェック
- 充足率をリアルタイムで計算

### 2. 動的なボタンスタイリング
- 必須情報が揃った場合: 強調表示（緑色、脈動アニメーション）
- 一部情報が不足: 通常表示（青色）
- 情報が大幅に不足: 抑制表示（グレー + 警告アイコン）

### 3. チェックリスト表示
- 収集すべき情報を視覚的に表示
- 各項目の充足状態をチェックマークで表示
- 全体の充足率をプログレスバーで表示

### 4. 柔軟な進行許容
- 情報が不足していても「このまま進む」を選択可能
- AIが不足情報を補完または追加質問

---

## 📊 型定義

### types/requirements.ts

```typescript
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
 * ボタンの状態
 */
export type ButtonReadinessLevel = 'ready' | 'partial' | 'not_ready';

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
```

---

## 🏗 アーキテクチャ

### 情報抽出の流れ

```
[ユーザーがメッセージ送信]
    ↓
[MessageInput] メッセージを追加
    ↓
[useStore] メッセージ履歴が更新される
    ↓
[extractTravelInfo] チャット履歴から情報を抽出
    ↓
[updateChecklist] チェックリストを更新
    ↓
[calculateChecklistStatus] 充足率を計算
    ↓
[determineButtonReadiness] ボタンの状態を決定
    ↓
[QuickActions] ボタンの見た目を更新
```

---

## 🔧 実装詳細

### 4.8.1 情報充足度チェックシステム

#### チェックリストの定義

**ファイル**: `lib/requirements/checklist-config.ts`

```typescript
import type { RequirementChecklistItem, PhaseRequirements } from '@/types/requirements';

/**
 * 各フェーズのチェックリスト設定
 */
export const PHASE_REQUIREMENTS: Record<ItineraryPhase, PhaseRequirements> = {
  initial: {
    phase: 'initial',
    requiredItems: [],
    optionalItems: [],
    items: [],
  },
  
  collecting: {
    phase: 'collecting',
    requiredItems: ['destination', 'duration'],
    optionalItems: ['budget', 'travelers', 'interests'],
    items: [
      {
        id: 'destination',
        label: '行き先',
        description: '旅行先の都市や地域',
        required: true,
        status: 'empty',
        extractor: extractDestination,
      },
      {
        id: 'duration',
        label: '日程',
        description: '旅行の日数または期間',
        required: true,
        status: 'empty',
        extractor: extractDuration,
      },
      {
        id: 'budget',
        label: '予算',
        description: '旅行の予算目安',
        required: false,
        status: 'empty',
        extractor: extractBudget,
      },
      {
        id: 'travelers',
        label: '人数',
        description: '旅行者の人数・構成',
        required: false,
        status: 'empty',
        extractor: extractTravelers,
      },
      {
        id: 'interests',
        label: '興味・テーマ',
        description: '観光、グルメ、自然など',
        required: false,
        status: 'empty',
        extractor: extractInterests,
      },
    ],
  },
  
  skeleton: {
    phase: 'skeleton',
    requiredItems: ['destination', 'duration', 'theme_ideas'],
    optionalItems: ['area_preferences'],
    items: [
      {
        id: 'theme_ideas',
        label: '各日のテーマアイデア',
        description: 'ユーザーが希望する各日の大まかなテーマ',
        required: true,
        status: 'empty',
        extractor: extractThemeIdeas,
      },
      {
        id: 'area_preferences',
        label: 'エリアの希望',
        description: '訪れたいエリアや避けたいエリア',
        required: false,
        status: 'empty',
        extractor: extractAreaPreferences,
      },
    ],
  },
  
  detailing: {
    phase: 'detailing',
    requiredItems: ['skeleton_created'],
    optionalItems: ['spot_preferences', 'meal_preferences'],
    items: [
      {
        id: 'skeleton_created',
        label: '骨組みの作成',
        description: '各日のテーマが決定している',
        required: true,
        status: 'empty',
        extractor: checkSkeletonCreated,
      },
      {
        id: 'spot_preferences',
        label: '観光スポットの希望',
        description: '訪れたい観光スポット',
        required: false,
        status: 'empty',
        extractor: extractSpotPreferences,
      },
      {
        id: 'meal_preferences',
        label: '食事の希望',
        description: '食べたい料理や避けたい食べ物',
        required: false,
        status: 'empty',
        extractor: extractMealPreferences,
      },
    ],
  },
  
  completed: {
    phase: 'completed',
    requiredItems: [],
    optionalItems: [],
    items: [],
  },
};
```

#### 情報抽出関数

**ファイル**: `lib/requirements/extractors.ts`

```typescript
import type { ChatMessage } from '@/types/chat';
import type { ItineraryData } from '@/types/itinerary';

/**
 * 行き先を抽出
 */
export function extractDestination(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string | null {
  // しおりに既に設定されている場合
  if (itinerary?.destination) {
    return itinerary.destination;
  }
  
  // チャット履歴から抽出
  const destinationKeywords = ['行きたい', '旅行', '行く', '訪れる'];
  const placePatterns = [
    /(?:東京|大阪|京都|北海道|沖縄|名古屋|福岡|広島|仙台|札幌)/,
    /(?:ハワイ|パリ|ニューヨーク|ロンドン|バリ|台湾|韓国|タイ)/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      // キーワードが含まれているか
      const hasKeyword = destinationKeywords.some(kw => msg.content.includes(kw));
      
      if (hasKeyword) {
        // 地名パターンにマッチするか
        for (const pattern of placePatterns) {
          const match = msg.content.match(pattern);
          if (match) {
            return match[0];
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * 日程を抽出
 */
export function extractDuration(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): number | null {
  // しおりに既に設定されている場合
  if (itinerary?.duration) {
    return itinerary.duration;
  }
  
  // チャット履歴から抽出
  const durationPatterns = [
    /(\d+)日/,
    /(\d+)泊/,
    /(\d+)泊(\d+)日/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      for (const pattern of durationPatterns) {
        const match = msg.content.match(pattern);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
    }
  }
  
  return null;
}

/**
 * 予算を抽出
 */
export function extractBudget(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): number | null {
  if (itinerary?.totalBudget) {
    return itinerary.totalBudget;
  }
  
  const budgetPatterns = [
    /予算.*?(\d+)万/,
    /(\d+)万円/,
    /(\d+)円/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      for (const pattern of budgetPatterns) {
        const match = msg.content.match(pattern);
        if (match) {
          const value = parseInt(match[1], 10);
          // 「万円」の場合は10000倍
          if (msg.content.includes('万')) {
            return value * 10000;
          }
          return value;
        }
      }
    }
  }
  
  return null;
}

/**
 * 旅行者情報を抽出
 */
export function extractTravelers(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): { count: number; type?: string } | null {
  const travelerPatterns = [
    /(\d+)人/,
    /(一人|ソロ|1人)/,
    /(カップル|恋人|二人|2人)/,
    /(家族|子供|親子)/,
    /(友達|友人)/,
  ];
  
  for (const msg of messages.slice().reverse()) {
    if (msg.role === 'user') {
      for (const pattern of travelerPatterns) {
        const match = msg.content.match(pattern);
        if (match) {
          if (match[0].includes('一人') || match[0].includes('ソロ')) {
            return { count: 1, type: 'solo' };
          }
          if (match[0].includes('カップル') || match[0].includes('恋人')) {
            return { count: 2, type: 'couple' };
          }
          if (match[0].includes('家族') || match[0].includes('子供')) {
            return { count: 3, type: 'family' };
          }
          const count = parseInt(match[1], 10);
          if (!isNaN(count)) {
            return { count };
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * 興味・テーマを抽出
 */
export function extractInterests(
  messages: ChatMessage[],
  itinerary?: ItineraryData
): string[] {
  const interests: string[] = [];
  const interestKeywords = {
    sightseeing: ['観光', '名所', '観る'],
    gourmet: ['グルメ', '食べ物', '料理', 'レストラン'],
    nature: ['自然', '山', '海', '景色'],
    history: ['歴史', '文化', '寺', '神社'],
    shopping: ['ショッピング', '買い物'],
    relaxation: ['リラックス', '温泉', 'スパ'],
  };
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      for (const [key, keywords] of Object.entries(interestKeywords)) {
        if (keywords.some(kw => msg.content.includes(kw))) {
          if (!interests.includes(key)) {
            interests.push(key);
          }
        }
      }
    }
  }
  
  return interests;
}

// 他の抽出関数も同様に実装...
```

#### Zustand状態管理の拡張

**ファイル**: `lib/store/useStore.ts` に追加

```typescript
import type { 
  RequirementChecklistItem, 
  ChecklistStatus,
  ButtonReadiness 
} from '@/types/requirements';
import { PHASE_REQUIREMENTS } from '@/lib/requirements/checklist-config';
import { 
  calculateChecklistStatus,
  determineButtonReadiness 
} from '@/lib/requirements/checklist-utils';

interface AppState {
  // ... 既存の状態 ...
  
  // Phase 4.8: チェックリスト状態
  requirementsChecklist: RequirementChecklistItem[];
  checklistStatus: ChecklistStatus | null;
  buttonReadiness: ButtonReadiness | null;
  
  // Phase 4.8: アクション
  updateChecklist: () => void;
  getChecklistForPhase: (phase: ItineraryPhase) => RequirementChecklistItem[];
}

export const useStore = create<AppState>((set, get) => ({
  // ... 既存の実装 ...
  
  // Phase 4.8: 初期状態
  requirementsChecklist: [],
  checklistStatus: null,
  buttonReadiness: null,
  
  // チェックリストを更新
  updateChecklist: () => {
    const { messages, currentItinerary, planningPhase } = get();
    
    // 現在のフェーズの要件を取得
    const requirements = PHASE_REQUIREMENTS[planningPhase];
    
    // 各項目を評価
    const updatedItems = requirements.items.map(item => {
      if (item.extractor) {
        const value = item.extractor(messages, currentItinerary || undefined);
        return {
          ...item,
          value,
          status: value ? 'filled' : 'empty',
        } as RequirementChecklistItem;
      }
      return item;
    });
    
    // 充足率を計算
    const status = calculateChecklistStatus(updatedItems, requirements);
    
    // ボタンの準備度を決定
    const readiness = determineButtonReadiness(status, planningPhase);
    
    set({
      requirementsChecklist: updatedItems,
      checklistStatus: status,
      buttonReadiness: readiness,
    });
  },
  
  // 特定フェーズのチェックリストを取得
  getChecklistForPhase: (phase: ItineraryPhase) => {
    const requirements = PHASE_REQUIREMENTS[phase];
    return requirements.items;
  },
}));
```

---

### 4.8.3 QuickActionsボタンの動的スタイリング

**ファイル**: `components/itinerary/QuickActions.tsx` を更新

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import { ArrowRight, RotateCcw, Check, AlertCircle } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const {
    planningPhase,
    buttonReadiness,
    checklistStatus,
    updateChecklist,
    proceedToNextStep,
    // ...
  } = useStore();
  
  const [showWarning, setShowWarning] = useState(false);
  
  // メッセージやしおりが更新されたらチェックリストを更新
  useEffect(() => {
    updateChecklist();
  }, [updateChecklist]);
  
  const handleNextStep = () => {
    if (!buttonReadiness) return;
    
    // 必須情報が不足している場合は警告を表示
    if (buttonReadiness.level === 'not_ready' && checklistStatus) {
      setShowWarning(true);
      return;
    }
    
    // 次のステップへ進む
    proceedToNextStep();
    // AIにメッセージ送信...
  };
  
  const handleForceNext = () => {
    setShowWarning(false);
    proceedToNextStep();
    // AIにメッセージ送信...
  };
  
  if (!buttonReadiness) return null;
  
  return (
    <div className="border-t bg-white p-4">
      {/* 警告ダイアログ */}
      {showWarning && checklistStatus && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900 mb-2">
                以下の情報が不足しています
              </h4>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                {checklistStatus.missingRequired.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  情報を追加する
                </button>
                <button
                  onClick={handleForceNext}
                  className="px-4 py-2 border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50"
                >
                  このまま進む
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 次へボタン */}
      <button
        onClick={handleNextStep}
        disabled={planningPhase === 'completed'}
        title={buttonReadiness.tooltip}
        className={`
          w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg 
          font-medium transition-all
          ${getButtonStyles(buttonReadiness)}
        `}
      >
        {buttonReadiness.level === 'ready' ? (
          <Check className="w-5 h-5" />
        ) : buttonReadiness.level === 'not_ready' ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <ArrowRight className="w-5 h-5" />
        )}
        <span>{buttonReadiness.label}</span>
      </button>
      
      {/* 不足情報のヒント */}
      {buttonReadiness.missingInfo && buttonReadiness.missingInfo.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          まだ: {buttonReadiness.missingInfo.join('、')} が未設定です
        </div>
      )}
    </div>
  );
};

function getButtonStyles(readiness: ButtonReadiness): string {
  const baseStyles = 'shadow-sm hover:shadow';
  
  switch (readiness.level) {
    case 'ready':
      return `${baseStyles} bg-green-500 text-white hover:bg-green-600 ${
        readiness.animate ? 'animate-pulse' : ''
      }`;
    case 'partial':
      return `${baseStyles} bg-blue-500 text-white hover:bg-blue-600`;
    case 'not_ready':
      return `${baseStyles} bg-gray-300 text-gray-600 cursor-not-allowed`;
    default:
      return baseStyles;
  }
}
```

---

### 4.8.4 チェックリスト表示UI

**ファイル**: `components/itinerary/RequirementsChecklist.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { ChevronDown, ChevronUp, Check, Circle } from 'lucide-react';
import type { RequirementChecklistItem } from '@/types/requirements';

export const RequirementsChecklist: React.FC = () => {
  const { requirementsChecklist, checklistStatus } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!checklistStatus || requirementsChecklist.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium">
            必要な情報 ({checklistStatus.requiredFilled}/{checklistStatus.requiredTotal})
          </div>
          <div className="text-xs text-gray-500">
            {Math.round(checklistStatus.completionRate)}% 完了
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {/* プログレスバー */}
      <div className="px-4 pb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${checklistStatus.completionRate}%` }}
          />
        </div>
      </div>
      
      {/* チェックリスト項目 */}
      {isExpanded && (
        <div className="border-t divide-y">
          {requirementsChecklist.map(item => (
            <ChecklistItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

const ChecklistItem: React.FC<{ item: RequirementChecklistItem }> = ({ item }) => {
  return (
    <div className="p-4 flex items-start space-x-3">
      {/* チェックマーク */}
      <div className="flex-shrink-0 mt-0.5">
        {item.status === 'filled' ? (
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>
      
      {/* 項目情報 */}
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <div className="font-medium text-sm">{item.label}</div>
          {item.required && (
            <span className="text-xs text-red-500">必須</span>
          )}
        </div>
        {item.description && (
          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
        )}
        {item.value && (
          <div className="text-xs text-blue-600 mt-1">
            設定済み: {formatValue(item.value)}
          </div>
        )}
      </div>
    </div>
  );
};

function formatValue(value: any): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
```

---

## 🎨 アニメーション

### Tailwind CSS設定

**ファイル**: `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
};
```

---

## 📱 使用例

### ユーザーフロー

1. **情報収集フェーズ開始**
   - ユーザー: 「東京に3泊4日で旅行に行きたいです」
   - システム: チェックリストを更新（行き先: ✓、日程: ✓）
   - ボタン: 青色表示（一部情報充足）

2. **さらに情報を追加**
   - ユーザー: 「予算は10万円くらいで、観光とグルメが楽しみたいです」
   - システム: チェックリストを更新（予算: ✓、興味: ✓）
   - ボタン: 緑色に変化 + 脈動アニメーション（必須情報充足）

3. **次のフェーズへ進む**
   - ユーザー: 「次へ」ボタンをクリック
   - システム: skeleton フェーズへ移行
   - AI: 「それでは各日のテーマを決めていきましょう...」

---

## 🧪 テスト項目

### 自動テスト
- [ ] 情報抽出関数の単体テスト
- [ ] チェックリスト更新ロジックのテスト
- [ ] 充足率計算のテスト
- [ ] ボタン準備度判定のテスト

### 手動テスト
- [ ] 段階的に情報を追加した場合のボタン変化
- [ ] 必須情報が揃った瞬間のアニメーション
- [ ] 情報不足時の警告ダイアログ
- [ ] 「このまま進む」の動作
- [ ] チェックリストの展開/折りたたみ

---

## 📝 実装優先順位

### Phase 1（基本機能）
1. ✅ 型定義の作成
2. ✅ チェックリスト設定の定義
3. ✅ 基本的な情報抽出関数（destination, duration）
4. ✅ Zustand状態管理の拡張
5. ✅ QuickActionsボタンの動的スタイリング

### Phase 2（UI強化）
6. ✅ RequirementsChecklistコンポーネント
7. ✅ 警告ダイアログ
8. ✅ アニメーション効果

### Phase 3（最適化）
9. ⬜ 高度な情報抽出（NLP活用）
10. ⬜ パフォーマンス最適化
11. ⬜ テストカバレッジ向上

---

**実装完了予定**: Phase 4.6, 4.7の後  
**推定工数**: 3-4日  
**依存関係**: Phase 4.1~4.5の完了