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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Paper,
  Tabs,
  Tab,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ChevronDown, Copy, Clock, Target, Book, Activity, CheckCircle } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { planGenerationSchema, type PlanGenerationInput } from '@/entities/schemas';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { copyToClipboard } from '@/shared/utils/copyToClipboard';
import { ApproveButton } from './ApproveButton';
import { VersionHistory } from './VersionHistory';
import { PresetSelector } from '@/features/ai/PresetSelector';
import type { LessonPlan, AIPreset } from '@/entities/types';

export const PlanTab = () => {
  const { currentLesson, updateLessonContent, updateDraftContent, refreshLesson } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [approvedPlan, setApprovedPlan] = useState<LessonPlan | null>(null);
  const [draftPlan, setDraftPlan] = useState<LessonPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AIPreset | null>(null);
  const [viewTab, setViewTab] = useState<'approved' | 'draft' | 'versions'>('draft');

  // Обновляем планы при изменении currentLesson
  useEffect(() => {
    if (currentLesson) {
      // Утвержденный план
      if (currentLesson.planJson) {
        const planJson = currentLesson.planJson;
        const transformedPlan: LessonPlan = {
          type: planJson.type || 'лекция',
          duration: planJson.duration || 90,
          level: planJson.level,
          blocks: [
            ...(planJson.objectives || []).map((obj: string) => ({
              title: 'Цель',
              content: obj,
            })),
            ...(planJson.materials || []).map((mat: string) => ({
              title: 'Материал',
              content: mat,
            })),
            ...(planJson.activities || []).map((activity: any) => ({
              title: activity.name || 'Активность',
              content: activity.description || '',
              duration: activity.duration,
            })),
            ...(planJson.assessment ? [{
              title: 'Оценка',
              content: planJson.assessment,
            }] : []),
          ],
        };
        setApprovedPlan(transformedPlan);
      } else if (currentLesson.plan) {
        setApprovedPlan(currentLesson.plan);
      }

      // Черновик
      if (currentLesson.planDraftJson) {
        const planJson = currentLesson.planDraftJson;
        const transformedPlan: LessonPlan = {
          type: planJson.type || 'лекция',
          duration: planJson.duration || 90,
          level: planJson.level,
          blocks: [
            ...(planJson.objectives || []).map((obj: string) => ({
              title: 'Цель',
              content: obj,
            })),
            ...(planJson.materials || []).map((mat: string) => ({
              title: 'Материал',
              content: mat,
            })),
            ...(planJson.activities || []).map((activity: any) => ({
              title: activity.name || 'Активность',
              content: activity.description || '',
              duration: activity.duration,
            })),
            ...(planJson.assessment ? [{
              title: 'Оценка',
              content: planJson.assessment,
            }] : []),
          ],
        };
        setDraftPlan(transformedPlan);
        setViewTab('draft');
      }
    }
  }, [currentLesson]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<PlanGenerationInput>({
    resolver: zodResolver(planGenerationSchema),
    defaultValues: {
      type: '',
      duration: 90,
      level: '',
    },
  });

  // Обновляем форму при выборе пресета
  useEffect(() => {
    if (selectedPreset && selectedPreset.payloadJson) {
      const payload = selectedPreset.payloadJson;
      reset({
        type: payload.type || '',
        duration: payload.duration || 90,
        level: payload.level || '',
      });
    }
  }, [selectedPreset, reset]);

  const onSubmit = async (data: PlanGenerationInput) => {
    if (!currentLesson) return;
    try {
      setIsGenerating(true);
      setLoading(true);
      // Определяем язык из браузера или используем 'ru' по умолчанию
      const language = typeof window !== 'undefined' 
        ? (navigator.language || navigator.languages?.[0] || 'ru').split('-')[0]
        : 'ru';
      
      const response = await api.post(
        endpoints.lessons.generatePlan(currentLesson.id),
        {
          type: data.type,
          duration: data.duration,
          level: data.level || 'начальный',
          goals: currentLesson.goals,
          language,
        }
      );
      
      // API 2.0: возвращает planJson напрямую (объект)
      // Может быть в обертке data
      const responseData = response.data?.data || response.data;
      const planJson = responseData.planJson || responseData;
      
      // Сохраняем черновик
      updateDraftContent('plan', planJson);
      
      // Трансформируем в формат фронтенда для отображения
      const transformedPlan: LessonPlan = {
        type: data.type,
        duration: data.duration,
        level: data.level,
        blocks: [
          ...(planJson.objectives || []).map((obj: string) => ({
            title: 'Цель',
            content: obj,
          })),
          ...(planJson.materials || []).map((mat: string) => ({
            title: 'Материал',
            content: mat,
          })),
          ...(planJson.activities || []).map((activity: any) => ({
            title: activity.name || 'Активность',
            content: activity.description || '',
            duration: activity.duration,
          })),
          ...(planJson.assessment ? [{
            title: 'Оценка',
            content: planJson.assessment,
          }] : []),
        ],
      };
      
      setDraftPlan(transformedPlan);
      setViewTab('draft');
      await refreshLesson();
      showNotification('План успешно сгенерирован (черновик)', 'success');
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка генерации плана',
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

  const handleCopyPlan = async (planToCopy: LessonPlan) => {
    if (!planToCopy) return;
    const planText = planToCopy.blocks
      .map((block) => `${block.title}\n${block.content}`)
      .join('\n\n');
    const success = await copyToClipboard(planText);
    if (success) {
      showNotification('План скопирован в буфер обмена', 'success');
    } else {
      showNotification('Ошибка копирования', 'error');
    }
  };

  const renderPlan = (plan: LessonPlan | null, isDraft: boolean) => {
    if (!plan) return null;

    // Преобразуем blocks обратно в структуру для красивого отображения
    const objectives = plan.blocks
      .filter(block => block.title === 'Цель')
      .map(block => block.content);
    
    const materials = plan.blocks
      .filter(block => block.title === 'Материал')
      .map(block => block.content);
    
    const activities = plan.blocks
      .filter(block => block.title !== 'Цель' && block.title !== 'Материал' && block.title !== 'Оценка')
      .map(block => ({
        name: block.title,
        duration: block.duration,
        description: block.content,
      }));
    
    const assessment = plan.blocks
      .find(block => block.title === 'Оценка')?.content;

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {isDraft ? 'Черновик плана' : 'Утвержденный план'}
            </Typography>
            {isDraft && <Chip label="Черновик" color="warning" size="small" />}
            {!isDraft && <Chip label="Утвержден" color="success" size="small" />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isDraft && currentLesson && (
              <ApproveButton
                lessonId={currentLesson.id}
                type="plan"
                hasDraft={!!currentLesson.planDraftJson}
                onApproved={handleApproved}
              />
            )}
            <Button
              startIcon={<Copy size={16} />}
              onClick={() => handleCopyPlan(plan)}
              variant="outlined"
            >
              Скопировать
            </Button>
          </Box>
        </Box>

        <Box>
          {objectives.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Target size={20} color="#1976d2" />
                <Typography variant="h6">Цели урока</Typography>
              </Box>
              <List>
                {objectives.map((objective: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          {index + 1}. {objective}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {materials.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Book size={20} color="#1976d2" />
                <Typography variant="h6">Материалы</Typography>
              </Box>
              <List>
                {materials.map((material: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          • {material}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {activities.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Activity size={20} color="#1976d2" />
                <Typography variant="h6">Активности</Typography>
              </Box>
              {activities.map((activity: any, index: number) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {activity.name || `Активность ${index + 1}`}
                      </Typography>
                      {activity.duration && (
                        <Chip
                          label={`${activity.duration} мин`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                      {activity.description || 'Описание отсутствует'}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {assessment && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CheckCircle size={20} color="#1976d2" />
                <Typography variant="h6">Оценка</Typography>
              </Box>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" whiteSpace="pre-wrap">
                  {assessment}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    );
  };

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации плана
      </Typography>
    );
  }

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации плана
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
            <PresetSelector
              type="plan"
              onSelectPreset={setSelectedPreset}
              selectedPresetId={selectedPreset?.id || null}
            />
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Тип занятия</InputLabel>
              <Select
                {...register('type')}
                label="Тип занятия"
                defaultValue=""
              >
                <MenuItem value="лекция">Лекция</MenuItem>
                <MenuItem value="семинар">Семинар</MenuItem>
                <MenuItem value="практика">Практическое занятие</MenuItem>
                <MenuItem value="воркшоп">Воркшоп</MenuItem>
              </Select>
            </FormControl>
            <TextField
              {...register('duration', { valueAsNumber: true })}
              label="Длительность (минуты)"
              type="number"
              error={!!errors.duration}
              helperText={errors.duration?.message}
            />
            <FormControl fullWidth>
              <InputLabel>Уровень группы (опционально)</InputLabel>
              <Select
                {...register('level')}
                label="Уровень группы (опционально)"
                defaultValue=""
              >
                <MenuItem value="начальный">Начальный</MenuItem>
                <MenuItem value="средний">Средний</MenuItem>
                <MenuItem value="продвинутый">Продвинутый</MenuItem>
              </Select>
            </FormControl>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isGenerating}
            >
              Сгенерировать план
            </LoadingButton>
          </Box>
        </form>
      </Paper>

      {(approvedPlan || draftPlan) && (
        <Box sx={{ mb: 3 }}>
          <Tabs value={viewTab} onChange={(_, newValue) => setViewTab(newValue)}>
            {draftPlan && (
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
            {approvedPlan && (
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Утвержденный
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

      {viewTab === 'draft' && renderPlan(draftPlan, true)}
      {viewTab === 'approved' && renderPlan(approvedPlan, false)}
      {viewTab === 'versions' && currentLesson && (
        <VersionHistory lessonId={currentLesson.id} type="plan" />
      )}

      {!approvedPlan && !draftPlan && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary" align="center">
            План еще не сгенерирован
                  </Typography>
        </Paper>
      )}
    </Box>
  );
};

