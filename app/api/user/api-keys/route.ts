/**
 * APIキー管理エンドポイント
 * Claude APIキーをSupabase（PostgreSQL）で安全に管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * APIキーの保存
 * POST /api/user/api-keys
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { apiKey, provider } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 400 }
      );
    }

    if (provider !== 'claude') {
      return NextResponse.json(
        { success: false, error: 'Unsupported provider' },
        { status: 400 }
      );
    }

    // 環境変数から暗号化キーを取得
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY is not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // APIキーを暗号化してSupabaseに保存
    const { data, error } = await supabaseAdmin.rpc('save_encrypted_api_key', {
      p_user_id: session.user.id,
      p_api_key: apiKey,
      p_encryption_key: encryptionKey,
    });

    if (error) {
      console.error('Failed to save API key:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/user/api-keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * APIキーの取得
 * GET /api/user/api-keys
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { apiKey: null, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 環境変数から暗号化キーを取得
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY is not set');
      return NextResponse.json(
        { apiKey: null, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Supabaseから暗号化されたAPIキーを取得して復号化
    const { data, error } = await supabaseAdmin.rpc('get_decrypted_api_key', {
      p_user_id: session.user.id,
      p_encryption_key: encryptionKey,
    });

    if (error) {
      console.error('Failed to load API key:', error);
      return NextResponse.json(
        { apiKey: null, error: 'Failed to load API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ apiKey: data || null });
  } catch (error) {
    console.error('GET /api/user/api-keys error:', error);
    return NextResponse.json(
      { apiKey: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * APIキーの削除
 * DELETE /api/user/api-keys
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SupabaseからAPIキーを削除
    const { error } = await supabaseAdmin
      .from('user_settings')
      .update({ encrypted_claude_api_key: null })
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Failed to delete API key:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/user/api-keys error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
