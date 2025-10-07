/**
 * API共通型定義
 */

/**
 * API成功レスポンスの基本型
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

/**
 * APIエラーレスポンスの基本型
 */
export interface ApiErrorResponse {
  error: string
  message: string
  details?: unknown
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

/**
 * HTTPメソッド型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * APIレスポンスステータス
 */
export type ApiStatus = 'success' | 'error' | 'loading'

/**
 * ユーザー情報レスポンス（/api/user/me）
 */
export interface UserMeResponse {
  id: string
  email: string
  name: string | null
  image: string | null
  googleId?: string
}
