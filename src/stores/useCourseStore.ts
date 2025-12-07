import { create } from 'zustand';
import type { Course } from '@/entities/types';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  setCurrentCourse: (course: Course | null) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  removeCourse: (id: string) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  currentCourse: null,
  setCourses: (courses) => set({ courses }),
  addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
  setCurrentCourse: (course) => set({ currentCourse: course }),
  updateCourse: (id, updates) =>
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      currentCourse:
        state.currentCourse?.id === id
          ? { ...state.currentCourse, ...updates }
          : state.currentCourse,
    })),
  removeCourse: (id) =>
    set((state) => ({
      courses: state.courses.filter((c) => c.id !== id),
      currentCourse: state.currentCourse?.id === id ? null : state.currentCourse,
    })),
}));

