'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { X, Download, FileText } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { presentationGenerationSchema, type PresentationGenerationInput } from '@/entities/schemas';
import { useLessonStore } from '@/stores/useLessonStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { ApproveButton } from './ApproveButton';
import { VersionHistory } from './VersionHistory';
import { PresetSelector } from '@/features/ai/PresetSelector';
import type { Presentation, AIPreset } from '@/entities/types';

interface PresentationDialogProps {
  open: boolean;
  onClose: () => void;
  lessonId: string;
}

type TabValue = 'generate' | 'view' | 'versions';

export const PresentationDialog = ({ open, onClose, lessonId }: PresentationDialogProps) => {
  const { currentLesson, updateDraftContent, refreshLesson } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [tabValue, setTabValue] = useState<TabValue>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AIPreset | null>(null);
  const [draftPresentation, setDraftPresentation] = useState<Presentation | null>(null);
  const [approvedPresentation, setApprovedPresentation] = useState<Presentation | null>(null);

  // Обновляем презентации при изменении currentLesson
  useEffect(() => {
    if (currentLesson && open) {
      if (currentLesson.presentationJson) {
        setApprovedPresentation(currentLesson.presentationJson);
      }
      if (currentLesson.presentationDraftJson) {
        setDraftPresentation(currentLesson.presentationDraftJson);
        setTabValue('view');
      }
    }
  }, [currentLesson, open]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PresentationGenerationInput>({
    resolver: zodResolver(presentationGenerationSchema),
    defaultValues: {
      slideCount: 10,
      style: '',
      complexity: '',
    },
  });

  // Обновляем форму при выборе пресета
  useEffect(() => {
    if (selectedPreset && selectedPreset.payloadJson) {
      const payload = selectedPreset.payloadJson;
      reset({
        slideCount: payload.slideCount || 10,
        style: payload.style || '',
        complexity: payload.complexity || '',
      });
    }
  }, [selectedPreset, reset]);

  const onSubmit = async (data: PresentationGenerationInput) => {
    try {
      setIsGenerating(true);
      setLoading(true);
      
      const response = await api.post(
        endpoints.lessons.generatePresentation(lessonId),
        {
          slideCount: data.slideCount,
          style: data.style || undefined,
          complexity: data.complexity || undefined,
        }
      );
      
      const responseData = response.data?.data || response.data;
      const presentationJson = responseData.presentationJson || responseData;
      
      // Сохраняем черновик
      updateDraftContent('presentation', presentationJson);
      setDraftPresentation(presentationJson);
      setTabValue('view');
      await refreshLesson();
      showNotification('Презентация успешно сгенерирована (черновик)', 'success');
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка генерации презентации',
        'error'
      );
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleExportPptx = async () => {
    try {
      setIsExporting(true);
      const response = await api.get(endpoints.lessons.exportPptx(lessonId), {
        responseType: 'blob',
      });

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      
      // Получаем имя файла из заголовка
      const contentDisposition = response.headers['content-disposition'];
      let filename = `presentation-${lessonId}.pptx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification('PPTX файл успешно экспортирован', 'success');
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка экспорта PPTX',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleApproved = async () => {
    await refreshLesson();
    if (currentLesson?.presentationJson) {
      setApprovedPresentation(currentLesson.presentationJson);
    }
  };

  const renderSlide = (slide: any, index: number) => (
    <Paper key={index} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Слайд {index + 1}: {slide.title}
      </Typography>
      {slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0 && (
        <List sx={{ mt: 2 }}>
          {slide.bullets.map((bullet: string, bulletIndex: number) => (
            <ListItem key={bulletIndex} sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <Typography variant="body1">
                    • {bullet}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {slide.notes && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" gutterBottom>
            Заметки для преподавателя:
          </Typography>
          <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
            {slide.notes}
          </Typography>
        </Box>
      )}
    </Paper>
  );

  const renderPresentation = (presentation: Presentation | null, isDraft: boolean) => {
    if (!presentation) return null;

    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {presentation.title}
            </Typography>
            {isDraft && <Chip label="Черновик" color="warning" size="small" />}
            {!isDraft && <Chip label="Утверждена" color="success" size="small" />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isDraft && currentLesson && (
              <ApproveButton
                lessonId={currentLesson.id}
                type="presentation"
                hasDraft={!!currentLesson.presentationDraftJson}
                onApproved={handleApproved}
              />
            )}
            {(!isDraft || approvedPresentation) && (
              <LoadingButton
                variant="outlined"
                startIcon={<Download size={16} />}
                onClick={handleExportPptx}
                loading={isExporting}
                disabled={isExporting}
              >
                Экспортировать PPTX
              </LoadingButton>
            )}
          </Box>
        </Box>

        <Box>
          {presentation.slides && presentation.slides.length > 0 ? (
            presentation.slides.map((slide, index) => renderSlide(slide, index))
          ) : (
            <Typography color="text.secondary">Слайды отсутствуют</Typography>
          )}
        </Box>
      </Paper>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Презентация урока</Typography>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Генерация" value="generate" />
            <Tab label="Просмотр" value="view" />
            <Tab label="История версий" value="versions" />
          </Tabs>
        </Box>

        {tabValue === 'generate' && (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Параметры генерации
              </Typography>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <PresetSelector
                    type="presentation"
                    onSelectPreset={setSelectedPreset}
                    selectedPresetId={selectedPreset?.id || null}
                  />
                  <TextField
                    {...register('slideCount', { valueAsNumber: true })}
                    label="Количество слайдов"
                    type="number"
                    error={!!errors.slideCount}
                    helperText={errors.slideCount?.message}
                    inputProps={{ min: 3, max: 50 }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Стиль презентации (опционально)</InputLabel>
                    <Select
                      {...register('style')}
                      label="Стиль презентации (опционально)"
                      defaultValue=""
                    >
                      <MenuItem value="">Не указан</MenuItem>
                      <MenuItem value="профессиональный">Профессиональный</MenuItem>
                      <MenuItem value="дружелюбный">Дружелюбный</MenuItem>
                      <MenuItem value="формальный">Формальный</MenuItem>
                      <MenuItem value="неформальный">Неформальный</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Сложность (опционально)</InputLabel>
                    <Select
                      {...register('complexity')}
                      label="Сложность (опционально)"
                      defaultValue=""
                    >
                      <MenuItem value="">Не указана</MenuItem>
                      <MenuItem value="легкий">Легкий</MenuItem>
                      <MenuItem value="средний">Средний</MenuItem>
                      <MenuItem value="сложный">Сложный</MenuItem>
                    </Select>
                  </FormControl>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    loading={isGenerating}
                  >
                    Сгенерировать презентацию
                  </LoadingButton>
                </Box>
              </form>
            </Paper>
          </Box>
        )}

        {tabValue === 'view' && (
          <Box>
            {draftPresentation && (
              <Box sx={{ mb: 3 }}>
                {renderPresentation(draftPresentation, true)}
              </Box>
            )}
            {approvedPresentation && (
              <Box>
                {renderPresentation(approvedPresentation, false)}
              </Box>
            )}
            {!draftPresentation && !approvedPresentation && (
              <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary" align="center">
                  Презентация еще не сгенерирована
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {tabValue === 'versions' && (
          <Box>
            <VersionHistory lessonId={lessonId} type="presentation" />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

