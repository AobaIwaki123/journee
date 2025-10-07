"use client";

import React from "react";
import Link from "next/link";
import { Plus, List, Settings } from "lucide-react";

/**
 * クイックアクションコンポーネント
 * 新規作成、しおり一覧、設定へのナビゲーション
 */
export const QuickActions: React.FC = () => {
  const actions = [
    {
      title: "新しいしおりを作成",
      description: "AIと一緒に新しい旅のしおりを作成",
      href: "/",
      icon: Plus,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "しおり一覧",
      description: "これまで作成したしおりを確認",
      href: "/itineraries",
      icon: List,
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
    {
      title: "設定",
      description: "アカウントとアプリの設定を管理",
      href: "/settings",
      icon: Settings,
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        クイックアクション
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`
                bg-gradient-to-br ${action.color} ${action.hoverColor}
                rounded-lg p-6 text-white
                transform transition-all duration-200
                hover:scale-105 hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              `}
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-white bg-opacity-20 rounded-full p-3 mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-base mb-1">{action.title}</h4>
                <p className="text-sm text-white text-opacity-90">
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
