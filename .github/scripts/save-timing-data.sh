#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# save-timing-data.sh - ベンチマーク結果保存スクリプト
#
# Usage: ./save-timing-data.sh <package-manager> <cache-enabled> <run-number> \
#          <job-start> <setup-time> <install-deps> <deps-cache-hit> \
#          <get-version> <install-browsers> <playwright-cache-hit> \
#          <test-duration> <test-result>
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

PACKAGE_MANAGER="${1}"
CACHE_ENABLED="${2}"
RUN_NUMBER="${3}"
JOB_START="${4}"
SETUP_TIME="${5}"
INSTALL_DEPS_DURATION="${6:-0}"
DEPS_CACHE_HIT="${7:-false}"
GET_VERSION_DURATION="${8:-0}"
INSTALL_BROWSERS_DURATION="${9:-0}"
PLAYWRIGHT_CACHE_HIT="${10:-false}"
TEST_DURATION="${11:-0}"
TEST_RESULT="${12:-unknown}"

JOB_END=$(date +%s)
TOTAL_DURATION=$((JOB_END - JOB_START))
SETUP_DURATION=$((SETUP_TIME - JOB_START))

# ファイル名の決定
if [ "$CACHE_ENABLED" = "true" ]; then
  FILENAME="timing-${PACKAGE_MANAGER}-cached-${RUN_NUMBER}.json"
else
  FILENAME="timing-${PACKAGE_MANAGER}-nocache-${RUN_NUMBER}.json"
fi

# JSON出力
cat << EOF > "$FILENAME"
{
  "package_manager": "$PACKAGE_MANAGER",
  "cache_enabled": $CACHE_ENABLED,
  "run": $RUN_NUMBER,
  "total": $TOTAL_DURATION,
  "setup_pm": $SETUP_DURATION,
  "install_deps": ${INSTALL_DEPS_DURATION},
  "deps_cache_hit": "$DEPS_CACHE_HIT",
  "get_version": ${GET_VERSION_DURATION},
  "install_browsers": ${INSTALL_BROWSERS_DURATION},
  "playwright_cache_hit": "$PLAYWRIGHT_CACHE_HIT",
  "test_execution": ${TEST_DURATION},
  "test_result": "$TEST_RESULT"
}
EOF

echo "💾 Saved timing data to: $FILENAME"
cat "$FILENAME"

# 後続のステップで使えるようにファイル名を出力
echo "filename=$FILENAME" >> "$GITHUB_OUTPUT"
