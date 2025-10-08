'use client';

/**
 * Phase 4.8: 必要情報チェックリストUI
 * ユーザーが旅のしおり作成に必要な情報を一目で把握できるコンポーネント
 */

import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

interface RequirementChecklistProps {
  /** 表示/非表示 */
  visible?: boolean;
  /** クラス名 */
  className?: string;
  /** 初期開閉状態 */
  defaultOpen?: boolean;
}

/**
 * 必要情報チェックリストコンポーネント
 */
export const RequirementChecklist: React.FC<RequirementChecklistProps> = ({
  visible = true,
  className = '',
  defaultOpen = true,
}) => {
  const {
    requirementsChecklist,
    checklistStatus,
    buttonReadiness,
  } = useStore();

  // アコーディオンの開閉状態
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // アコーディオンのトグル
  const toggleAccordion = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // キーボード操作ハンドラー
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [toggleAccordion]);

  // 非表示の場合は何も表示しない
  if (!visible) {
    return null;
  }

  return (
    <div
      className={`flex flex-col ${className}`}
      role="region"
      aria-label="必要情報チェックリスト"
      aria-describedby="checklist-description"
    >
      {/* アコーディオンヘッダー */}
      <button
        type="button"
        className="
          flex items-center justify-between
          w-full px-4 py-3
          bg-gradient-to-r from-blue-500 to-purple-600
          text-white
          border-b border-white/20
          hover:from-blue-600 hover:to-purple-700
          focus:outline-none focus:ring-2 focus:ring-white/50
          transition-all duration-200
          cursor-pointer
        "
        onClick={toggleAccordion}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="checklist-content"
        aria-labelledby="checklist-header-title"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <h3 
            id="checklist-header-title"
            className="text-sm font-semibold"
          >
            必要情報チェックリスト
          </h3>
          {checklistStatus && (
            <span 
              className="
                inline-flex items-center justify-center
                min-w-[3rem] px-2 py-0.5
                bg-white/20 backdrop-blur-sm
                rounded-full
                text-xs font-bold
              "
              aria-label={`充足率 ${checklistStatus.completionRate}パーセント`}
            >
              {checklistStatus.completionRate}%
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>
      
      {/* アコーディオンコンテンツ */}
      {isOpen && (
        <div
          id="checklist-content"
          className="flex-1 overflow-y-auto p-4"
          role="tabpanel"
        >
          {/* スクリーンリーダー用の説明 */}
          <p 
            id="checklist-description" 
            className="sr-only"
          >
            旅のしおり作成に必要な情報のチェックリストです。
            各項目の充足状態を確認できます。
          </p>
          
          {requirementsChecklist.length === 0 ? (
            <p 
              className="text-gray-500 text-sm text-center py-4"
              role="status"
            >
              チェックリスト項目がありません
            </p>
          ) : (
            <ul 
              className="space-y-3"
              role="list"
              aria-label="必要情報の一覧"
            >
              {requirementsChecklist.map((item) => {
                const isFilled = item.status === 'filled';
                const isPartial = item.status === 'partial';
                
                return (
                  <li
                    key={item.id}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg
                      transition-all duration-200
                      hover:bg-gray-50
                      ${isFilled ? 'bg-green-50/50' : ''}
                      ${!isFilled && !isPartial ? 'bg-gray-50/30' : ''}
                    `}
                    role="listitem"
                    aria-label={`
                      ${item.label}。
                      ${item.required ? '必須項目' : 'オプション項目'}。
                      ${isFilled ? '入力済み' : '未入力'}。
                    `}
                  >
                    {/* ステータスアイコン */}
                    <div 
                      className="flex-shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      {isFilled ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    
                    {/* 項目内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`
                            font-medium text-sm
                            ${isFilled ? 'text-green-700' : 'text-gray-700'}
                          `}
                        >
                          {item.label}
                        </span>
                        
                        {/* 必須/推奨/オプションバッジ */}
                        {item.required ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            必須
                          </span>
                        ) : item.description?.includes('推奨') ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            <Info className="w-3 h-3" />
                            推奨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            オプション
                          </span>
                        )}
                      </div>
                      
                      {/* 説明文 */}
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </p>
                      )}
                      
                      {/* 抽出された値 */}
                      {item.value && (
                        <p className="text-sm text-gray-700 mt-1 font-medium">
                          {typeof item.value === 'object'
                            ? JSON.stringify(item.value)
                            : String(item.value)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          
          {/* プログレスバー */}
          {checklistStatus && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">全体の進捗</span>
                <span 
                  className="font-bold text-lg text-gray-900"
                  aria-label={`充足率 ${checklistStatus.completionRate}パーセント`}
                >
                  {checklistStatus.completionRate}%
                </span>
              </div>
              
              <div 
                className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={checklistStatus.completionRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="全体の充足率"
              >
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${checklistStatus.completionRate}%` }}
                />
              </div>
              
              <div 
                className="flex items-center justify-between text-xs text-gray-600"
                role="status"
                aria-live="polite"
              >
                <span aria-label={`必須項目 ${checklistStatus.requiredFilled}個中${checklistStatus.requiredTotal}個完了`}>
                  必須: {checklistStatus.requiredFilled}/{checklistStatus.requiredTotal}
                </span>
                <span aria-label={`オプション項目 ${checklistStatus.optionalFilled}個中${checklistStatus.optionalTotal}個完了`}>
                  オプション: {checklistStatus.optionalFilled}/{checklistStatus.optionalTotal}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

RequirementChecklist.displayName = 'RequirementChecklist';
