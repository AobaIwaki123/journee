'use client';

import React, { useCallback, useEffect, useState } from 'react';

type SupportState = 'checking' | 'supported' | 'unsupported';
type SwState = 'idle' | 'registering' | 'ready' | 'error';

type SubscriptionState = {
  endpoint: string;
  raw: PushSubscription;
} | null;

const publicVapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;

const NotificationDemoPage: React.FC = () => {
  const [supportState, setSupportState] = useState<SupportState>('checking');
  const [swState, setSwState] = useState<SwState>('idle');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(null);
  const [message, setMessage] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingServer, setIsSendingServer] = useState(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }

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
        const activeReg = existing ?? (await navigator.serviceWorker.register('/sw.js'));
        const readyReg = activeReg ?? (await navigator.serviceWorker.ready);
        setRegistration(readyReg);
        const existingSub = await readyReg.pushManager.getSubscription();
        if (existingSub) {
          setSubscription({ endpoint: existingSub.endpoint, raw: existingSub });
        }
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

  const sendLocalNotification = useCallback(async () => {
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
      setMessage('ローカル通知を送信しました');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '通知送信に失敗しました');
    }
  }, [registration, permission]);

  const subscribePush = useCallback(async () => {
    if (!registration) {
      setMessage('Service Workerが準備できていません');
      return;
    }
    if (!publicVapidKey) {
      setMessage('VAPID公開鍵が設定されていません');
      return;
    }
    const perm = permission === 'default' ? await Notification.requestPermission() : permission;
    setPermission(perm);
    if (perm !== 'granted') {
      setMessage('通知権限を許可してください');
      return;
    }

    setIsSubscribing(true);
    try {
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        setSubscription({ endpoint: existing.endpoint, raw: existing });
        setMessage('既存の購読を再利用します');
        return;
      }

      const appServerKey = urlBase64ToUint8Array(publicVapidKey);
      const newSub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });
      setSubscription({ endpoint: newSub.endpoint, raw: newSub });
      setMessage('購読を作成しました');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '購読に失敗しました');
    } finally {
      setIsSubscribing(false);
    }
  }, [permission, registration, urlBase64ToUint8Array]);

  const sendServerPush = useCallback(async () => {
    if (!subscription) {
      setMessage('まず購読を作成してください');
      return;
    }
    setIsSendingServer(true);
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.raw.toJSON() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data?.error || 'サーバー通知の送信に失敗しました');
        return;
      }
      setMessage('サーバーから通知を送信しました');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'サーバー通知の送信に失敗しました');
    } finally {
      setIsSendingServer(false);
    }
  }, [subscription]);

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
            PWA環境でのローカル通知とWeb Push（サーバー送信）の双方を確認します。
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
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 md:col-span-2">
              <p className="text-sm text-gray-500">購読エンドポイント</p>
              <p className="text-xs text-gray-700 break-all">{subscription?.endpoint || '未購読'}</p>
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
              onClick={sendLocalNotification}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50"
              disabled={permission !== 'granted' || !registration || swState !== 'ready'}
            >
              ローカル通知を送信
            </button>
            <button
              type="button"
              onClick={subscribePush}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isSubscribing || swState !== 'ready'}
            >
              {isSubscribing ? '購読処理中...' : 'Web Pushを購読'}
            </button>
            <button
              type="button"
              onClick={sendServerPush}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              disabled={isSendingServer || !subscription}
            >
              {isSendingServer ? '送信中...' : 'サーバー通知を送信'}
            </button>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">使い方</h2>
            <ol className="mt-3 list-decimal list-inside space-y-2 text-gray-700">
              <li>このページにアクセスするとService Workerを登録します。</li>
              <li>「通知を許可する」を押して権限を付与します。</li>
              <li>「Web Pushを購読」で PushManager.subscribe を実行し購読を作成します。</li>
              <li>「ローカル通知を送信」でクライアント→SW経由の通知を確認します。</li>
              <li>「サーバー通知を送信」でサーバー→PushService→SW経由の通知を確認します。</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemoPage;
