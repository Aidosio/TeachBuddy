import { mockCourses, mockLessons, mockPlanGeneration, mockMaterialsGeneration, mockTestsGeneration, mockFeedbackGeneration } from './mock-data';
import type { Course, Lesson, LessonPlan, LessonMaterials, LessonTests } from '@/entities/types';

// Симуляция задержки API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Auth
  async login(email: string, password: string) {
    await delay(800);
    return {
      user: {
        id: 'user-1',
        email,
        name: 'Преподаватель',
      },
      token: 'mock-token-' + Date.now(),
    };
  },

  async register(email: string, password: string, fullName?: string) {
    await delay(1000);
    return {
      user: {
        id: 'user-' + Date.now(),
        email,
        fullName: fullName || 'Пользователь',
      },
      token: 'mock-token-' + Date.now(),
    };
  },

  // Courses
  async getCourses(): Promise<Course[]> {
    await delay(500);
    return [...mockCourses];
  },

  async getCourse(id: string): Promise<Course> {
    await delay(300);
    const course = mockCourses.find(c => c.id === id);
    if (!course) throw new Error('Курс не найден');
    return course;
  },

  async createCourse(data: Partial<Course>): Promise<Course> {
    await delay(600);
    const newCourse: Course = {
      id: 'course-' + Date.now(),
      title: data.title || 'Новый курс',
      description: data.description,
      level: data.level,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCourses.push(newCourse);
    return newCourse;
  },

  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    await delay(400);
    const course = mockCourses.find(c => c.id === id);
    if (!course) throw new Error('Курс не найден');
    Object.assign(course, data, { updatedAt: new Date().toISOString() });
    return course;
  },

  async deleteCourse(id: string): Promise<void> {
    await delay(300);
    const index = mockCourses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Курс не найден');
    mockCourses.splice(index, 1);
  },

  // Lessons
  async getLessons(courseId: string): Promise<Lesson[]> {
    await delay(400);
    return mockLessons[courseId] || [];
  },

  async getLesson(id: string): Promise<Lesson> {
    await delay(300);
    for (const lessons of Object.values(mockLessons)) {
      const lesson = lessons.find(l => l.id === id);
      if (lesson) return lesson;
    }
    throw new Error('Урок не найден');
  },

  async createLesson(data: Partial<Lesson> & { courseId: string }): Promise<Lesson> {
    await delay(500);
    const newLesson: Lesson = {
      id: 'lesson-' + Date.now(),
      courseId: data.courseId,
      title: data.title || 'Новая тема',
      goals: data.goals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (!mockLessons[data.courseId]) {
      mockLessons[data.courseId] = [];
    }
    mockLessons[data.courseId].push(newLesson);
    return newLesson;
  },

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson> {
    await delay(400);
    for (const lessons of Object.values(mockLessons)) {
      const lesson = lessons.find(l => l.id === id);
      if (lesson) {
        Object.assign(lesson, data, { updatedAt: new Date().toISOString() });
        return lesson;
      }
    }
    throw new Error('Урок не найден');
  },

  async deleteLesson(id: string): Promise<void> {
    await delay(300);
    for (const courseId in mockLessons) {
      const index = mockLessons[courseId].findIndex(l => l.id === id);
      if (index !== -1) {
        mockLessons[courseId].splice(index, 1);
        return;
      }
    }
    throw new Error('Урок не найден');
  },

  // Generation
  async generatePlan(lessonId: string, params: any): Promise<LessonPlan> {
    await delay(1500);
    const plan = mockPlanGeneration(params);
    
    // Сохраняем план в урок
    for (const lessons of Object.values(mockLessons)) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.plan = plan;
        lesson.updatedAt = new Date().toISOString();
        break;
      }
    }
    
    return plan;
  },

  async generateMaterials(lessonId: string, params: { type: string }): Promise<{ content: string }> {
    await delay(1200);
    const content = mockMaterialsGeneration(params.type);
    
    // Сохраняем материалы в урок
    for (const lessons of Object.values(mockLessons)) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        if (!lesson.materials) lesson.materials = {};
        if (params.type === 'explanation') {
          lesson.materials.explanation = content;
        } else if (params.type === 'examples') {
          lesson.materials.examples = content;
        } else if (params.type === 'simplified') {
          lesson.materials.simplified = content;
        }
        lesson.updatedAt = new Date().toISOString();
        break;
      }
    }
    
    return { content };
  },

  async generateTests(lessonId: string, params: any): Promise<LessonTests> {
    await delay(1800);
    const tests = mockTestsGeneration(params);
    
    // Сохраняем тесты в урок
    for (const lessons of Object.values(mockLessons)) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        lesson.tests = tests;
        lesson.updatedAt = new Date().toISOString();
        break;
      }
    }
    
    return tests;
  },

  async generateFeedback(params: any): Promise<{ feedback: string }> {
    await delay(2000);
    return {
      feedback: mockFeedbackGeneration(params),
    };
  },
};

