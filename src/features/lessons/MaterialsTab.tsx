"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Divider,
} from "@mui/material";
import { FileText, BookOpen, Sun } from "react-feather";
import { useLessonStore } from "@/stores/useLessonStore";
import { useUiStore } from "@/stores/useUiStore";
import { api, endpoints } from "@/lib/api";
import { LoadingButton } from "@/shared/components/LoadingButton";
import type { LessonMaterials } from "@/entities/types";

export const MaterialsTab = () => {
  const { currentLesson, updateLessonContent } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [materials, setMaterials] = useState<LessonMaterials>(
    currentLesson?.materials || {}
  );
  const [generating, setGenerating] = useState<string | null>(null);

  // Обновляем материалы при изменении currentLesson
  useEffect(() => {
    if (currentLesson?.materials) {
      setMaterials(currentLesson.materials);
    }
  }, [currentLesson]);

  const generateMaterial = async (
    type: "explanation" | "examples" | "simplified"
  ) => {
    if (!currentLesson) return;
    try {
      setGenerating(type);
      setLoading(true);
      // Бэкенд принимает tone и complexity вместо type
      const response = await api.post(
        endpoints.lessons.generateMaterials(currentLesson.id),
        {
          tone:
            type === "explanation"
              ? "профессиональный"
              : type === "examples"
              ? "дружелюбный"
              : "простой",
          complexity: type === "simplified" ? "низкий" : "средний",
        }
      );
      
      console.log('📚 MaterialsTab - Full response:', response);
      console.log('📚 MaterialsTab - response.data:', response.data);
      
      // Бэкенд возвращает { materialsJson: { raw: "```json\n{...}\n```" } }
      let materialsData = response.data.materialsJson || response.data;
      
      console.log('📚 MaterialsTab - materialsData before parsing:', materialsData);
      
      // Если materialsJson содержит raw (строка с JSON в markdown), извлекаем и парсим
      if (materialsData && typeof materialsData === 'object' && 'raw' in materialsData) {
        try {
          console.log('📚 MaterialsTab - materialsData.raw:', materialsData.raw);
          // Убираем markdown code block (```json и ```)
          let jsonString = materialsData.raw;
          jsonString = jsonString.replace(/^```json\s*/i, '').replace(/\s*```$/g, '').trim();
          console.log('📚 MaterialsTab - jsonString after cleanup:', jsonString);
          materialsData = JSON.parse(jsonString);
          console.log('📚 MaterialsTab - materialsData after parsing:', materialsData);
        } catch (parseError) {
          console.error('❌ MaterialsTab - Ошибка парсинга materialsJson.raw:', parseError);
          throw new Error('Не удалось распарсить материалы урока');
        }
      }
      
      // Преобразуем данные в формат фронтенда
      let content = '';
      const fieldName =
        type === "explanation"
          ? "explanation"
          : type === "examples"
          ? "examples"
          : "simplified";
      
      if (materialsData?.educational_materials) {
        const eduMaterials = materialsData.educational_materials;
        
        if (type === "explanation") {
          // Объединяем key_concepts и explanations
          const parts: string[] = [];
          
          if (eduMaterials.key_concepts && Array.isArray(eduMaterials.key_concepts)) {
            parts.push('Ключевые концепции:\n' + eduMaterials.key_concepts.map((concept: string, index: number) => 
              `${index + 1}. ${concept}`
            ).join('\n'));
          }
          
          if (eduMaterials.explanations && typeof eduMaterials.explanations === 'object') {
            parts.push('\n\nОбъяснения:\n' + Object.entries(eduMaterials.explanations)
              .map(([concept, explanation]) => `• ${concept}: ${explanation}`)
              .join('\n\n'));
          }
          
          content = parts.join('\n');
        } else if (type === "examples") {
          // Преобразуем examples объект в текст
          if (eduMaterials.examples && typeof eduMaterials.examples === 'object') {
            content = Object.entries(eduMaterials.examples)
              .map(([title, example]) => `${title}:\n${example}`)
              .join('\n\n');
          }
        } else if (type === "simplified") {
          // Упрощенная версия - используем key_concepts с краткими объяснениями
          if (eduMaterials.key_concepts && Array.isArray(eduMaterials.key_concepts)) {
            content = eduMaterials.key_concepts
              .map((concept: string) => `• ${concept}`)
              .join('\n');
          }
        }
      } else {
        // Fallback: если структура другая, пытаемся использовать как есть
        content = typeof materialsData === 'string' ? materialsData : JSON.stringify(materialsData, null, 2);
      }
      
      console.log('📚 MaterialsTab - Final content for', fieldName, ':', content);
      
      const updatedMaterials = {
        ...materials,
        [fieldName]: content,
      };
      setMaterials(updatedMaterials);
      updateLessonContent("materials", updatedMaterials);
      showNotification("Материал успешно сгенерирован", "success");
    } catch (err: any) {
      console.error('❌ MaterialsTab - Error:', err);
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Ошибка генерации материала",
        "error"
      );
    } finally {
      setGenerating(null);
      setLoading(false);
    }
  };

  const handleMaterialChange = (
    field: keyof LessonMaterials,
    value: string
  ) => {
    const updated = { ...materials, [field]: value };
    setMaterials(updated);
    updateLessonContent("materials", updated);
  };

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации материалов
      </Typography>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Генерация материалов
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <LoadingButton
            variant="outlined"
            startIcon={<FileText size={16} />}
            onClick={() => generateMaterial("explanation")}
            loading={generating === "explanation"}
            disabled={!!generating}
          >
            Сгенерировать объяснение
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            startIcon={<BookOpen size={16} />}
            onClick={() => generateMaterial("examples")}
            loading={generating === "examples"}
            disabled={!!generating}
          >
            Сгенерировать примеры
          </LoadingButton>
          <LoadingButton
            variant="outlined"
            startIcon={<Sun size={16} />}
            onClick={() => generateMaterial("simplified")}
            loading={generating === "simplified"}
            disabled={!!generating}
          >
            Сгенерировать упрощённую версию
          </LoadingButton>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Основной текст
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={materials.explanation || ""}
          onChange={(e) => handleMaterialChange("explanation", e.target.value)}
          placeholder="Основной текст объяснения..."
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Примеры
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={materials.examples || ""}
          onChange={(e) => handleMaterialChange("examples", e.target.value)}
          placeholder="Примеры использования..."
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Упрощённый текст
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={materials.simplified || ""}
          onChange={(e) => handleMaterialChange("simplified", e.target.value)}
          placeholder="Упрощённая версия для лучшего понимания..."
        />
      </Paper>
    </Box>
  );
};
