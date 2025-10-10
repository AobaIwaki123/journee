/**
 * Phase 9.1: EmptyState - 共通空状態表示コンポーネント
 * 
 * 空状態のUIを統一
 */

'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 md:p-12 text-center ${className}`}>
      {icon && (
        <div className="mb-4 flex justify-center text-gray-400">
          {icon}
        </div>
      )}
      <p className="text-gray-600 text-base md:text-lg font-medium mb-2">
        {title}
      </p>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </div>
  );
};
