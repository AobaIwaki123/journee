/**
 * モックデータ: しおり一覧（10-20件）
 */

import { ItineraryData } from "@/types/itinerary";

/**
 * モックしおりデータ（15件）
 */
export const mockItineraries: ItineraryData[] = [
  {
    id: "mock-001",
    userId: "user-001",
    title: "東京3日間の旅",
    destination: "東京",
    startDate: "2025-11-01",
    endDate: "2025-11-03",
    duration: 3,
    summary: "東京の主要観光スポットを巡る3日間の旅",
    schedule: [
      {
        day: 1,
        date: "2025-11-01",
        title: "浅草・スカイツリーエリア",
        spots: [
          {
            id: "spot-001-1",
            name: "浅草寺",
            description: "東京の代表的な観光地",
            location: {
              lat: 35.7148,
              lng: 139.7967,
              address: "東京都台東区浅草2-3-1",
            },
            scheduledTime: "10:00",
            duration: 90,
            category: "sightseeing",
            estimatedCost: 0,
          },
          {
            id: "spot-001-2",
            name: "東京スカイツリー",
            description: "東京のランドマークタワー",
            location: {
              lat: 35.7101,
              lng: 139.8107,
              address: "東京都墨田区押上1-1-2",
            },
            scheduledTime: "14:00",
            duration: 120,
            category: "sightseeing",
            estimatedCost: 2100,
          },
        ],
        totalDistance: 5.2,
        totalCost: 2100,
      },
      {
        day: 2,
        date: "2025-11-02",
        title: "渋谷・原宿エリア",
        spots: [
          {
            id: "spot-001-3",
            name: "明治神宮",
            description: "東京を代表する神社",
            location: {
              lat: 35.6764,
              lng: 139.6993,
              address: "東京都渋谷区代々木神園町1-1",
            },
            scheduledTime: "09:30",
            duration: 60,
            category: "sightseeing",
            estimatedCost: 0,
          },
          {
            id: "spot-001-4",
            name: "竹下通り",
            description: "原宿のメインストリート",
            location: {
              lat: 35.6705,
              lng: 139.7038,
              address: "東京都渋谷区神宮前1丁目",
            },
            scheduledTime: "11:00",
            duration: 90,
            category: "sightseeing",
            estimatedCost: 3000,
          },
        ],
        totalDistance: 3.8,
        totalCost: 3000,
      },
      {
        day: 3,
        date: "2025-11-03",
        title: "銀座・築地エリア",
        spots: [
          {
            id: "spot-001-5",
            name: "築地場外市場",
            description: "新鮮な海鮮が楽しめる市場",
            location: {
              lat: 35.6655,
              lng: 139.7707,
              address: "東京都中央区築地4丁目",
            },
            scheduledTime: "08:00",
            duration: 120,
            category: "dining",
            estimatedCost: 5000,
          },
          {
            id: "spot-001-6",
            name: "銀座ショッピング",
            description: "高級ショッピングエリア",
            location: {
              lat: 35.6717,
              lng: 139.764,
              address: "東京都中央区銀座4丁目",
            },
            scheduledTime: "13:00",
            duration: 180,
            category: "sightseeing",
            estimatedCost: 10000,
          },
        ],
        totalDistance: 2.5,
        totalCost: 15000,
      },
    ],
    totalBudget: 50000,
    status: "completed",
    createdAt: new Date("2025-09-15T10:00:00Z"),
    updatedAt: new Date("2025-09-20T14:30:00Z"),
    isPublic: false,
  },
  {
    id: "mock-002",
    userId: "user-001",
    title: "京都紅葉巡り5日間",
    destination: "京都",
    startDate: "2025-11-20",
    endDate: "2025-11-24",
    duration: 5,
    summary: "京都の紅葉スポットを巡る秋の旅",
    schedule: [
      {
        day: 1,
        date: "2025-11-20",
        title: "嵐山エリア",
        spots: [
          {
            id: "spot-002-1",
            name: "渡月橋",
            description: "嵐山のシンボル",
            location: {
              lat: 35.0094,
              lng: 135.6788,
              address: "京都府京都市右京区嵯峨中ノ島町",
            },
            scheduledTime: "10:00",
            duration: 60,
            category: "sightseeing",
            estimatedCost: 0,
          },
        ],
        totalDistance: 1.5,
        totalCost: 0,
      },
    ],
    totalBudget: 80000,
    status: "draft",
    createdAt: new Date("2025-10-01T09:00:00Z"),
    updatedAt: new Date("2025-10-05T16:45:00Z"),
    isPublic: false,
  },
  {
    id: "mock-003",
    userId: "user-001",
    title: "北海道グルメツアー4日間",
    destination: "札幌",
    startDate: "2025-12-10",
    endDate: "2025-12-13",
    duration: 4,
    summary: "札幌の美味しいグルメを堪能する4日間",
    schedule: [
      {
        day: 1,
        date: "2025-12-10",
        title: "札幌市内観光",
        spots: [
          {
            id: "spot-003-1",
            name: "時計台",
            description: "札幌のシンボル",
            location: {
              lat: 43.0622,
              lng: 141.3531,
              address: "北海道札幌市中央区北1条西2丁目",
            },
            scheduledTime: "10:00",
            duration: 30,
            category: "sightseeing",
            estimatedCost: 200,
          },
          {
            id: "spot-003-2",
            name: "すすきのラーメン横丁",
            description: "札幌ラーメンの名店が集まるエリア",
            location: {
              lat: 43.0537,
              lng: 141.3537,
              address: "北海道札幌市中央区南5条西3丁目",
            },
            scheduledTime: "19:00",
            duration: 90,
            category: "dining",
            estimatedCost: 1500,
          },
        ],
        totalDistance: 4.2,
        totalCost: 1700,
      },
    ],
    totalBudget: 60000,
    status: "draft",
    createdAt: new Date("2025-09-28T11:20:00Z"),
    updatedAt: new Date("2025-10-02T10:15:00Z"),
    isPublic: false,
  },
  {
    id: "mock-004",
    userId: "user-001",
    title: "沖縄ビーチリゾート6日間",
    destination: "沖縄",
    startDate: "2025-08-01",
    endDate: "2025-08-06",
    duration: 6,
    summary: "沖縄のビーチでリラックス",
    schedule: [],
    totalBudget: 120000,
    status: "completed",
    createdAt: new Date("2025-06-10T14:00:00Z"),
    updatedAt: new Date("2025-07-25T18:30:00Z"),
    isPublic: true,
  },
  {
    id: "mock-005",
    userId: "user-001",
    title: "大阪食い倒れツアー3日間",
    destination: "大阪",
    startDate: "2025-11-15",
    endDate: "2025-11-17",
    duration: 3,
    summary: "大阪のグルメを楽しむ3日間",
    schedule: [
      {
        day: 1,
        date: "2025-11-15",
        title: "道頓堀・心斎橋",
        spots: [
          {
            id: "spot-005-1",
            name: "道頓堀",
            description: "大阪を代表する繁華街",
            location: {
              lat: 34.6686,
              lng: 135.5013,
              address: "大阪府大阪市中央区道頓堀",
            },
            scheduledTime: "18:00",
            duration: 180,
            category: "dining",
            estimatedCost: 5000,
          },
        ],
        totalDistance: 2.0,
        totalCost: 5000,
      },
    ],
    totalBudget: 45000,
    status: "draft",
    createdAt: new Date("2025-10-03T13:30:00Z"),
    updatedAt: new Date("2025-10-04T09:20:00Z"),
    isPublic: false,
  },
  {
    id: "mock-006",
    userId: "user-001",
    title: "金沢歴史探訪2日間",
    destination: "金沢",
    startDate: "2025-10-20",
    endDate: "2025-10-21",
    duration: 2,
    summary: "金沢の歴史と文化を体験",
    schedule: [],
    totalBudget: 35000,
    status: "archived",
    createdAt: new Date("2025-08-15T10:00:00Z"),
    updatedAt: new Date("2025-09-10T16:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-007",
    userId: "user-001",
    title: "広島平和記念ツアー2日間",
    destination: "広島",
    startDate: "2025-11-05",
    endDate: "2025-11-06",
    duration: 2,
    summary: "平和について考える広島の旅",
    schedule: [],
    totalBudget: 30000,
    status: "completed",
    createdAt: new Date("2025-09-01T08:00:00Z"),
    updatedAt: new Date("2025-10-01T12:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-008",
    userId: "user-001",
    title: "福岡博多グルメ旅3日間",
    destination: "福岡",
    startDate: "2025-12-01",
    endDate: "2025-12-03",
    duration: 3,
    summary: "博多のグルメを満喫する旅",
    schedule: [],
    totalBudget: 50000,
    status: "draft",
    createdAt: new Date("2025-10-05T15:00:00Z"),
    updatedAt: new Date("2025-10-06T11:30:00Z"),
    isPublic: false,
  },
  {
    id: "mock-009",
    userId: "user-001",
    title: "名古屋城と熱田神宮巡り",
    destination: "名古屋",
    startDate: "2025-11-10",
    endDate: "2025-11-11",
    duration: 2,
    summary: "名古屋の歴史スポットを巡る",
    schedule: [],
    totalBudget: 25000,
    status: "draft",
    createdAt: new Date("2025-10-02T12:00:00Z"),
    updatedAt: new Date("2025-10-03T14:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-010",
    userId: "user-001",
    title: "仙台牛タンと温泉の旅",
    destination: "仙台",
    startDate: "2025-12-15",
    endDate: "2025-12-17",
    duration: 3,
    summary: "仙台グルメと温泉を楽しむ",
    schedule: [],
    totalBudget: 55000,
    status: "draft",
    createdAt: new Date("2025-10-04T10:30:00Z"),
    updatedAt: new Date("2025-10-05T09:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-011",
    userId: "user-001",
    title: "長野スキー＆温泉4日間",
    destination: "長野",
    startDate: "2026-01-20",
    endDate: "2026-01-23",
    duration: 4,
    summary: "冬の長野でスキーと温泉を満喫",
    schedule: [],
    totalBudget: 70000,
    status: "draft",
    createdAt: new Date("2025-10-06T16:00:00Z"),
    updatedAt: new Date("2025-10-06T17:30:00Z"),
    isPublic: false,
  },
  {
    id: "mock-012",
    userId: "user-001",
    title: "神戸夜景とスイーツ巡り",
    destination: "神戸",
    startDate: "2025-11-25",
    endDate: "2025-11-26",
    duration: 2,
    summary: "神戸の夜景とスイーツを楽しむ",
    schedule: [],
    totalBudget: 32000,
    status: "draft",
    createdAt: new Date("2025-10-01T14:20:00Z"),
    updatedAt: new Date("2025-10-02T11:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-013",
    userId: "user-001",
    title: "鎌倉寺院巡り1日プラン",
    destination: "鎌倉",
    startDate: "2025-11-08",
    endDate: "2025-11-08",
    duration: 1,
    summary: "鎌倉の寺院を1日で巡る",
    schedule: [],
    totalBudget: 15000,
    status: "completed",
    createdAt: new Date("2025-09-20T09:00:00Z"),
    updatedAt: new Date("2025-10-01T15:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-014",
    userId: "user-001",
    title: "奈良の大仏と鹿公園",
    destination: "奈良",
    startDate: "2025-11-12",
    endDate: "2025-11-13",
    duration: 2,
    summary: "奈良の歴史と自然を楽しむ",
    schedule: [],
    totalBudget: 28000,
    status: "draft",
    createdAt: new Date("2025-09-25T10:00:00Z"),
    updatedAt: new Date("2025-10-03T13:00:00Z"),
    isPublic: false,
  },
  {
    id: "mock-015",
    userId: "user-001",
    title: "箱根温泉リラックス旅",
    destination: "箱根",
    startDate: "2025-12-20",
    endDate: "2025-12-22",
    duration: 3,
    summary: "箱根の温泉でリラックス",
    schedule: [],
    totalBudget: 65000,
    status: "draft",
    createdAt: new Date("2025-10-05T11:00:00Z"),
    updatedAt: new Date("2025-10-06T10:00:00Z"),
    isPublic: false,
  },
];

/**
 * LocalStorageのキー
 */
export const STORAGE_KEY = "journee_itineraries";

/**
 * LocalStorageからしおり一覧を読み込み
 */
export const loadItinerariesFromStorage = (): ItineraryData[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return mockItineraries;

    const parsed = JSON.parse(stored);
    // Date型に変換
    return parsed.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
    }));
  } catch (error) {
    console.error("Failed to load itineraries from storage:", error);
    return mockItineraries;
  }
};

/**
 * LocalStorageにしおり一覧を保存
 */
export const saveItinerariesToStorage = (
  itineraries: ItineraryData[]
): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itineraries));
  } catch (error) {
    console.error("Failed to save itineraries to storage:", error);
  }
};

/**
 * しおりをIDで取得
 */
export const getItineraryById = (id: string): ItineraryData | undefined => {
  const itineraries = loadItinerariesFromStorage();
  return itineraries.find((item) => item.id === id);
};

/**
 * しおりを追加
 */
export const addItinerary = (itinerary: ItineraryData): void => {
  const itineraries = loadItinerariesFromStorage();
  itineraries.push(itinerary);
  saveItinerariesToStorage(itineraries);
};

/**
 * しおりを更新
 */
export const updateItinerary = (
  id: string,
  updates: Partial<ItineraryData>
): void => {
  const itineraries = loadItinerariesFromStorage();
  const index = itineraries.findIndex((item) => item.id === id);

  if (index !== -1) {
    itineraries[index] = {
      ...itineraries[index],
      ...updates,
      updatedAt: new Date(),
    };
    saveItinerariesToStorage(itineraries);
  }
};

/**
 * しおりを削除
 */
export const deleteItinerary = (id: string): void => {
  const itineraries = loadItinerariesFromStorage();
  const filtered = itineraries.filter((item) => item.id !== id);
  saveItinerariesToStorage(filtered);
};

/**
 * 初期データをLocalStorageに保存（初回のみ）
 */
export const initializeMockData = (): void => {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveItinerariesToStorage(mockItineraries);
  }
};

/**
 * 全てのしおりをクリア（マイグレーション後に使用）
 */
export const clearAllItineraries = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
};
