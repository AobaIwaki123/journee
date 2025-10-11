'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAIStore } from '@/lib/store/ai';
import { validateApiKeyFormat, maskApiKey } from '@/lib/utils/encryption';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Phase 10.1: APIキーモーダル（useAIStore使用）
 */
export const APIKeyModal: React.FC<APIKeyModalProps> = ({ isOpen, onClose }) => {
  const { claudeApiKey, setClaudeApiKey, removeClaudeApiKey } = useAIStore();

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && claudeApiKey) {
      setApiKey(claudeApiKey);
    }
  }, [isOpen, claudeApiKey]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setErrorMessage('APIキーを入力してください');
      setValidationStatus('error');
      return;
    }

    if (!validateApiKeyFormat(apiKey)) {
      setErrorMessage('APIキーの形式が正しくありません（最低20文字必要）');
      setValidationStatus('error');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setErrorMessage('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setClaudeApiKey(apiKey);
      setValidationStatus('success');
      
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1000);
    } catch (error) {
      setErrorMessage('APIキーの保存に失敗しました');
      setValidationStatus('error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    if (confirm('Claude APIキーを削除してもよろしいですか？\nGemini APIに切り替わります。')) {
      removeClaudeApiKey();
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setApiKey('');
    setShowKey(false);
    setValidationStatus('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              Claude APIキー設定
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Claude APIを使用するには、Anthropic社のAPIキーが必要です。
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 underline hover:text-blue-600"
              >
                こちら
              </a>
              からAPIキーを取得できます。
            </p>
          </div>

          {claudeApiKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-800">
                  登録済み: {maskApiKey(claudeApiKey)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              APIキー
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setValidationStatus('idle');
                  setErrorMessage('');
                }}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {validationStatus === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {validationStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800">APIキーを保存しました</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ APIキーはブラウザのLocalStorageに暗号化して保存されます。
              共有PCでは使用後に必ず削除してください。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div>
            {claudeApiKey && (
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                APIキーを削除
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isValidating || !apiKey.trim()}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isValidating ? '検証中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
