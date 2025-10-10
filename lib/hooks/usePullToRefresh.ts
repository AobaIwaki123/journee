import { useEffect, useRef, useState, useCallback } from 'react';

export interface PullToRefreshOptions {
  /**
   * リフレッシュ処理を実行する関数
   */
  onRefresh: () => Promise<void>;
  
  /**
   * プルトゥリフレッシュを有効化する最小のY位置（デフォルト: 80px）
   */
  pullDownThreshold?: number;
  
  /**
   * プルトゥリフレッシュを無効化する（デフォルト: false）
   */
  disabled?: boolean;
  
  /**
   * 最大プルダウン距離（デフォルト: 150px）
   */
  maxPullDistance?: number;
}

export interface PullToRefreshState {
  /**
   * 現在のプルダウン距離
   */
  pullDistance: number;
  
  /**
   * リフレッシュ中かどうか
   */
  isRefreshing: boolean;
  
  /**
   * リフレッシュ可能状態かどうか
   */
  canRelease: boolean;
}

/**
 * プルトゥリフレッシュ機能を提供するカスタムフック
 * 
 * @example
 * ```tsx
 * const { pullDistance, isRefreshing, canRelease } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await loadData();
 *   }
 * });
 * ```
 */
export function usePullToRefresh({
  onRefresh,
  pullDownThreshold = 80,
  disabled = false,
  maxPullDistance = 150,
}: PullToRefreshOptions): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRelease, setCanRelease] = useState(false);
  
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // スクロール位置が上部にある場合のみプル可能
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    // 下方向のプルのみ
    if (distance > 0) {
      // プル距離を制限（減衰効果を追加）
      const dampingFactor = 0.5;
      const limitedDistance = Math.min(
        distance * dampingFactor,
        maxPullDistance
      );
      
      setPullDistance(limitedDistance);
      setCanRelease(limitedDistance >= pullDownThreshold);

      // スクロールを防止
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing, maxPullDistance, pullDownThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    
    isPulling.current = false;

    if (canRelease && !isRefreshing) {
      // リフレッシュ実行
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRelease(false);
      }
    } else {
      // リフレッシュせずに戻る
      setPullDistance(0);
      setCanRelease(false);
    }
  }, [canRelease, isRefreshing, onRefresh]);

  useEffect(() => {
    if (disabled) return;

    // タッチイベントをドキュメントに登録（パッシブでないように）
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

  return {
    pullDistance,
    isRefreshing,
    canRelease,
  };
}
