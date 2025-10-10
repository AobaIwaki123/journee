/**
 * Phase 9.1: FormActions - 共通フォームアクションボタン
 * 
 * キャンセル・送信ボタンを統一
 */

'use client';

import React from 'react';

interface FormActionsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitType?: 'button' | 'submit';
}

export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  onSubmit,
  cancelLabel = 'キャンセル',
  submitLabel = '保存',
  submitDisabled = false,
  submitType = 'submit',
}) => {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        type={submitType}
        onClick={onSubmit}
        disabled={submitDisabled}
        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </div>
  );
};
