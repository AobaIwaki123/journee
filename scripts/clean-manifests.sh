#!/bin/bash

# k8s/manifests-*とk8s/argocd-*を削除するスクリプト

set -e

# スクリプトのディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🗑️  ブランチ固有のk8sマニフェストを削除します..."
echo ""

# 削除対象のディレクトリを検索して表示
MANIFESTS_DIRS=$(find k8s -maxdepth 1 -type d -name 'manifests-*' 2>/dev/null || true)
ARGOCD_DIRS=$(find k8s -maxdepth 1 -type d -name 'argocd-*' 2>/dev/null || true)

if [ -z "$MANIFESTS_DIRS" ] && [ -z "$ARGOCD_DIRS" ]; then
  echo "✨ 削除対象のディレクトリが見つかりませんでした。"
  exit 0
fi

echo "以下のディレクトリを削除します:"
echo ""

if [ -n "$MANIFESTS_DIRS" ]; then
  echo "$MANIFESTS_DIRS"
fi

if [ -n "$ARGOCD_DIRS" ]; then
  echo "$ARGOCD_DIRS"
fi

echo ""
read -p "削除してよろしいですか？ (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ キャンセルしました。"
  exit 0
fi

# manifests-*を削除
if [ -n "$MANIFESTS_DIRS" ]; then
  echo ""
  echo "📂 manifests-* を削除中..."
  find k8s -maxdepth 1 -type d -name 'manifests-*' -exec rm -rf {} + 2>/dev/null || true
  echo "✅ manifests-* を削除しました。"
fi

# argocd-*を削除
if [ -n "$ARGOCD_DIRS" ]; then
  echo ""
  echo "📂 argocd-* を削除中..."
  find k8s -maxdepth 1 -type d -name 'argocd-*' -exec rm -rf {} + 2>/dev/null || true
  echo "✅ argocd-* を削除しました。"
fi

echo ""
echo "✨ クリーンアップが完了しました！"

