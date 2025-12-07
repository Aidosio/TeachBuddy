import { create } from 'zustand';
import type { Lesson } from '@/entities/types';

type ActiveTab = 'plan' | 'materials' | 'tests' | 'feedback';

interface LessonState {
  currentLesson: Lesson | null;
  activeTab: ActiveTab;
  setCurrentLesson: (lesson: Lesson | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  updateLessonContent: (
    type: 'plan' | 'materials' | 'tests',
    content: any
  ) => void;
}

export const useLessonStore = create<LessonState>((set) => ({
  currentLesson: null,
  activeTab: 'plan',
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  updateLessonContent: (type, content) =>
    set((state) => ({
      currentLesson: state.currentLesson
        ? {
            ...state.currentLesson,
            [type]: content,
          }
        : null,
    })),
}));

