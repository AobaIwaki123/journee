/**
 * useItineraryProgressStore - しおり進捗管理のストア
 * 
 * プランニングフェーズ、チェックリスト、自動進行を管理
 */

import { create } from 'zustand';
import type { ItineraryPhase, ItineraryData } from '@/types/itinerary';
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
  saveAutoProgressMode,
  saveAutoProgressSettings,
  type AutoProgressSettings,
} from '@/lib/utils/storage';
import type { Message } from '@/types/chat';

interface ItineraryProgressStore {
  // State
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  requirementsChecklist: RequirementChecklistItem[];
  checklistStatus: ChecklistStatus | null;
  buttonReadiness: ButtonReadiness | null;
  
  // Auto progress state
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
  
  // Actions
  setPlanningPhase: (phase: ItineraryPhase) => void;
  setCurrentDetailingDay: (day: number | null) => void;
  proceedToNextStep: () => void;
  resetPlanning: () => void;
  
  // Checklist actions
  updateChecklist: (messages: Message[], currentItinerary: ItineraryData | null) => void;
  getChecklistForPhase: (phase: ItineraryPhase) => RequirementChecklistItem[];
  
  // Auto progress actions
  enableAutoProgress: () => void;
  disableAutoProgress: () => void;
  setAutoProgressSettings: (settings: AutoProgressSettings) => void;
  setIsAutoProgressing: (value: boolean) => void;
  setAutoProgressState: (state: any) => void;
  shouldTriggerAutoProgress: () => boolean;
}

export const useItineraryProgressStore = create<ItineraryProgressStore>((set, get) => ({
  // State
  planningPhase: 'initial',
  currentDetailingDay: null,
  requirementsChecklist: [],
  checklistStatus: null,
  buttonReadiness: null,
  
  // Auto progress state
  autoProgressMode: true,
  autoProgressSettings: {
    enabled: true,
    parallelCount: 3,
    showNotifications: true,
  },
  isAutoProgressing: false,
  autoProgressState: null,
  
  // Actions
  setPlanningPhase: (phase) => set({ planningPhase: phase }),
  
  setCurrentDetailingDay: (day) => set({ currentDetailingDay: day }),
  
  proceedToNextStep: () => {
    const state = get();
    const { planningPhase, currentDetailingDay } = state;
    
    let newPhase = planningPhase;
    let newDetailingDay = currentDetailingDay;
    
    switch (planningPhase) {
      case 'initial':
        newPhase = 'collecting';
        break;
        
      case 'collecting':
        newPhase = 'skeleton';
        break;
        
      case 'skeleton':
        newPhase = 'detailing';
        newDetailingDay = 1;
        break;
        
      case 'detailing':
        // 次の日へ、または完成へ
        // この部分は実際にはcurrentItineraryを参照する必要がある
        // 一旦シンプルな実装
        newPhase = 'completed';
        newDetailingDay = null;
        break;
        
      case 'completed':
        // 何もしない
        break;
    }
    
    set({
      planningPhase: newPhase,
      currentDetailingDay: newDetailingDay,
    });
  },
  
  resetPlanning: () => set({
    planningPhase: 'initial',
    currentDetailingDay: null,
    requirementsChecklist: [],
    checklistStatus: null,
    buttonReadiness: null,
  }),
  
  // Checklist actions
  updateChecklist: (messages, currentItinerary) => {
    const { planningPhase } = get();
    
    // 現在のフェーズの要件を取得
    const requirements = getRequirementsForPhase(planningPhase);
    
    // 各項目を評価
    const updatedItems = requirements.items.map((item) => {
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
  
  getChecklistForPhase: (phase) => {
    const requirements = getRequirementsForPhase(phase);
    return requirements.items;
  },
  
  // Auto progress actions
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
    if (state.planningPhase !== 'collecting') {
      return false;
    }
    
    // チェックリストが充足していればtrue
    return state.checklistStatus?.completionRate === 100;
  },
}));
