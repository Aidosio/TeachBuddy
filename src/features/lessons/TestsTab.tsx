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
} from '@mui/material';
import { Download, Copy } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { testsGenerationSchema, type TestsGenerationInput } from '@/entities/schemas';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { copyToClipboard } from '@/shared/utils/copyToClipboard';
import type { LessonTests } from '@/entities/types';

export const TestsTab = () => {
  const { currentLesson, updateLessonContent } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [tests, setTests] = useState<LessonTests | null>(currentLesson?.tests || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExam, setIsExam] = useState(false);

  // Обновляем тесты при изменении currentLesson
  useEffect(() => {
    if (currentLesson?.tests) {
      setTests(currentLesson.tests);
      setIsExam(currentLesson.tests.isExam || false);
    }
  }, [currentLesson]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestsGenerationInput>({
    resolver: zodResolver(testsGenerationSchema),
    defaultValues: {
      type: 'multiple-choice',
      difficulty: 'средний',
      count: 5,
    },
  });

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
      
      const response = await api.post(
        endpoints.lessons.generateTests(currentLesson.id),
        {
          type: data.type,
          difficulty: backendDifficulty,
          count: data.count,
        }
      );
      // Бэкенд возвращает { questions: [...] }
      const backendQuestions = response.data.questions || [];
      
      // Преобразуем difficulty обратно в формат фронтенда
      const frontendDifficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
        'легкий': 'easy',
        'средний': 'medium',
        'сложный': 'hard',
      };
      const frontendDifficulty = frontendDifficultyMap[backendDifficulty] || 'medium';
      
      // Трансформируем в формат фронтенда
      const transformedTests: LessonTests = {
        type: data.type,
        difficulty: frontendDifficulty,
        questions: backendQuestions.map((q: any) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          answer: q.type === 'short-answer' ? q.answer : q.options?.[q.correctOptionIndex] || '',
          explanation: q.explanation,
        })),
        isExam,
      };
      
      setTests(transformedTests);
      updateLessonContent('tests', transformedTests);
      showNotification('Задания успешно сгенерированы', 'success');
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

  const handleExport = async () => {
    if (!tests) return;
    const exportText = tests.questions
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

  const handleExamChange = (checked: boolean) => {
    setIsExam(checked);
    if (tests) {
      const updated = { ...tests, isExam: checked };
      setTests(updated);
      updateLessonContent('tests', updated);
    }
  };

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации заданий
      </Typography>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Параметры генерации
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

      {tests && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Результат</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isExam}
                    onChange={(e) => handleExamChange(e.target.checked)}
                  />
                }
                label="Пометить как контрольную"
              />
              <Button
                startIcon={<Copy size={16} />}
                onClick={handleExport}
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
      )}
    </Box>
  );
};

