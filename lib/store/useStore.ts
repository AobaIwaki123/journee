import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  hasClaudeApiKey,
} from "@/lib/utils/api-key-manager";
import {
  type AutoProgressSettings,
  savePublicItinerary,
  removePublicItinerary,
} from "@/lib/utils/storage";
import {
  saveSelectedAI,
  loadSelectedAI,
  saveAutoProgressMode,
  loadAutoProgressMode,
  saveAutoProgressSettings,
  loadAutoProgressSettings,
  saveAppSettings,
  loadAppSettings,
  saveChatPanelWidth,
  loadChatPanelWidth,
} from "@/lib/utils/ui-storage";
import { journeeDB, isIndexedDBAvailable } from "@/lib/utils/indexed-db";
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
import type { SaveLocation } from "@/types/save";

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

export interface AppState {
  // Chat state
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  hasReceivedResponse: boolean;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setStreamingMessage: (message: string) => void;
  appendStreamingMessage: (chunk: string) => void;
  clearMessages: () => void;
  setHasReceivedResponse: (value: boolean) => void;
  resetChatHistory: () => void; // 追加: チャット履歴をリセットするアクション

  // 追加: しおりがまだ未保存かどうか
  isItineraryUnsaved: boolean;
  setItineraryUnsaved: (unsaved: boolean) => void;

  // Message editing state
  editingMessageId: string | null;
  messageDraft: string;
  startEditingMessage: (messageId: string) => void;
  cancelEditingMessage: () => void;
  saveEditedMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  setMessageDraft: (draft: string) => void;

  // AI response control
  abortAIResponse: () => void;
  setAbortController: (controller: AbortController | null) => void;
  abortController: AbortController | null;

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
  setClaudeApiKey: (key: string) => Promise<boolean>;
  removeClaudeApiKey: () => Promise<boolean>;
  initializeFromStorage: () => Promise<void>;

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
  saveLocation: SaveLocation | null;
  setSaveLocation: (location: SaveLocation | null) => void;
  dbSaveSuccess: boolean | null;
  setDbSaveSuccess: (success: boolean | null) => void;

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

  // ✅ 追加: チャット履歴DB統合
  loadChatHistory: (itineraryId: string) => Promise<void>;
  saveChatHistoryToDb: (itineraryId: string) => Promise<boolean>;
  compressAndSaveChatHistory: (itineraryId: string) => Promise<void>;
}

/**
 * IndexedDB用のストレージアダプター
 * Zustand persistミドルウェアで使用
 */
const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    if (!isIndexedDBAvailable()) {
      return null;
    }
    try {
      await journeeDB.init();
      const value = await journeeDB.get("store_state", name);
      return value ? JSON.stringify(value) : null;
    } catch (error) {
      console.error("Failed to get item from IndexedDB:", error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    if (!isIndexedDBAvailable()) {
      return;
    }
    try {
      await journeeDB.init();
      await journeeDB.set("store_state", name, JSON.parse(value));
    } catch (error) {
      console.error("Failed to set item to IndexedDB:", error);
    }
  },
  removeItem: async (name: string) => {
    if (!isIndexedDBAvailable()) {
      return;
    }
    try {
      await journeeDB.init();
      await journeeDB.delete("store_state", name);
    } catch (error) {
      console.error("Failed to remove item from IndexedDB:", error);
    }
  },
}));

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Chat state
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingMessage: "",
      hasReceivedResponse: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setLoading: (loading) => set({ isLoading: loading }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setStreamingMessage: (message) => set({ streamingMessage: message }),
      appendStreamingMessage: (chunk) =>
        set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
      clearMessages: () => set({ messages: [], streamingMessage: "" }),
      setHasReceivedResponse: (value) => set({ hasReceivedResponse: value }),
      resetChatHistory: () =>
        set({ messages: [], streamingMessage: "", hasReceivedResponse: false }), // 追加

      isItineraryUnsaved: true, // 初期状態は未保存
      setItineraryUnsaved: (unsaved) => set({ isItineraryUnsaved: unsaved }),

      // Message editing state
      editingMessageId: null,
      messageDraft: "",

      startEditingMessage: (messageId) => {
        const state = get();

        // 編集モード開始時に進行中のAI応答をキャンセル
        if (state.isStreaming || state.isLoading) {
          state.abortAIResponse();
        }

        // 新規メッセージドラフトを一時保存
        const currentDraft = state.messageDraft;

        set({
          editingMessageId: messageId,
          messageDraft: currentDraft, // ドラフトを保持
        });
      },

      cancelEditingMessage: () => {
        set({ editingMessageId: null });
        // messageDraftは保持したまま（編集終了後に復元）
      },

      saveEditedMessage: (messageId, newContent) => {
        set((state) => {
          // 編集対象のメッセージを見つける
          const editedMessage = state.messages.find(
            (msg) => msg.id === messageId
          );

          // 編集されたメッセージの直後のAI応答を削除
          let messagesToKeep = state.messages;
          if (editedMessage) {
            const editedIndex = state.messages.findIndex(
              (msg) => msg.id === messageId
            );
            // 編集されたメッセージの直後のメッセージがAI応答なら削除
            if (
              editedIndex >= 0 &&
              editedIndex < state.messages.length - 1 &&
              state.messages[editedIndex + 1].role === "assistant"
            ) {
              messagesToKeep = [
                ...state.messages.slice(0, editedIndex + 1),
                ...state.messages.slice(editedIndex + 2),
              ];
            }
          }

          return {
            messages: messagesToKeep.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: newContent, editedAt: new Date() }
                : msg
            ),
            editingMessageId: null,
            // messageDraftは保持したまま
          };
        });
      },

      deleteMessage: (messageId) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  isDeleted: true,
                  content: "このメッセージは削除されました",
                }
              : msg
          ),
        }));
      },

      setMessageDraft: (draft) => set({ messageDraft: draft }),

      // AI response control
      abortController: null,
      setAbortController: (controller) => set({ abortController: controller }),
      abortAIResponse: () => {
        const state = get();
        if (state.abortController) {
          state.abortController.abort();
          set({
            abortController: null,
            isLoading: false,
            isStreaming: false,
            streamingMessage: "",
          });
        }
      },

      // Itinerary state
      currentItinerary: null,
      setItinerary: (itinerary) => {
        // scheduleがundefinedの場合は空配列で初期化
        const normalizedItinerary = itinerary
          ? {
              ...itinerary,
              schedule: Array.isArray(itinerary.schedule)
                ? itinerary.schedule
                : [],
            }
          : null;

        console.log(
          "[Store] setItinerary called with schedule length:",
          normalizedItinerary?.schedule?.length
        );

        // Zustand persistが自動的にIndexedDBに保存
        set((state) => ({
          currentItinerary: normalizedItinerary,
          history: {
            past: normalizedItinerary
              ? ([...state.history.past, state.currentItinerary].filter(
                  Boolean
                ) as ItineraryData[])
              : [],
            present: normalizedItinerary,
            future: [],
          },
        }));
      },
      updateItinerary: (updates) =>
        set((state) => {
          const newItinerary = state.currentItinerary
            ? {
                ...state.currentItinerary,
                ...updates,
                // scheduleがupdatesに含まれる場合、配列であることを保証
                schedule:
                  updates.schedule !== undefined
                    ? Array.isArray(updates.schedule)
                      ? updates.schedule
                      : []
                    : state.currentItinerary.schedule,
                updatedAt: new Date(),
              }
            : null;

          // Zustand persistが自動的にIndexedDBに保存
          return {
            currentItinerary: newItinerary,
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
          const { planningPhase, currentItinerary, currentDetailingDay } =
            state;
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
            const value = item.extractor(
              messages,
              currentItinerary || undefined
            );
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

          const spotIndex = oldDaySchedule.spots.findIndex(
            (s) => s.id === spotId
          );
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
      setClaudeApiKey: async (key) => {
        if (key) {
          const success = await saveClaudeApiKey(key);
          if (!success) {
            console.error("Failed to save API key");
            return false;
          }
        }
        set({ claudeApiKey: key });
        return true;
      },
      removeClaudeApiKey: async () => {
        const success = await removeClaudeApiKey();
        if (!success) {
          console.error("Failed to remove API key");
          return false;
        }
        set({ claudeApiKey: "", selectedAI: DEFAULT_AI_MODEL });
        return true;
      },
      initializeFromStorage: async () => {
        // Zustand persistで自動的に復元されるため、ここではAPIキーのみロード
        const savedApiKey = await loadClaudeApiKey();

        // UI設定もIndexedDBから非同期ロード（Zustand persist対象外の設定）
        const savedAI = await loadSelectedAI();
        const autoProgressMode = await loadAutoProgressMode();
        const autoProgressSettings = await loadAutoProgressSettings();
        const savedSettings = await loadAppSettings();
        const savedPanelWidth = await loadChatPanelWidth();

        set((state) => ({
          claudeApiKey: savedApiKey,
          // persistで復元されない場合のフォールバック
          selectedAI: state.selectedAI || savedAI,
          autoProgressMode: state.autoProgressMode ?? autoProgressMode,
          autoProgressSettings:
            state.autoProgressSettings || autoProgressSettings,
          settings:
            state.settings ||
            (savedSettings
              ? { ...DEFAULT_SETTINGS, ...savedSettings }
              : DEFAULT_SETTINGS),
          chatPanelWidth: state.chatPanelWidth || savedPanelWidth,
        }));
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
      saveLocation: null,
      setSaveLocation: (location) => set({ saveLocation: location }),
      dbSaveSuccess: null,
      setDbSaveSuccess: (success) => set({ dbSaveSuccess: success }),

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
            return {
              success: false,
              error: data.error || "公開に失敗しました",
            };
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
              settings.allowPdfDownload ??
              state.currentItinerary.allowPdfDownload,
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
      chatPanelWidth: 40, // デフォルト値、initializeFromStorageで非同期ロード
      setChatPanelWidth: (width) => {
        // 範囲チェック（30-70%）
        const clampedWidth = Math.max(30, Math.min(70, width));
        set({ chatPanelWidth: clampedWidth });
        // IndexedDBに保存
        saveChatPanelWidth(clampedWidth);
      },

      // ✅ チャット履歴の読み込み
      loadChatHistory: async (itineraryId: string) => {
        try {
          const response = await fetch(
            `/api/chat/history?itineraryId=${itineraryId}`
          );

          if (!response.ok) {
            console.error("Failed to load chat history");
            return;
          }

          const data = await response.json();

          if (data.success && data.messages) {
            // メッセージをストアに設定
            set({ messages: data.messages });
          }
        } catch (error) {
          console.error("Load chat history error:", error);
        }
      },

      // ✅ チャット履歴の保存
      saveChatHistoryToDb: async (itineraryId: string) => {
        const { messages } = get();

        if (!itineraryId || messages.length === 0) {
          return false;
        }

        try {
          const response = await fetch("/api/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itineraryId,
              messages,
            }),
          });

          return response.ok;
        } catch (error) {
          console.error("Save chat history error:", error);
          return false;
        }
      },

      // ✅ チャット履歴の圧縮と保存
      compressAndSaveChatHistory: async (itineraryId: string) => {
        const { messages, selectedAI, claudeApiKey } = get();

        // トークン数をチェック
        if (messages.length < 20) {
          // メッセージ数が少ない場合はスキップ
          return;
        }

        try {
          // クライアント側で圧縮APIを呼び出し
          const response = await fetch("/api/chat/compress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages,
              modelId: selectedAI,
              claudeApiKey,
            }),
          });

          if (response.ok) {
            const data = await response.json();

            if (data.didCompress && data.compressed) {
              // 圧縮されたメッセージでストアを更新
              set({ messages: data.compressed });

              // DBに保存
              await get().saveChatHistoryToDb(itineraryId);

              // ユーザーに通知
              get().addToast(
                "チャット履歴が長くなったため、自動的に要約されました",
                "info"
              );
            }
          }
        } catch (error) {
          console.error("Compress chat history error:", error);
        }
      },
    }),
    {
      name: "journee-storage",
      storage: indexedDBStorage,
      // 永続化する状態を選択（重要な状態のみ）
      partialize: (state) => ({
        currentItinerary: state.currentItinerary,
        messages: state.messages,
        settings: state.settings,
        selectedAI: state.selectedAI,
        autoProgressMode: state.autoProgressMode,
        autoProgressSettings: state.autoProgressSettings,
        chatPanelWidth: state.chatPanelWidth,
        isItineraryUnsaved: state.isItineraryUnsaved, // 追加
      }),
      // ハイドレーション完了時のコールバック
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate storage:", error);
        } else {
          console.log("Storage rehydration complete");
          // ストレージ初期化フラグを立てる
          if (state) {
            state.setStorageInitialized(true);
          }
        }
      },
    }
  )
);
