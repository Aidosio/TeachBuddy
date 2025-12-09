import { create } from 'zustand';
import type { Lesson } from '@/entities/types';
import { api, endpoints } from '@/lib/api';
import { lessonSchemaResponse } from '@/entities/schemas';

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
  updateDraftContent: (
    type: 'plan' | 'materials' | 'tests',
    draftJson: any
  ) => void;
  updateApprovedContent: (
    type: 'plan' | 'materials' | 'tests',
    approvedJson: any
  ) => void;
  refreshLesson: () => Promise<void>;
}

// Функция парсинга урока (та же логика что и в page.tsx)
const parseLessonResponse = (rawLesson: any, courseId?: string): Lesson => {
  // Базовые данные урока
  let lessonData: any = {
    id: rawLesson.id,
    courseId: rawLesson.courseId || courseId,
    title: rawLesson.title || 'Без названия',
    goals: rawLesson.goals,
    createdAt: rawLesson.createdAt || new Date().toISOString(),
    updatedAt: rawLesson.updatedAt || new Date().toISOString(),
  };
  
  const content = rawLesson.content || {};
  
  // Обрабатываем план (черновик и утвержденный)
  if (content.planApproved) {
    lessonData.planJson = content.planApproved;
    const parsedPlan = content.planApproved;
    lessonData.plan = {
      type: parsedPlan.type || 'лекция',
      duration: parsedPlan.duration || 90,
      level: parsedPlan.level,
      blocks: [
        ...(parsedPlan.objectives || []).map((obj: string) => ({
          title: 'Цель',
          content: obj,
        })),
        ...(parsedPlan.materials || []).map((mat: string) => ({
          title: 'Материал',
          content: mat,
        })),
        ...(parsedPlan.activities || []).map((activity: any) => ({
          title: activity.name || 'Активность',
          content: activity.description || '',
          duration: activity.duration,
        })),
        ...(parsedPlan.assessment ? [{
          title: 'Оценка',
          content: parsedPlan.assessment,
        }] : []),
      ],
    };
  }
  
  if (content.planDraft) {
    lessonData.planDraftJson = content.planDraft;
  }
  
  // Обрабатываем материалы (черновик и утвержденные)
  if (content.materialsApproved) {
    lessonData.materialsJson = content.materialsApproved;
    const parsedMaterials = content.materialsApproved;
    const materials = parsedMaterials.educational_materials || parsedMaterials;
    
    let explanation = '';
    let examples = '';
    let simplified = '';
    
    // Обрабатываем keyConcepts (новый формат - массив объектов)
    if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
      const conceptsText = materials.keyConcepts.map((item: any, index: number) => {
        if (typeof item === 'object' && item.concept) {
          return `${index + 1}. ${item.concept}\n   ${item.explanation || ''}`;
        }
        return `${index + 1}. ${item}`;
      }).join('\n\n');
      explanation += 'Ключевые концепции:\n' + conceptsText;
    }
    
    // Обрабатываем key_concepts (старый формат - массив строк)
    if (materials.key_concepts && Array.isArray(materials.key_concepts)) {
      const conceptsText = materials.key_concepts.map((item: any, index: number) => {
        if (typeof item === 'object' && item.concept) {
          return `${index + 1}. ${item.concept}\n   ${item.explanation || ''}`;
        }
        return `${index + 1}. ${item}`;
      }).join('\n\n');
      if (!explanation) {
        explanation += 'Ключевые концепции:\n' + conceptsText;
      }
    }
    
    // Обрабатываем explanations (старый формат - объект)
    if (materials.explanations && typeof materials.explanations === 'object' && !Array.isArray(materials.explanations)) {
      explanation += '\n\nОбъяснения:\n' + Object.entries(materials.explanations)
        .map(([concept, exp]) => `• ${concept}: ${exp}`)
        .join('\n\n');
    }
    
    // Обрабатываем examples (новый формат - массив объектов)
    if (materials.examples && Array.isArray(materials.examples)) {
      examples = materials.examples.map((example: any, index: number) => {
        let exampleText = '';
        if (example.title) {
          exampleText += `${example.title}\n`;
        }
        if (example.code) {
          exampleText += `Код:\n${example.code}\n`;
        }
        if (example.description) {
          exampleText += `Описание: ${example.description}`;
        }
        return exampleText || `Пример ${index + 1}`;
      }).join('\n\n---\n\n');
    } else if (materials.examples && typeof materials.examples === 'object') {
      // Старый формат - объект
      examples = Object.entries(materials.examples)
        .map(([title, example]) => `${title}:\n${typeof example === 'string' ? example : JSON.stringify(example, null, 2)}`)
        .join('\n\n');
    }
    
    // Упрощенная версия - только названия концепций
    if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
      simplified = materials.keyConcepts
        .map((item: any) => typeof item === 'object' && item.concept ? `• ${item.concept}` : `• ${item}`)
        .join('\n');
    } else if (materials.key_concepts && Array.isArray(materials.key_concepts)) {
      simplified = materials.key_concepts
        .map((item: any) => typeof item === 'object' && item.concept ? `• ${item.concept}` : `• ${item}`)
        .join('\n');
    }
    
    lessonData.materials = {
      explanation: explanation || undefined,
      examples: examples || undefined,
      simplified: simplified || undefined,
    };
  }
  
  if (content.materialsDraft) {
    lessonData.materialsDraftJson = content.materialsDraft;
  }
  
  // Обрабатываем тесты (черновик и утвержденные)
  if (content.testsApproved && Array.isArray(content.testsApproved) && content.testsApproved.length > 0) {
    lessonData.testsJson = { questions: content.testsApproved };
    const parsedTests = { questions: content.testsApproved };
    
    if (parsedTests.questions && Array.isArray(parsedTests.questions)) {
      const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'легкий': 'easy',
        'средний': 'medium',
        'сложный': 'hard',
        'easy': 'easy',
        'medium': 'medium',
        'hard': 'hard',
      };
      const firstQuestion = parsedTests.questions[0];
      const difficulty = firstQuestion.difficulty 
        ? (difficultyMap[firstQuestion.difficulty] || 'medium')
        : 'medium';
      
      lessonData.tests = {
        type: firstQuestion.type || 'multiple-choice',
        difficulty,
        questions: parsedTests.questions.map((q: any) => ({
          id: q.id || Math.random().toString(),
          type: q.type,
          question: q.question,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
          explanation: q.explanation,
        })),
      };
    }
  }
  
  if (content.testsDraft) {
    lessonData.testsDraftJson = content.testsDraft;
  }
  
  // Обрабатываем quizQuestions (старый формат для совместимости)
  if (rawLesson.quizQuestions && Array.isArray(rawLesson.quizQuestions) && rawLesson.quizQuestions.length > 0) {
    if (!lessonData.tests) {
      const firstQuestion = rawLesson.quizQuestions[0];
      const testType = firstQuestion.type === 'multiple-choice' ? 'multiple-choice' : 'short-answer';
      
      lessonData.tests = {
        type: testType,
        difficulty: 'medium',
        questions: rawLesson.quizQuestions.map((q: any) => ({
          id: q.id || Math.random().toString(),
          type: q.type,
          question: q.question,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
          explanation: q.explanation,
        })),
      };
    }
  }
  
  return lessonSchemaResponse.parse(lessonData);
};

export const useLessonStore = create<LessonState>((set, get) => ({
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
  updateDraftContent: (type, draftJson) =>
    set((state) => ({
      currentLesson: state.currentLesson
        ? {
            ...state.currentLesson,
            [`${type}DraftJson`]: draftJson,
          }
        : null,
    })),
  updateApprovedContent: (type, approvedJson) =>
    set((state) => ({
      currentLesson: state.currentLesson
        ? {
            ...state.currentLesson,
            [`${type}Json`]: approvedJson,
            [`${type}DraftJson`]: undefined, // Очищаем черновик после утверждения
          }
        : null,
    })),
  refreshLesson: async () => {
    const lesson = get().currentLesson;
    if (!lesson) return;
    
    try {
      const response = await api.get(endpoints.lessons.detail(lesson.id));
      // API может возвращать данные в обертке data
      const rawLesson = response.data?.data || response.data;
      const courseId = lesson.courseId;
      const parsedLesson = parseLessonResponse(rawLesson, courseId);
      set({ currentLesson: parsedLesson });
    } catch (error) {
      console.error('Failed to refresh lesson:', error);
    }
  },
}));

