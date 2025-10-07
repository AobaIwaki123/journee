import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * 
 * APIのヘルスチェックエンドポイント
 * サービスが正常に動作しているかを確認するために使用
 * 
 * @returns ヘルスステータス
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Journee API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  })
}
