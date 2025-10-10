"use client";

import React from "react";
import { Bot } from "lucide-react";

/**
 * メッセージスケルトンコンポーネント
 * AIの応答待ち中に表示されるローディングUI
 */
export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[80%]">
        {/* AIアイコン */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
          <Bot className="w-5 h-5 text-gray-600 animate-pulse" />
        </div>

        {/* スケルトンメッセージ */}
        <div className="rounded-lg p-3 bg-gray-100 space-y-2 min-w-[200px]">
          {/* 1行目 - 長いテキストのスケルトン */}
          <div className="h-4 rounded shimmer w-full"></div>
          
          {/* 2行目 - 中程度の長さのテキストのスケルトン */}
          <div className="h-4 rounded shimmer w-5/6"></div>
          
          {/* 3行目 - 短いテキストのスケルトン */}
          <div className="h-4 rounded shimmer w-4/6"></div>
        </div>
      </div>
    </div>
  );
};
