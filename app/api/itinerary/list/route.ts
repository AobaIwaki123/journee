import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { itineraryRepository } from '@/lib/db/itinerary-repository';
import type { ItineraryFilters, SortBy, SortOrder } from '@/lib/db/itinerary-repository';

/**
 * Phase 8.3: しおり一覧取得API（Database版）
 * 
 * GET /api/itinerary/list
 * 
 * Supabaseデータベースを使用した実装。
 * ユーザーのしおり一覧を取得する（フィルター・ソート・ページネーション対応）。
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // クエリパラメータ取得
    const searchParams = request.nextUrl.searchParams;

    // フィルター条件
    const filters: ItineraryFilters = {};
    const status = searchParams.get('status');
    if (status === 'draft' || status === 'completed' || status === 'archived') {
      filters.status = status;
    }
    const destination = searchParams.get('destination');
    if (destination) {
      filters.destination = destination;
    }
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // ソート条件
    const sortBy = (searchParams.get('sortBy') || 'updated_at') as SortBy;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as SortOrder;

    // ページネーション
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // しおり一覧を取得
    const result = await itineraryRepository.listItineraries(
      user.id,
      filters,
      sortBy,
      sortOrder,
      { page, pageSize }
    );

    return NextResponse.json({
      success: true,
      itineraries: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Failed to load itineraries:', error);
    return NextResponse.json(
      { error: 'Failed to load itineraries' },
      { status: 500 }
    );
  }
}
