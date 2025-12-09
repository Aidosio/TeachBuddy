import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  fullName: z.string().optional(),
});

// Course schemas
export const courseSchema = z.object({
  title: z.string().min(1, 'Название курса обязательно'),
  description: z.string().optional(),
  level: z.string().optional(),
});

// Lesson schemas
export const lessonSchema = z.object({
  title: z.string().min(1, 'Название темы обязательно'),
  goals: z.string().optional(),
});

// Plan generation schema
export const planGenerationSchema = z.object({
  type: z.string().min(1, 'Тип занятия обязателен'),
  duration: z.number().min(1, 'Длительность должна быть больше 0'),
  level: z.string().optional(),
});

// Materials generation schema
export const materialsGenerationSchema = z.object({
  tone: z.string().optional(),
  complexity: z.string().optional(),
});

// Tests generation schema
export const testsGenerationSchema = z.object({
  type: z.enum([
    'multiple-choice',
    'short-answer',
    'fill-blanks',
    'true-false',
    'matching',
    'ordering',
    'essay',
    'numeric',
    'code',
    'diagram',
    'matrix',
    'drag-drop',
  ]),
  difficulty: z.string().min(1, 'Сложность обязательна'),
  count: z.number().min(1).max(50),
});

// Presentation generation schema
export const presentationGenerationSchema = z.object({
  slideCount: z.number().min(3, 'Количество слайдов должно быть не менее 3').max(50, 'Количество слайдов должно быть не более 50'),
  style: z.string().optional(),
  complexity: z.string().optional(),
});

// Question type schema
export const questionTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  suitableFor: z.array(z.string()),
  fields: z.record(z.any()),
});

// Question types response schema
export const questionTypesResponseSchema = z.object({
  questionTypes: z.array(questionTypeSchema),
});

// Feedback schema
export const feedbackSchema = z.object({
  answerText: z.string().min(1, 'Ответ студента обязателен'),
  assignmentType: z.enum(['open', 'case']),
  goal: z.string().optional(),
  desiredTone: z.string().optional(),
});

// API response schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string().optional(),
  role: z.string().optional(),
});

// Схема для ответа аутентификации (поддерживает оба формата)
export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string().optional(),
  token: z.string().optional(), // Для совместимости с моковым API
}).transform((data) => ({
  user: data.user,
  accessToken: data.accessToken || data.token || '',
}));

export const courseSchemaResponse = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  level: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const lessonSchemaResponse = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  goals: z.string().optional(),
  plan: z.any().optional(),
  materials: z.any().optional(),
  tests: z.any().optional(),
  // Утвержденный контент (API 2.0)
  planJson: z.any().optional(),
  materialsJson: z.any().optional(),
  testsJson: z.any().optional(),
  presentationJson: z.any().optional(),
  // Черновики (API 2.0)
  planDraftJson: z.any().optional(),
  materialsDraftJson: z.any().optional(),
  testsDraftJson: z.any().optional(),
  presentationDraftJson: z.any().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Content version schema
export const contentVersionSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  type: z.enum(['plan', 'materials', 'tests', 'presentation']),
  payloadJson: z.any(),
  createdAt: z.string(),
  createdBy: z.string(),
});

// AI Preset schema
export const aiPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.enum(['plan', 'materials', 'tests', 'presentation']),
  payloadJson: z.any(),
  isPublic: z.boolean(),
  createdBy: z.string(),
  createdAt: z.string(),
});

// Preset creation schema
export const presetCreateSchema = z.object({
  name: z.string().min(1, 'Название пресета обязательно'),
  target: z.enum(['plan', 'materials', 'tests', 'presentation']),
  payloadJson: z.any(),
  isPublic: z.boolean().optional().default(false),
});

// Approval request schema
export const approvalRequestSchema = z.object({
  versionId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type PlanGenerationInput = z.infer<typeof planGenerationSchema>;
export type MaterialsGenerationInput = z.infer<typeof materialsGenerationSchema>;
export type TestsGenerationInput = z.infer<typeof testsGenerationSchema>;
export type PresentationGenerationInput = z.infer<typeof presentationGenerationSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type ContentVersion = z.infer<typeof contentVersionSchema>;
export type AIPreset = z.infer<typeof aiPresetSchema>;
export type PresetCreateInput = z.infer<typeof presetCreateSchema>;
export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type QuestionTypesResponse = z.infer<typeof questionTypesResponseSchema>;

