/**
 * CommentItem コンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentItem from '../CommentItem';
import type { Comment } from '@/types/comment';

// date-utils のモック
jest.mock('@/lib/utils/date-utils', () => ({
  getRelativeTime: jest.fn((date) => {
    if (!date) return '不明';
    return '3時間前';
  }),
}));

describe('CommentItem', () => {
  const mockComment: Comment = {
    id: 'comment-1',
    itineraryId: 'itinerary-1',
    userId: 'user-1',
    authorName: 'テストユーザー',
    content: 'これはテストコメントです',
    isAnonymous: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockAnonymousComment: Comment = {
    ...mockComment,
    id: 'comment-2',
    userId: null,
    authorName: '匿名ユーザー',
    isAnonymous: true,
  };

  it('コメントを正しく表示', () => {
    render(<CommentItem comment={mockComment} />);

    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    expect(
      screen.getByText('これはテストコメントです')
    ).toBeInTheDocument();
    expect(screen.getByText('3時間前')).toBeInTheDocument();
  });

  it('匿名コメントを正しく表示', () => {
    render(<CommentItem comment={mockAnonymousComment} />);

    expect(screen.getByText('匿名ユーザー')).toBeInTheDocument();
    expect(screen.getByText('(匿名)')).toBeInTheDocument();
  });

  it('自分のコメントに削除ボタンを表示', () => {
    const mockOnDelete = jest.fn();

    render(
      <CommentItem
        comment={mockComment}
        currentUserId="user-1"
        onDelete={mockOnDelete}
      />
    );

    // 削除ボタンが表示されている
    const deleteButton = screen.getByTitle('削除');
    expect(deleteButton).toBeInTheDocument();
  });

  it('削除ボタンクリックで確認ダイアログを表示', async () => {
    const mockOnDelete = jest.fn().mockResolvedValue(undefined);
    window.confirm = jest.fn().mockReturnValue(true);

    render(
      <CommentItem
        comment={mockComment}
        currentUserId="user-1"
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('削除');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'このコメントを削除しますか？'
    );
    
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('comment-1');
    });
  });

  it('削除キャンセル時は何もしない', () => {
    const mockOnDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(false);

    render(
      <CommentItem
        comment={mockComment}
        currentUserId="user-1"
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('削除');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('無効な日付でもエラーにならない', () => {
    const commentWithInvalidDate: Comment = {
      ...mockComment,
      createdAt: 'invalid-date' as any,
    };

    render(<CommentItem comment={commentWithInvalidDate} />);

    // エラーが発生せずにレンダリングされる
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
  });
});
