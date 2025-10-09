/**
 * Itinerary Repository (Phase 8.2)
 *
 * しおりデータのCRUD操作を提供するリポジトリクラス
 */

import { supabase, supabaseAdmin } from "./supabase";
import type {
  ItineraryData,
  TouristSpot,
  DaySchedule,
} from "@/types/itinerary";
import type { Database } from "@/types/database";

type DbItinerary = Database["public"]["Tables"]["itineraries"]["Row"];
type DbDaySchedule = Database["public"]["Tables"]["day_schedules"]["Row"];
type DbTouristSpot = Database["public"]["Tables"]["tourist_spots"]["Row"];

/**
 * UUID形式の文字列かどうかをチェック
 */
function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * 有効なUUIDを確保（無効な場合は新規生成）
 */
function ensureValidUUID(id: string | undefined | null): string {
  if (isValidUUID(id)) {
    return id!;
  }
  return crypto.randomUUID();
}

/**
 * フィルター条件
 */
export interface ItineraryFilters {
  status?: "draft" | "completed" | "archived";
  startDateFrom?: Date;
  startDateTo?: Date;
  destination?: string;
  search?: string; // タイトル・目的地での検索
}

/**
 * ソート条件
 */
export type SortBy = "created_at" | "updated_at" | "title" | "start_date";
export type SortOrder = "asc" | "desc";

/**
 * ページネーション設定
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * しおりリポジトリ
 */
export class ItineraryRepository {
  /**
   * データベース形式からアプリケーション形式へ変換
   */
  private async dbToItinerary(
    dbItinerary: DbItinerary,
    includeDays: boolean = true,
    client: typeof supabase = supabase
  ): Promise<ItineraryData> {
    let schedule: DaySchedule[] = [];

    if (includeDays) {
      // 日程詳細を取得（指定されたクライアントを使用）
      const { data: dbDays, error: daysError } = await client
        .from("day_schedules")
        .select("*")
        .eq("itinerary_id", dbItinerary.id)
        .order("day", { ascending: true });

      if (daysError) {
        console.error("Failed to fetch day schedules:", daysError);
      } else if (dbDays) {
        // 各日のスポットを取得（指定されたクライアントを使用）
        schedule = await Promise.all(
          dbDays.map(async (dbDay: DbDaySchedule) => {
            const { data: dbSpots, error: spotsError } = await client
              .from("tourist_spots")
              .select("*")
              .eq("day_schedule_id", dbDay.id)
              .order("order_index", { ascending: true });

            if (spotsError) {
              console.error("Failed to fetch tourist spots:", spotsError);
            }

            const spots: TouristSpot[] = (dbSpots || []).map(this.dbToSpot);

            return this.dbToDaySchedule(dbDay, spots);
          })
        );
      }
    }

    return {
      id: dbItinerary.id,
      userId: dbItinerary.user_id,
      title: dbItinerary.title,
      destination: dbItinerary.destination || "",
      startDate: dbItinerary.start_date || undefined,
      endDate: dbItinerary.end_date || undefined,
      duration: dbItinerary.duration || undefined,
      summary: dbItinerary.summary || undefined,
      schedule,
      totalBudget: dbItinerary.total_budget
        ? Number(dbItinerary.total_budget)
        : undefined,
      currency: dbItinerary.currency || "JPY",
      status: dbItinerary.status,
      createdAt: new Date(dbItinerary.created_at),
      updatedAt: new Date(dbItinerary.updated_at),
      isPublic: dbItinerary.is_public || undefined,
      publicSlug: dbItinerary.public_slug || undefined,
      publishedAt: dbItinerary.published_at
        ? new Date(dbItinerary.published_at)
        : undefined,
      viewCount: dbItinerary.view_count || undefined,
      allowPdfDownload: dbItinerary.allow_pdf_download || undefined,
      customMessage: dbItinerary.custom_message || undefined,
      phase: (dbItinerary.phase as ItineraryData["phase"]) || undefined,
      currentDay: dbItinerary.current_day || undefined,
    };
  }

  /**
   * DaySchedule変換
   */
  private dbToDaySchedule(
    dbDay: DbDaySchedule,
    spots: TouristSpot[]
  ): DaySchedule {
    return {
      id: dbDay.id,
      day: dbDay.day,
      date: dbDay.date || undefined,
      title: dbDay.title || undefined,
      spots,
      totalDistance: dbDay.total_distance
        ? Number(dbDay.total_distance)
        : undefined,
      totalCost: dbDay.total_cost ? Number(dbDay.total_cost) : undefined,
      status: (dbDay.status as DaySchedule["status"]) || undefined,
      theme: dbDay.theme || undefined,
      isLoading: dbDay.is_loading || undefined,
      error: dbDay.error || undefined,
      progress: dbDay.progress || undefined,
    };
  }

  /**
   * TouristSpot変換
   */
  private dbToSpot(dbSpot: DbTouristSpot): TouristSpot {
    return {
      id: dbSpot.id,
      name: dbSpot.name,
      description: dbSpot.description || "",
      location:
        dbSpot.location_lat && dbSpot.location_lng
          ? {
              lat: Number(dbSpot.location_lat),
              lng: Number(dbSpot.location_lng),
              address: dbSpot.location_address || undefined,
              placeId: dbSpot.location_place_id || undefined,
            }
          : undefined,
      scheduledTime: dbSpot.scheduled_time || undefined,
      duration: dbSpot.duration || undefined,
      category: (dbSpot.category as TouristSpot["category"]) || undefined,
      estimatedCost: dbSpot.estimated_cost
        ? Number(dbSpot.estimated_cost)
        : undefined,
      notes: dbSpot.notes || undefined,
      imageUrl: dbSpot.image_url || undefined,
    };
  }

  /**
   * しおりの作成
   */
  async createItinerary(
    userId: string,
    itinerary: ItineraryData
  ): Promise<ItineraryData> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    // 1. しおり本体を作成
    // クライアント側で生成したUUIDをそのまま使用
    const { data: dbItinerary, error: itineraryError } = await client
      .from("itineraries")
      .insert({
        id: itinerary.id, // クライアントのIDを保持
        user_id: userId,
        title: itinerary.title,
        destination: itinerary.destination,
        start_date: itinerary.startDate,
        end_date: itinerary.endDate,
        duration: itinerary.duration,
        summary: itinerary.summary,
        total_budget: itinerary.totalBudget,
        currency: itinerary.currency || "JPY",
        status: itinerary.status || "draft",
        is_public: itinerary.isPublic,
        public_slug: itinerary.publicSlug,
        published_at: itinerary.publishedAt?.toISOString(),
        view_count: itinerary.viewCount || 0,
        allow_pdf_download: itinerary.allowPdfDownload,
        custom_message: itinerary.customMessage,
        phase: itinerary.phase || "initial",
        current_day: itinerary.currentDay,
      } as any)
      .select()
      .single();

    if (itineraryError) {
      throw new Error(`Failed to create itinerary: ${itineraryError.message}`);
    }

    const typedItinerary = dbItinerary as DbItinerary;

    // 2. 日程詳細を作成
    if (itinerary.schedule && itinerary.schedule.length > 0) {
      for (const day of itinerary.schedule) {
        // 有効なUUIDを確保
        const dayId = ensureValidUUID(day.id);

        const { data: dbDay, error: dayError } = await client
          .from("day_schedules")
          .insert({
            id: dayId, // 確実にUUID形式のIDを設定
            itinerary_id: typedItinerary.id,
            day: day.day,
            date: day.date,
            title: day.title,
            total_distance: day.totalDistance,
            total_cost: day.totalCost,
            status: day.status || "draft",
            theme: day.theme,
            is_loading: day.isLoading,
            error: day.error,
            progress: day.progress,
          } as any)
          .select()
          .single();

        if (dayError) {
          console.error("Failed to create day schedule:", dayError);
          continue;
        }

        const typedDay = dbDay as DbDaySchedule;

        // 3. 観光スポットを作成
        if (day.spots && day.spots.length > 0) {
          const spotsToInsert = day.spots.map((spot, index) => ({
            id: ensureValidUUID(spot.id), // 確実にUUID形式のIDを設定
            day_schedule_id: typedDay.id,
            name: spot.name,
            description: spot.description,
            scheduled_time: spot.scheduledTime,
            duration: spot.duration,
            category: spot.category,
            estimated_cost: spot.estimatedCost,
            notes: spot.notes,
            image_url: spot.imageUrl,
            location_lat: spot.location?.lat,
            location_lng: spot.location?.lng,
            location_address: spot.location?.address,
            location_place_id: spot.location?.placeId,
            order_index: index,
          }));

          const { error: spotsError } = await client
            .from("tourist_spots")
            .insert(spotsToInsert as any);

          if (spotsError) {
            console.error("Failed to create tourist spots:", spotsError);
          }
        }
      }
    }

    // Admin権限を使ってデータを取得
    return this.dbToItinerary(typedItinerary, true, client);
  }

  /**
   * しおりの取得
   */
  async getItinerary(
    itineraryId: string,
    userId: string
  ): Promise<ItineraryData | null> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    const { data, error } = await client
      .from("itineraries")
      .select("*")
      .eq("id", itineraryId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Admin権限を使ってデータを取得
    return this.dbToItinerary(data, true, client);
  }

  /**
   * 公開しおりの取得（スラッグベース）
   */
  async getPublicItinerary(slug: string): Promise<ItineraryData | null> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    const { data, error } = await client
      .from("itineraries")
      .select("*")
      .eq("public_slug", slug)
      .eq("is_public", true)
      .single();

    if (error || !data) {
      return null;
    }

    // Admin権限を使ってデータを取得
    return this.dbToItinerary(data, true, client);
  }

  /**
   * 公開しおりの取得（IDベース）
   */
  async getPublicItineraryById(id: string): Promise<ItineraryData | null> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    const { data, error } = await client
      .from("itineraries")
      .select("*")
      .eq("id", id)
      .eq("is_public", true)
      .single();

    if (error || !data) {
      return null;
    }

    // Admin権限を使ってデータを取得
    return this.dbToItinerary(data, true, client);
  }

  /**
   * しおり一覧の取得
   */
  async listItineraries(
    userId: string,
    filters?: ItineraryFilters,
    sortBy: SortBy = "updated_at",
    sortOrder: SortOrder = "desc",
    pagination?: PaginationOptions
  ): Promise<PaginatedResponse<ItineraryData>> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    let query = client
      .from("itineraries")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    // フィルター適用
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDateFrom) {
      query = query.gte(
        "start_date",
        filters.startDateFrom.toISOString().split("T")[0]
      );
    }
    if (filters?.startDateTo) {
      query = query.lte(
        "start_date",
        filters.startDateTo.toISOString().split("T")[0]
      );
    }
    if (filters?.destination) {
      query = query.ilike("destination", `%${filters.destination}%`);
    }
    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,destination.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`
      );
    }

    // ソート
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // ページネーション
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (pagination) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list itineraries: ${error.message}`);
    }

    const itineraries = await Promise.all(
      (data || []).map((item: DbItinerary) => this.dbToItinerary(item, false))
    );

    return {
      data: itineraries,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  }

  /**
   * しおりの更新
   */
  async updateItinerary(
    itineraryId: string,
    userId: string,
    updates: Partial<ItineraryData>
  ): Promise<ItineraryData> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    // 1. しおり本体を更新
    const { data: dbItinerary, error: itineraryError } = await (client as any)
      .from("itineraries")
      .update({
        title: updates.title,
        destination: updates.destination,
        start_date: updates.startDate,
        end_date: updates.endDate,
        duration: updates.duration,
        summary: updates.summary,
        total_budget: updates.totalBudget,
        currency: updates.currency,
        status: updates.status,
        is_public: updates.isPublic,
        public_slug: updates.publicSlug,
        published_at: updates.publishedAt?.toISOString(),
        view_count: updates.viewCount,
        allow_pdf_download: updates.allowPdfDownload,
        custom_message: updates.customMessage,
        phase: updates.phase,
        current_day: updates.currentDay,
      } as any)
      .eq("id", itineraryId)
      .eq("user_id", userId)
      .select()
      .single();

    if (itineraryError) {
      throw new Error(`Failed to update itinerary: ${itineraryError.message}`);
    }

    // 2. 日程詳細を更新（必要に応じて）
    if (updates.schedule) {
      // 既存の日程を削除
      await client
        .from("day_schedules")
        .delete()
        .eq("itinerary_id", itineraryId);

      // 新しい日程を作成
      for (const day of updates.schedule) {
        // 有効なUUIDを確保
        const dayId = ensureValidUUID(day.id);

        const { data: dbDay, error: dayError } = await client
          .from("day_schedules")
          .insert({
            id: dayId, // 確実にUUID形式のIDを設定
            itinerary_id: itineraryId,
            day: day.day,
            date: day.date,
            title: day.title,
            total_distance: day.totalDistance,
            total_cost: day.totalCost,
            status: day.status,
            theme: day.theme,
            is_loading: day.isLoading,
            error: day.error,
            progress: day.progress,
          } as any)
          .select()
          .single();

        if (dayError) {
          console.error("Failed to update day schedule:", dayError);
          continue;
        }

        const typedDay = dbDay as DbDaySchedule;

        // スポットを作成
        if (day.spots && day.spots.length > 0) {
          const spotsToInsert = day.spots.map((spot, index) => ({
            id: ensureValidUUID(spot.id), // 確実にUUID形式のIDを設定
            day_schedule_id: typedDay.id,
            name: spot.name,
            description: spot.description,
            scheduled_time: spot.scheduledTime,
            duration: spot.duration,
            category: spot.category,
            estimated_cost: spot.estimatedCost,
            notes: spot.notes,
            image_url: spot.imageUrl,
            location_lat: spot.location?.lat,
            location_lng: spot.location?.lng,
            location_address: spot.location?.address,
            location_place_id: spot.location?.placeId,
            order_index: index,
          }));

          await client.from("tourist_spots").insert(spotsToInsert as any);
        }
      }
    }

    // Admin権限を使ってデータを取得
    return this.dbToItinerary(dbItinerary, true, client);
  }

  /**
   * しおりの削除
   */
  async deleteItinerary(itineraryId: string, userId: string): Promise<boolean> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    const { error } = await client
      .from("itineraries")
      .delete()
      .eq("id", itineraryId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete itinerary: ${error.message}`);
    }

    return true;
  }

  /**
   * 閲覧数のインクリメント
   */
  async incrementViewCount(slug: string): Promise<void> {
    // RLSをバイパスするためAdmin権限を使用
    const client = (supabaseAdmin || supabase) as typeof supabase;

    const { error } = await (client as any).rpc("increment_view_count", {
      slug,
    });

    if (error) {
      console.error("Failed to increment view count:", error);
    }
  }
}

// シングルトンインスタンス
export const itineraryRepository = new ItineraryRepository();
