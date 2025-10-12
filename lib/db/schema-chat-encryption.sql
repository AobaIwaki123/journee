-- Chat Messages Encryption Migration
-- Phase: Gemini Flash & Chat History DB Integration
-- 
-- チャットメッセージの暗号化機能を追加
-- pgcrypto拡張を使用してサーバーサイド暗号化を実現

-- 1. pgcrypto拡張を有効化（既に有効な場合はスキップ）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. chat_messagesテーブルに暗号化フィールドを追加
ALTER TABLE chat_messages 
  ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- 3. contentカラムをNULLABLEに変更（暗号化コンテンツを使用する場合）
ALTER TABLE chat_messages 
  ALTER COLUMN content DROP NOT NULL;

-- 4. 暗号化関数: メッセージを暗号化して保存
CREATE OR REPLACE FUNCTION encrypt_chat_message(
  p_content TEXT,
  p_encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(p_content, p_encryption_key),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 復号化関数: 暗号化されたメッセージを復号化
CREATE OR REPLACE FUNCTION decrypt_chat_message(
  p_encrypted_content TEXT,
  p_encryption_key TEXT
) RETURNS TEXT AS $$
BEGIN
  IF p_encrypted_content IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(p_encrypted_content, 'base64'),
    p_encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- 復号化エラー時はNULLを返す
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 既存データのマイグレーション関数
-- 既存の非暗号化メッセージを暗号化形式に移行
CREATE OR REPLACE FUNCTION migrate_existing_chat_messages(
  p_encryption_key TEXT
) RETURNS void AS $$
BEGIN
  -- contentが存在し、encrypted_contentがNULLのレコードを暗号化
  UPDATE chat_messages
  SET 
    encrypted_content = encrypt_chat_message(content, p_encryption_key),
    is_encrypted = TRUE,
    content = NULL  -- 暗号化後は平文を削除
  WHERE 
    content IS NOT NULL 
    AND encrypted_content IS NULL;
    
  RAISE NOTICE 'Migrated % chat messages to encrypted format', 
    (SELECT COUNT(*) FROM chat_messages WHERE is_encrypted = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. インデックスの追加（is_encryptedフィールド用）
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_encrypted 
  ON chat_messages(is_encrypted) 
  WHERE is_encrypted = TRUE;

-- 8. チェック制約: encrypted_contentまたはcontentのいずれかが存在する必要がある
ALTER TABLE chat_messages 
  ADD CONSTRAINT chat_messages_content_check 
  CHECK (
    (content IS NOT NULL AND encrypted_content IS NULL) OR 
    (content IS NULL AND encrypted_content IS NOT NULL)
  );

-- 9. コメント追加
COMMENT ON COLUMN chat_messages.encrypted_content IS 'pgcryptoで暗号化されたメッセージ内容（base64エンコード）';
COMMENT ON COLUMN chat_messages.is_encrypted IS '暗号化されているかどうかのフラグ';
COMMENT ON FUNCTION encrypt_chat_message IS 'チャットメッセージを暗号化';
COMMENT ON FUNCTION decrypt_chat_message IS 'チャットメッセージを復号化';
COMMENT ON FUNCTION migrate_existing_chat_messages IS '既存メッセージを暗号化形式に移行';

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE 'Chat messages encryption schema updated successfully!';
  RAISE NOTICE 'To migrate existing messages, run: SELECT migrate_existing_chat_messages(''your-encryption-key'');';
END $$;
