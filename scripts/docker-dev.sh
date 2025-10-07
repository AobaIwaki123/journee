#!/bin/bash

# Journee Docker Development Environment Script

set -e

echo "🚀 Journee - Docker開発環境"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local が見つかりません。"
    echo "📝 .env.example から .env.local を作成しています..."
    cp .env.example .env.local
    echo "✅ .env.local を作成しました。必要に応じて編集してください。"
    echo ""
fi

# Parse command
case "${1:-start}" in
    start|up)
        echo "🐳 Dockerコンテナを起動します..."
        docker compose up -d
        echo ""
        echo "✅ 起動完了！"
        echo "🌐 アプリケーション: http://localhost:3000"
        echo ""
        echo "📊 ログを確認: npm run docker:logs"
        echo "🛑 停止: npm run docker:stop"
        ;;
    
    stop|down)
        echo "🛑 Dockerコンテナを停止します..."
        docker compose down
        echo "✅ 停止完了"
        ;;
    
    restart)
        echo "🔄 Dockerコンテナを再起動します..."
        docker compose restart
        echo "✅ 再起動完了"
        ;;
    
    logs)
        echo "📊 ログを表示します (Ctrl+Cで終了)..."
        docker compose logs -f app
        ;;
    
    shell|bash)
        echo "🐚 コンテナ内のシェルに接続します..."
        docker compose exec app sh
        ;;
    
    build)
        echo "🔨 Dockerイメージをビルドします..."
        docker compose build --no-cache
        echo "✅ ビルド完了"
        ;;
    
    clean)
        echo "🧹 Dockerコンテナとボリュームを削除します..."
        docker compose down -v
        echo "✅ クリーンアップ完了"
        ;;
    
    status)
        echo "📊 コンテナの状態:"
        docker compose ps
        ;;
    
    *)
        echo "使用方法: $0 {start|stop|restart|logs|shell|build|clean|status}"
        echo ""
        echo "コマンド:"
        echo "  start   - コンテナを起動"
        echo "  stop    - コンテナを停止"
        echo "  restart - コンテナを再起動"
        echo "  logs    - ログを表示"
        echo "  shell   - コンテナ内のシェルに接続"
        echo "  build   - イメージを再ビルド"
        echo "  clean   - コンテナとボリュームを削除"
        echo "  status  - コンテナの状態を表示"
        exit 1
        ;;
esac
