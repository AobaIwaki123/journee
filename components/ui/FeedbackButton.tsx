/**
 * フィードバックボタンコンポーネント
 */

'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  position?: 'header' | 'floating';
  className?: string;
}

export default function FeedbackButton({ 
  position = 'header',
  className = '' 
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (position === 'floating') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 group ${className}`}
          title="フィードバックを送信"
          aria-label="フィードバックを送信"
        >
          <MessageSquarePlus className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            フィードバック
          </span>
        </button>

        <FeedbackModal 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        aria-label="フィードバックを送信"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span>フィードバック</span>
      </button>

      <FeedbackModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
