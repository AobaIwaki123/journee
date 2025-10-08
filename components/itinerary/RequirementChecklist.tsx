'use client';

/**
 * Phase 4.8: 必要情報チェックリストUI
 * ユーザーが旅のしおり作成に必要な情報を一目で把握できるコンポーネント
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
      className={`requirement-checklist ${className}`}
      role="region"
      aria-label="必要情報チェックリスト"
    >
      {/* アコーディオンヘッダー */}
      <button
        type="button"
        className="checklist-header"
        onClick={toggleAccordion}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls="checklist-content"
      >
        <div className="header-content">
          <h3>必要情報チェックリスト</h3>
          {checklistStatus && (
            <span className="completion-badge">
              {checklistStatus.completionRate}%
            </span>
          )}
        </div>
        <div className="header-icon">
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
          className="checklist-body"
        >
          {requirementsChecklist.length === 0 ? (
            <p className="text-gray-500 text-sm">
              チェックリスト項目がありません
            </p>
          ) : (
            <ul className="space-y-2">
              {requirementsChecklist.map((item) => (
                <li key={item.id} className="checklist-item">
                  {item.label}
                  {item.required && (
                    <span className="text-red-500 text-xs ml-1">(必須)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          
          {checklistStatus && (
            <div className="checklist-footer mt-4">
              <div className="text-sm text-gray-600">
                <p>
                  必須項目: {checklistStatus.requiredFilled} / {checklistStatus.requiredTotal}
                </p>
                <p>
                  オプション: {checklistStatus.optionalFilled} / {checklistStatus.optionalTotal}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

RequirementChecklist.displayName = 'RequirementChecklist';
