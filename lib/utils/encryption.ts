/**
 * 暗号化/復号化ユーティリティ
 * ブラウザのLocalStorageに保存するAPIキーを簡易的に暗号化します。
 * 
 * 注意: これは基本的なセキュリティ対策であり、完全なセキュリティを保証するものではありません。
 * 本番環境では、より強固な暗号化手法やサーバーサイドでのキー管理を検討してください。
 */

// 固定の暗号化キー（本番環境では環境変数から読み込むべき）
const ENCRYPTION_KEY = 'journee-app-encryption-key-2025';

/**
 * 文字列をBase64エンコードされた暗号化文字列に変換
 * XOR暗号を使用した簡易的な暗号化
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const encrypted = xorCipher(text, ENCRYPTION_KEY);
    return btoa(encrypted); // Base64エンコード
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
}

/**
 * 暗号化された文字列を復号化
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const decoded = atob(encryptedText); // Base64デコード
    return xorCipher(decoded, ENCRYPTION_KEY);
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * XOR暗号（排他的論理和による暗号化/復号化）
 * 同じキーで2回実行すると元に戻る性質を利用
 */
function xorCipher(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * APIキーの形式を検証（簡易的なバリデーション）
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // 最低限の長さチェック（20文字以上）
  if (apiKey.length < 20) {
    return false;
  }
  
  // 空白のみでないことを確認
  if (apiKey.trim().length === 0) {
    return false;
  }
  
  return true;
}

/**
 * APIキーをマスク表示用にフォーマット
 * 例: "sk-ant-...xyz123" → "sk-ant-***...xyz123"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) {
    return '***';
  }
  
  const start = apiKey.substring(0, 7);
  const end = apiKey.substring(apiKey.length - 6);
  return `${start}***...${end}`;
}