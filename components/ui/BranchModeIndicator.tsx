"use client";

import React from "react";
import { Wrench } from "lucide-react";
import { isMockAuthEnabled } from "@/lib/utils/env";

export const BranchModeIndicator: React.FC = () => {
  // NEXT_PUBLIC_ENABLE_MOCK_AUTH=trueの時だけ表示
  if (!isMockAuthEnabled()) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center space-x-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-full shadow-md">
      <Wrench className="w-4 h-4 text-amber-700" />
      <span className="text-xs font-medium text-amber-800">開発モード</span>
    </div>
  );
};
