import { create } from 'zustand';
import { Message } from '@/types/chat';
import { ItineraryData, ItineraryPhase, DayStatus } from '@/types/itinerary';
import type { AIModelId } from '@/types/ai';
import type {
  RequirementChecklistItem,
  ChecklistStatus,
  ButtonReadiness,
} from '@/types/requirements';
import { getRequirementsForPhase } from '@/lib/requirements/checklist-config';
import {
  calculateChecklistStatus,
  determineButtonReadiness,
} from '@/lib/requirements/checklist-utils';
import {
  saveClaudeApiKey,
  loadClaudeApiKey,
  removeClaudeApiKey,
  saveSelectedAI,
  loadSelectedAI,
} from '@/lib/utils/storage';
import { DEFAULT_AI_MODEL } from '@/lib/ai/models';

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

  // UI state
  selectedAI: AIModelId;
  claudeApiKey: string;
  setSelectedAI: (ai: AIModelId) => void;
  setClaudeApiKey: (key: string) => void;
  removeClaudeApiKey: () => void;
  initializeFromStorage: () => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Chat state
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingMessage: '',
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setStreamingMessage: (message) => set({ streamingMessage: message }),
  appendStreamingMessage: (chunk) =>
    set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
  clearMessages: () => set({ messages: [], streamingMessage: '' }),

  // Itinerary state
  currentItinerary: null,
  setItinerary: (itinerary) => set({ currentItinerary: itinerary }),
  updateItinerary: (updates) =>
    set((state) => ({
      currentItinerary: state.currentItinerary
        ? { ...state.currentItinerary, ...updates }
        : null,
    })),

  // Phase 4: Planning phase state
  planningPhase: 'initial',
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
        case 'initial':
          // 初期状態 → 情報収集フェーズへ
          newPhase = 'collecting';
          break;

        case 'collecting':
          // 情報収集完了 → 骨組み作成フェーズへ
          newPhase = 'skeleton';
          break;

        case 'skeleton':
          // 骨組み完了 → 詳細化フェーズへ（1日目から開始）
          newPhase = 'detailing';
          newDetailingDay = 1;
          updates.phase = 'detailing';
          updates.currentDay = 1;
          break;

        case 'detailing':
          // 詳細化中 → 次の日へ、または完成へ
          if (currentItinerary && currentDetailingDay !== null) {
            const totalDays = currentItinerary.duration || currentItinerary.schedule.length;
            if (currentDetailingDay < totalDays) {
              // 次の日へ
              newDetailingDay = currentDetailingDay + 1;
              updates.currentDay = newDetailingDay;
            } else {
              // 全ての日が完了 → 完成フェーズへ
              newPhase = 'completed';
              newDetailingDay = null;
              updates.phase = 'completed';
              updates.currentDay = undefined;
              updates.status = 'completed';
            }
          }
          break;

        case 'completed':
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
      planningPhase: 'initial',
      currentDetailingDay: null,
      requirementsChecklist: [],
      checklistStatus: null,
      buttonReadiness: null,
    }),
  
  // Phase 4.8: Requirements checklist state
  requirementsChecklist: [],
  checklistStatus: null,
  buttonReadiness: null,
  
  // Phase 4.8: Update requirements checklist
  updateChecklist: () => {
    const { messages, currentItinerary, planningPhase } = get();
    
    // 現在のフェーズの要件を取得
    const requirements = getRequirementsForPhase(planningPhase);
    
    // 各項目を評価
    const updatedItems = requirements.items.map(item => {
      if (item.extractor) {
        const value = item.extractor(messages, currentItinerary || undefined);
        const status = value ? 'filled' : 'empty';
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

  // UI state
  selectedAI: DEFAULT_AI_MODEL,
  claudeApiKey: '',
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
    set({ claudeApiKey: '', selectedAI: DEFAULT_AI_MODEL });
  },
  initializeFromStorage: () => {
    const savedApiKey = loadClaudeApiKey();
    const savedAI = loadSelectedAI();
    set({
      claudeApiKey: savedApiKey,
      selectedAI: savedAI,
    });
  },

  // Error state
  error: null,
  setError: (error) => set({ error }),
}));