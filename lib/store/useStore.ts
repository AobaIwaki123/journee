import { create } from "zustand";
import { Message } from "@/types/chat";
import {
  ItineraryData,
  TouristSpot,
  DaySchedule,
  ItineraryPhase,
  DayStatus,
  PublicItinerarySettings,
} from "@/types/itinerary";
import type { AIModelId } from "@/types/ai";
import type { AppSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import type {
  RequirementChecklistItem,
  ChecklistStatus,
  ButtonReadiness,
} from "@/types/requirements";
import { getRequirementsForPhase } from "@/lib/requirements/checklist-config";
import {
  calculateChecklistStatus,
  determineButtonReadiness,
} from "@/lib/requirements/checklist-utils";
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey,
  saveSelectedAI,
  loadSelectedAI,
  saveAutoProgressMode,
  loadAutoProgressMode,
  saveAutoProgressSettings,
  loadAutoProgressSettings,
  type AutoProgressSettings,
  saveAppSettings,
  loadAppSettings,
  savePublicItinerary,
  removePublicItinerary,
  saveChatPanelWidth,
  loadChatPanelWidth,
} from "@/lib/utils/storage";
import { DEFAULT_AI_MODEL } from "@/lib/ai/models";
import { createHistoryUpdate } from "./useStore-helper";
import {
  sortSpotsByTime,
  adjustTimeAfterReorder,
} from "@/lib/utils/time-utils";
import {
  updateDayBudget,
  updateItineraryBudget,
} from "@/lib/utils/budget-utils";
import { generateId } from "@/lib/utils/id-generator";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface HistoryState {
  past: ItineraryData[];
  present: ItineraryData | null;
  future: ItineraryData[];
}

/**
 * しおりフィルター条件
 */
export interface ItineraryFilter {
  status?: "draft" | "completed" | "archived" | "all";
  destination?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * しおりソート条件
 */
export type ItinerarySortField =
  | "updatedAt"
  | "createdAt"
  | "title"
  | "startDate";
export type ItinerarySortOrder = "asc" | "desc";

export interface ItinerarySort {
  field: ItinerarySortField;
  order: ItinerarySortOrder;
}

interface AppState {
  // Chat state
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  clearMessages: () => void;

  // Itinerary state
  currentItinerary: ItineraryData | null;
  setItinerary: (itinerary: ItineraryData | null) => void;
  updateItinerary: (updates: Partial<ItineraryData>) => void;

  // Phase 4: Planning phase state
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  setPlanningPhase: (phase: ItineraryPhase) => void;
  setCurrentDetailingDay: (day: number | null) => void;
  proceedToNextStep: () => void;
  resetPlanning: () => void;

  // Phase 4.8: Requirements checklist state
  requirementsChecklist: RequirementChecklistItem[];
  checklistStatus: ChecklistStatus | null;
  buttonReadiness: ButtonReadiness | null;
  updateChecklist: () => void;
  getChecklistForPhase: (phase: ItineraryPhase) => RequirementChecklistItem[];

  // Phase 4.10: Auto progress state
  autoProgressMode: boolean;
  autoProgressSettings: AutoProgressSettings;
  isAutoProgressing: boolean;
  autoProgressState: {
    phase: "idle" | "skeleton" | "detailing" | "completed" | "error";
    currentStep: string;
    currentDay?: number;
    totalDays?: number;
    progress: number;
    error?: string;
  } | null;
  enableAutoProgress: () => void;
  disableAutoProgress: () => void;
  setAutoProgressSettings: (settings: AutoProgressSettings) => void;
  setIsAutoProgressing: (value: boolean) => void;
  setAutoProgressState: (state: any) => void;
  shouldTriggerAutoProgress: () => boolean;

  // Phase 5.1.2: Itinerary editing actions
  updateItineraryTitle: (title: string) => void;
  updateItineraryDestination: (destination: string) => void;
  updateSpot: (
    dayIndex: number,
    spotId: string,
    updates: Partial<TouristSpot>
  ) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  addSpot: (dayIndex: number, spot: TouristSpot) => void;
  reorderSpots: (
    dayIndex: number,
    startIndex: number,
    endIndex: number
  ) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;

  // Phase 5.4: Itinerary list state
  itineraryFilter: ItineraryFilter;
  itinerarySort: ItinerarySort;
  setItineraryFilter: (filter: ItineraryFilter) => void;
  setItinerarySort: (sort: ItinerarySort) => void;
  resetItineraryFilters: () => void;

  // UI state
  selectedAI: AIModelId;
  claudeApiKey: string;
  setSelectedAI: (ai: AIModelId) => void;
  setClaudeApiKey: (key: string) => void;
  removeClaudeApiKey: () => void;
  initializeFromStorage: () => void;

  // Mobile UI state (Phase 7.2)
  mobileActiveTab: "chat" | "itinerary";
  setMobileActiveTab: (tab: "chat" | "itinerary") => void;

  // Settings state (Phase 5.4.3)
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateGeneralSettings: (updates: Partial<AppSettings["general"]>) => void;
  updateSoundSettings: (updates: Partial<AppSettings["sound"]>) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Toast notifications (Phase 5.1.2)
  toasts: ToastMessage[];
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;

  // Editing state (Phase 5.1.2)
  isSaving: boolean;
  setSaving: (saving: boolean) => void;

  // Auto-save state (Phase 5.2)
  lastSaveTime: Date | null;
  setLastSaveTime: (time: Date | null) => void;

  // Storage initialization state (Phase 5.2.10)
  isStorageInitialized: boolean;
  setStorageInitialized: (initialized: boolean) => void;

  // Undo/Redo state (Phase 5.1.3)
  history: HistoryState;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Phase 5.5: Itinerary sharing/publishing actions
  publishItinerary: (settings: PublicItinerarySettings) => Promise<{
    success: boolean;
    publicUrl?: string;
    slug?: string;
    error?: string;
  }>;
  unpublishItinerary: () => Promise<{ success: boolean; error?: string }>;
  updatePublicSettings: (settings: Partial<PublicItinerarySettings>) => void;

  // Phase 7.1: Panel resizer state
  chatPanelWidth: number; // チャットパネルの幅（パーセンテージ: 30-70）
  setChatPanelWidth: (width: number) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  // Chat state
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: "",
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  appendStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
  clearMessages: () => set({ messages: [], streamingMessage: "" }),

  // Itinerary state
  currentItinerary: null,
  setItinerary: (itinerary) => {
    // LocalStorageに保存
    if (typeof window !== "undefined") {
      try {
        const currentStorage = localStorage.getItem("journee-storage");
        const parsed = currentStorage ? JSON.parse(currentStorage) : {};
        const newStorage = {
          ...parsed,
          state: {
            ...(parsed.state || {}),
            currentItinerary: itinerary,
          },
          version: 0,
        };
        localStorage.setItem("journee-storage", JSON.stringify(newStorage));
      } catch (e) {
        console.error("Failed to save itinerary to localStorage:", e);
      }
    }

    set((state) => {
      // Update planningPhase based on itinerary.phase if provided
      const newPhase = itinerary?.phase || state.planningPhase;

      // If itinerary has schedule data but phase is still initial, advance to collecting
      const shouldAdvancePhase =
        itinerary &&
        itinerary.schedule &&
        itinerary.schedule.length > 0 &&
        state.planningPhase === "initial" &&
        !itinerary.phase;

      const finalPhase = shouldAdvancePhase ? "collecting" : newPhase;

      console.log("📝 setItinerary called:", {
        hasItinerary: !!itinerary,
        scheduleLength: itinerary?.schedule?.length || 0,
        itineraryPhase: itinerary?.phase,
        currentPhase: state.planningPhase,
        newPhase: finalPhase,
      });

      return {
        currentItinerary: itinerary,
        planningPhase: finalPhase,
        history: {
          past: itinerary
            ? ([...state.history.past, state.currentItinerary].filter(
                Boolean
              ) as ItineraryData[])
            : [],
          present: itinerary,
          future: [],
        },
      };
    });
  },
  updateItinerary: (updates) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? {
            ...state.currentItinerary,
            ...updates,
            updatedAt: new Date(),
          }
        : null;

      // LocalStorageに保存
      if (typeof window !== "undefined" && newItinerary) {
        try {
          const currentStorage = localStorage.getItem("journee-storage");
          const parsed = currentStorage ? JSON.parse(currentStorage) : {};
          const newStorage = {
            ...parsed,
            state: {
              ...(parsed.state || {}),
              currentItinerary: newItinerary,
            },
            version: 0,
          };
          localStorage.setItem("journee-storage", JSON.stringify(newStorage));
        } catch (e) {
          console.error("Failed to save itinerary to localStorage:", e);
        }
      }

      // Update planningPhase if phase field is in updates
      const newPhase = updates.phase || state.planningPhase;

      return {
        currentItinerary: newItinerary,
        planningPhase: newPhase,
        history: {
          past: state.currentItinerary
            ? [...state.history.past, state.currentItinerary]
            : state.history.past,
          present: newItinerary,
          future: [],
        },
      };
    }),

  // Phase 4: Planning phase state
  planningPhase: "initial",
  currentDetailingDay: null,
  setPlanningPhase: (phase) => set({ planningPhase: phase }),
  setCurrentDetailingDay: (day) => set({ currentDetailingDay: day }),

  // フェーズを次に進める
  proceedToNextStep: () =>
    set((state) => {
      const { planningPhase, currentItinerary, currentDetailingDay } = state;
      let newPhase: ItineraryPhase = planningPhase;
      let newDetailingDay: number | null = currentDetailingDay;
      let updates: Partial<ItineraryData> = {};

      switch (planningPhase) {
        case "initial":
          // 初期状態 → 情報収集フェーズへ
          newPhase = "collecting";
          break;

        case "collecting":
          // 情報収集完了 → 骨組み作成フェーズへ
          newPhase = "skeleton";
          break;

        case "skeleton":
          // 骨組み完了 → 詳細化フェーズへ（1日目から開始）
          newPhase = "detailing";
          newDetailingDay = 1;
          updates.phase = "detailing";
          updates.currentDay = 1;
          break;

        case "detailing":
          // 詳細化中 → 次の日へ、または完成へ
          if (currentItinerary && currentDetailingDay !== null) {
            const totalDays =
              currentItinerary.duration || currentItinerary.schedule.length;
            if (currentDetailingDay < totalDays) {
              // 次の日へ
              newDetailingDay = currentDetailingDay + 1;
              updates.currentDay = newDetailingDay;
            } else {
              // 全ての日が完了 → 完成フェーズへ
              newPhase = "completed";
              newDetailingDay = null;
              updates.phase = "completed";
              updates.currentDay = undefined;
              updates.status = "completed";
            }
          }
          break;

        case "completed":
          // 完成済み → 何もしない
          break;
      }

      return {
        planningPhase: newPhase,
        currentDetailingDay: newDetailingDay,
        currentItinerary: state.currentItinerary
          ? { ...state.currentItinerary, ...updates }
          : null,
      };
    }),

  // プランニング状態をリセット
  resetPlanning: () =>
    set({
      planningPhase: "initial",
      currentDetailingDay: null,
      requirementsChecklist: [],
      checklistStatus: null,
      buttonReadiness: null,
    }),

  // Phase 4.8: Requirements checklist state
  requirementsChecklist: [],
  checklistStatus: null,
  buttonReadiness: null,

  // Phase 4.10: Auto progress state
  autoProgressMode: true,
  autoProgressSettings: {
    enabled: true,
    parallelCount: 3,
    showNotifications: true,
  },
  isAutoProgressing: false,
  autoProgressState: null,

  // Phase 4.8: Update requirements checklist
  updateChecklist: () => {
    const { messages, currentItinerary, planningPhase } = get();

    // 現在のフェーズの要件を取得
    const requirements = getRequirementsForPhase(planningPhase);

    // 各項目を評価
    const updatedItems = requirements.items.map((item) => {
      if (item.extractor) {
        const value = item.extractor(messages, currentItinerary || undefined);
        const status = value ? "filled" : "empty";
        return {
          ...item,
          value,
          status,
        } as RequirementChecklistItem;
      }
      return item;
    });

    // 充足率を計算
    const status = calculateChecklistStatus(updatedItems, requirements);

    // ボタンの準備度を決定
    const readiness = determineButtonReadiness(status, planningPhase);

    set({
      requirementsChecklist: updatedItems,
      checklistStatus: status,
      buttonReadiness: readiness,
    });
  },

  // Get checklist for specific phase
  getChecklistForPhase: (phase: ItineraryPhase) => {
    const requirements = getRequirementsForPhase(phase);
    return requirements.items;
  },

  // Phase 4.10: Auto progress actions
  enableAutoProgress: () => {
    saveAutoProgressMode(true);
    set({ autoProgressMode: true });
  },
  disableAutoProgress: () => {
    saveAutoProgressMode(false);
    set({ autoProgressMode: false });
  },
  setAutoProgressSettings: (settings) => {
    saveAutoProgressSettings(settings);
    set({ autoProgressSettings: settings });
  },
  setIsAutoProgressing: (value) => set({ isAutoProgressing: value }),
  setAutoProgressState: (state) => set({ autoProgressState: state }),

  /**
   * Phase 4.10.1: 自動進行をトリガーすべきか判定
   */
  shouldTriggerAutoProgress: () => {
    const state = get();

    // 自動進行モードがOFFなら false
    if (!state.autoProgressMode || !state.autoProgressSettings.enabled) {
      return false;
    }

    // すでに自動進行中なら false
    if (state.isAutoProgressing) {
      return false;
    }

    // collecting フェーズでのみトリガー
    if (state.planningPhase !== "collecting") {
      return false;
    }

    // 必須情報が揃っているかチェック
    if (!state.checklistStatus?.allRequiredFilled) {
      return false;
    }

    return true;
  },

  // Phase 5.1.2: Itinerary editing actions
  updateItineraryTitle: (title) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? { ...state.currentItinerary, title, updatedAt: new Date() }
        : null;
      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  updateItineraryDestination: (destination) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? { ...state.currentItinerary, destination, updatedAt: new Date() }
        : null;
      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  updateSpot: (dayIndex, spotId, updates) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];

      if (!oldDaySchedule) return state;

      const spotIndex = oldDaySchedule.spots.findIndex((s) => s.id === spotId);
      if (spotIndex === -1) return state;

      // 新しいspots配列を作成（イミュータブル）
      const newSpots = [...oldDaySchedule.spots];

      // スポット情報を更新
      newSpots[spotIndex] = {
        ...newSpots[spotIndex],
        ...updates,
      };

      // 時刻が変更された場合、時刻順にソート
      const sortedSpots =
        updates.scheduledTime !== undefined
          ? sortSpotsByTime(newSpots)
          : newSpots;

      // 新しいdayScheduleオブジェクトを作成（イミュータブル）
      newSchedule[dayIndex] = updateDayBudget({
        ...oldDaySchedule,
        spots: sortedSpots,
      });

      const newItinerary = updateItineraryBudget({
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      });

      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  deleteSpot: (dayIndex, spotId) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];

      if (!oldDaySchedule) return state;

      // 新しいspots配列を作成（イミュータブル）
      const newSpots = oldDaySchedule.spots.filter((s) => s.id !== spotId);

      // 新しいdayScheduleオブジェクトを作成（イミュータブル）
      newSchedule[dayIndex] = updateDayBudget({
        ...oldDaySchedule,
        spots: newSpots,
      });

      const newItinerary = updateItineraryBudget({
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      });

      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  addSpot: (dayIndex, spot) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];

      if (!oldDaySchedule) return state;

      // 新しいspots配列を作成（イミュータブル）
      const newSpots = [...oldDaySchedule.spots, spot];

      // スポット追加後、時刻順にソート
      const sortedSpots = sortSpotsByTime(newSpots);

      // 新しいdayScheduleオブジェクトを作成（イミュータブル）
      newSchedule[dayIndex] = updateDayBudget({
        ...oldDaySchedule,
        spots: sortedSpots,
      });

      const newItinerary = updateItineraryBudget({
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      });

      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  reorderSpots: (dayIndex, startIndex, endIndex) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];

      if (!oldDaySchedule) return state;

      // 新しいspots配列を作成（イミュータブル）
      const spots = [...oldDaySchedule.spots];
      const [removed] = spots.splice(startIndex, 1);
      spots.splice(endIndex, 0, removed);

      // 並び替え後、移動したスポットの時刻を自動調整
      const adjustedSpots = adjustTimeAfterReorder(spots, endIndex);

      // 新しいdayScheduleオブジェクトを作成（イミュータブル）
      newSchedule[dayIndex] = updateDayBudget({
        ...oldDaySchedule,
        spots: adjustedSpots,
      });

      const newItinerary = updateItineraryBudget({
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      });

      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  moveSpot: (fromDayIndex, toDayIndex, spotId) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const newSchedule = [...state.currentItinerary.schedule];
      const oldFromDay = newSchedule[fromDayIndex];
      const oldToDay = newSchedule[toDayIndex];

      if (!oldFromDay || !oldToDay) return state;

      const spotIndex = oldFromDay.spots.findIndex((s) => s.id === spotId);
      if (spotIndex === -1) return state;

      // 新しいspots配列を作成（イミュータブル）
      const newFromSpots = [...oldFromDay.spots];
      const [spot] = newFromSpots.splice(spotIndex, 1);

      const newToSpots = [...oldToDay.spots, spot];

      // スポット追加後、移動先の日を時刻順にソート
      const sortedToSpots = sortSpotsByTime(newToSpots);

      // 新しいdayScheduleオブジェクトを作成（イミュータブル）
      newSchedule[fromDayIndex] = updateDayBudget({
        ...oldFromDay,
        spots: newFromSpots,
      });

      newSchedule[toDayIndex] = updateDayBudget({
        ...oldToDay,
        spots: sortedToSpots,
      });

      const newItinerary = updateItineraryBudget({
        ...state.currentItinerary,
        schedule: newSchedule,
        updatedAt: new Date(),
      });

      return createHistoryUpdate(
        state.currentItinerary,
        newItinerary,
        state.history
      );
    }),

  // Phase 5.4: Itinerary list state
  itineraryFilter: {
    status: "all",
  },
  itinerarySort: {
    field: "updatedAt",
    order: "desc",
  },
  setItineraryFilter: (filter) => set({ itineraryFilter: filter }),
  setItinerarySort: (sort) => set({ itinerarySort: sort }),
  resetItineraryFilters: () =>
    set({
      itineraryFilter: { status: "all" },
      itinerarySort: { field: "updatedAt", order: "desc" },
    }),

  // UI state
  selectedAI: DEFAULT_AI_MODEL,
  claudeApiKey: "",
  setSelectedAI: (ai) => {
    saveSelectedAI(ai);
    set({ selectedAI: ai });
  },
  setClaudeApiKey: (key) => {
    if (key) {
      saveClaudeApiKey(key);
    }
    set({ claudeApiKey: key });
  },
  removeClaudeApiKey: () => {
    removeClaudeApiKey();
    set({ claudeApiKey: "", selectedAI: DEFAULT_AI_MODEL });
  },
  initializeFromStorage: () => {
    const savedApiKey = loadClaudeApiKey();
    const savedAI = loadSelectedAI();
    const autoProgressMode = loadAutoProgressMode();
    const autoProgressSettings = loadAutoProgressSettings();
    const savedSettings = loadAppSettings();
    const savedPanelWidth = loadChatPanelWidth();

    // currentItineraryも復元する
    let savedItinerary = null;
    if (typeof window !== "undefined") {
      const journeeStorage = localStorage.getItem("journee-storage");
      if (journeeStorage) {
        try {
          const parsed = JSON.parse(journeeStorage);
          savedItinerary = parsed?.state?.currentItinerary || null;
        } catch (e) {
          console.error("Failed to parse journee-storage:", e);
        }
      }
    }

    set({
      claudeApiKey: savedApiKey,
      selectedAI: savedAI,
      autoProgressMode,
      autoProgressSettings,
      settings: savedSettings
        ? { ...DEFAULT_SETTINGS, ...savedSettings }
        : DEFAULT_SETTINGS,
      chatPanelWidth: savedPanelWidth,
      currentItinerary: savedItinerary,
    });
  },

  // Mobile UI state (Phase 7.2)
  mobileActiveTab: "itinerary",
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),

  // Settings state (Phase 5.4.3)
  settings: DEFAULT_SETTINGS,
  updateSettings: (updates) => {
    set((state) => {
      const newSettings = { ...state.settings, ...updates };
      saveAppSettings(newSettings);
      return { settings: newSettings };
    });
  },
  updateGeneralSettings: (updates) => {
    set((state) => {
      const newSettings = {
        ...state.settings,
        general: { ...state.settings.general, ...updates },
      };
      saveAppSettings(newSettings);
      return { settings: newSettings };
    });
  },
  updateSoundSettings: (updates) => {
    set((state) => {
      const newSettings = {
        ...state.settings,
        sound: { ...state.settings.sound, ...updates },
      };
      saveAppSettings(newSettings);
      return { settings: newSettings };
    });
  },

  // Error state
  error: null,
  setError: (error) => set({ error }),

  // Toast notifications (Phase 5.1.2)
  toasts: [],
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: generateId(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Editing state (Phase 5.1.2)
  isSaving: false,
  setSaving: (saving) => set({ isSaving: saving }),

  // Auto-save state (Phase 5.2)
  lastSaveTime: null,
  setLastSaveTime: (time) => set({ lastSaveTime: time }),

  // Storage initialization state (Phase 5.2.10)
  isStorageInitialized: false,
  setStorageInitialized: (initialized) =>
    set({ isStorageInitialized: initialized }),

  // Undo/Redo state (Phase 5.1.3)
  history: {
    past: [],
    present: null,
    future: [],
  },

  undo: () =>
    set((state) => {
      if (state.history.past.length === 0) return state;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      return {
        currentItinerary: previous,
        history: {
          past: newPast,
          present: previous,
          future: state.currentItinerary
            ? [state.currentItinerary, ...state.history.future]
            : state.history.future,
        },
      };
    }),

  redo: () =>
    set((state) => {
      if (state.history.future.length === 0) return state;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        currentItinerary: next,
        history: {
          past: state.currentItinerary
            ? [...state.history.past, state.currentItinerary]
            : state.history.past,
          present: next,
          future: newFuture,
        },
      };
    }),

  canUndo: () => {
    const state = get();
    return state.history.past.length > 0;
  },

  canRedo: () => {
    const state = get();
    return state.history.future.length > 0;
  },

  // Phase 5.5: Itinerary sharing/publishing actions
  publishItinerary: async (settings) => {
    const state = get();
    const { currentItinerary } = state;

    if (!currentItinerary) {
      return { success: false, error: "しおりが存在しません" };
    }

    try {
      const response = await fetch("/api/itinerary/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: currentItinerary.id,
          settings,
          itinerary: currentItinerary, // しおりデータ全体を送信（DB未保存の場合に備えて）
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "公開に失敗しました" };
      }

      // しおりの公開情報を更新
      const updatedItinerary: ItineraryData = {
        ...currentItinerary,
        id: data.itineraryId, // 新規作成された場合は新しいIDに更新
        isPublic: settings.isPublic,
        publicSlug: data.slug,
        publishedAt: new Date(data.publishedAt),
        allowPdfDownload: settings.allowPdfDownload,
        customMessage: settings.customMessage,
        viewCount: 0, // 初期閲覧数
        updatedAt: new Date(),
      };

      set({
        currentItinerary: updatedItinerary,
        history: {
          ...state.history,
          present: updatedItinerary,
        },
      });

      // Phase 5-7: LocalStorageに公開しおりを保存
      savePublicItinerary(data.slug, updatedItinerary);

      return {
        success: true,
        publicUrl: data.publicUrl,
        slug: data.slug,
      };
    } catch (error) {
      console.error("Error publishing itinerary:", error);
      return { success: false, error: "公開に失敗しました" };
    }
  },

  unpublishItinerary: async () => {
    const state = get();
    const { currentItinerary } = state;

    if (!currentItinerary) {
      return { success: false, error: "しおりが存在しません" };
    }

    try {
      const response = await fetch("/api/itinerary/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId: currentItinerary.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "非公開化に失敗しました",
        };
      }

      // しおりの公開情報をクリア
      const updatedItinerary: ItineraryData = {
        ...currentItinerary,
        isPublic: false,
        publicSlug: undefined,
        publishedAt: undefined,
        allowPdfDownload: undefined,
        customMessage: undefined,
        viewCount: undefined,
        updatedAt: new Date(),
      };

      set({
        currentItinerary: updatedItinerary,
        history: {
          ...state.history,
          present: updatedItinerary,
        },
      });

      // Phase 5-7: LocalStorageから公開しおりを削除
      if (currentItinerary.publicSlug) {
        removePublicItinerary(currentItinerary.publicSlug);
      }

      return { success: true };
    } catch (error) {
      console.error("Error unpublishing itinerary:", error);
      return { success: false, error: "非公開化に失敗しました" };
    }
  },

  updatePublicSettings: (settings) =>
    set((state) => {
      if (!state.currentItinerary) return state;

      const updatedItinerary: ItineraryData = {
        ...state.currentItinerary,
        allowPdfDownload:
          settings.allowPdfDownload ?? state.currentItinerary.allowPdfDownload,
        customMessage:
          settings.customMessage ?? state.currentItinerary.customMessage,
        updatedAt: new Date(),
      };

      return {
        currentItinerary: updatedItinerary,
        history: {
          ...state.history,
          present: updatedItinerary,
        },
      };
    }),

  // Phase 7.1: Panel resizer
  chatPanelWidth: loadChatPanelWidth(),
  setChatPanelWidth: (width) => {
    // 範囲チェック（30-70%）
    const clampedWidth = Math.max(30, Math.min(70, width));
    set({ chatPanelWidth: clampedWidth });
    // LocalStorageに保存
    saveChatPanelWidth(clampedWidth);
  },
}));
