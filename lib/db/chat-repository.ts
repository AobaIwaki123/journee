/**
 * チャット履歴リポジトリ
 * チャットメッセージのDB操作（暗号化対応）
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ChatMessage } from '@/types/chat';

// Supabaseクライアントのシングルトン
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Supabaseクライアントを取得
 */
function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials are not configured');
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

/**
 * 暗号化キーを取得
 */
function getEncryptionKey(): string {
  const key = process.env.CHAT_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!key) {
    throw new Error('CHAT_ENCRYPTION_KEY is not configured');
  }
  return key;
}

/**
 * メッセージを1件保存（暗号化）
 */
export async function saveMessage(
  itineraryId: string,
  message: Omit<ChatMessage, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const encryptionKey = getEncryptionKey();

    // サーバーサイドの暗号化関数を使用
    const { data: encryptedContent, error: encryptError } = await supabase.rpc(
      'encrypt_chat_message',
      {
        p_content: message.content,
        p_encryption_key: encryptionKey,
      }
    );

    if (encryptError) {
      console.error('Encryption error:', encryptError);
      return { success: false, error: encryptError.message };
    }

    // 暗号化されたメッセージを保存
    const { error: insertError } = await supabase.from('chat_messages').insert({
      itinerary_id: itineraryId,
      role: message.role,
      encrypted_content: encryptedContent as string,
      is_encrypted: true,
      content: null, // 平文は保存しない
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('saveMessage error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * メッセージを一括保存（暗号化）
 */
export async function saveMessages(
  itineraryId: string,
  messages: Omit<ChatMessage, 'id'>[]
): Promise<{ success: boolean; error?: string; saved: number }> {
  try {
    const supabase = getSupabaseClient();
    const encryptionKey = getEncryptionKey();

    let savedCount = 0;

    // メッセージを1件ずつ暗号化して保存
    for (const message of messages) {
      const { data: encryptedContent, error: encryptError } = await supabase.rpc(
        'encrypt_chat_message',
        {
          p_content: message.content,
          p_encryption_key: encryptionKey,
        }
      );

      if (encryptError) {
        console.error('Encryption error:', encryptError);
        continue; // スキップして次へ
      }

      const { error: insertError } = await supabase.from('chat_messages').insert({
        itinerary_id: itineraryId,
        role: message.role,
        encrypted_content: encryptedContent as string,
        is_encrypted: true,
        content: null,
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        continue;
      }

      savedCount++;
    }

    return { success: true, saved: savedCount };
  } catch (error: any) {
    console.error('saveMessages error:', error);
    return { success: false, error: error.message, saved: 0 };
  }
}

/**
 * チャット履歴を取得（復号化）
 */
export async function getChatHistory(
  itineraryId: string
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const encryptionKey = getEncryptionKey();

    // チャットメッセージを取得
    const { data: rawMessages, error: fetchError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!rawMessages || rawMessages.length === 0) {
      return { success: true, messages: [] };
    }

    // メッセージを復号化
    const messages: ChatMessage[] = [];

    for (const raw of rawMessages) {
      let content: string;

      if (raw.is_encrypted && raw.encrypted_content) {
        // 暗号化されている場合は復号化
        const { data: decryptedContent, error: decryptError } = await supabase.rpc(
          'decrypt_chat_message',
          {
            p_encrypted_content: raw.encrypted_content,
            p_encryption_key: encryptionKey,
          }
        );

        if (decryptError || !decryptedContent) {
          console.error('Decryption error:', decryptError);
          continue; // 復号化失敗時はスキップ
        }

        content = decryptedContent as string;
      } else if (raw.content) {
        // 平文の場合（旧データ）
        content = raw.content;
      } else {
        // contentもencrypted_contentもない場合はスキップ
        continue;
      }

      messages.push({
        id: raw.id,
        role: raw.role as 'user' | 'assistant',
        content,
        timestamp: new Date(raw.created_at),
      });
    }

    return { success: true, messages };
  } catch (error: any) {
    console.error('getChatHistory error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * チャット履歴を削除
 */
export async function deleteChatHistory(
  itineraryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('itinerary_id', itineraryId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('deleteChatHistory error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * チャット履歴の件数を取得
 */
export async function getChatHistoryCount(
  itineraryId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('itinerary_id', itineraryId);

    if (error) {
      console.error('Count error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error: any) {
    console.error('getChatHistoryCount error:', error);
    return { success: false, error: error.message };
  }
}
