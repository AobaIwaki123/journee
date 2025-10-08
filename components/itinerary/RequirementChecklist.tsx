'use client';

/**
 * Phase 4.8: 必要情報チェックリストUI
 * ユーザーが旅のしおり作成に必要な情報を一目で把握できるコンポーネント
 */

import React from 'react';
import { useStore } from '@/lib/store/useStore';

interface RequirementChecklistProps {
  /** 表示/非表示 */
  visible?: boolean;
  /** クラス名 */
  className?: string;
}

/**
 * 必要情報チェックリストコンポーネント
 */
export const RequirementChecklist: React.FC<RequirementChecklistProps> = ({
  visible = true,
  className = '',
}) => {
  const {
    requirementsChecklist,
    checklistStatus,
    buttonReadiness,
  } = useStore();

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
      <div className="checklist-header">
        <h3>必要情報チェックリスト</h3>
      </div>
      
      <div className="checklist-body">
        {requirementsChecklist.length === 0 ? (
          <p>チェックリスト項目がありません</p>
        ) : (
          <ul>
            {requirementsChecklist.map((item) => (
              <li key={item.id}>
                {item.label}
                {item.required && <span> (必須)</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {checklistStatus && (
        <div className="checklist-footer">
          <p>充足率: {checklistStatus.completionRate}%</p>
        </div>
      )}
    </div>
  );
};

RequirementChecklist.displayName = 'RequirementChecklist';
