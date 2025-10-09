/**
 * CommentRepository のテスト
 */

import { CommentRepository } from '../comment-repository';
import type { CreateCommentRequest } from '@/types/comment';

// Supabaseクライアントのモック
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  supabaseAdmin: null,
}));

describe('CommentRepository', () => {
  let repository: CommentRepository;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockRange: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    repository = new CommentRepository();

    // モックのセットアップ
    mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    mockRange = jest.fn().mockReturnThis();
    mockOrder = jest.fn().mockReturnValue({ range: mockRange });
    mockEq = jest.fn().mockReturnValue({
      order: mockOrder,
      eq: jest.fn().mockReturnValue({ order: mockOrder }),
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    });
    mockSelect = jest.fn().mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });
    mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    });
    mockUpdate = jest.fn().mockReturnValue({
      eq: mockEq,
    });
    mockDelete = jest.fn().mockReturnValue({
      eq: mockEq,
    });
    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    const { supabase } = require('../supabase');
    supabase.from = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('コメントを作成（認証ユーザー）', async () => {
      const mockComment = {
        id: 'comment-1',
        itinerary_id: 'itinerary-1',
        user_id: 'user-1',
        author_name: 'テストユーザー',
        content: 'テストコメント',
        is_anonymous: false,
        is_reported: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockComment, error: null });

      const request: CreateCommentRequest = {
        itineraryId: 'itinerary-1',
        content: 'テストコメント',
        isAnonymous: false,
        authorName: 'テストユーザー',
      };

      const result = await repository.createComment(request, 'user-1');

      expect(result.id).toBe('comment-1');
      expect(result.content).toBe('テストコメント');
      expect(result.isAnonymous).toBe(false);
      expect(mockFrom).toHaveBeenCalledWith('comments');
    });

    it('コメントを作成（匿名ユーザー）', async () => {
      const mockComment = {
        id: 'comment-2',
        itinerary_id: 'itinerary-1',
        user_id: null,
        author_name: '匿名さん',
        content: '匿名コメント',
        is_anonymous: true,
        is_reported: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSingle.mockResolvedValue({ data: mockComment, error: null });

      const request: CreateCommentRequest = {
        itineraryId: 'itinerary-1',
        content: '匿名コメント',
        isAnonymous: true,
        authorName: '匿名さん',
      };

      const result = await repository.createComment(request);

      expect(result.isAnonymous).toBe(true);
      expect(result.authorName).toBe('匿名さん');
      expect(result.userId).toBeNull();
    });

    it('エラー: 匿名投稿で名前が未指定', async () => {
      const request: CreateCommentRequest = {
        itineraryId: 'itinerary-1',
        content: 'コメント',
        isAnonymous: true,
      };

      await expect(repository.createComment(request)).rejects.toThrow(
        '匿名投稿の場合は名前が必要です'
      );
    });

    it('エラー: 文字数オーバー（500文字超）', async () => {
      const request: CreateCommentRequest = {
        itineraryId: 'itinerary-1',
        content: 'a'.repeat(501),
        isAnonymous: false,
        authorName: 'テスト',
      };

      await expect(
        repository.createComment(request, 'user-1')
      ).rejects.toThrow('コメントは500文字以内で入力してください');
    });

    it('エラー: 空のコメント', async () => {
      const request: CreateCommentRequest = {
        itineraryId: 'itinerary-1',
        content: '   ',
        isAnonymous: false,
        authorName: 'テスト',
      };

      await expect(
        repository.createComment(request, 'user-1')
      ).rejects.toThrow('コメントを入力してください');
    });
  });

  describe('deleteComment', () => {
    it('コメントを削除', async () => {
      mockEq.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const result = await repository.deleteComment('comment-1', 'user-1');

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('comments');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('エラー: データベースエラー', async () => {
      mockEq.mockReturnValue({
        eq: jest
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      });

      await expect(
        repository.deleteComment('comment-1', 'user-1')
      ).rejects.toThrow('コメントの削除に失敗しました');
    });
  });
});
