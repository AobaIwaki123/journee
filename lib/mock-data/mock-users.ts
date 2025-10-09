/**
 * モックユーザーデータ
 *
 * ブランチモード（ENABLE_MOCK_AUTH=true）で使用される
 * Google OAuth認証をバイパスするためのテストユーザー
 */

export interface MockUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  image: string;
}

/**
 * デフォルトのモックユーザー
 * ブランチモードでのログイン時に自動的に使用されます
 */
export const DEFAULT_MOCK_USER: MockUser = {
  id: "mock-user-uuid-12345",
  googleId: "mock-google-id-12345",
  email: "test@example.com",
  name: "テストユーザー",
  image: "https://via.placeholder.com/150",
};

/**
 * 複数のテストユーザー（将来の拡張用）
 */
export const MOCK_USERS: Record<string, MockUser> = {
  default: DEFAULT_MOCK_USER,
  user1: {
    id: "mock-user-uuid-11111",
    googleId: "mock-google-id-11111",
    email: "user1@example.com",
    name: "ユーザー1",
    image: "https://via.placeholder.com/150/FF0000",
  },
  user2: {
    id: "mock-user-uuid-22222",
    googleId: "mock-google-id-22222",
    email: "user2@example.com",
    name: "ユーザー2",
    image: "https://via.placeholder.com/150/00FF00",
  },
  admin: {
    id: "mock-user-uuid-99999",
    googleId: "mock-google-id-99999",
    email: "admin@example.com",
    name: "管理者",
    image: "https://via.placeholder.com/150/0000FF",
  },
};

/**
 * モックユーザーを取得
 * @param key - ユーザーキー（デフォルト: "default"）
 * @returns モックユーザーデータ
 */
export function getMockUser(key: string = "default"): MockUser {
  return MOCK_USERS[key] || DEFAULT_MOCK_USER;
}

/**
 * モック認証が有効かどうかを判定
 * @returns モック認証が有効な場合はtrue
 */
export function isMockAuthEnabled(): boolean {
  return process.env.ENABLE_MOCK_AUTH === "true";
}
