'use client';

import { useState } from 'react';
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
} from '@mui/material';
import { Copy, Send } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema, type FeedbackInput } from '@/entities/schemas';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { copyToClipboard } from '@/shared/utils/copyToClipboard';

export const FeedbackTab = () => {
  const { showNotification, setLoading, loading } = useUiStore();
  const [feedback, setFeedback] = useState<string>('');
  const [tone, setTone] = useState<string>('конструктивный и ободряющий');
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      assignmentType: 'open',
      desiredTone: 'конструктивный и ободряющий',
    },
  });

  const onSubmit = async (data: FeedbackInput) => {
    try {
      setIsGenerating(true);
      setLoading(true);
      const response = await api.post(endpoints.feedback.generate, {
        answerText: data.answerText,
        assignmentType: data.assignmentType,
        goal: data.goal,
        desiredTone: data.desiredTone || tone,
      });
      // Бэкенд возвращает { feedbackText: string }
      const feedbackText = response.data.feedbackText || response.data.feedback || response.data;
      setFeedback(feedbackText);
      showNotification('Фидбек успешно сгенерирован', 'success');
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка генерации фидбека',
        'error'
      );
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!feedback) return;
    const success = await copyToClipboard(feedback);
    if (success) {
      showNotification('Фидбек скопирован в буфер обмена', 'success');
    } else {
      showNotification('Ошибка копирования', 'error');
    }
  };


  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Параметры генерации фидбека
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              {...register('answerText')}
              label="Ответ студента"
              multiline
              rows={6}
              fullWidth
              error={!!errors.answerText}
              helperText={errors.answerText?.message}
              placeholder="Вставьте текст ответа студента..."
            />
            <FormControl fullWidth error={!!errors.assignmentType}>
              <InputLabel>Тип задания</InputLabel>
              <Select
                {...register('assignmentType')}
                label="Тип задания"
                defaultValue="open"
              >
                <MenuItem value="open">Открытый вопрос</MenuItem>
                <MenuItem value="case">Кейс</MenuItem>
              </Select>
            </FormControl>
            <TextField
              {...register('goal')}
              label="Цель задания (опционально)"
              fullWidth
              error={!!errors.goal}
              helperText={errors.goal?.message}
              placeholder="Например: оценка аргументации, проверка понимания концепции..."
            />
            <TextField
              {...register('desiredTone')}
              label="Желаемый тон (опционально)"
              fullWidth
              error={!!errors.desiredTone}
              helperText={errors.desiredTone?.message}
              placeholder="Например: конструктивный и ободряющий"
              value={tone}
              onChange={(e) => {
                setTone(e.target.value);
                setValue('desiredTone', e.target.value);
              }}
            />
            <LoadingButton
              type="submit"
              variant="contained"
              startIcon={<Send size={16} />}
              loading={isGenerating}
            >
              Сгенерировать фидбек
            </LoadingButton>
          </Box>
        </form>
      </Paper>

      {feedback && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Результат</Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Button
                startIcon={<Copy size={16} />}
                onClick={handleCopy}
                variant="outlined"
              >
                Скопировать
              </Button>
            </Box>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Сгенерированный фидбек появится здесь..."
          />
        </Paper>
      )}
    </Box>
  );
};

