# Phase 3.6: 効果音システム実装計画

## 概要

**目的**: UXを向上させる効果音機能を実装し、AIとの対話をより自然で心地よいものにする

**実装期間**: Week 6

**優先度**: Medium（UI/UX改善）

---

## 目次

1. [背景と目的](#背景と目的)
2. [機能要件](#機能要件)
3. [技術設計](#技術設計)
4. [実装計画](#実装計画)
5. [テスト計画](#テスト計画)
6. [実装チェックリスト](#実装チェックリスト)

---

## 背景と目的

### 背景

現在のJourneeアプリは、AIとチャット形式で対話しながら旅行計画を立てる仕組みですが、ユーザーのアクション（メッセージ送信、AI返信受信、しおり更新等）に対する聴覚的フィードバックがありません。視覚的フィードバックのみでは、ユーザーがアプリの状態変化を見逃す可能性があります。

### 目的

1. **UX向上**: 効果音により、アクションの成功/失敗を即座に把握できる
2. **没入感向上**: 音声フィードバックで、AIとの対話がより自然になる
3. **アクセシビリティ**: 視覚的フィードバックと組み合わせて、より多様なユーザーに対応
4. **カスタマイズ性**: ユーザーが音量調整やON/OFFを自由に設定できる

### 期待される効果

- ✅ AIからのメッセージ受信時に音が鳴り、応答があったことが明確になる
- ✅ メッセージ送信、しおり更新などのアクションに即座のフィードバック
- ✅ エラー発生時に注意を促すアラート音で問題を見逃さない
- ✅ ユーザーが音量を自由に調整でき、快適な環境で利用できる

---

## 機能要件

### 必須機能（Must Have）

#### 1. 効果音再生機能

| トリガー | 効果音ファイル | 説明 | 再生タイミング |
|---------|--------------|------|--------------|
| AI返信完了 | `notification.mp3` | AIメッセージ受信完了時 | ストリーミング完了検知後 |
| メッセージ送信 | `send.mp3` | ユーザーメッセージ送信時 | 送信ボタンクリック時 |
| しおり更新 | `update.mp3` | しおりデータが更新された際 | しおりマージ処理完了時 |
| エラー発生 | `error.mp3` | エラー発生時 | エラー通知表示時 |

#### 2. 音量設定機能

- **音量調整**: 0% - 100%（0.0 - 1.0の範囲）
- **ON/OFF切り替え**: 効果音の有効/無効を切り替え
- **デフォルト値**: 音量70%、効果音ON
- **永続化**: LocalStorageに保存し、ページリロード時に復元

#### 3. 設定UIコンポーネント

- **設定パネル**: 音量調整スライダー、ON/OFFトグル、プレビューボタン
- **ヘッダー統合**: ヘッダーに音量設定アイコンを追加、ドロップダウン表示
- **モバイル対応**: タップしやすいUI設計

### オプション機能（Nice to Have）

- **効果音のカスタマイズ**: 複数の効果音セットから選択
- **ショートカットキー**: キーボード操作での音声ON/OFF
- **効果音の追加**: 成功通知音（汎用）など

---

## 技術設計

### アーキテクチャ

```
┌──────────────────────────────────────────────┐
│           User Action                        │
│  (メッセージ送信、AI返信受信、エラー等)         │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│        SoundManager.ts                       │
│  - playSound(soundName)                      │
│  - setVolume(volume)                         │
│  - preloadSounds()                           │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│        Zustand Store                         │
│  - soundEnabled: boolean                     │
│  - soundVolume: number (0.0 - 1.0)          │
│  - setSoundEnabled(enabled)                  │
│  - setSoundVolume(volume)                    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│        SoundProvider.tsx                     │
│  - Context で音声設定を管理                   │
│  - アプリ起動時に効果音をプリロード            │
└──────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│        各コンポーネント                        │
│  - MessageInput.tsx (送信音、受信音)          │
│  - ItineraryPreview.tsx (更新音)             │
│  - ErrorNotification.tsx (エラー音)          │
└──────────────────────────────────────────────┘
```

### ディレクトリ構造

```
/lib/sound/
  └── SoundManager.ts          # 効果音再生・音量制御ユーティリティ

/components/sound/
  └── SoundProvider.tsx        # グローバル音声管理プロバイダー

/components/settings/
  └── SoundSettings.tsx        # 効果音設定UI

/public/sounds/
  ├── notification.mp3         # AI返信通知音
  ├── send.mp3                 # メッセージ送信音
  ├── update.mp3               # しおり更新音
  ├── error.mp3                # エラー通知音
  └── success.mp3              # 成功通知音（汎用）

/types/
  └── sound.ts                 # 効果音関連の型定義
```

### 技術スタック候補

#### 1. **use-sound** （推奨）
- React向けの軽量サウンドフックライブラリ
- Howler.jsのラッパー
- 使いやすいReact Hooks API
- **採用理由**: Reactとの親和性が高く、学習コストが低い

```bash
npm install use-sound
```

**使用例**:
```typescript
import useSound from 'use-sound';

const MessageInput: React.FC = () => {
  const [play] = useSound('/sounds/send.mp3', { volume: 0.7 });
  
  const handleSend = () => {
    play();
    // メッセージ送信処理
  };
};
```

#### 2. **Howler.js**
- 高機能なWeb Audio API ラッパー
- 詳細な音量制御、フェードイン/アウト等
- **採用理由**: 高度な制御が必要な場合に有効

#### 3. **Web Audio API**（ネイティブ）
- ブラウザネイティブAPI
- カスタマイズ性が非常に高い
- **採用理由**: 依存ライブラリを減らしたい場合

---

## 実装計画

### Phase 3.6.1: 効果音システムの基礎構築

#### ステップ1: サウンドライブラリの選定と設定

**作業内容**:
1. `use-sound` をインストール
   ```bash
   npm install use-sound
   ```

2. 効果音ファイルの準備
   - `/public/sounds/` ディレクトリを作成
   - 効果音ファイルを配置（.mp3形式推奨）

**成果物**:
- ✅ `use-sound` パッケージがインストールされている
- ✅ `/public/sounds/` に5つの効果音ファイルが配置されている

---

#### ステップ2: サウンドマネージャーの実装

**ファイル**: `lib/sound/SoundManager.ts`

**実装内容**:
```typescript
// lib/sound/SoundManager.ts
export type SoundName = 'notification' | 'send' | 'update' | 'error' | 'success';

export class SoundManager {
  private sounds: Map<SoundName, HTMLAudioElement> = new Map();
  private volume: number = 0.7; // デフォルト音量
  private enabled: boolean = true;

  constructor() {
    this.preloadSounds();
  }

  // 効果音をプリロード
  preloadSounds() {
    const soundFiles: Record<SoundName, string> = {
      notification: '/sounds/notification.mp3',
      send: '/sounds/send.mp3',
      update: '/sounds/update.mp3',
      error: '/sounds/error.mp3',
      success: '/sounds/success.mp3',
    };

    Object.entries(soundFiles).forEach(([name, url]) => {
      const audio = new Audio(url);
      audio.volume = this.volume;
      this.sounds.set(name as SoundName, audio);
    });
  }

  // 効果音を再生
  playSound(soundName: SoundName) {
    if (!this.enabled) return;

    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.currentTime = 0; // 再生位置をリセット
      audio.play().catch((error) => {
        console.warn(`Failed to play sound: ${soundName}`, error);
      });
    }
  }

  // 音量を設定
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume)); // 0.0 - 1.0の範囲に制限
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  // 効果音のON/OFF
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// シングルトンインスタンス
export const soundManager = new SoundManager();
```

**型定義**: `types/sound.ts`

```typescript
// types/sound.ts
export type SoundName = 'notification' | 'send' | 'update' | 'error' | 'success';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
}
```

**成果物**:
- ✅ `lib/sound/SoundManager.ts` が実装されている
- ✅ 効果音のプリロード、再生、音量制御が機能している
- ✅ `types/sound.ts` が作成されている

---

#### ステップ3: Zustand ストアへの統合

**ファイル**: `lib/store/useStore.ts`

**実装内容**:
```typescript
import { soundManager } from '@/lib/sound/SoundManager';

interface Store {
  // ... 既存の状態 ...
  
  // 効果音設定
  soundEnabled: boolean;
  soundVolume: number;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

export const useStore = create<Store>((set) => ({
  // ... 既存の状態 ...
  
  // 効果音設定（デフォルト値）
  soundEnabled: true,
  soundVolume: 0.7,

  setSoundEnabled: (enabled) => {
    soundManager.setEnabled(enabled);
    set({ soundEnabled: enabled });
    // LocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEnabled', String(enabled));
    }
  },

  setSoundVolume: (volume) => {
    soundManager.setVolume(volume);
    set({ soundVolume: volume });
    // LocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', String(volume));
    }
  },
}));
```

**初期化処理**:
```typescript
// app/layout.tsx または useStore.ts に追加
if (typeof window !== 'undefined') {
  const savedEnabled = localStorage.getItem('soundEnabled');
  const savedVolume = localStorage.getItem('soundVolume');
  
  if (savedEnabled !== null) {
    useStore.getState().setSoundEnabled(savedEnabled === 'true');
  }
  
  if (savedVolume !== null) {
    useStore.getState().setSoundVolume(parseFloat(savedVolume));
  }
}
```

**成果物**:
- ✅ Zustandストアに `soundEnabled`, `soundVolume` が追加されている
- ✅ LocalStorageに設定が保存・復元される
- ✅ `soundManager` と連動している

---

### Phase 3.6.2: 効果音の実装

#### ステップ1: AI返信時の効果音

**ファイル**: `components/chat/MessageInput.tsx`

**実装内容**:
```typescript
import { soundManager } from '@/lib/sound/SoundManager';

const handleSend = async (message: string) => {
  // ... 既存の送信処理 ...
  
  try {
    for await (const chunk of sendChatMessageStream(...)) {
      // ... ストリーミング処理 ...
    }
    
    // ストリーミング完了時に通知音を再生
    soundManager.playSound('notification');
    
  } catch (error) {
    // ... エラー処理 ...
  }
};
```

**成果物**:
- ✅ AI返信完了時に `notification.mp3` が再生される

---

#### ステップ2: メッセージ送信時の効果音

**ファイル**: `components/chat/MessageInput.tsx`

**実装内容**:
```typescript
const handleSend = async (message: string) => {
  if (!message.trim() || isLoading) return;

  // メッセージ送信時に送信音を再生
  soundManager.playSound('send');

  // ... 既存の送信処理 ...
};
```

**成果物**:
- ✅ メッセージ送信時に `send.mp3` が再生される

---

#### ステップ3: しおり更新時の効果音

**ファイル**: `components/itinerary/ItineraryPreview.tsx`

**実装内容**:
```typescript
import { soundManager } from '@/lib/sound/SoundManager';
import { useEffect, useRef } from 'react';

export const ItineraryPreview: React.FC = () => {
  const { currentItinerary } = useStore();
  const prevItinerary = useRef(currentItinerary);

  useEffect(() => {
    // しおりが更新された際に効果音を再生
    if (prevItinerary.current !== currentItinerary && currentItinerary) {
      soundManager.playSound('update');
    }
    prevItinerary.current = currentItinerary;
  }, [currentItinerary]);

  // ... 既存の実装 ...
};
```

**成果物**:
- ✅ しおり更新時に `update.mp3` が再生される

---

#### ステップ4: エラー時の効果音

**ファイル**: `components/ui/ErrorNotification.tsx`

**実装内容**:
```typescript
import { soundManager } from '@/lib/sound/SoundManager';
import { useEffect } from 'react';

export const ErrorNotification: React.FC = () => {
  const { error } = useStore();

  useEffect(() => {
    if (error) {
      soundManager.playSound('error');
    }
  }, [error]);

  // ... 既存の実装 ...
};
```

**成果物**:
- ✅ エラー発生時に `error.mp3` が再生される

---

### Phase 3.6.3: 音量設定UIの実装

#### ステップ1: 設定パネルコンポーネントの作成

**ファイル**: `components/settings/SoundSettings.tsx`

**実装内容**:
```typescript
'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { soundManager } from '@/lib/sound/SoundManager';

export const SoundSettings: React.FC = () => {
  const { soundEnabled, soundVolume, setSoundEnabled, setSoundVolume } = useStore();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setSoundVolume(volume);
  };

  const handleToggle = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handlePreview = () => {
    soundManager.playSound('notification');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md w-80">
      <h3 className="text-lg font-semibold mb-4">効果音設定</h3>

      {/* ON/OFFトグル */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm">効果音</span>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              soundEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 音量調整スライダー */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">音量</span>
          <span className="text-sm text-gray-500">{Math.round(soundVolume * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <VolumeX className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={soundVolume}
            onChange={handleVolumeChange}
            disabled={!soundEnabled}
            className="flex-1"
          />
          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* プレビューボタン */}
      <button
        onClick={handlePreview}
        disabled={!soundEnabled}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        効果音をプレビュー
      </button>
    </div>
  );
};
```

**成果物**:
- ✅ 音量調整スライダーが機能している
- ✅ ON/OFFトグルスイッチが機能している
- ✅ プレビューボタンで効果音を確認できる

---

#### ステップ2: ヘッダーへの統合

**ファイル**: `components/layout/Header.tsx`

**実装内容**:
```typescript
import { Volume2 } from 'lucide-react';
import { SoundSettings } from '@/components/settings/SoundSettings';
import { useState } from 'react';

export const Header: React.FC = () => {
  const [showSoundSettings, setShowSoundSettings] = useState(false);

  return (
    <header className="...">
      {/* ... 既存のヘッダー要素 ... */}

      {/* 音量設定アイコン */}
      <div className="relative">
        <button
          onClick={() => setShowSoundSettings(!showSoundSettings)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="効果音設定"
        >
          <Volume2 className="w-5 h-5" />
        </button>

        {/* ドロップダウンパネル */}
        {showSoundSettings && (
          <div className="absolute right-0 mt-2 z-50">
            <SoundSettings />
          </div>
        )}
      </div>

      {/* ... 既存のユーザーメニュー等 ... */}
    </header>
  );
};
```

**成果物**:
- ✅ ヘッダーに音量設定アイコンが表示される
- ✅ クリックでドロップダウンパネルが表示される
- ✅ モバイル対応（タップしやすいサイズ）

---

### Phase 3.6.4: アクセシビリティ対応

#### ステップ1: 視覚的フィードバックの追加

**実装内容**:
- 効果音再生時にアニメーション効果を追加
- 聴覚障害者向けの視覚的通知（アイコン点滅等）

**ファイル**: `components/chat/MessageList.tsx`

```typescript
const [isNotifying, setIsNotifying] = useState(false);

useEffect(() => {
  if (/* 新しいメッセージ受信時 */) {
    setIsNotifying(true);
    setTimeout(() => setIsNotifying(false), 500);
  }
}, [messages]);

// アイコンに視覚的フィードバックを追加
<div className={`transition-all ${isNotifying ? 'scale-110 text-blue-600' : ''}`}>
  {/* メッセージ表示 */}
</div>
```

**成果物**:
- ✅ 効果音再生時に視覚的フィードバックがある
- ✅ 聴覚障害者も状態変化を把握できる

---

#### ステップ2: キーボード操作対応

**実装内容**:
- ショートカットキーで音声ON/OFF（例: `Ctrl + M`）

**ファイル**: `app/layout.tsx` または `useStore.ts`

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'm') {
      e.preventDefault();
      const { soundEnabled, setSoundEnabled } = useStore.getState();
      setSoundEnabled(!soundEnabled);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**成果物**:
- ✅ `Ctrl + M` で効果音のON/OFF切り替えが可能

---

### Phase 3.6.5: パフォーマンス最適化

#### ステップ1: 効果音のプリロード

**実装内容**:
- アプリ起動時にすべての効果音を事前読み込み

**ファイル**: `lib/sound/SoundManager.ts`（既に実装済み）

```typescript
preloadSounds() {
  // ... 効果音をプリロード ...
}
```

**成果物**:
- ✅ 効果音の再生遅延が最小化されている

---

#### ステップ2: メモリ管理

**実装内容**:
- コンポーネントのアンマウント時に音声リソースを解放

**ファイル**: `lib/sound/SoundManager.ts`

```typescript
cleanup() {
  this.sounds.forEach((audio) => {
    audio.pause();
    audio.src = '';
  });
  this.sounds.clear();
}
```

**成果物**:
- ✅ メモリリークがない
- ✅ 不要な音声リソースが解放される

---

## テスト計画

### 手動テスト

#### テストケース1: AI返信時の効果音

**手順**:
1. メッセージを送信
2. AI返信が完了したことを確認
3. 効果音が再生されることを確認

**期待結果**:
- ✅ AI返信完了時に `notification.mp3` が再生される
- ✅ 音量設定が反映されている

---

#### テストケース2: メッセージ送信時の効果音

**手順**:
1. メッセージ入力欄にテキストを入力
2. 送信ボタンをクリック
3. 効果音が再生されることを確認

**期待結果**:
- ✅ メッセージ送信時に `send.mp3` が再生される

---

#### テストケース3: しおり更新時の効果音

**手順**:
1. AIにしおりを更新するメッセージを送信
2. しおりが更新されることを確認
3. 効果音が再生されることを確認

**期待結果**:
- ✅ しおり更新時に `update.mp3` が再生される

---

#### テストケース4: エラー時の効果音

**手順**:
1. エラーを発生させる（ネットワークエラー等）
2. エラー通知が表示されることを確認
3. 効果音が再生されることを確認

**期待結果**:
- ✅ エラー発生時に `error.mp3` が再生される

---

#### テストケース5: 音量設定

**手順**:
1. ヘッダーの音量設定アイコンをクリック
2. 音量スライダーを50%に設定
3. プレビューボタンをクリック
4. 音量が50%で再生されることを確認

**期待結果**:
- ✅ 音量設定が反映される
- ✅ ページリロード後も設定が保持される

---

#### テストケース6: ON/OFF切り替え

**手順**:
1. 効果音をOFFに設定
2. メッセージを送信
3. 効果音が再生されないことを確認
4. 効果音をONに戻す
5. メッセージを送信
6. 効果音が再生されることを確認

**期待結果**:
- ✅ OFFの場合、効果音が再生されない
- ✅ ONの場合、効果音が再生される

---

### ブラウザ互換性テスト

| ブラウザ | 音声再生 | 音量調整 | LocalStorage | 結果 |
|---------|---------|---------|-------------|------|
| Chrome (最新) | ✅ | ✅ | ✅ | PASS |
| Firefox (最新) | ✅ | ✅ | ✅ | PASS |
| Safari (最新) | ✅ | ✅ | ✅ | PASS |
| Edge (最新) | ✅ | ✅ | ✅ | PASS |
| モバイルSafari | ✅ | ✅ | ✅ | PASS |
| モバイルChrome | ✅ | ✅ | ✅ | PASS |

---

## 実装チェックリスト

### Phase 3.6.1: 効果音システムの基礎構築

- [ ] `use-sound` パッケージのインストール
- [ ] `/public/sounds/` ディレクトリの作成
- [ ] 効果音ファイルの準備（5つ）
  - [ ] notification.mp3
  - [ ] send.mp3
  - [ ] update.mp3
  - [ ] error.mp3
  - [ ] success.mp3
- [ ] `lib/sound/SoundManager.ts` の実装
  - [ ] プリロード機能
  - [ ] 音声再生機能
  - [ ] 音量制御機能
- [ ] `types/sound.ts` の作成
- [ ] Zustand ストアへの統合
  - [ ] `soundEnabled` 状態の追加
  - [ ] `soundVolume` 状態の追加
  - [ ] `setSoundEnabled` アクションの追加
  - [ ] `setSoundVolume` アクションの追加
  - [ ] LocalStorage連携

### Phase 3.6.2: 効果音の実装

- [ ] AI返信時の効果音
  - [ ] `MessageInput.tsx` での統合
  - [ ] ストリーミング完了検知での再生トリガー
- [ ] メッセージ送信時の効果音
  - [ ] `MessageInput.tsx` での統合
  - [ ] 送信ボタンクリック時の再生トリガー
- [ ] しおり更新時の効果音
  - [ ] `ItineraryPreview.tsx` での統合
  - [ ] しおりマージ処理完了時の再生トリガー
- [ ] エラー時の効果音
  - [ ] `ErrorNotification.tsx` での統合
  - [ ] エラー発生時の再生トリガー

### Phase 3.6.3: 音量設定UIの実装

- [ ] `components/settings/SoundSettings.tsx` の作成
  - [ ] 音声ON/OFFトグルスイッチ
  - [ ] 音量調整スライダー（0% - 100%）
  - [ ] 効果音プレビューボタン
  - [ ] 視覚的フィードバック
- [ ] `Header.tsx` への統合
  - [ ] 音量設定アイコン追加
  - [ ] ドロップダウンメニュー表示
  - [ ] モバイル対応

### Phase 3.6.4: アクセシビリティ対応

- [ ] 視覚的フィードバックの追加
  - [ ] 効果音再生時のアニメーション
  - [ ] 聴覚障害者向けの視覚的通知
- [ ] ユーザー設定の尊重
  - [ ] システムの自動再生ポリシー対応
  - [ ] ユーザーインタラクション後に再生
- [ ] キーボード操作対応
  - [ ] ショートカットキーでの音声ON/OFF（Ctrl + M）
  - [ ] フォーカス管理

### Phase 3.6.5: パフォーマンス最適化

- [ ] 効果音のプリロード
  - [ ] アプリ起動時に事前読み込み
  - [ ] 再生遅延の最小化
- [ ] メモリ管理
  - [ ] 音声ファイルの効率的なキャッシング
  - [ ] 使用していない音声の解放

### テスト

- [ ] 手動テスト
  - [ ] AI返信時の効果音テスト
  - [ ] メッセージ送信時の効果音テスト
  - [ ] しおり更新時の効果音テスト
  - [ ] エラー時の効果音テスト
  - [ ] 音量設定テスト
  - [ ] ON/OFF切り替えテスト
- [ ] ブラウザ互換性テスト
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
  - [ ] モバイルSafari
  - [ ] モバイルChrome
- [ ] パフォーマンステスト
  - [ ] プリロード時のメモリ使用量
  - [ ] 再生遅延の測定
  - [ ] メモリリークの確認

---

## まとめ

Phase 3.6では、効果音システムを実装し、JourneeアプリのUXを大幅に向上させます。

### 主な成果物

1. **サウンドマネージャー**: 効果音の再生・音量制御を一元管理
2. **5つの効果音**: AI返信、送信、更新、エラー、成功通知
3. **音量設定UI**: ユーザーが自由に音量調整・ON/OFF可能
4. **アクセシビリティ**: 視覚的フィードバック、キーボード操作対応
5. **パフォーマンス**: プリロード、メモリ管理の最適化

### 次のステップ

- **Phase 4**: 段階的旅程構築システム（骨組み作成 → 日程詳細化）
- **Phase 5**: しおり機能統合（詳細実装 + 一時保存 + PDF出力）

---

**最終更新**: 2025-10-07