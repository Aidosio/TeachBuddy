'use client';

import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Settings } from 'react-feather';
import { api, endpoints } from '@/lib/api';
import { useUiStore } from '@/stores/useUiStore';
import type { AIPreset, ContentType } from '@/entities/types';
import { PresetsManager } from './PresetsManager';

interface PresetSelectorProps {
  type: ContentType;
  onSelectPreset: (preset: AIPreset | null) => void;
  selectedPresetId?: string | null;
}

export const PresetSelector = ({
  type,
  onSelectPreset,
  selectedPresetId,
}: PresetSelectorProps) => {
  const [presets, setPresets] = useState<AIPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const { showNotification } = useUiStore();

  useEffect(() => {
    fetchPresets();
  }, [type]);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.presets.list);
      const allPresets = response.data || [];
      // Фильтруем пресеты по типу и показываем публичные + пользовательские
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

  const handlePresetChange = (presetId: string) => {
    if (presetId === '') {
      onSelectPreset(null);
      return;
    }
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      onSelectPreset(preset);
    }
  };

  const handlePresetSaved = () => {
    fetchPresets();
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Загрузка пресетов...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1}>
        <FormControl fullWidth>
          <InputLabel>Пресет (опционально)</InputLabel>
          <Select
            value={selectedPresetId || ''}
            onChange={(e) => handlePresetChange(e.target.value)}
            label="Пресет (опционально)"
          >
            <MenuItem value="">Без пресета</MenuItem>
            {presets.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.name} {preset.isPublic && '(публичный)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton
          onClick={() => setManagerOpen(true)}
          title="Управление пресетами"
        >
          <Settings size={20} />
        </IconButton>
      </Box>

      <PresetsManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        type={type}
        onPresetSaved={handlePresetSaved}
      />
    </Box>
  );
};

