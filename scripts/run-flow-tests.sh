#!/bin/bash

###############################################################################
# フロー改善テスト実行スクリプト
# 
# 使用方法:
#   ./scripts/run-flow-tests.sh [options]
#
# オプション:
#   --headed        ブラウザを表示してテスト実行
#   --debug         デバッグモードで実行
#   --ui            UI モードで実行
#   --report        レポートを生成して開く
#   --update-golden 期待値を更新
###############################################################################

set -e

# スクリプトのディレクトリに移動
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}  フロー改善 E2Eテスト実行${NC}"
echo -e "${BLUE}==================================================================${NC}"
echo ""

# 開発サーバーが起動しているかチェック
check_server() {
  echo -e "${YELLOW}📡 開発サーバーの確認...${NC}"
  
  if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 開発サーバーが起動しています (http://localhost:3001)${NC}"
    return 0
  elif curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 開発サーバーが起動しています (http://localhost:3000)${NC}"
    echo -e "${YELLOW}⚠ テストはポート3001を想定しています${NC}"
    return 0
  else
    echo -e "${RED}✗ 開発サーバーが起動していません${NC}"
    echo -e "${YELLOW}  別のターミナルで 'npm run dev' を実行してください${NC}"
    return 1
  fi
}

# Node modulesのチェック
check_dependencies() {
  echo -e "${YELLOW}📦 依存関係の確認...${NC}"
  
  if [ ! -d "node_modules" ]; then
    echo -e "${RED}✗ node_modules が見つかりません${NC}"
    echo -e "${YELLOW}  npm install を実行してください${NC}"
    exit 1
  fi
  
  if [ ! -d "node_modules/@playwright" ]; then
    echo -e "${RED}✗ Playwright がインストールされていません${NC}"
    echo -e "${YELLOW}  npm install を実行してください${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ 依存関係OK${NC}"
}

# Playwrightブラウザのインストールチェック
check_browsers() {
  echo -e "${YELLOW}🌐 Playwrightブラウザの確認...${NC}"
  
  if ! npx playwright --version > /dev/null 2>&1; then
    echo -e "${RED}✗ Playwright CLI が見つかりません${NC}"
    exit 1
  fi
  
  # ブラウザがインストールされているか簡易チェック
  if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}⚠ Playwrightブラウザがインストールされていない可能性があります${NC}"
    echo -e "${YELLOW}  npx playwright install を実行することをお勧めします${NC}"
  else
    echo -e "${GREEN}✓ ブラウザOK${NC}"
  fi
}

# テスト前チェック
pre_test_checks() {
  check_dependencies
  check_browsers
  
  if ! check_server; then
    exit 1
  fi
  
  echo ""
}

# テスト実行
run_tests() {
  local test_command="npx playwright test e2e/flow-improvement.spec.ts"
  
  # オプションに応じてコマンドを変更
  case "$1" in
    --headed)
      echo -e "${BLUE}🎭 ブラウザを表示してテスト実行...${NC}"
      test_command="$test_command --headed"
      ;;
    --debug)
      echo -e "${BLUE}🐛 デバッグモードでテスト実行...${NC}"
      test_command="$test_command --debug"
      ;;
    --ui)
      echo -e "${BLUE}🎨 UIモードでテスト実行...${NC}"
      test_command="npx playwright test --ui e2e/flow-improvement.spec.ts"
      ;;
    --update-golden)
      echo -e "${BLUE}📸 スクリーンショットを更新...${NC}"
      test_command="$test_command --update-snapshots"
      ;;
    *)
      echo -e "${BLUE}🧪 ヘッドレスモードでテスト実行...${NC}"
      ;;
  esac
  
  echo ""
  echo -e "${YELLOW}実行コマンド: ${test_command}${NC}"
  echo ""
  
  # テスト実行
  if eval "$test_command"; then
    echo ""
    echo -e "${GREEN}==================================================================${NC}"
    echo -e "${GREEN}  ✓ テスト成功！${NC}"
    echo -e "${GREEN}==================================================================${NC}"
    
    # レポートオプションがある場合
    if [ "$2" == "--report" ]; then
      echo ""
      echo -e "${BLUE}📊 レポートを開いています...${NC}"
      npx playwright show-report
    fi
    
    return 0
  else
    echo ""
    echo -e "${RED}==================================================================${NC}"
    echo -e "${RED}  ✗ テスト失敗${NC}"
    echo -e "${RED}==================================================================${NC}"
    echo ""
    echo -e "${YELLOW}詳細なレポートを確認するには:${NC}"
    echo -e "${YELLOW}  npx playwright show-report${NC}"
    echo ""
    return 1
  fi
}

# テスト結果の記録
record_results() {
  local status=$1
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  local result_file="$PROJECT_ROOT/test-results/flow-improvement-results.log"
  
  mkdir -p "$PROJECT_ROOT/test-results"
  
  if [ "$status" -eq 0 ]; then
    echo "[$timestamp] ✓ PASS - フロー改善テスト成功" >> "$result_file"
  else
    echo "[$timestamp] ✗ FAIL - フロー改善テスト失敗" >> "$result_file"
  fi
  
  echo ""
  echo -e "${BLUE}📝 テスト結果を記録しました: ${result_file}${NC}"
}

# ヘルプメッセージ
show_help() {
  echo "使用方法: $0 [options]"
  echo ""
  echo "オプション:"
  echo "  --headed          ブラウザを表示してテスト実行"
  echo "  --debug           デバッグモードで実行"
  echo "  --ui              UIモードで実行"
  echo "  --report          テスト後にレポートを開く"
  echo "  --update-golden   期待値（スクリーンショット）を更新"
  echo "  --help            このヘルプを表示"
  echo ""
  echo "例:"
  echo "  $0                    # 通常のテスト実行"
  echo "  $0 --headed           # ブラウザを表示してテスト"
  echo "  $0 --ui               # UIモードでテスト"
  echo "  $0 --headed --report  # ブラウザ表示 + レポート表示"
  echo ""
}

# メイン処理
main() {
  # ヘルプオプション
  if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_help
    exit 0
  fi
  
  # 事前チェック
  pre_test_checks
  
  # テスト実行
  run_tests "$@"
  local test_status=$?
  
  # 結果記録
  record_results $test_status
  
  # 最終的なメッセージ
  echo ""
  if [ $test_status -eq 0 ]; then
    echo -e "${GREEN}🎉 全てのテストが成功しました！${NC}"
  else
    echo -e "${RED}❌ 一部のテストが失敗しました${NC}"
    echo -e "${YELLOW}詳細はレポートを確認してください: npx playwright show-report${NC}"
  fi
  echo ""
  
  exit $test_status
}

# スクリプト実行
main "$@"

