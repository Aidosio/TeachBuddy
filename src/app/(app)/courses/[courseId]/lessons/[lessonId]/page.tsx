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
import { ArrowLeft } from 'react-feather';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { lessonSchemaResponse } from '@/entities/schemas';
import { PlanTab } from '@/features/lessons/PlanTab';
import { MaterialsTab } from '@/features/lessons/MaterialsTab';
import { TestsTab } from '@/features/lessons/TestsTab';
import { FeedbackTab } from '@/features/lessons/FeedbackTab';

type TabValue = 'plan' | 'materials' | 'tests' | 'feedback';

export default function LessonEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const { currentLesson, setCurrentLesson, activeTab, setActiveTab } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [tabValue, setTabValue] = useState<TabValue>(activeTab);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.lessons.detail(lessonId));
      
      console.log('📚 LessonEditor - Full response:', response);
      console.log('📚 LessonEditor - response.data:', response.data);
      console.log('📚 LessonEditor - response.data.content:', response.data.content);
      
      const rawLesson = response.data;
      
      // Извлекаем данные из content
      let lessonData: any = {
        id: rawLesson.id,
        courseId: rawLesson.courseId,
        title: rawLesson.title,
        goals: rawLesson.goals,
        createdAt: rawLesson.createdAt,
        updatedAt: rawLesson.updatedAt,
      };
      
      // Обрабатываем content.planJson
      if (rawLesson.content?.planJson) {
        console.log('📚 LessonEditor - content.planJson:', rawLesson.content.planJson);
        const planJson = rawLesson.content.planJson;
        
        if (planJson.raw) {
          try {
            let jsonString = planJson.raw;
            jsonString = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/g, '').trim();
            const parsedPlan = JSON.parse(jsonString);
            console.log('📚 LessonEditor - parsed plan:', parsedPlan);
            
            // Преобразуем в формат фронтенда
            lessonData.plan = {
              type: 'лекция', // можно извлечь из данных или оставить по умолчанию
              duration: 90, // можно извлечь из данных или оставить по умолчанию
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
          } catch (parseError) {
            console.error('❌ LessonEditor - Ошибка парсинга planJson:', parseError);
          }
        }
      }
      
      // Обрабатываем content.materialsJson (если есть)
      if (rawLesson.content?.materialsJson) {
        console.log('📚 LessonEditor - content.materialsJson:', rawLesson.content.materialsJson);
        const materialsJson = rawLesson.content.materialsJson;
        
        if (materialsJson.raw) {
          try {
            let jsonString = materialsJson.raw;
            jsonString = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/g, '').trim();
            const parsedMaterials = JSON.parse(jsonString);
            console.log('📚 LessonEditor - parsed materials:', parsedMaterials);
            
            // Преобразуем в формат фронтенда
            const eduMaterials = parsedMaterials.educational_materials || parsedMaterials;
            
            let explanation = '';
            let examples = '';
            let simplified = '';
            
            // Explanation: key_concepts + explanations
            if (eduMaterials.key_concepts && Array.isArray(eduMaterials.key_concepts)) {
              explanation += 'Ключевые концепции:\n' + eduMaterials.key_concepts.map((concept: string, index: number) => 
                `${index + 1}. ${concept}`
              ).join('\n');
            }
            
            if (eduMaterials.explanations && typeof eduMaterials.explanations === 'object') {
              explanation += '\n\nОбъяснения:\n' + Object.entries(eduMaterials.explanations)
                .map(([concept, exp]) => `• ${concept}: ${exp}`)
                .join('\n\n');
            }
            
            // Examples
            if (eduMaterials.examples && typeof eduMaterials.examples === 'object') {
              examples = Object.entries(eduMaterials.examples)
                .map(([title, example]) => `${title}:\n${example}`)
                .join('\n\n');
            }
            
            // Simplified: key_concepts
            if (eduMaterials.key_concepts && Array.isArray(eduMaterials.key_concepts)) {
              simplified = eduMaterials.key_concepts
                .map((concept: string) => `• ${concept}`)
                .join('\n');
            }
            
            lessonData.materials = {
              explanation: explanation || undefined,
              examples: examples || undefined,
              simplified: simplified || undefined,
            };
          } catch (parseError) {
            console.error('❌ LessonEditor - Ошибка парсинга materialsJson:', parseError);
          }
        }
      }
      
      // Обрабатываем quizQuestions (если есть)
      if (rawLesson.quizQuestions && Array.isArray(rawLesson.quizQuestions) && rawLesson.quizQuestions.length > 0) {
        console.log('📚 LessonEditor - quizQuestions:', rawLesson.quizQuestions);
        
        // Определяем тип тестов на основе первого вопроса
        const firstQuestion = rawLesson.quizQuestions[0];
        const testType = firstQuestion.type === 'multiple-choice' ? 'multiple-choice' : 'short-answer';
        
        // Преобразуем quizQuestions в формат фронтенда
        lessonData.tests = {
          type: testType,
          difficulty: 'medium', // можно определить по сложности вопросов или оставить по умолчанию
          questions: rawLesson.quizQuestions.map((q: any) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
            explanation: q.explanation,
          })),
        };
      }
      
      const lesson = lessonSchemaResponse.parse(lessonData);
      console.log('📚 LessonEditor - Final lesson:', lesson);
      setCurrentLesson(lesson);
    } catch (err: any) {
      console.error('❌ LessonEditor - Error:', err);
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка загрузки урока',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
    setTabValue(newValue);
    setActiveTab(newValue);
  };

  if (loading && !currentLesson) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentLesson) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.push(`/courses/${courseId}`)}>
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h4" component="h1">
          {currentLesson.title}
        </Typography>
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

