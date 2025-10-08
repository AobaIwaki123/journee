'use client';

import React from 'react';
import { useStore } from '@/lib/store/useStore';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { LinearProgress } from '@/components/ui/ProgressBar';

/**
 * Phase 3.5.3: ストリーミング進捗表示コンポーネント
 * 
 * AIのストリーミング応答を段階的に視覚化
 */

interface StreamingProgressProps {
  /** コンパクト表示モード */
  compact?: boolean;
  /** カスタムステージメッセージ */
  stageMessages?: {
    thinking?: string;
    streaming?: string;
    finalizing?: string;
  };
}

interface Stage {
  id: string;
  label: string;
  description: string;
}

const StreamingProgress: React.FC<StreamingProgressProps> = ({
  compact = false,
  stageMessages,
}) => {
  const { loadingState } = useStore();

  // ステージ定義
  const stages: Stage[] = [
    {
      id: 'thinking',
      label: 'AIが思考中',
      description: stageMessages?.thinking || '最適な旅程を考えています...',
    },
    {
      id: 'streaming',
      label: 'しおりを作成中',
      description: stageMessages?.streaming || 'リアルタイムで情報を生成中...',
    },
    {
      id: 'finalizing',
      label: '最終調整中',
      description: stageMessages?.finalizing || '細部を調整しています...',
    },
  ];

  // 現在のステージインデックス
  const getCurrentStageIndex = () => {
    return stages.findIndex((s) => s.id === loadingState.stage);
  };

  const currentStageIndex = getCurrentStageIndex();

  // ステージアイコン
  const StageIcon: React.FC<{ stageIndex: number }> = ({ stageIndex }) => {
    if (stageIndex < currentStageIndex) {
      // 完了
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (stageIndex === currentStageIndex) {
      // 進行中
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    } else {
      // 未開始
      return <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />;
    }
  };

  // コンパクト表示
  if (compact) {
    return (
      <div className="space-y-2">
        {/* 現在のステージメッセージ */}
        {currentStageIndex >= 0 && currentStageIndex < stages.length && (
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {stages[currentStageIndex].label}
          </p>
        )}

        {/* プログレスバー */}
        <LinearProgress
          progress={loadingState.streamProgress}
          height="md"
          color="gradient"
          showLabel
          animated
        />
      </div>
    );
  }

  // 通常表示
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          しおり作成中
        </h3>
        {loadingState.estimatedWaitTime > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            あと約 {loadingState.estimatedWaitTime} 秒
          </span>
        )}
      </div>

      {/* ステージリスト */}
      <div className="space-y-4 mb-6">
        {stages.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;

          return (
            <div
              key={stage.id}
              className={`flex items-start space-x-3 transition-opacity ${
                isActive || isCompleted ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {/* アイコン */}
              <div className="flex-shrink-0 mt-0.5">
                <StageIcon stageIndex={index} />
              </div>

              {/* コンテンツ */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {stage.label}
                </p>
                {isActive && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 全体の進捗バー */}
      <div>
        <LinearProgress
          progress={loadingState.streamProgress}
          height="lg"
          color="gradient"
          showLabel
          animated
        />
      </div>
    </div>
  );
};

StreamingProgress.displayName = 'StreamingProgress';

export default StreamingProgress;
