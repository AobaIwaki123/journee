'use client';

import React from 'react';
import { Plane } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 rounded-lg p-2">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Journee</h1>
            <p className="text-xs text-gray-500">AI旅のしおり作成</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-sm text-gray-600 hover:text-gray-800">
            ログイン
          </button>
          <span className="text-gray-300">|</span>
          <button className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            はじめる
          </button>
        </div>
      </div>
    </header>
  );
};
