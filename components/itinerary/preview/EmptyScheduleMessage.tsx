/**
 * Phase 8: EmptyScheduleMessage
 * 
 * スケジュールが空の場合のメッセージコンポーネント
 */

'use client';

import React from 'react';

export const EmptyScheduleMessage: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 md:p-12 text-center">
      <p className="text-gray-600 text-base md:text-lg font-medium mb-2">
        スケジュールがまだ作成されていません
      </p>
      <p className="text-sm text-gray-500">
        AIチャットで「〇日目の詳細を教えて」と聞いてみましょう
      </p>
    </div>
  );
};
