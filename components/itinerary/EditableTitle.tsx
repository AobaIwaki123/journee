'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Edit2, Check, X } from 'lucide-react';

interface EditableTitleProps {
  value: string;
  className?: string;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({ value, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const updateItineraryTitle = useStore((state: any) => state.updateItineraryTitle);
  const addToast = useStore((state: any) => state.addToast);

  // 編集モードに入ったときにフォーカス
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // propsのvalueが変更されたらeditValueを更新
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    
    if (!trimmedValue) {
      addToast('タイトルを入力してください', 'error');
      return;
    }

    if (trimmedValue.length > 100) {
      addToast('タイトルは100文字以内で入力してください', 'error');
      return;
    }

    updateItineraryTitle(trimmedValue);
    setIsEditing(false);
    addToast('タイトルを更新しました', 'success');
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
          className={`${className} bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-lg px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:border-white transition-colors`}
          placeholder="旅のタイトルを入力"
        />
        <button
          onClick={handleSave}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          title="保存"
        >
          <Check className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={handleCancel}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          title="キャンセル"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3">
      <h1 className={className}>{value}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/10 hover:bg-white/20 rounded-lg"
        title="タイトルを編集"
      >
        <Edit2 className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};