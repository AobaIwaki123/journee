"use client";

import React from "react";

export const GeminiFlashBanner: React.FC = () => {
  return (
    <div className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
      <span className="font-medium">✨ Gemini 2.5 Flashが追加されました (Proよりも高速)</span>
    </div>
  );
};
