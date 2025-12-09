'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Trash2, Edit, Plus, Save } from 'react-feather';
import { api, endpoints } from '@/lib/api';
import { useUiStore } from '@/stores/useUiStore';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { presetCreateSchema, type PresetCreateInput } from '@/entities/schemas';
import type { AIPreset, ContentType } from '@/entities/types';

interface PresetsManagerProps {
  open: boolean;
  onClose: () => void;
  type: ContentType;
  onPresetSaved?: () => void;
}

export const PresetsManager = ({
  open,
  onClose,
  type,
  onPresetSaved,
}: PresetsManagerProps) => {
  const [presets, setPresets] = useState<AIPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPreset, setEditingPreset] = useState<AIPreset | null>(null);
  const [creating, setCreating] = useState(false);
  const [jsonString, setJsonString] = useState('{}');
  const [textInput, setTextInput] = useState('');
  const { showNotification } = useUiStore();

  // Функция для преобразования текста в JSON
  const parseTextToJson = (text: string): any => {
    const result: any = {};
    const lowerText = text.toLowerCase();

    if (type === 'plan') {
      // Парсим параметры для плана
      // Тип занятия
      if (lowerText.includes('лекция') || lowerText.includes('lecture')) {
        result.type = 'лекция';
      } else if (lowerText.includes('семинар') || lowerText.includes('seminar')) {
        result.type = 'семинар';
      } else if (lowerText.includes('практика') || lowerText.includes('практическое') || lowerText.includes('practical')) {
        result.type = 'практика';
      } else if (lowerText.includes('воркшоп') || lowerText.includes('workshop')) {
        result.type = 'воркшоп';
      }

      // Длительность
      const durationMatch = text.match(/(\d+)\s*(?:мин|минут|минуты|min|minutes?)/i);
      if (durationMatch) {
        result.duration = parseInt(durationMatch[1]);
      } else {
        const numMatch = text.match(/\b(\d+)\b/);
        if (numMatch && parseInt(numMatch[1]) > 10 && parseInt(numMatch[1]) < 300) {
          result.duration = parseInt(numMatch[1]);
        }
      }

      // Уровень
      if (lowerText.includes('начальн') || lowerText.includes('beginner') || lowerText.includes('базов')) {
        result.level = 'начальный';
      } else if (lowerText.includes('средн') || lowerText.includes('intermediate') || lowerText.includes('middle')) {
        result.level = 'средний';
      } else if (lowerText.includes('продвинут') || lowerText.includes('advanced') || lowerText.includes('высок')) {
        result.level = 'продвинутый';
      }

      // Парсим форматы типа "тип: лекция, длительность: 90, уровень: начальный"
      const typeMatch = text.match(/тип[:\s]+([а-яa-z]+)/i);
      if (typeMatch && !result.type) {
        const typeValue = typeMatch[1].toLowerCase();
        if (typeValue.includes('лекц')) result.type = 'лекция';
        else if (typeValue.includes('семинар')) result.type = 'семинар';
        else if (typeValue.includes('практик')) result.type = 'практика';
        else if (typeValue.includes('воркшоп')) result.type = 'воркшоп';
      }

      const durationMatch2 = text.match(/длительность[:\s]+(\d+)/i);
      if (durationMatch2 && !result.duration) {
        result.duration = parseInt(durationMatch2[1]);
      }

      const levelMatch = text.match(/уровень[:\s]+([а-яa-z]+)/i);
      if (levelMatch && !result.level) {
        const levelValue = levelMatch[1].toLowerCase();
        if (levelValue.includes('начальн') || levelValue.includes('базов')) result.level = 'начальный';
        else if (levelValue.includes('средн')) result.level = 'средний';
        else if (levelValue.includes('продвинут') || levelValue.includes('высок')) result.level = 'продвинутый';
      }

      // Значения по умолчанию
      if (!result.type) result.type = 'лекция';
      if (!result.duration) result.duration = 90;
      if (!result.level) result.level = 'начальный';
    } else if (type === 'materials') {
      // Параметры для материалов
      // Тон
      if (lowerText.includes('профессиональн') || lowerText.includes('professional')) {
        result.tone = 'профессиональный';
      } else if (lowerText.includes('дружелюбн') || lowerText.includes('friendly')) {
        result.tone = 'дружелюбный';
      } else if (lowerText.includes('формальн') || lowerText.includes('formal')) {
        result.tone = 'формальный';
      } else if (lowerText.includes('прост') || lowerText.includes('simple')) {
        result.tone = 'простой';
      }

      // Сложность
      if (lowerText.includes('низк') || lowerText.includes('low') || lowerText.includes('легк')) {
        result.complexity = 'низкий';
      } else if (lowerText.includes('средн') || lowerText.includes('medium') || lowerText.includes('middle')) {
        result.complexity = 'средний';
      } else if (lowerText.includes('высок') || lowerText.includes('high') || lowerText.includes('сложн')) {
        result.complexity = 'высокий';
      }

      // Парсим форматы
      const toneMatch = text.match(/тон[:\s]+([а-яa-z]+)/i);
      if (toneMatch && !result.tone) {
        const toneValue = toneMatch[1].toLowerCase();
        if (toneValue.includes('профессиональн')) result.tone = 'профессиональный';
        else if (toneValue.includes('дружелюбн')) result.tone = 'дружелюбный';
        else if (toneValue.includes('формальн')) result.tone = 'формальный';
        else if (toneValue.includes('прост')) result.tone = 'простой';
      }

      const complexityMatch = text.match(/сложность[:\s]+([а-яa-z]+)/i);
      if (complexityMatch && !result.complexity) {
        const complexityValue = complexityMatch[1].toLowerCase();
        if (complexityValue.includes('низк') || complexityValue.includes('легк')) result.complexity = 'низкий';
        else if (complexityValue.includes('средн')) result.complexity = 'средний';
        else if (complexityValue.includes('высок') || complexityValue.includes('сложн')) result.complexity = 'высокий';
      }

      // Значения по умолчанию
      if (!result.tone) result.tone = 'профессиональный';
      if (!result.complexity) result.complexity = 'средний';
    } else if (type === 'tests') {
      // Параметры для тестов
      // Тип вопросов
      if (lowerText.includes('выбор') || lowerText.includes('multiple') || lowerText.includes('вариант')) {
        result.type = 'multiple-choice';
      } else if (lowerText.includes('кратк') || lowerText.includes('short') || lowerText.includes('ответ')) {
        result.type = 'short-answer';
      }

      // Сложность
      if (lowerText.includes('легк') || lowerText.includes('easy') || lowerText.includes('простой')) {
        result.difficulty = 'легкий';
      } else if (lowerText.includes('средн') || lowerText.includes('medium') || lowerText.includes('middle')) {
        result.difficulty = 'средний';
      } else if (lowerText.includes('сложн') || lowerText.includes('hard') || lowerText.includes('высок')) {
        result.difficulty = 'сложный';
      }

      // Количество
      const countMatch = text.match(/(\d+)\s*(?:вопрос|question|задани)/i);
      if (countMatch) {
        result.count = parseInt(countMatch[1]);
      } else {
        const numMatch = text.match(/\b(\d+)\b/);
        if (numMatch && parseInt(numMatch[1]) > 0 && parseInt(numMatch[1]) <= 50) {
          result.count = parseInt(numMatch[1]);
        }
      }

      // Парсим форматы
      const typeMatch = text.match(/тип[:\s]+([а-яa-z-]+)/i);
      if (typeMatch && !result.type) {
        const typeValue = typeMatch[1].toLowerCase();
        if (typeValue.includes('выбор') || typeValue.includes('multiple') || typeValue.includes('вариант')) {
          result.type = 'multiple-choice';
        } else if (typeValue.includes('кратк') || typeValue.includes('short') || typeValue.includes('ответ')) {
          result.type = 'short-answer';
        }
      }

      const difficultyMatch = text.match(/сложность[:\s]+([а-яa-z]+)/i);
      if (difficultyMatch && !result.difficulty) {
        const difficultyValue = difficultyMatch[1].toLowerCase();
        if (difficultyValue.includes('легк') || difficultyValue.includes('простой')) result.difficulty = 'легкий';
        else if (difficultyValue.includes('средн')) result.difficulty = 'средний';
        else if (difficultyValue.includes('сложн') || difficultyValue.includes('высок')) result.difficulty = 'сложный';
      }

      const countMatch2 = text.match(/количество[:\s]+(\d+)/i);
      if (countMatch2 && !result.count) {
        result.count = parseInt(countMatch2[1]);
      }

      // Значения по умолчанию
      if (!result.type) result.type = 'multiple-choice';
      if (!result.difficulty) result.difficulty = 'средний';
      if (!result.count) result.count = 5;
    }

    return result;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PresetCreateInput>({
    resolver: zodResolver(presetCreateSchema),
    defaultValues: {
      name: '',
      target: type,
      payloadJson: {},
      isPublic: false,
    },
  });

  useEffect(() => {
    if (open) {
      fetchPresets();
      reset({
        name: '',
        target: type,
        payloadJson: {},
        isPublic: false,
      });
      setJsonString('{}');
      setTextInput('');
      setEditingPreset(null);
    }
  }, [open, type, reset]);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.presets.list);
      const allPresets = response.data || [];
      const filteredPresets = allPresets.filter(
        (preset: AIPreset) => preset.target === type
      );
      setPresets(filteredPresets);
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка загрузки пресетов',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: PresetCreateInput) => {
    try {
      setCreating(true);
      // Преобразуем текст в JSON
      const payloadJson = parseTextToJson(textInput);
      setJsonString(JSON.stringify(payloadJson, null, 2));
      
      await api.post(endpoints.presets.create, {
        ...data,
        payloadJson,
      });
      showNotification('Пресет успешно создан', 'success');
      reset();
      setJsonString('{}');
      setTextInput('');
      await fetchPresets();
      if (onPresetSaved) {
        onPresetSaved();
      }
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка создания пресета',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (preset: AIPreset) => {
    setEditingPreset(preset);
    reset({
      name: preset.name,
      target: preset.target,
      payloadJson: preset.payloadJson,
      isPublic: preset.isPublic,
    });
    setJsonString(JSON.stringify(preset.payloadJson, null, 2));
    // Преобразуем JSON обратно в понятный текст
    const payload = preset.payloadJson || {};
    let text = '';
    if (preset.target === 'plan') {
      text = `Тип: ${payload.type || 'лекция'}, Длительность: ${payload.duration || 90} минут, Уровень: ${payload.level || 'начальный'}`;
    } else if (preset.target === 'materials') {
      text = `Тон: ${payload.tone || 'профессиональный'}, Сложность: ${payload.complexity || 'средний'}`;
    } else if (preset.target === 'tests') {
      text = `Тип: ${payload.type === 'multiple-choice' ? 'выбор из вариантов' : 'краткий ответ'}, Сложность: ${payload.difficulty || 'средний'}, Количество: ${payload.count || 5} вопросов`;
    }
    setTextInput(text);
  };

  const handleUpdate = async (data: PresetCreateInput) => {
    if (!editingPreset) return;
    try {
      setCreating(true);
      // Преобразуем текст в JSON
      const payloadJson = parseTextToJson(textInput);
      setJsonString(JSON.stringify(payloadJson, null, 2));
      
      await api.put(endpoints.presets.update(editingPreset.id), {
        ...data,
        payloadJson,
      });
      showNotification('Пресет успешно обновлен', 'success');
      reset();
      setJsonString('{}');
      setTextInput('');
      setEditingPreset(null);
      await fetchPresets();
      if (onPresetSaved) {
        onPresetSaved();
      }
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка обновления пресета',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (presetId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот пресет?')) return;
    try {
      await api.delete(endpoints.presets.delete(presetId));
      showNotification('Пресет успешно удален', 'success');
      await fetchPresets();
      if (onPresetSaved) {
        onPresetSaved();
      }
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка удаления пресета',
        'error'
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingPreset(null);
    reset({
      name: '',
      target: type,
      payloadJson: {},
      isPublic: false,
    });
    setJsonString('{}');
    setTextInput('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Управление пресетами</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {editingPreset ? 'Редактирование пресета' : 'Создание нового пресета'}
                </Typography>
                <form
                  onSubmit={handleSubmit(editingPreset ? handleUpdate : handleCreate)}
                >
                  <TextField
                    {...register('name')}
                    label="Название пресета"
                    fullWidth
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                  <TextField
                    label="Параметры"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                    }}
                    placeholder={
                      type === 'plan'
                        ? 'Например: Лекция на 90 минут для начального уровня\nИли: Тип: лекция, Длительность: 90, Уровень: начальный'
                        : type === 'materials'
                        ? 'Например: Профессиональный тон, средняя сложность\nИли: Тон: профессиональный, Сложность: средний'
                        : 'Например: Выбор из вариантов, средняя сложность, 5 вопросов\nИли: Тип: multiple-choice, Сложность: средний, Количество: 5'
                    }
                    helperText={
                      type === 'plan'
                        ? 'Опишите параметры плана: тип занятия (лекция, семинар, практика, воркшоп), длительность в минутах, уровень (начальный, средний, продвинутый)'
                        : type === 'materials'
                        ? 'Опишите параметры материалов: тон изложения (профессиональный, дружелюбный, формальный, простой), сложность (низкий, средний, высокий)'
                        : 'Опишите параметры тестов: тип вопросов (выбор из вариантов или краткий ответ), сложность (легкий, средний, сложный), количество вопросов'
                    }
                  />
                  {textInput && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                        Будет преобразовано в:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', m: 0 }}>
                        {JSON.stringify(parseTextToJson(textInput), null, 2)}
                      </Typography>
                    </Box>
                  )}
                  <FormControlLabel
                    control={<Checkbox {...register('isPublic')} />}
                    label="Публичный пресет"
                    sx={{ mt: 1 }}
                  />
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <LoadingButton
                      type="submit"
                      variant="contained"
                      loading={creating}
                      startIcon={editingPreset ? <Save size={16} /> : <Plus size={16} />}
                    >
                      {editingPreset ? 'Сохранить' : 'Создать'}
                    </LoadingButton>
                    {editingPreset && (
                      <Button onClick={handleCancelEdit}>Отмена</Button>
                    )}
                  </Box>
                </form>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Существующие пресеты
              </Typography>
              {presets.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Пресеты не найдены
                </Typography>
              ) : (
                <List>
                  {presets.map((preset) => (
                    <ListItem key={preset.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{preset.name}</Typography>
                            {preset.isPublic && (
                              <Typography variant="caption" color="primary">
                                (публичный)
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {JSON.stringify(preset.payloadJson)}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleEdit(preset)}
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <Edit size={16} />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(preset.id)}
                          size="small"
                          color="error"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};

