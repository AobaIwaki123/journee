import { create } from 'zustand';
import { Message } from '@/types/chat';
import { ItineraryData, ItineraryPhase, DayStatus } from '@/types/itinerary';

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

  // UI state
  selectedAI: 'gemini' | 'claude';
  claudeApiKey: string;
  setSelectedAI: (ai: 'gemini' | 'claude') => void;
  setClaudeApiKey: (key: string) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
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
    }),

  // UI state
  selectedAI: 'gemini',
  claudeApiKey: '',
  setSelectedAI: (ai) => set({ selectedAI: ai }),
  setClaudeApiKey: (key) => set({ claudeApiKey: key }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
}));
