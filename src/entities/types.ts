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
  presentationJson?: any;
  // Черновики (из API 2.0)
  planDraftJson?: any;
  materialsDraftJson?: any;
  testsDraftJson?: any;
  presentationDraftJson?: any;
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

export interface Slide {
  title: string;
  bullets: string[];
  notes?: string;
}

export interface Presentation {
  title: string;
  slides: Slide[];
}

export type QuestionTypeId =
  | 'multiple-choice'
  | 'short-answer'
  | 'fill-blanks'
  | 'true-false'
  | 'matching'
  | 'ordering'
  | 'essay'
  | 'numeric'
  | 'code'
  | 'diagram'
  | 'matrix'
  | 'drag-drop';

export interface LessonTests {
  type: QuestionTypeId;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: TestQuestion[];
  isExam?: boolean;
}

export interface TestQuestion {
  id: string;
  type: QuestionTypeId;
  question: string;
  // Для multiple-choice и true-false
  options?: string[];
  correctOptionIndex?: number | null;
  // Для short-answer
  answer?: string;
  explanation?: string;
  // Дополнительные данные для всех типов вопросов
  additionalData?: any;
}

export interface QuestionType {
  id: QuestionTypeId;
  name: string;
  description: string;
  suitableFor: string[];
  fields: Record<string, any>;
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

export type ContentType = 'plan' | 'materials' | 'tests' | 'presentation';

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

