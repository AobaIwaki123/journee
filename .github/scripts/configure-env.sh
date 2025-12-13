#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# configure-env.sh - パッケージマネージャー環境設定スクリプト
# 
# Usage: ./configure-env.sh <package-manager> [include-playwright-cmd]
#   package-manager: bun, pnpm, or npm
#   include-playwright-cmd: true の場合、PLAYWRIGHT_CMD も設定
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

PACKAGE_MANAGER="${1:-}"
INCLUDE_PLAYWRIGHT_CMD="${2:-false}"

if [ -z "$PACKAGE_MANAGER" ]; then
  echo "❌ Error: Package manager not specified"
  echo "Usage: $0 <bun|pnpm|npm> [include-playwright-cmd]"
  exit 1
fi

echo "⚙️ Configuring environment for: $PACKAGE_MANAGER"

case "$PACKAGE_MANAGER" in
  bun)
    echo "LOCKFILE=bun.lock" >> "$GITHUB_ENV"
    echo "CACHE_DIR=$HOME/.bun/install/cache" >> "$GITHUB_ENV"
    echo "INSTALL_CMD=bun install --frozen-lockfile" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_INSTALL_CMD=bunx playwright install --with-deps" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_INSTALL_DEPS_CMD=bunx playwright install-deps" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_VERSION_CMD=bunx playwright --version" >> "$GITHUB_ENV"
    if [ "$INCLUDE_PLAYWRIGHT_CMD" = "true" ]; then
      echo "PLAYWRIGHT_CMD=bunx playwright --workers=4" >> "$GITHUB_ENV"
    fi
    ;;
  pnpm)
    echo "LOCKFILE=pnpm-lock.yaml" >> "$GITHUB_ENV"
    echo "CACHE_DIR=$(pnpm store path)" >> "$GITHUB_ENV"
    echo "INSTALL_CMD=pnpm install --frozen-lockfile" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_INSTALL_CMD=pnpm exec playwright install --with-deps" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_INSTALL_DEPS_CMD=pnpm exec playwright install-deps" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_VERSION_CMD=pnpm exec playwright --version" >> "$GITHUB_ENV"
    if [ "$INCLUDE_PLAYWRIGHT_CMD" = "true" ]; then
      echo "PLAYWRIGHT_CMD=pnpm exec playwright --workers=4" >> "$GITHUB_ENV"
    fi
    ;;
  npm)
    echo "LOCKFILE=package-lock.json" >> "$GITHUB_ENV"
    echo "CACHE_DIR=$HOME/.npm" >> "$GITHUB_ENV"
    echo "INSTALL_CMD=npm ci" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_INSTALL_CMD=npx playwright install --with-deps" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_INSTALL_DEPS_CMD=npx playwright install-deps" >> "$GITHUB_ENV"
    echo "PLAYWRIGHT_VERSION_CMD=npx playwright --version" >> "$GITHUB_ENV"
    if [ "$INCLUDE_PLAYWRIGHT_CMD" = "true" ]; then
      echo "PLAYWRIGHT_CMD=npx playwright --workers=4" >> "$GITHUB_ENV"
    fi
    ;;
  *)
    echo "❌ Error: Unknown package manager: $PACKAGE_MANAGER"
    echo "Supported: bun, pnpm, npm"
    exit 1
    ;;
esac

echo "✅ Environment configured successfully"
