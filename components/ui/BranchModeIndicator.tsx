'use client';

import React from 'react';
import { GitBranch } from 'lucide-react';

export const BranchModeIndicator: React.FC = () => {
  // ビルド時に環境変数から取得
  const branchName = process.env.NEXT_PUBLIC_GIT_BRANCH;
  
  // mainブランチまたはブランチ情報がない場合は表示しない
  if (!branchName || branchName === 'main' || branchName === 'master') {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center space-x-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-full shadow-md">
      <GitBranch className="w-4 h-4 text-amber-700" />
      <span className="text-xs font-medium text-amber-800">
        {branchName}
      </span>
    </div>
  );
};
