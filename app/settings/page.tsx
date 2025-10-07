'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Settings, Globe, Brain, Volume2, User, ChevronRight, ArrowLeft } from 'lucide-react';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { AISettings } from '@/components/settings/AISettings';
import { SoundSettings } from '@/components/settings/SoundSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useStore } from '@/lib/store/useStore';
import type { SettingsSection } from '@/types/settings';

/**
 * 設定ページ
 * Phase 5.4.3 - 設定ページ実装
 */
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const initializeFromStorage = useStore((state) => state.initializeFromStorage);
  const [selectedSection, setSelectedSection] = useState<SettingsSection>('general');

  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // LocalStorageから設定を読み込み
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const sections = [
    {
      id: 'general' as SettingsSection,
      name: '一般',
      icon: Globe,
      description: '言語・タイムゾーン・通貨',
    },
    {
      id: 'ai' as SettingsSection,
      name: 'AI',
      icon: Brain,
      description: 'AIモデル・APIキー',
    },
    {
      id: 'sound' as SettingsSection,
      name: '効果音',
      icon: Volume2,
      description: '音量・効果音設定',
    },
    {
      id: 'account' as SettingsSection,
      name: 'アカウント',
      icon: User,
      description: 'ユーザー情報・ログアウト',
    },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case 'general':
        return <GeneralSettings />;
      case 'ai':
        return <AISettings />;
      case 'sound':
        return <SoundSettings />;
      case 'account':
        return <AccountSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">設定</h1>
                <p className="text-sm text-gray-600 mt-1">
                  アプリケーションの設定を管理します
                </p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>戻る</span>
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* サイドバー（デスクトップ） */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = selectedSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-4 transition-colors text-left border-b border-gray-100 last:border-b-0 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                        {section.name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {section.description}
                      </p>
                    </div>
                    {isActive && <ChevronRight className="w-5 h-5 text-blue-500" />}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* タブ切り替え（モバイル） */}
          <div className="lg:hidden">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = selectedSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`flex flex-col items-center justify-center py-4 transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                        {section.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <main className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}