import type { Course, Lesson, LessonPlan, LessonMaterials, LessonTests, User } from '@/entities/types';

// Моковые данные
export const mockUser: User = {
  id: 'user-1',
  email: 'teacher@example.com',
  name: 'Преподаватель',
};

export const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Введение в программирование',
    description: 'Базовый курс по основам программирования для начинающих',
    level: 'Начальный',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'course-2',
    title: 'Веб-разработка',
    description: 'Современные технологии веб-разработки: HTML, CSS, JavaScript, React',
    level: 'Средний',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'course-3',
    title: 'Алгоритмы и структуры данных',
    description: 'Изучение основных алгоритмов и структур данных',
    level: 'Продвинутый',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const mockLessons: Record<string, Lesson[]> = {
  'course-1': [
    {
      id: 'lesson-1-1',
      courseId: 'course-1',
      title: 'Введение в программирование',
      goals: 'Понять основные концепции программирования',
      plan: {
        type: 'lecture',
        duration: 90,
        level: 'beginner',
        blocks: [
          {
            title: 'Введение (10 мин)',
            content: 'Приветствие, знакомство с курсом, обзор программы обучения',
            duration: 10,
          },
          {
            title: 'Основные концепции (30 мин)',
            content: 'Переменные, типы данных, операторы, базовые конструкции языка',
            duration: 30,
          },
          {
            title: 'Практика (40 мин)',
            content: 'Решение простых задач, написание первых программ',
            duration: 40,
          },
          {
            title: 'Заключение (10 мин)',
            content: 'Подведение итогов, ответы на вопросы, домашнее задание',
            duration: 10,
          },
        ],
      },
      materials: {
        explanation: 'Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер выполняет для решения определенной задачи.',
        examples: 'Пример 1: Вывод текста\nprint("Hello, World!")\n\nПример 2: Переменные\nname = "Иван"\nage = 25\nprint(f"Меня зовут {name}, мне {age} лет")',
        simplified: 'Программирование — это написание команд для компьютера. Как рецепт для повара, только для компьютера.',
      },
      tests: {
        type: 'tests',
        difficulty: 'easy',
        questions: [
          {
            id: 'q1',
            question: 'Что такое переменная?',
            answer: 'Переменная — это именованная область памяти для хранения данных',
            explanation: 'Переменные позволяют хранить и изменять значения в программе',
          },
          {
            id: 'q2',
            question: 'Какие основные типы данных вы знаете?',
            answer: 'Числа (int, float), строки (string), булевы значения (bool), списки (list)',
            explanation: 'Типы данных определяют, какие операции можно выполнять со значениями',
          },
        ],
        isExam: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'lesson-1-2',
      courseId: 'course-1',
      title: 'Условные операторы',
      goals: 'Изучить работу с условиями if/else',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  'course-2': [
    {
      id: 'lesson-2-1',
      courseId: 'course-2',
      title: 'Основы HTML и CSS',
      goals: 'Изучить базовые теги HTML и стили CSS',
      plan: {
        type: 'workshop',
        duration: 120,
        level: 'beginner',
        blocks: [
          {
            title: 'HTML структура (30 мин)',
            content: 'Теги, атрибуты, семантическая разметка',
            duration: 30,
          },
          {
            title: 'CSS основы (40 мин)',
            content: 'Селекторы, свойства, каскадность, наследование',
            duration: 40,
          },
          {
            title: 'Практика (50 мин)',
            content: 'Создание простой веб-страницы',
            duration: 50,
          },
        ],
      },
      materials: {
        explanation: 'HTML (HyperText Markup Language) — язык разметки для создания структуры веб-страниц. CSS (Cascading Style Sheets) — язык стилей для оформления веб-страниц.',
        examples: 'HTML:\n<div class="container">\n  <h1>Заголовок</h1>\n  <p>Текст параграфа</p>\n</div>\n\nCSS:\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n}',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  'course-3': [
    {
      id: 'lesson-3-1',
      courseId: 'course-3',
      title: 'Сортировки',
      goals: 'Изучить алгоритмы сортировки массивов',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

// Моковые ответы для генерации
export const mockPlanGeneration = (params: any): LessonPlan => ({
  type: params.type || 'lecture',
  duration: params.duration || 90,
  level: params.level || 'intermediate',
  blocks: [
    {
      title: 'Введение (15 мин)',
      content: 'Приветствие, обзор темы занятия, постановка целей и задач',
      duration: 15,
    },
    {
      title: 'Теоретическая часть (30 мин)',
      content: 'Изучение основных концепций и принципов темы',
      duration: 30,
    },
    {
      title: 'Практическая часть (35 мин)',
      content: 'Решение задач, выполнение упражнений, работа с примерами',
      duration: 35,
    },
    {
      title: 'Заключение (10 мин)',
      content: 'Подведение итогов, ответы на вопросы, домашнее задание',
      duration: 10,
    },
  ],
});

export const mockMaterialsGeneration = (type: string): string => {
  const materials: Record<string, string> = {
    explanation: 'Это подробное объяснение материала. Здесь описываются основные концепции, принципы работы и важные детали, которые необходимо понять для успешного освоения темы.',
    examples: 'Пример 1: Базовый пример использования\n\nПример 2: Более сложный случай\n\nПример 3: Практическое применение',
    simplified: 'Упрощенное объяснение для лучшего понимания. Основная идея в том, что...',
  };
  return materials[type] || 'Сгенерированный материал';
};

export const mockTestsGeneration = (params: any): LessonTests => {
  const questions = Array.from({ length: params.count || 5 }, (_, i) => ({
    id: `q${i + 1}`,
    question: `Вопрос ${i + 1} по теме занятия?`,
    answer: `Правильный ответ на вопрос ${i + 1}`,
    explanation: `Пояснение к ответу на вопрос ${i + 1}`,
  }));

  return {
    type: params.type || 'tests',
    difficulty: params.difficulty || 'medium',
    questions,
    isExam: false,
  };
};

export const mockFeedbackGeneration = (params: any): string => {
  return `Фидбек по работе студента:

Сильные стороны:
- Хорошо структурирован ответ
- Приведены релевантные примеры
- Продемонстрировано понимание темы

Области для улучшения:
- Можно добавить больше деталей
- Стоит развить аргументацию

Общая оценка: Работа выполнена на хорошем уровне. Рекомендую обратить внимание на указанные моменты для дальнейшего развития.

Дополнительные рекомендации:
- Изучить дополнительные материалы по теме
- Практиковаться в решении подобных задач`;
};

