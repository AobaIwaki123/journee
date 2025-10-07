/**
 * Itinerary Slice
 * 旅のしおり関連の状態管理
 */

import { StateCreator } from 'zustand';
import type { ItineraryData, TouristSpot, DaySchedule, ItineraryPhase } from '@/types/itinerary';
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
import type { AutoProgressSettings } from '@/lib/utils/storage';
import {
  saveAutoProgressMode,
  loadAutoProgressMode,
  saveAutoProgressSettings,
  loadAutoProgressSettings,
} from '@/lib/utils/storage';
import { createHistoryUpdate } from '../useStore-helper';
import { sortSpotsByTime, adjustTimeAfterReorder } from '@/lib/utils/time-utils';
import { updateDayBudget, updateItineraryBudget } from '@/lib/utils/budget-utils';
import type { Message } from '@/types/chat';

export interface ItinerarySlice {
  // State
  currentItinerary: ItineraryData | null;
  planningPhase: ItineraryPhase;
  currentDetailingDay: number | null;
  requirementsChecklist: RequirementChecklistItem[];
  checklistStatus: ChecklistStatus | null;
  buttonReadiness: ButtonReadiness | null;
  autoProgressMode: boolean;
  autoProgressSettings: AutoProgressSettings;
  isAutoProgressing: boolean;
  autoProgressState: {
    phase: 'idle' | 'skeleton' | 'detailing' | 'completed' | 'error';
    currentStep: string;
    currentDay?: number;
    totalDays?: number;
    progress: number;
    error?: string;
  } | null;
  
  // Actions
  setItinerary: (itinerary: ItineraryData | null) => void;
  updateItinerary: (updates: Partial<ItineraryData>) => void;
  updateItineraryTitle: (title: string) => void;
  updateItineraryDestination: (destination: string) => void;
  updateSpot: (dayIndex: number, spotId: string, updates: Partial<TouristSpot>) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  addSpot: (dayIndex: number, spot: TouristSpot) => void;
  reorderSpots: (dayIndex: number, startIndex: number, endIndex: number) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;
  setPlanningPhase: (phase: ItineraryPhase) => void;
  setCurrentDetailingDay: (day: number | null) => void;
  proceedToNextStep: () => void;
  resetPlanning: () => void;
  updateChecklist: () => void;
  getChecklistForPhase: (phase: ItineraryPhase) => RequirementChecklistItem[];
  enableAutoProgress: () => void;
  disableAutoProgress: () => void;
  setAutoProgressSettings: (settings: AutoProgressSettings) => void;
  setIsAutoProgressing: (value: boolean) => void;
  setAutoProgressState: (state: any) => void;
  shouldTriggerAutoProgress: () => boolean;
}

export const createItinerarySlice: StateCreator<ItinerarySlice, [], [], ItinerarySlice> = (set, get) => ({
  // Initial state
  currentItinerary: null,
  planningPhase: 'initial',
  currentDetailingDay: null,
  requirementsChecklist: [],
  checklistStatus: null,
  buttonReadiness: null,
  autoProgressMode: true,
  autoProgressSettings: {
    enabled: true,
    parallelCount: 3,
    showNotifications: true,
  },
  isAutoProgressing: false,
  autoProgressState: null,
  
  // Actions
  setItinerary: (itinerary) => set({ currentItinerary: itinerary }),
  
  updateItinerary: (updates) =>
    set((state) => {
      const newItinerary = state.currentItinerary
        ? { ...state.currentItinerary, ...updates, updatedAt: new Date() }
        : null;
      return { currentItinerary: newItinerary };
    }),
  
  updateItineraryTitle: (title) =>
    set((state) => ({
      currentItinerary: state.currentItinerary
        ? { ...state.currentItinerary, title, updatedAt: new Date() }
        : null,
    })),
  
  updateItineraryDestination: (destination) =>
    set((state) => ({
      currentItinerary: state.currentItinerary
        ? { ...state.currentItinerary, destination, updatedAt: new Date() }
        : null,
    })),
  
  updateSpot: (dayIndex, spotId, updates) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];
      
      if (!oldDaySchedule) return state;
      
      const spotIndex = oldDaySchedule.spots.findIndex((s) => s.id === spotId);
      if (spotIndex === -1) return state;
      
      const newSpots = [...oldDaySchedule.spots];
      newSpots[spotIndex] = { ...newSpots[spotIndex], ...updates };
      
      const sortedSpots = updates.scheduledTime !== undefined 
        ? sortSpotsByTime(newSpots)
        : newSpots;
      
      newSchedule[dayIndex] = { ...oldDaySchedule, spots: sortedSpots };
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
    }),
  
  deleteSpot: (dayIndex, spotId) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];
      
      if (!oldDaySchedule) return state;
      
      const newSpots = oldDaySchedule.spots.filter((s) => s.id !== spotId);
      newSchedule[dayIndex] = { ...oldDaySchedule, spots: newSpots };
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
    }),
  
  addSpot: (dayIndex, spot) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];
      
      if (!oldDaySchedule) return state;
      
      const newSpots = [...oldDaySchedule.spots, spot];
      const sortedSpots = sortSpotsByTime(newSpots);
      
      newSchedule[dayIndex] = { ...oldDaySchedule, spots: sortedSpots };
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
    }),
  
  reorderSpots: (dayIndex, startIndex, endIndex) =>
    set((state) => {
      if (!state.currentItinerary) return state;
      
      const newSchedule = [...state.currentItinerary.schedule];
      const oldDaySchedule = newSchedule[dayIndex];
      
      if (!oldDaySchedule) return state;
      
      const spots = [...oldDaySchedule.spots];
      const [removed] = spots.splice(startIndex, 1);
      spots.splice(endIndex, 0, removed);
      
      const adjustedSpots = adjustTimeAfterReorder(spots, endIndex);
      newSchedule[dayIndex] = { ...oldDaySchedule, spots: adjustedSpots };
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
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
      
      const newFromSpots = [...oldFromDay.spots];
      const [spot] = newFromSpots.splice(spotIndex, 1);
      
      const newToSpots = [...oldToDay.spots, spot];
      const sortedToSpots = sortSpotsByTime(newToSpots);
      
      newSchedule[fromDayIndex] = { ...oldFromDay, spots: newFromSpots };
      newSchedule[toDayIndex] = { ...oldToDay, spots: sortedToSpots };
      
      return {
        currentItinerary: {
          ...state.currentItinerary,
          schedule: newSchedule,
          updatedAt: new Date(),
        },
      };
    }),
  
  setPlanningPhase: (phase) => set({ planningPhase: phase }),
  
  setCurrentDetailingDay: (day) => set({ currentDetailingDay: day }),
  
  proceedToNextStep: () =>
    set((state) => {
      const { planningPhase, currentItinerary, currentDetailingDay } = state;
      let newPhase: ItineraryPhase = planningPhase;
      let newDetailingDay: number | null = currentDetailingDay;
      let updates: Partial<ItineraryData> = {};
      
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
          updates.phase = 'detailing';
          updates.currentDay = 1;
          break;
        case 'detailing':
          if (currentItinerary && currentDetailingDay !== null) {
            const totalDays = currentItinerary.duration || currentItinerary.schedule.length;
            if (currentDetailingDay < totalDays) {
              newDetailingDay = currentDetailingDay + 1;
              updates.currentDay = newDetailingDay;
            } else {
              newPhase = 'completed';
              newDetailingDay = null;
              updates.phase = 'completed';
              updates.currentDay = undefined;
              updates.status = 'completed';
            }
          }
          break;
        case 'completed':
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
  
  resetPlanning: () =>
    set({
      planningPhase: 'initial',
      currentDetailingDay: null,
      requirementsChecklist: [],
      checklistStatus: null,
      buttonReadiness: null,
    }),
  
  updateChecklist: () => {
    // Note: This function needs access to messages from ChatSlice
    // For now, we'll create a placeholder. In a real implementation,
    // you might want to pass messages as a parameter or use a selector
    const { currentItinerary, planningPhase } = get();
    const requirements = getRequirementsForPhase(planningPhase);
    
    // Placeholder: In the integrated store, messages would be available
    const messages: Message[] = [];
    
    const updatedItems = requirements.items.map(item => {
      if (item.extractor) {
        const value = item.extractor(messages, currentItinerary || undefined);
        const status = value ? 'filled' : 'empty';
        return { ...item, value, status } as RequirementChecklistItem;
      }
      return item;
    });
    
    const status = calculateChecklistStatus(updatedItems, requirements);
    const readiness = determineButtonReadiness(status, planningPhase);
    
    set({
      requirementsChecklist: updatedItems,
      checklistStatus: status,
      buttonReadiness: readiness,
    });
  },
  
  getChecklistForPhase: (phase: ItineraryPhase) => {
    const requirements = getRequirementsForPhase(phase);
    return requirements.items;
  },
  
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
    return state.autoProgressMode && !state.isAutoProgressing;
  },
});