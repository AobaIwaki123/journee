"use client";

import React from "react";
import { Calendar, MessageCircle, Sparkles, ArrowRight } from "lucide-react";

export const EmptyItinerary: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="relative mb-6 hidden lg:block">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <Calendar className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 shadow-md animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-800 mb-3 hidden lg:block">
          旅のしおりをプレビュー
        </h3>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed mb-8">
          AIチャットで旅行計画を作成すると、
          <br />
          こちらにリアルタイムでしおりが表示されます
        </p>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 text-left bg-white rounded-lg p-4 shadow-sm">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">
                行き先を伝える
              </h4>
              <p className="text-sm text-gray-600">
                「〇〇に旅行したい」とチャットで伝えましょう
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left bg-white rounded-lg p-4 shadow-sm">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">詳細を追加</h4>
              <p className="text-sm text-gray-600">
                期間、予算、興味のあることをAIに伝えます
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left bg-white rounded-lg p-4 shadow-sm">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">
                しおりが完成！
              </h4>
              <p className="text-sm text-gray-600">
                AIが自動で美しい旅のしおりを作成します
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
