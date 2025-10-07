/**
 * APIキー暗号化ユーティリティ
 * 
 * ブラウザのLocalStorageに保存する際、APIキーを暗号化して保存します。
 * Web Crypto APIを使用した簡易的な暗号化を実装しています。
 * 
 * 注意: これはクライアントサイドの暗号化であり、完全なセキュリティを保証するものではありません。
 * より高度なセキュリティが必要な場合は、Phase 8のDB統合時にサーバーサイドで暗号化してください。
 */

const ENCRYPTION_KEY = 'journee-encryption-key-v1';

/**
 * 文字列をBase64エンコード
 */
function base64Encode(str: string): string {
  return btoa(encodeURIComponent(str));
}

/**
 * Base64デコードして文字列に変換
 */
function base64Decode(str: string): string {
  return decodeURIComponent(atob(str));
}

/**
 * 簡易的なXOR暗号化
 * 注意: これは簡易的な実装です。本番環境では適切な暗号化ライブラリの使用を推奨します。
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * APIキーを暗号化
 * @param apiKey - 暗号化するAPIキー
 * @returns 暗号化されたAPIキー（Base64エンコード済み）
 */
export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  try {
    // XOR暗号化してBase64エンコード
    const encrypted = xorEncrypt(apiKey, ENCRYPTION_KEY);
    return base64Encode(encrypted);
  } catch (error) {
    console.error('Failed to encrypt API key:', error);
    return '';
  }
}

/**
 * APIキーを復号化
 * @param encryptedKey - 暗号化されたAPIキー（Base64エンコード済み）
 * @returns 復号化されたAPIキー
 */
export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  
  try {
    // Base64デコードしてXOR復号化
    const decoded = base64Decode(encryptedKey);
    return xorEncrypt(decoded, ENCRYPTION_KEY);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return '';
  }
}

/**
 * APIキーの形式を検証
 * @param apiKey - 検証するAPIキー
 * @param provider - AIプロバイダー（'claude'）
 * @returns 検証結果
 */
export function validateApiKeyFormat(apiKey: string, provider: 'claude'): boolean {
  if (!apiKey) return false;
  
  switch (provider) {
    case 'claude':
      // Claude APIキーは 'sk-ant-' で始まる
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    default:
      return false;
  }
}

/**
 * APIキーをマスク表示用に変換
 * @param apiKey - 元のAPIキー
 * @returns マスクされたAPIキー（例: sk-ant-****...****1234）
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  const visibleStart = 7; // 最初の7文字を表示
  const visibleEnd = 4;   // 最後の4文字を表示
  
  if (apiKey.length <= visibleStart + visibleEnd) {
    return apiKey;
  }
  
  const start = apiKey.substring(0, visibleStart);
  const end = apiKey.substring(apiKey.length - visibleEnd);
  const masked = '****...****';
  
  return `${start}${masked}${end}`;
}