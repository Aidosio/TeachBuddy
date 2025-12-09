export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  level?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  goals?: string;
  plan?: LessonPlan;
  materials?: LessonMaterials;
  tests?: LessonTests;
  // Утвержденный контент (из API 2.0)
  planJson?: any;
  materialsJson?: any;
  testsJson?: any;
  // Черновики (из API 2.0)
  planDraftJson?: any;
  materialsDraftJson?: any;
  testsDraftJson?: any;
  createdAt: string;
  updatedAt: string;
}

export interface LessonPlan {
  type: string;
  duration: number;
  level?: string;
  blocks: PlanBlock[];
}

export interface PlanBlock {
  title: string;
  content: string;
  duration?: number;
}

export interface LessonMaterials {
  explanation?: string;
  examples?: string;
  simplified?: string;
}

export interface LessonTests {
  type: 'multiple-choice' | 'short-answer';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: TestQuestion[];
  isExam?: boolean;
}

export interface TestQuestion {
  id: string;
  type: 'multiple-choice' | 'short-answer';
  question: string;
  // Для multiple-choice
  options?: string[];
  correctOptionIndex?: number;
  // Для short-answer
  answer?: string;
  explanation?: string;
}

export interface FeedbackRequest {
  answerText: string;
  assignmentType: 'open' | 'case';
  goal?: string;
  desiredTone?: string;
}

export interface FeedbackResponse {
  feedback: string;
  suggestions?: string[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type ContentType = 'plan' | 'materials' | 'tests';

export interface ContentVersion {
  id: string;
  lessonId: string;
  type: ContentType;
  payloadJson: any;
  createdAt: string;
  createdBy: string;
}

export interface AIPreset {
  id: string;
  name: string;
  target: ContentType;
  payloadJson: any;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

