import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { compressChatHistory } from '@/lib/ai/chat-compressor';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, modelId, claudeApiKey } = await req.json();

    // 圧縮実行
    const result = await compressChatHistory(messages, modelId, claudeApiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Compress chat history error:', error);
    return NextResponse.json(
      { error: 'Failed to compress chat history' },
      { status: 500 }
    );
  }
}
