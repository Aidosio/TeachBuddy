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
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableContainer,
} from '@mui/material';
import { Copy, Clock } from 'react-feather';
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
import type { LessonTests, AIPreset, QuestionType, TestQuestion } from '@/entities/types';

export const TestsTab = () => {
  const { currentLesson, updateLessonContent, updateDraftContent, refreshLesson } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [approvedTests, setApprovedTests] = useState<LessonTests | null>(null);
  const [draftTests, setDraftTests] = useState<LessonTests | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExam, setIsExam] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AIPreset | null>(null);
  const [viewTab, setViewTab] = useState<'approved' | 'draft' | 'versions'>('draft');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [loadingQuestionTypes, setLoadingQuestionTypes] = useState(false);

  // Загружаем доступные типы вопросов
  useEffect(() => {
    const fetchQuestionTypes = async () => {
      if (!currentLesson) return;
      try {
        setLoadingQuestionTypes(true);
        const response = await api.get(endpoints.lessons.questionTypes(currentLesson.id));
        const data = response.data?.data || response.data;
        setQuestionTypes(data.questionTypes || []);
      } catch (err: any) {
        console.error('Failed to fetch question types:', err);
        // В случае ошибки используем базовые типы
        setQuestionTypes([
          { id: 'multiple-choice', name: 'Выбор из вариантов', description: '', suitableFor: [], fields: {} },
          { id: 'short-answer', name: 'Краткий ответ', description: '', suitableFor: [], fields: {} },
        ]);
      } finally {
        setLoadingQuestionTypes(false);
      }
    };

    fetchQuestionTypes();
  }, [currentLesson?.id]);

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
              correctOptionIndex: q.correctOptionIndex ?? null,
              answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
              explanation: q.explanation,
              additionalData: q.additionalData,
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
              correctOptionIndex: q.correctOptionIndex ?? null,
              answer: q.type === 'short-answer' ? q.answer : (q.options?.[q.correctOptionIndex] || ''),
              explanation: q.explanation,
              additionalData: q.additionalData,
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
    watch,
  } = useForm<TestsGenerationInput>({
    resolver: zodResolver(testsGenerationSchema),
    defaultValues: {
      type: 'multiple-choice',
      difficulty: 'средний',
      count: 5,
    },
  });

  const selectedType = watch('type');

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
          correctOptionIndex: q.correctOptionIndex ?? null,
          answer: q.type === 'short-answer' ? q.answer : q.options?.[q.correctOptionIndex] || '',
          explanation: q.explanation,
          additionalData: q.additionalData,
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
        let answerText = '';
        if (q.type === 'multiple-choice' && q.options && q.correctOptionIndex !== null) {
          answerText = `Ответ: ${q.options[q.correctOptionIndex]}`;
        } else if (q.type === 'short-answer' && q.answer) {
          answerText = `Ответ: ${q.answer}`;
        } else if (q.type === 'true-false' && q.correctOptionIndex !== null) {
          answerText = `Ответ: ${q.options?.[q.correctOptionIndex] || ''}`;
        } else if (q.type === 'fill-blanks' && q.additionalData?.blanks) {
          answerText = `Ответы: ${q.additionalData.blanks.map((b: any) => b.correctAnswer).join(', ')}`;
        } else if (q.type === 'numeric' && q.additionalData?.correctAnswer !== undefined) {
          answerText = `Ответ: ${q.additionalData.correctAnswer}`;
        } else if (q.type === 'matching' && q.additionalData?.pairs) {
          answerText = `Пары: ${q.additionalData.pairs.map((p: any) => `${p.left} - ${p.right}`).join('; ')}`;
        } else if (q.type === 'ordering' && q.additionalData?.correctOrder) {
          const ordered = q.additionalData.correctOrder.map((idx: number) => q.options?.[idx]).filter(Boolean);
          answerText = `Порядок: ${ordered.join(' → ')}`;
        }
        return `${i + 1}. ${q.question}\n${answerText}${q.explanation ? `\nПояснение: ${q.explanation}` : ''}`;
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

  // Функции рендеринга для разных типов вопросов
  const renderQuestionContent = (question: TestQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        if (question.options && question.options.length > 0) {
          return (
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
          );
        }
        return null;

      case 'short-answer':
        return (
          <Typography variant="body2" color="primary">
            Ответ: {question.answer || 'Не указан'}
          </Typography>
        );

      case 'true-false':
        return (
          <Box>
            {question.options?.map((option, optIndex) => (
              <Typography
                key={optIndex}
                variant="body2"
                color={optIndex === question.correctOptionIndex ? 'primary' : 'text.secondary'}
                sx={{ mt: 0.5 }}
              >
                {optIndex === question.correctOptionIndex ? '✓ ' : '  '}
                {option}
              </Typography>
            ))}
            {question.additionalData?.isTrue !== undefined && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Правильный ответ: {question.additionalData.isTrue ? 'Верно' : 'Неверно'}
              </Typography>
            )}
          </Box>
        );

      case 'fill-blanks':
        if (question.additionalData?.blanks) {
          return (
            <Box>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                Правильные ответы:
              </Typography>
              {question.additionalData.blanks.map((blank: any, idx: number) => (
                <Typography key={idx} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Пробел {blank.position + 1}: <strong>{blank.correctAnswer}</strong>
                </Typography>
              ))}
            </Box>
          );
        }
        return null;

      case 'matching':
        if (question.additionalData?.pairs) {
          return (
            <Box>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                Правильные пары:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Левая часть</strong></TableCell>
                      <TableCell><strong>Правая часть</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {question.additionalData.pairs.map((pair: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{pair.left}</TableCell>
                        <TableCell>{pair.right}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        }
        return null;

      case 'ordering':
        if (question.additionalData?.correctOrder && question.options) {
          return (
            <Box>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                Правильный порядок:
              </Typography>
              {question.additionalData.correctOrder.map((idx: number, orderIdx: number) => (
                <Typography key={orderIdx} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {orderIdx + 1}. {question.options?.[idx] || ''}
                </Typography>
              ))}
            </Box>
          );
        }
        return null;

      case 'numeric':
        if (question.additionalData?.correctAnswer !== undefined) {
          return (
            <Box>
              <Typography variant="body2" color="primary">
                Правильный ответ: <strong>{question.additionalData.correctAnswer}</strong>
              </Typography>
              {question.additionalData.tolerance !== undefined && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Допуск: ±{question.additionalData.tolerance}
                </Typography>
              )}
            </Box>
          );
        }
        return null;

      case 'code':
        if (question.additionalData) {
          return (
            <Box>
              {question.additionalData.language && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Язык: {question.additionalData.language}
                </Typography>
              )}
              {question.additionalData.testCases && question.additionalData.testCases.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 0.5 }}>
                    Тестовые случаи:
                  </Typography>
                  {question.additionalData.testCases.map((testCase: any, idx: number) => (
                    <Paper key={idx} sx={{ p: 1, mt: 0.5, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" component="div">
                        Вход: <code>{JSON.stringify(testCase.input)}</code>
                      </Typography>
                      <Typography variant="caption" component="div">
                        Ожидается: <code>{JSON.stringify(testCase.expected)}</code>
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          );
        }
        return null;

      case 'essay':
        if (question.additionalData) {
          return (
            <Box>
              {question.additionalData.minWords && (
                <Typography variant="body2" color="text.secondary">
                  Минимум слов: {question.additionalData.minWords}
                </Typography>
              )}
              {question.additionalData.maxWords && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Максимум слов: {question.additionalData.maxWords}
                </Typography>
              )}
            </Box>
          );
        }
        return null;

      case 'matrix':
        if (question.additionalData?.rows && question.additionalData?.columns && question.additionalData?.correctAnswers) {
          return (
            <Box>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                Правильные ответы:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      {question.additionalData.columns.map((col: string, idx: number) => (
                        <TableCell key={idx} align="center"><strong>{col}</strong></TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {question.additionalData.rows.map((row: string, rowIdx: number) => (
                      <TableRow key={rowIdx}>
                        <TableCell><strong>{row}</strong></TableCell>
                        {question.additionalData.correctAnswers[rowIdx]?.map((isCorrect: boolean, colIdx: number) => (
                          <TableCell key={colIdx} align="center">
                            {isCorrect ? '✓' : '✗'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        }
        return null;

      case 'drag-drop':
        if (question.additionalData?.dropZones && question.additionalData?.items) {
          return (
            <Box>
              <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                Зоны размещения:
              </Typography>
              {question.additionalData.dropZones.map((zone: string, idx: number) => (
                <Typography key={idx} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {idx + 1}. {zone}
                </Typography>
              ))}
              <Typography variant="body2" color="primary" sx={{ mt: 1, mb: 0.5 }}>
                Элементы для перетаскивания:
              </Typography>
              {question.additionalData.items.map((item: string, idx: number) => (
                <Chip key={idx} label={item} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
              ))}
            </Box>
          );
        }
        return null;

      case 'diagram':
        return (
          <Typography variant="body2" color="text.secondary">
            {question.additionalData?.description || 'Требуется создать схему/диаграмму'}
          </Typography>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Тип вопроса: {question.type}
          </Typography>
        );
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
                  primary={
                    <Box>
                      <Typography variant="body1" component="span">
                        {index + 1}. {question.question}
                      </Typography>
                      <Chip
                        label={questionTypes.find(qt => qt.id === question.type)?.name || question.type}
                        size="small"
                        sx={{ ml: 1 }}
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {renderQuestionContent(question)}
                      {question.explanation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>Пояснение:</strong> {question.explanation}
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
                disabled={loadingQuestionTypes}
              >
                {questionTypes.length > 0 ? (
                  questionTypes.map((qt) => (
                    <MenuItem key={qt.id} value={qt.id}>
                      {qt.name}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="multiple-choice">Выбор из вариантов</MenuItem>
                    <MenuItem value="short-answer">Краткий ответ</MenuItem>
                  </>
                )}
              </Select>
              {questionTypes.length > 0 && selectedType && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {questionTypes.find(qt => qt.id === selectedType)?.description}
                </Typography>
              )}
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
