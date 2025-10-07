'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Check, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatChecklistValue } from '@/lib/requirements/checklist-utils';

/**
 * Phase 4.8.4: 要件チェックリスト表示コンポーネント
 * アコーディオン形式で折りたたみ可能
 */
export const RequirementsChecklist: React.FC = () => {
  const {
    requirementsChecklist,
    checklistStatus,
    planningPhase,
  } = useStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 表示対象のフェーズでない場合は非表示
  if (planningPhase === 'initial' || planningPhase === 'completed') {
    return null;
  }
  
  // チェックリストが空の場合は非表示
  if (!requirementsChecklist || requirementsChecklist.length === 0) {
    return null;
  }
  
  // 必須項目とオプション項目を分離
  const requiredItems = requirementsChecklist.filter(item => item.required);
  const optionalItems = requirementsChecklist.filter(item => !item.required);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg mx-4 mb-4 overflow-hidden">
      {/* ヘッダー（クリックで展開/折りたたみ） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {checklistStatus?.allRequiredFilled ? (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Circle className="w-5 h-5 text-blue-600" />
              </div>
            )}
          </div>
          
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">
              必要情報チェックリスト
            </h3>
            {checklistStatus && (
              <p className="text-xs text-gray-500">
                {checklistStatus.requiredFilled}/{checklistStatus.requiredTotal} 必須項目完了
                {checklistStatus.optionalTotal > 0 && (
                  <span className="ml-2">
                    + {checklistStatus.optionalFilled}/{checklistStatus.optionalTotal} オプション
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 進捗率バッジ */}
          {checklistStatus && (
            <div className={`
              px-2 py-1 rounded text-xs font-medium
              ${checklistStatus.completionRate === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
            `}>
              {checklistStatus.completionRate}%
            </div>
          )}
          
          {/* 展開アイコン */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {/* チェックリスト内容（展開時のみ表示） */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-3">
          {/* 充足率プログレスバー */}
          {checklistStatus && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  全体の充足率
                </span>
                <span className="text-xs font-medium text-blue-600">
                  {checklistStatus.completionRate}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full transition-all duration-500 ease-out
                    ${checklistStatus.completionRate === 100 ? 'bg-green-500' : 'bg-blue-500'}
                  `}
                  style={{ width: `${checklistStatus.completionRate}%` }}
                />
              </div>
            </div>
          )}
          
          {/* 必須項目 */}
          {requiredItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                必須項目
              </h4>
              <div className="space-y-2">
                {requiredItems.map(item => (
                  <div
                    key={item.id}
                    className={`
                      flex items-start space-x-3 p-2 rounded-lg
                      ${item.status === 'filled' ? 'bg-green-50' : 'bg-gray-50'}
                    `}
                  >
                    {/* チェックマーク */}
                    <div className="flex-shrink-0 mt-0.5">
                      {item.status === 'filled' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    {/* 項目情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`
                          text-sm font-medium
                          ${item.status === 'filled' ? 'text-green-900' : 'text-gray-700'}
                        `}>
                          {item.label}
                        </span>
                        {item.status === 'filled' && item.value && (
                          <span className="text-xs text-green-700 font-medium ml-2">
                            {formatChecklistValue(item.value)}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* オプション項目 */}
          {optionalItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                オプション項目
              </h4>
              <div className="space-y-2">
                {optionalItems.map(item => (
                  <div
                    key={item.id}
                    className={`
                      flex items-start space-x-3 p-2 rounded-lg
                      ${item.status === 'filled' ? 'bg-blue-50' : 'bg-gray-50'}
                    `}
                  >
                    {/* チェックマーク */}
                    <div className="flex-shrink-0 mt-0.5">
                      {item.status === 'filled' ? (
                        <Check className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    {/* 項目情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`
                          text-sm font-medium
                          ${item.status === 'filled' ? 'text-blue-900' : 'text-gray-700'}
                        `}>
                          {item.label}
                        </span>
                        {item.status === 'filled' && item.value && (
                          <span className="text-xs text-blue-700 font-medium ml-2">
                            {formatChecklistValue(item.value)}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 不足情報の入力促進メッセージ */}
          {checklistStatus && !checklistStatus.allRequiredFilled && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>まだ以下の情報が必要です:</strong>
                <br />
                {checklistStatus.missingRequired.join('、')}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                チャットでAIに伝えてください
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};