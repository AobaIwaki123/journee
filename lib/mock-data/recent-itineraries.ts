import { ItineraryListItem } from "@/types/itinerary";

/**
 * 最近のしおりのモックデータを生成
 */
export function getMockRecentItineraries(): ItineraryListItem[] {
  return [
    {
      id: "d6e7f8a9-bacb-4dce-dfed-afbcedfedfa0",
      title: "京都の秋を満喫する旅",
      destination: "京都",
      startDate: "2025-11-15",
      endDate: "2025-11-18",
      status: "draft",
      createdAt: new Date("2025-10-05"),
      updatedAt: new Date("2025-10-07"),
      thumbnailUrl:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop",
    },
    {
      id: "e7f8a9ba-cbdc-4edf-edaf-bcedfedfabc1",
      title: "パリ美食の旅",
      destination: "パリ",
      startDate: "2025-12-20",
      endDate: "2025-12-27",
      status: "completed",
      createdAt: new Date("2025-09-28"),
      updatedAt: new Date("2025-10-02"),
      thumbnailUrl:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
    },
    {
      id: "f8a9bacb-dced-4fed-afbc-edfedfabced2",
      title: "沖縄リゾート満喫プラン",
      destination: "沖縄",
      startDate: "2026-01-10",
      endDate: "2026-01-13",
      status: "draft",
      createdAt: new Date("2025-09-15"),
      updatedAt: new Date("2025-09-20"),
      thumbnailUrl:
        "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop",
    },
  ];
}
