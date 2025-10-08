/**
 * フィードバックモーダルコンポーネント
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Bug, Lightbulb, Palette, Zap, FileText, MoreHorizontal, Send, CheckCircle, AlertCircle } from 'lucide-react';
import type { FeedbackCategory, FeedbackInput } from '@/types/feedback';
import { CATEGORY_METADATA } from '@/types/feedback';
import { useSession } from 'next-auth/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const CATEGORY_ICONS = {
  bug: Bug,
  feature: Lightbulb,
  'ui-ux': Palette,
  performance: Zap,
  content: FileText,
  other: MoreHorizontal
} as const;

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { data: session } = useSession();
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [issueUrl, setIssueUrl] = useState('');
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  // バリデーションエラー
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    email?: string;
  }>({});

  // モーダルが開いたときに前回の入力を復元（オプション）
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('feedback-draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setCategory(parsed.category || 'bug');
          setTitle(parsed.title || '');
          setDescription(parsed.description || '');
          setEmail(parsed.email || '');
        } catch (error) {
          console.error('Failed to restore draft:', error);
        }
      }
    }
  }, [isOpen]);

  // ドラフト保存
  useEffect(() => {
    if (isOpen && (title || description)) {
      const draft = { category, title, description, email };
      localStorage.setItem('feedback-draft', JSON.stringify(draft));
    }
  }, [isOpen, category, title, description, email]);

  // フォームリセット
  const resetForm = () => {
    setCategory('bug');
    setTitle('');
    setDescription('');
    setEmail('');
    setErrors({});
    setSubmitState('idle');
    setErrorMessage('');
    setIssueUrl('');
    localStorage.removeItem('feedback-draft');
  };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (title.length < 5) {
      newErrors.title = 'タイトルは5文字以上必要です';
    } else if (title.length > 200) {
      newErrors.title = 'タイトルは200文字以内にしてください';
    }

    if (description.length < 10) {
      newErrors.description = '説明は10文字以上必要です';
    } else if (description.length > 5000) {
      newErrors.description = '説明は5000文字以内にしてください';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitState('submitting');
    setErrorMessage('');

    try {
      // コンテキスト情報を収集
      const context = {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: session?.user?.id,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };

      const feedback: FeedbackInput = {
        category,
        title,
        description,
        email: email || undefined,
        context
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'フィードバックの送信に失敗しました');
      }

      setSubmitState('success');
      setIssueUrl(data.issueUrl);
      setRemainingRequests(data.remaining);

      // 3秒後に自動的に閉じる
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Feedback submission error:', error);
      setSubmitState('error');
      setErrorMessage(error instanceof Error ? error.message : '送信中にエラーが発生しました');
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (submitState === 'submitting') {
      return; // 送信中は閉じられない
    }
    resetForm();
    onClose();
  };

  // Escapeキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && submitState !== 'submitting') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, submitState]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-900">フィードバックを送信</h2>
          <button
            onClick={handleClose}
            disabled={submitState === 'submitting'}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="閉じる"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 成功画面 */}
        {submitState === 'success' && (
          <div className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              フィードバックを送信しました！
            </h3>
            <p className="text-gray-600 mb-4">
              貴重なご意見ありがとうございます。
            </p>
            {issueUrl && (
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-4"
              >
                GitHub Issueを確認 →
              </a>
            )}
            {remainingRequests !== null && (
              <p className="mt-4 text-sm text-gray-500">
                残り送信可能回数: {remainingRequests} / 1時間
              </p>
            )}
          </div>
        )}

        {/* エラー画面 */}
        {submitState === 'error' && (
          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
              送信に失敗しました
            </h3>
            <p className="text-gray-600 text-center mb-6">
              {errorMessage}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setSubmitState('idle')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* フォーム */}
        {(submitState === 'idle' || submitState === 'submitting') && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* カテゴリ選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(CATEGORY_METADATA) as FeedbackCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  const meta = CATEGORY_METADATA[cat];
                  const isSelected = category === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? meta.color : 'text-gray-400'}`} />
                      <div className="text-sm font-medium text-gray-900">{meta.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{meta.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* タイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: ログインボタンが反応しない"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitState === 'submitting'}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {title.length} / 200文字
              </p>
            </div>

            {/* 説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                詳細説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="できるだけ詳しく教えてください。&#10;&#10;- どんな操作をしましたか？&#10;- 何が起きましたか？&#10;- どうなることを期待していましたか？"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitState === 'submitting'}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {description.length} / 5000文字
              </p>
            </div>

            {/* メールアドレス（オプション） */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス（オプション）
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={submitState === 'submitting'}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                進捗状況をお知らせすることがあります
              </p>
            </div>

            {/* プライバシー通知 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>プライバシーについて:</strong> 送信された情報はGitHub Issueとして公開されます。
                個人を特定できる情報（氏名、住所など）は含めないでください。
              </p>
            </div>

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitState === 'submitting'}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitState === 'submitting' || !title || !description}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitState === 'submitting' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    送信する
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
