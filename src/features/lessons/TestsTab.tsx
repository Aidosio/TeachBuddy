'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { Download, Copy, Clock } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { testsGenerationSchema, type TestsGenerationInput } from '@/entities/schemas';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { copyToClipboard } from '@/shared/utils/copyToClipboard';
import { ApproveButton } from './ApproveButton';
import { VersionHistory } from './VersionHistory';
import { PresetSelector } from '@/features/ai/PresetSelector';
import type { LessonTests, AIPreset } from '@/entities/types';

export const TestsTab = () => {
  const { currentLesson, updateLessonContent, updateDraftContent, refreshLesson } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [approvedTests, setApprovedTests] = useState<LessonTests | null>(null);
  const [draftTests, setDraftTests] = useState<LessonTests | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExam, setIsExam] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AIPreset | null>(null);
  const [viewTab, setViewTab] = useState<'approved' | 'draft' | 'versions'>('draft');

  // Обновляем тесты при изменении currentLesson
  useEffect(() => {
    if (currentLesson) {
      // Утвержденные тесты
      if (currentLesson.testsJson) {
        const testsJson = currentLesson.testsJson;
        if (testsJson.questions && Array.isArray(testsJson.questions)) {
          const transformedTests: LessonTests = {
            type: testsJson.type || 'multiple-choice',
            difficulty: testsJson.difficulty === 'легкий' ? 'easy' : testsJson.difficulty === 'средний' ? 'medium' : 'hard',
            questions: testsJson.questions.map((q: any) => ({
              id: q.id || Math.random().toString(),
              type: q.type,
              question: q.question,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
              explanation: q.explanation,
            })),
            isExam: testsJson.isExam || false,
          };
          setApprovedTests(transformedTests);
          setIsExam(transformedTests.isExam || false);
        }
      } else if (currentLesson.tests) {
        setApprovedTests(currentLesson.tests);
      setIsExam(currentLesson.tests.isExam || false);
      }

      // Черновик
      if (currentLesson.testsDraftJson) {
        const testsJson = currentLesson.testsDraftJson;
        if (testsJson.questions && Array.isArray(testsJson.questions)) {
          const transformedTests: LessonTests = {
            type: testsJson.type || 'multiple-choice',
            difficulty: testsJson.difficulty === 'легкий' ? 'easy' : testsJson.difficulty === 'средний' ? 'medium' : 'hard',
            questions: testsJson.questions.map((q: any) => ({
              id: q.id || Math.random().toString(),
              type: q.type,
              question: q.question,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
              explanation: q.explanation,
            })),
            isExam: testsJson.isExam || false,
          };
          setDraftTests(transformedTests);
          setIsExam(transformedTests.isExam || false);
          setViewTab('draft');
        }
      }
    }
  }, [currentLesson]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TestsGenerationInput>({
    resolver: zodResolver(testsGenerationSchema),
    defaultValues: {
      type: 'multiple-choice',
      difficulty: 'средний',
      count: 5,
    },
  });

  // Обновляем форму при выборе пресета
  useEffect(() => {
    if (selectedPreset && selectedPreset.payloadJson) {
      const payload = selectedPreset.payloadJson;
      reset({
        type: payload.type || 'multiple-choice',
        difficulty: payload.difficulty || 'средний',
        count: payload.count || 5,
      });
    }
  }, [selectedPreset, reset]);

  const onSubmit = async (data: TestsGenerationInput) => {
    if (!currentLesson) return;
    try {
      setIsGenerating(true);
      setLoading(true);
      // Преобразуем difficulty в формат бэкенда (русские строки)
      const difficultyMap: Record<string, string> = {
        'легкий': 'легкий',
        'средний': 'средний',
        'сложный': 'сложный',
        'easy': 'легкий',
        'medium': 'средний',
        'hard': 'сложный',
      };
      const backendDifficulty = difficultyMap[data.difficulty] || data.difficulty;
      
      // Определяем язык из браузера или используем 'ru' по умолчанию
      const language = typeof window !== 'undefined' 
        ? (navigator.language || navigator.languages?.[0] || 'ru').split('-')[0]
        : 'ru';
      
      const response = await api.post(
        endpoints.lessons.generateTests(currentLesson.id),
        {
          type: data.type,
          difficulty: backendDifficulty,
          count: data.count,
          language,
        }
      );
      
      // API 2.0: возвращает testsJson напрямую (объект)
      // Может быть в обертке data
      const responseData = response.data?.data || response.data;
      const testsJson = responseData.testsJson || responseData;
      
      // Сохраняем черновик
      updateDraftContent('tests', testsJson);
      
      // Преобразуем difficulty обратно в формат фронтенда
      const frontendDifficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'легкий': 'easy',
        'средний': 'medium',
        'сложный': 'hard',
      };
      const frontendDifficulty = frontendDifficultyMap[backendDifficulty] || 'medium';
      
      // Трансформируем в формат фронтенда
      const backendQuestions = testsJson.questions || [];
      const transformedTests: LessonTests = {
        type: data.type,
        difficulty: frontendDifficulty,
        questions: backendQuestions.map((q: any) => ({
          id: q.id || Math.random().toString(),
          type: q.type,
          question: q.question,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          answer: q.type === 'short-answer' ? q.answer : q.options?.[q.correctOptionIndex] || '',
          explanation: q.explanation,
        })),
        isExam,
      };
      
      setDraftTests(transformedTests);
      setViewTab('draft');
      await refreshLesson();
      showNotification('Задания успешно сгенерированы (черновик)', 'success');
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка генерации заданий',
        'error'
      );
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleApproved = async () => {
    await refreshLesson();
    setViewTab('approved');
  };

  const handleExport = async (testsToExport: LessonTests) => {
    if (!testsToExport) return;
    const exportText = testsToExport.questions
      .map((q, i) => {
        return `${i + 1}. ${q.question}\nОтвет: ${q.answer}${q.explanation ? `\nПояснение: ${q.explanation}` : ''}`;
      })
      .join('\n\n');
    const success = await copyToClipboard(exportText);
    if (success) {
      showNotification('Задания скопированы в буфер обмена', 'success');
    } else {
      showNotification('Ошибка копирования', 'error');
    }
  };

  const handleExamChange = (checked: boolean, isDraft: boolean) => {
    setIsExam(checked);
    const testsToUpdate = isDraft ? draftTests : approvedTests;
    if (testsToUpdate) {
      const updated = { ...testsToUpdate, isExam: checked };
      if (isDraft) {
        setDraftTests(updated);
      } else {
        setApprovedTests(updated);
      updateLessonContent('tests', updated);
      }
    }
  };

  const renderTests = (tests: LessonTests | null, isDraft: boolean) => {
    if (!tests) return null;

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {isDraft ? 'Черновик тестов' : 'Утвержденные тесты'}
      </Typography>
            {isDraft && <Chip label="Черновик" color="warning" size="small" />}
            {!isDraft && <Chip label="Утверждены" color="success" size="small" />}
          </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
            {isDraft && currentLesson && (
              <ApproveButton
                lessonId={currentLesson.id}
                type="tests"
                hasDraft={!!currentLesson.testsDraftJson}
                onApproved={handleApproved}
              />
            )}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isExam}
                  onChange={(e) => handleExamChange(e.target.checked, isDraft)}
                  disabled={!isDraft}
                  />
                }
                label="Пометить как контрольную"
              />
              <Button
                startIcon={<Copy size={16} />}
              onClick={() => handleExport(tests)}
                variant="outlined"
              >
                Экспорт
              </Button>
            </Box>
          </Box>
          <List>
            {tests.questions.map((question, index) => (
              <Box key={question.id || index}>
                <ListItem>
                  <ListItemText
                    primary={`${index + 1}. ${question.question}`}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {question.type === 'multiple-choice' && question.options ? (
                          <Box>
                            {question.options.map((option, optIndex) => (
                              <Typography
                                key={optIndex}
                                variant="body2"
                                color={optIndex === question.correctOptionIndex ? 'primary' : 'text.secondary'}
                                sx={{ mt: 0.5 }}
                              >
                                {optIndex === question.correctOptionIndex ? '✓ ' : '  '}
                                {String.fromCharCode(65 + optIndex)}. {option}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="primary">
                            Ответ: {question.answer}
                          </Typography>
                        )}
                        {question.explanation && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Пояснение: {question.explanation}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < tests.questions.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
      </Paper>
    );
  };

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации заданий
      </Typography>
    );
  }

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации заданий
      </Typography>
    );
  }

  const hasTests = approvedTests || draftTests;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Параметры генерации
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PresetSelector
              type="tests"
              onSelectPreset={setSelectedPreset}
              selectedPresetId={selectedPreset?.id || null}
            />
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Тип вопросов</InputLabel>
              <Select
                {...register('type')}
                label="Тип вопросов"
                defaultValue="multiple-choice"
              >
                <MenuItem value="multiple-choice">Выбор из вариантов</MenuItem>
                <MenuItem value="short-answer">Краткий ответ</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth error={!!errors.difficulty}>
              <InputLabel>Сложность</InputLabel>
              <Select
                {...register('difficulty')}
                label="Сложность"
                defaultValue="средний"
              >
                <MenuItem value="легкий">Лёгкая</MenuItem>
                <MenuItem value="средний">Средняя</MenuItem>
                <MenuItem value="сложный">Сложная</MenuItem>
              </Select>
            </FormControl>
            <TextField
              {...register('count', { valueAsNumber: true })}
              label="Количество вопросов"
              type="number"
              error={!!errors.count}
              helperText={errors.count?.message}
            />
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isGenerating}
            >
              Сгенерировать
            </LoadingButton>
          </Box>
        </form>
      </Paper>

      {hasTests && (
        <Box sx={{ mb: 3 }}>
          <Tabs value={viewTab} onChange={(_, newValue) => setViewTab(newValue)}>
            {draftTests && (
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Черновик
                    <Chip label="Новый" color="warning" size="small" />
                  </Box>
                }
                value="draft"
              />
            )}
            {approvedTests && (
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Утвержденные
                    <Chip label="✓" color="success" size="small" />
                  </Box>
                }
                value="approved"
              />
            )}
            {currentLesson && (
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={16} />
                    История версий
                  </Box>
                }
                value="versions"
              />
            )}
          </Tabs>
        </Box>
      )}

      {viewTab === 'draft' && renderTests(draftTests, true)}
      {viewTab === 'approved' && renderTests(approvedTests, false)}
      {viewTab === 'versions' && currentLesson && (
        <VersionHistory lessonId={currentLesson.id} type="tests" />
      )}

      {!hasTests && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary" align="center">
            Тесты еще не сгенерированы
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

