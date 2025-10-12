/**
 * チャット履歴API
 * POST /api/chat/history - メッセージ保存
 * GET /api/chat/history?itineraryId={id} - 履歴取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import {
  saveMessage,
  saveMessages,
  getChatHistory,
  deleteChatHistory,
  getChatHistoryCount,
} from '@/lib/db/chat-repository';
import type { ChatMessage } from '@/types/chat';

/**
 * GET /api/chat/history
 * チャット履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // クエリパラメータからitineraryIdを取得
    const searchParams = request.nextUrl.searchParams;
    const itineraryId = searchParams.get('itineraryId');

    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'itineraryId is required' },
        { status: 400 }
      );
    }

    // チャット履歴を取得
    const result = await getChatHistory(itineraryId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: result.error || 'Failed to fetch chat history',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messages: result.messages || [],
      count: result.messages?.length || 0,
    });
  } catch (error: any) {
    console.error('GET /api/chat/history error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/history
 * チャットメッセージを保存
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // リクエストボディをパース
    const body = await request.json();
    const { itineraryId, message, messages } = body;

    // バリデーション
    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'itineraryId is required' },
        { status: 400 }
      );
    }

    // 単一メッセージ保存
    if (message) {
      if (!message.role || !message.content) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'message.role and message.content are required' },
          { status: 400 }
        );
      }

      const result = await saveMessage(itineraryId, {
        role: message.role,
        content: message.content,
        timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
      });

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Internal Server Error',
            message: result.error || 'Failed to save message',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Message saved successfully',
      });
    }

    // 複数メッセージ保存
    if (messages && Array.isArray(messages)) {
      if (messages.length === 0) {
        return NextResponse.json(
          { error: 'Bad Request', message: 'messages array is empty' },
          { status: 400 }
        );
      }

      // バリデーション
      for (const msg of messages) {
        if (!msg.role || !msg.content) {
          return NextResponse.json(
            { error: 'Bad Request', message: 'All messages must have role and content' },
            { status: 400 }
          );
        }
      }

      const result = await saveMessages(
        itineraryId,
        messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }))
      );

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Internal Server Error',
            message: result.error || 'Failed to save messages',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${result.saved} messages saved successfully`,
        saved: result.saved,
      });
    }

    return NextResponse.json(
      { error: 'Bad Request', message: 'Either message or messages must be provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('POST /api/chat/history error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/history
 * チャット履歴を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // クエリパラメータからitineraryIdを取得
    const searchParams = request.nextUrl.searchParams;
    const itineraryId = searchParams.get('itineraryId');

    if (!itineraryId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'itineraryId is required' },
        { status: 400 }
      );
    }

    // チャット履歴を削除
    const result = await deleteChatHistory(itineraryId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Internal Server Error',
          message: result.error || 'Failed to delete chat history',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Chat history deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/chat/history error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
