'use client';

import React, { useCallback, useEffect, useState } from 'react';

type SupportState = 'checking' | 'supported' | 'unsupported';
type SwState = 'idle' | 'registering' | 'ready' | 'error';

const NotificationDemoPage: React.FC = () => {
  const [supportState, setSupportState] = useState<SupportState>('checking');
  const [swState, setSwState] = useState<SwState>('idle');
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || typeof Notification === 'undefined') {
      setSupportState('unsupported');
      setMessage('このブラウザではプッシュ通知を利用できません。');
      return;
    }

    setSupportState('supported');
    setSwState('registering');

    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration();
        if (existing) {
          setRegistration(existing);
          setSwState('ready');
          return;
        }

        await navigator.serviceWorker.register('/sw.js');
        const ready = await navigator.serviceWorker.ready;
        setRegistration(ready);
        setSwState('ready');
      } catch (error) {
        setSwState('error');
        setMessage(error instanceof Error ? error.message : 'Service Worker登録に失敗しました');
      }
    };

    register();
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const sendTestNotification = useCallback(async () => {
    if (!registration) {
      setMessage('Service Workerが準備できていません');
      return;
    }

    if (permission !== 'granted') {
      setMessage('通知権限を許可してください');
      return;
    }

    try {
      await registration.showNotification('Journee push test', {
        body: 'Service Worker経由のテスト通知です。',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'journee-push-test',
      });
      setMessage('テスト通知を送信しました');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '通知送信に失敗しました');
    }
  }, [registration, permission]);

  const supportLabel =
    supportState === 'checking'
      ? '確認中'
      : supportState === 'supported'
        ? 'サポートされています'
        : '未対応のブラウザです';

  const swLabel =
    swState === 'registering'
      ? '登録中'
      : swState === 'ready'
        ? '準備完了'
        : swState === 'error'
          ? 'エラー'
          : '未開始';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900">プッシュ通知テスト</h1>
          <p className="text-gray-600 mt-2">
            PWA環境での通知権限付与とService Worker経由の通知表示を確認します。
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">ブラウザ対応状況</p>
              <p className="text-base font-semibold text-gray-800">{supportLabel}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">Service Worker</p>
              <p className="text-base font-semibold text-gray-800">{swLabel}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">通知権限</p>
              <p className="text-base font-semibold text-gray-800">{permission}</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-500">メッセージ</p>
              <p className="text-base font-semibold text-gray-800 break-words">
                {message || '—'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={requestPermission}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={permission === 'granted' || supportState !== 'supported'}
            >
              通知を許可する
            </button>
            <button
              type="button"
              onClick={sendTestNotification}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50"
              disabled={permission !== 'granted' || !registration || swState !== 'ready'}
            >
              テスト通知を送信
            </button>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">使い方</h2>
            <ol className="mt-3 list-decimal list-inside space-y-2 text-gray-700">
              <li>このページにアクセスするとService Workerを登録します。</li>
              <li>「通知を許可する」を押して権限を付与します（ブラウザのダイアログが表示されます）。</li>
              <li>「テスト通知を送信」を押して通知が表示されることを確認します。</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemoPage;
