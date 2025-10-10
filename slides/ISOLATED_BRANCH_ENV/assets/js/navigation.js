/**
 * スライドナビゲーション
 * ブランチごとの独立環境構築 - HTMLスライド
 */

// スライドの総数
const TOTAL_SLIDES = 12;

// 現在のスライド番号を取得
function getCurrentSlideNumber() {
  const path = window.location.pathname;
  const match = path.match(/slide_(\d+)\.html/);
  return match ? parseInt(match[1], 10) : 1;
}

// スライド番号からファイルパスを生成
function getSlideFilename(slideNumber) {
  return `slide_${String(slideNumber).padStart(2, "0")}.html`;
}

// 指定したスライドに移動
function goToSlide(slideNumber) {
  if (slideNumber < 1 || slideNumber > TOTAL_SLIDES) {
    return;
  }
  const filename = getSlideFilename(slideNumber);
  window.location.href = filename;
}

// 次のスライドに移動
function nextSlide() {
  const current = getCurrentSlideNumber();
  if (current < TOTAL_SLIDES) {
    goToSlide(current + 1);
  }
}

// 前のスライドに移動
function prevSlide() {
  const current = getCurrentSlideNumber();
  if (current > 1) {
    goToSlide(current - 1);
  }
}

// 最初のスライドに移動
function firstSlide() {
  goToSlide(1);
}

// 最後のスライドに移動
function lastSlide() {
  goToSlide(TOTAL_SLIDES);
}

// プログレスバーを更新
function updateProgressBar() {
  const current = getCurrentSlideNumber();
  const progress = (current / TOTAL_SLIDES) * 100;
  const progressBarFill = document.querySelector(".progress-bar-fill");
  if (progressBarFill) {
    progressBarFill.style.width = `${progress}%`;
  }
}

// スライド番号を表示
function updateSlideNumber() {
  const current = getCurrentSlideNumber();
  const slideNumberElement = document.querySelector(".slide-number");
  if (slideNumberElement) {
    slideNumberElement.textContent = `${current} / ${TOTAL_SLIDES}`;
  }
}

// キーボードイベントの設定
function setupKeyboardNavigation() {
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowRight":
      case " ":
      case "PageDown":
        event.preventDefault();
        nextSlide();
        break;
      case "ArrowLeft":
      case "PageUp":
        event.preventDefault();
        prevSlide();
        break;
      case "Home":
        event.preventDefault();
        firstSlide();
        break;
      case "End":
        event.preventDefault();
        lastSlide();
        break;
      case "Escape":
        event.preventDefault();
        window.location.href = "../index.html";
        break;
    }
  });
}

// ナビゲーションボタンの設定
function setupNavigationButtons() {
  const current = getCurrentSlideNumber();

  // 前へボタン
  const prevButton = document.querySelector(".nav-button.prev");
  if (prevButton) {
    if (current === 1) {
      prevButton.style.opacity = "0.5";
      prevButton.style.cursor = "not-allowed";
    } else {
      prevButton.addEventListener("click", prevSlide);
    }
  }

  // 次へボタン
  const nextButton = document.querySelector(".nav-button.next");
  if (nextButton) {
    if (current === TOTAL_SLIDES) {
      nextButton.style.opacity = "0.5";
      nextButton.style.cursor = "not-allowed";
    } else {
      nextButton.addEventListener("click", nextSlide);
    }
  }

  // ホームボタン
  const homeButton = document.querySelector(".nav-button.home");
  if (homeButton) {
    homeButton.addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }
}

// スワイプジェスチャーの設定（モバイル用）
function setupSwipeGestures() {
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
  });

  document.addEventListener("touchend", (event) => {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // 左にスワイプ → 次へ
        nextSlide();
      } else {
        // 右にスワイプ → 前へ
        prevSlide();
      }
    }
  }
}

// フルスクリーンモードの切り替え
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log(`Fullscreen error: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// ページ読み込み時の初期化
document.addEventListener("DOMContentLoaded", () => {
  // プログレスバーを更新
  updateProgressBar();

  // スライド番号を表示
  updateSlideNumber();

  // キーボードナビゲーションを設定
  setupKeyboardNavigation();

  // ナビゲーションボタンを設定
  setupNavigationButtons();

  // スワイプジェスチャーを設定
  setupSwipeGestures();

  // Fキーでフルスクリーン切り替え
  document.addEventListener("keydown", (event) => {
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  // アニメーション効果の追加
  const slideContent = document.querySelector(".slide-content");
  if (slideContent) {
    slideContent.style.opacity = "0";
    setTimeout(() => {
      slideContent.style.transition = "opacity 0.5s ease-in-out";
      slideContent.style.opacity = "1";
    }, 100);
  }
});

// ページ遷移前のアニメーション
window.addEventListener("beforeunload", () => {
  const slideContent = document.querySelector(".slide-content");
  if (slideContent) {
    slideContent.style.transition = "opacity 0.3s ease-in-out";
    slideContent.style.opacity = "0";
  }
});

// デバッグ用：コンソールに操作方法を表示
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  キーボード操作
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  →, Space, PageDown : 次のスライド
  ←, PageUp         : 前のスライド
  Home              : 最初のスライド
  End               : 最後のスライド
  F                 : フルスクリーン切り替え
  Esc               : ホームに戻る
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
