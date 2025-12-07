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
} from '@mui/material';
import { ChevronDown, Copy } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { planGenerationSchema, type PlanGenerationInput } from '@/entities/schemas';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { copyToClipboard } from '@/shared/utils/copyToClipboard';
import type { LessonPlan } from '@/entities/types';

export const PlanTab = () => {
  const { currentLesson, updateLessonContent } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [plan, setPlan] = useState<LessonPlan | null>(currentLesson?.plan || null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Обновляем план при изменении currentLesson
  useEffect(() => {
    if (currentLesson?.plan) {
      setPlan(currentLesson.plan);
    }
  }, [currentLesson]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PlanGenerationInput>({
    resolver: zodResolver(planGenerationSchema),
    defaultValues: {
      type: '',
      duration: 90,
      level: '',
    },
  });

  const onSubmit = async (data: PlanGenerationInput) => {
    if (!currentLesson) return;
    try {
      setIsGenerating(true);
      setLoading(true);
      const response = await api.post(
        endpoints.lessons.generatePlan(currentLesson.id),
        {
          type: data.type,
          duration: data.duration,
          level: data.level || 'начальный',
          goals: currentLesson.goals,
        }
      );
      
      console.log('📋 PlanTab - Full response:', response);
      console.log('📋 PlanTab - response.data:', response.data);
      
      // Бэкенд возвращает { planJson: { raw: "```json\n{...}\n```" } }
      let planJson = response.data.planJson || response.data;
      
      console.log('📋 PlanTab - planJson before parsing:', planJson);
      
      // Если planJson содержит raw (строка с JSON в markdown), извлекаем и парсим
      if (planJson && typeof planJson === 'object' && 'raw' in planJson) {
        try {
          console.log('📋 PlanTab - planJson.raw:', planJson.raw);
          // Убираем markdown code block (```json и ```)
          let jsonString = planJson.raw;
          jsonString = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/g, '').trim();
          console.log('📋 PlanTab - jsonString after cleanup:', jsonString);
          planJson = JSON.parse(jsonString);
          console.log('📋 PlanTab - planJson after parsing:', planJson);
        } catch (parseError) {
          console.error('❌ PlanTab - Ошибка парсинга planJson.raw:', parseError);
          throw new Error('Не удалось распарсить план урока');
        }
      }
      
      // Трансформируем в формат фронтенда
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
      
      setPlan(transformedPlan);
      updateLessonContent('plan', transformedPlan);
      showNotification('План успешно сгенерирован', 'success');
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

  const handleCopyPlan = async () => {
    if (!plan) return;
    const planText = plan.blocks
      .map((block) => `${block.title}\n${block.content}`)
      .join('\n\n');
    const success = await copyToClipboard(planText);
    if (success) {
      showNotification('План скопирован в буфер обмена', 'success');
    } else {
      showNotification('Ошибка копирования', 'error');
    }
  };

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
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Тип занятия</InputLabel>
              <Select
                {...register('type')}
                label="Тип занятия"
                defaultValue=""
              >
                <MenuItem value="lecture">Лекция</MenuItem>
                <MenuItem value="seminar">Семинар</MenuItem>
                <MenuItem value="practical">Практическое занятие</MenuItem>
                <MenuItem value="workshop">Воркшоп</MenuItem>
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
                <MenuItem value="beginner">Начальный</MenuItem>
                <MenuItem value="intermediate">Средний</MenuItem>
                <MenuItem value="advanced">Продвинутый</MenuItem>
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

      {plan && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Результат</Typography>
            <Button
              startIcon={<Copy size={16} />}
              onClick={handleCopyPlan}
              variant="outlined"
            >
              Скопировать план
            </Button>
          </Box>
          {plan.blocks.map((block, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                <Typography>{block.title}</Typography>
                {block.duration && (
                  <Typography sx={{ ml: 2, color: 'text.secondary' }}>
                    {block.duration} мин
                  </Typography>
                )}
              </AccordionSummary>
              <AccordionDetails>
                <Typography whiteSpace="pre-wrap">{block.content}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}
    </Box>
  );
};

