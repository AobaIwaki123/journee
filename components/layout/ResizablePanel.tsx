'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store/useStore';

/**
 * ResizablePanel コンポーネント
 * 
 * ドラッグ可能なリサイザーバーを提供し、チャットとしおりのパネル幅を調整可能にします。
 * 
 * 機能:
 * - マウスドラッグによる幅調整
 * - タッチ操作対応（モバイル互換性）
 * - 最小幅・最大幅の制限（30-70%）
 * - ホバー・ドラッグ時のビジュアルフィードバック
 * - LocalStorageへの幅の永続化
 */
export const ResizablePanel: React.FC = () => {
  const { setChatPanelWidth } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 幅を計算してストアに保存
   */
  const handleResize = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;

      const container = containerRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((clientX - containerRect.left) / containerRect.width) * 100;

      // 30-70%の範囲に制限
      const clampedWidth = Math.max(30, Math.min(70, newWidth));
      setChatPanelWidth(clampedWidth);
    },
    [setChatPanelWidth]
  );

  /**
   * マウスダウン: ドラッグ開始
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * タッチスタート: ドラッグ開始（モバイル対応）
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  /**
   * グローバルマウスムーブ: ドラッグ中の処理
   */
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleResize(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleResize(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    // イベントリスナーを追加
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    // カーソルをドラッグ中に固定
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    // クリーンアップ
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleResize]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`
        relative w-1 bg-gray-200 cursor-col-resize
        transition-colors duration-200
        hover:bg-blue-400 hover:w-1.5
        active:bg-blue-500
        ${isDragging ? 'bg-blue-500 w-1.5' : ''}
        touch-none
        flex-shrink-0
      `}
      aria-label="パネルのサイズを調整"
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
    >
      {/* ホバー時のヒント（オプション） */}
      <div
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          bg-blue-500 text-white text-xs px-2 py-1 rounded
          opacity-0 hover:opacity-100 transition-opacity pointer-events-none
          whitespace-nowrap
          ${isDragging ? 'opacity-100' : ''}
        `}
      >
        ドラッグして幅を調整
      </div>
    </div>
  );
};

ResizablePanel.displayName = 'ResizablePanel';
