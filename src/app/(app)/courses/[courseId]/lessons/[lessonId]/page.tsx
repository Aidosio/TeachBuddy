'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowLeft, FileText } from 'react-feather';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { lessonSchemaResponse } from '@/entities/schemas';
import { PlanTab } from '@/features/lessons/PlanTab';
import { MaterialsTab } from '@/features/lessons/MaterialsTab';
import { TestsTab } from '@/features/lessons/TestsTab';
import { FeedbackTab } from '@/features/lessons/FeedbackTab';
import { LoadingButton } from '@/shared/components/LoadingButton';

type TabValue = 'plan' | 'materials' | 'tests' | 'feedback';

export default function LessonEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const { currentLesson, setCurrentLesson, activeTab, setActiveTab } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [tabValue, setTabValue] = useState<TabValue>(activeTab);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching lesson:', lessonId);
      const response = await api.get(endpoints.lessons.detail(lessonId));
      console.log('📚 Lesson response:', response);
      
      // API может возвращать данные в обертке data
      const rawLesson = response.data?.data || response.data;
      console.log('📚 Raw lesson data:', rawLesson);
      
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
      
      const lesson = lessonSchemaResponse.parse(lessonData);
      setCurrentLesson(lesson);
    } catch (err: any) {
      console.error('❌ LessonEditor - Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка загрузки урока';
      console.error('Error details:', {
        message: errorMessage,
        response: err.response?.data,
        lessonData: err.issues || 'No validation issues',
      });
      showNotification(errorMessage, 'error');
      // Не очищаем currentLesson, чтобы пользователь мог видеть предыдущее состояние
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
    setActiveTab(newValue);
  };

  const handleExportPdf = async () => {
    if (!currentLesson) return;

    try {
      setIsExportingPdf(true);
      const response = await api.get(endpoints.lessons.exportPdf(lessonId), {
        responseType: 'blob',
      });

      // response.data уже является Blob при responseType: 'blob'
      const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Открываем PDF в новой вкладке
      window.open(url, '_blank');

      // Очистка URL через некоторое время (после открытия)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);

      showNotification('PDF успешно сгенерирован', 'success');
    } catch (err: any) {
      console.error('❌ PDF Export Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка при генерации PDF';
      showNotification(errorMessage, 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Проверяем, все ли контент утвержден
  const isAllContentApproved = 
    currentLesson?.planJson && 
    currentLesson?.materialsJson && 
    currentLesson?.testsJson;

  if (loading && !currentLesson) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentLesson && !loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          Не удалось загрузить урок. Попробуйте обновить страницу.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push(`/courses/${courseId}`)}>
            <ArrowLeft size={20} />
          </IconButton>
          <Typography variant="h4" component="h1">
            {currentLesson.title}
          </Typography>
        </Box>
        <LoadingButton
          variant="outlined"
          color="error"
          startIcon={<FileText size={16} />}
          onClick={handleExportPdf}
          loading={isExportingPdf}
          disabled={!isAllContentApproved || isExportingPdf}
        >
          Сгенерировать PDF
        </LoadingButton>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="План занятия" value="plan" />
          <Tab label="Материалы" value="materials" />
          <Tab label="Задания/Тесты" value="tests" />
          <Tab label="Фидбек" value="feedback" />
        </Tabs>
      </Box>

      <Box>
        {tabValue === 'plan' && <PlanTab />}
        {tabValue === 'materials' && <MaterialsTab />}
        {tabValue === 'tests' && <TestsTab />}
        {tabValue === 'feedback' && <FeedbackTab />}
      </Box>
    </Box>
  );
}

