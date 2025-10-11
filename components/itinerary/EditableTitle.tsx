'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/lib/store/ui';
import { useItineraryEditor } from '@/lib/hooks/itinerary';
import { Edit2, Check, X } from 'lucide-react';

interface EditableTitleProps {
  value: string;
  className?: string;
}

/**
 * Phase 10.3: インライン編集可能タイトル（useUIStore使用）
 */
export const EditableTitle: React.FC<EditableTitleProps> = ({ value, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { updateTitle } = useItineraryEditor();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (!editValue.trim()) {
      addToast('タイトルを入力してください', 'error');
      return;
    }

    updateTitle(editValue.trim());
    setIsEditing(false);
    addToast('タイトルを更新しました', 'success');
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-lg focus:outline-none text-lg md:text-2xl font-bold"
        />
        <button
          onClick={handleSave}
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="保存"
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="キャンセル"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className={className}>
        {value || '無題のしおり'}
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
        title="タイトルを編集"
      >
        <Edit2 className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
};
