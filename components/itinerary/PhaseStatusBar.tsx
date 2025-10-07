/**
 * Phase 4.10.3: フェーズステータスバー
 * しおり作成の進捗を視覚的に表示
 */

'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { AutoProgressState } from '@/lib/execution/sequential-itinerary-builder';

interface PhaseStatusBarProps {
  state: AutoProgressState;
}

const phases = [
  { id: 'skeleton', label: '骨組み作成', order: 1 },
  { id: 'detailing', label: '詳細化', order: 2 },
  { id: 'completed', label: '完成', order: 3 },
] as const;

export const PhaseStatusBar: React.FC<PhaseStatusBarProps> = ({ state }) => {
  const currentPhaseOrder = phases.find(p => p.id === state.phase)?.order || 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            しおり作成中
          </h3>
          <span className="text-sm font-medium text-blue-600">
            {state.progress}%
          </span>
        </div>
        
        {/* プログレスバー */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      </div>
      
      {/* フェーズインジケーター */}
      <div className="flex items-center justify-between relative">
        {/* 背景の線 */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
        
        {phases.map((phase, index) => {
          const isCompleted = currentPhaseOrder > phase.order;
          const isCurrent = currentPhaseOrder === phase.order;
          const isPending = currentPhaseOrder < phase.order;
          
          return (
            <div key={phase.id} className="flex flex-col items-center flex-1">
              {/* アイコン */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-300 z-10
                  ${isCompleted ? 'bg-green-500' : ''}
                  ${isCurrent ? 'bg-blue-600 animate-pulse' : ''}
                  ${isPending ? 'bg-gray-300' : ''}
                `}
              >
                {isCompleted && <Check className="w-5 h-5 text-white" />}
                {isCurrent && <Loader2 className="w-5 h-5 text-white animate-spin" />}
                {isPending && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              
              {/* ラベル */}
              <span
                className={`
                  mt-2 text-xs font-medium text-center
                  ${isCompleted ? 'text-green-600' : ''}
                  ${isCurrent ? 'text-blue-600' : ''}
                  ${isPending ? 'text-gray-400' : ''}
                `}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* 現在のステップ */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {state.currentStep}
        </p>
        {state.phase === 'detailing' && state.currentDay && state.totalDays && (
          <p className="text-xs text-gray-500 mt-1">
            ({state.currentDay} / {state.totalDays}日)
          </p>
        )}
      </div>
      
      {/* エラー表示 */}
      {state.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{state.error}</p>
        </div>
      )}
    </div>
  );
};