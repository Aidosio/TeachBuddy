"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { FileText, BookOpen, Sun, Clock, Book, Code } from "react-feather";
import { useLessonStore } from "@/stores/useLessonStore";
import { useUiStore } from "@/stores/useUiStore";
import { api, endpoints } from "@/lib/api";
import { LoadingButton } from "@/shared/components/LoadingButton";
import { ApproveButton } from "./ApproveButton";
import { VersionHistory } from "./VersionHistory";
import { PresetSelector } from "@/features/ai/PresetSelector";
import type { LessonMaterials, AIPreset } from "@/entities/types";

export const MaterialsTab = () => {
  const {
    currentLesson,
    updateLessonContent,
    updateDraftContent,
    refreshLesson,
  } = useLessonStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [approvedMaterials, setApprovedMaterials] = useState<LessonMaterials>(
    {}
  );
  const [draftMaterials, setDraftMaterials] = useState<LessonMaterials>({});
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<string>("профессиональный");
  const [complexity, setComplexity] = useState<string>("средний");
  const [selectedPreset, setSelectedPreset] = useState<AIPreset | null>(null);
  const [viewTab, setViewTab] = useState<"approved" | "draft" | "versions">(
    "draft"
  );

  // Обновляем материалы при изменении currentLesson
  useEffect(() => {
    if (currentLesson) {
      // Утвержденные материалы
      if (currentLesson.materialsJson) {
        const materialsJson = currentLesson.materialsJson;
        const materials = materialsJson.educational_materials || materialsJson;

        let explanation = "";
        let examples = "";
        let simplified = "";

        // Обрабатываем keyConcepts (новый формат - массив объектов)
        if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
          const conceptsText = materials.keyConcepts
            .map((item: any, index: number) => {
              if (typeof item === "object" && item.concept) {
                return `${index + 1}. ${item.concept}\n   ${
                  item.explanation || ""
                }`;
              }
              return `${index + 1}. ${item}`;
            })
            .join("\n\n");
          explanation += "Ключевые концепции:\n" + conceptsText;
        }

        // Обрабатываем key_concepts (старый формат - массив строк)
        if (materials.key_concepts && Array.isArray(materials.key_concepts)) {
          const conceptsText = materials.key_concepts
            .map((item: any, index: number) => {
              if (typeof item === "object" && item.concept) {
                return `${index + 1}. ${item.concept}\n   ${
                  item.explanation || ""
                }`;
              }
              return `${index + 1}. ${item}`;
            })
            .join("\n\n");
          if (!explanation) {
            explanation += "Ключевые концепции:\n" + conceptsText;
          }
        }

        // Обрабатываем explanations (старый формат - объект)
        if (
          materials.explanations &&
          typeof materials.explanations === "object" &&
          !Array.isArray(materials.explanations)
        ) {
          explanation +=
            "\n\nОбъяснения:\n" +
            Object.entries(materials.explanations)
              .map(([concept, exp]) => `• ${concept}: ${exp}`)
              .join("\n\n");
        }

        // Обрабатываем examples (новый формат - массив объектов)
        if (materials.examples && Array.isArray(materials.examples)) {
          examples = materials.examples
            .map((example: any, index: number) => {
              let exampleText = "";
              if (example.title) {
                exampleText += `${example.title}\n`;
              }
              if (example.code) {
                exampleText += `Код:\n${example.code}\n`;
              }
              if (example.description) {
                exampleText += `Описание: ${example.description}`;
              }
              return exampleText || `Пример ${index + 1}`;
            })
            .join("\n\n---\n\n");
        } else if (
          materials.examples &&
          typeof materials.examples === "object"
        ) {
          // Старый формат - объект
          examples = Object.entries(materials.examples)
            .map(
              ([title, example]) =>
                `${title}:\n${
                  typeof example === "string"
                    ? example
                    : JSON.stringify(example, null, 2)
                }`
            )
            .join("\n\n");
        }

        // Упрощенная версия - только названия концепций
        if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
          simplified = materials.keyConcepts
            .map((item: any) =>
              typeof item === "object" && item.concept
                ? `• ${item.concept}`
                : `• ${item}`
            )
            .join("\n");
        } else if (
          materials.key_concepts &&
          Array.isArray(materials.key_concepts)
        ) {
          simplified = materials.key_concepts
            .map((item: any) =>
              typeof item === "object" && item.concept
                ? `• ${item.concept}`
                : `• ${item}`
            )
            .join("\n");
        }

        setApprovedMaterials({
          explanation: explanation || undefined,
          examples: examples || undefined,
          simplified: simplified || undefined,
        });
      } else if (currentLesson.materials) {
        setApprovedMaterials(currentLesson.materials);
      } else {
        // Очищаем утвержденные материалы если их нет
        setApprovedMaterials({});
      }

      // Черновик
      if (currentLesson.materialsDraftJson) {
        const materialsJson = currentLesson.materialsDraftJson;
        const materials = materialsJson.educational_materials || materialsJson;

        let explanation = "";
        let examples = "";
        let simplified = "";

        // Обрабатываем keyConcepts (новый формат - массив объектов)
        if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
          const conceptsText = materials.keyConcepts
            .map((item: any, index: number) => {
              if (typeof item === "object" && item.concept) {
                return `${index + 1}. ${item.concept}\n   ${
                  item.explanation || ""
                }`;
              }
              return `${index + 1}. ${item}`;
            })
            .join("\n\n");
          explanation += "Ключевые концепции:\n" + conceptsText;
        }

        // Обрабатываем key_concepts (старый формат - массив строк)
        if (materials.key_concepts && Array.isArray(materials.key_concepts)) {
          const conceptsText = materials.key_concepts
            .map((item: any, index: number) => {
              if (typeof item === "object" && item.concept) {
                return `${index + 1}. ${item.concept}\n   ${
                  item.explanation || ""
                }`;
              }
              return `${index + 1}. ${item}`;
            })
            .join("\n\n");
          if (!explanation) {
            explanation += "Ключевые концепции:\n" + conceptsText;
          }
        }

        // Обрабатываем explanations (старый формат - объект)
        if (
          materials.explanations &&
          typeof materials.explanations === "object" &&
          !Array.isArray(materials.explanations)
        ) {
          explanation +=
            "\n\nОбъяснения:\n" +
            Object.entries(materials.explanations)
              .map(([concept, exp]) => `• ${concept}: ${exp}`)
              .join("\n\n");
        }

        // Обрабатываем examples (новый формат - массив объектов)
        if (materials.examples && Array.isArray(materials.examples)) {
          examples = materials.examples
            .map((example: any, index: number) => {
              let exampleText = "";
              if (example.title) {
                exampleText += `${example.title}\n`;
              }
              if (example.code) {
                exampleText += `Код:\n${example.code}\n`;
              }
              if (example.description) {
                exampleText += `Описание: ${example.description}`;
              }
              return exampleText || `Пример ${index + 1}`;
            })
            .join("\n\n---\n\n");
        } else if (
          materials.examples &&
          typeof materials.examples === "object"
        ) {
          // Старый формат - объект
          examples = Object.entries(materials.examples)
            .map(
              ([title, example]) =>
                `${title}:\n${
                  typeof example === "string"
                    ? example
                    : JSON.stringify(example, null, 2)
                }`
            )
            .join("\n\n");
        }

        // Упрощенная версия - только названия концепций
        if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
          simplified = materials.keyConcepts
            .map((item: any) =>
              typeof item === "object" && item.concept
                ? `• ${item.concept}`
                : `• ${item}`
            )
            .join("\n");
        } else if (
          materials.key_concepts &&
          Array.isArray(materials.key_concepts)
        ) {
          simplified = materials.key_concepts
            .map((item: any) =>
              typeof item === "object" && item.concept
                ? `• ${item.concept}`
                : `• ${item}`
            )
            .join("\n");
        }

        setDraftMaterials({
          explanation: explanation || undefined,
          examples: examples || undefined,
          simplified: simplified || undefined,
        });
        setViewTab("draft");
      } else {
        // Очищаем черновик если его нет
        setDraftMaterials({});
      }
    }
  }, [currentLesson]);

  // Обновляем параметры при выборе пресета
  useEffect(() => {
    if (selectedPreset && selectedPreset.payloadJson) {
      const payload = selectedPreset.payloadJson;
      if (payload.tone) setTone(payload.tone);
      if (payload.complexity) setComplexity(payload.complexity);
    }
  }, [selectedPreset]);

  const generateMaterial = async () => {
    if (!currentLesson) return;
    try {
      setGenerating(true);
      setLoading(true);
      // Определяем язык из браузера или используем 'ru' по умолчанию
      const language =
        typeof window !== "undefined"
          ? (navigator.language || navigator.languages?.[0] || "ru").split(
              "-"
            )[0]
          : "ru";

      const response = await api.post(
        endpoints.lessons.generateMaterials(currentLesson.id),
        {
          tone,
          complexity,
          language,
        }
      );

      // API 2.0: возвращает materialsJson напрямую (объект)
      // Может быть в обертке data
      const responseData = response.data?.data || response.data;
      const materialsJson = responseData.materialsJson || responseData;

      // Сохраняем черновик
      updateDraftContent("materials", materialsJson);

      // Преобразуем данные в формат фронтенда
      const materials = materialsJson.educational_materials || materialsJson;

      let explanation = "";
      let examples = "";
      let simplified = "";

      // Обрабатываем keyConcepts (новый формат - массив объектов)
      if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
        const conceptsText = materials.keyConcepts
          .map((item: any, index: number) => {
            if (typeof item === "object" && item.concept) {
              return `${index + 1}. ${item.concept}\n   ${
                item.explanation || ""
              }`;
            }
            return `${index + 1}. ${item}`;
          })
          .join("\n\n");
        explanation += "Ключевые концепции:\n" + conceptsText;
      }

      // Обрабатываем key_concepts (старый формат - массив строк)
      if (materials.key_concepts && Array.isArray(materials.key_concepts)) {
        const conceptsText = materials.key_concepts
          .map((item: any, index: number) => {
            if (typeof item === "object" && item.concept) {
              return `${index + 1}. ${item.concept}\n   ${
                item.explanation || ""
              }`;
            }
            return `${index + 1}. ${item}`;
          })
          .join("\n\n");
        if (!explanation) {
          explanation += "Ключевые концепции:\n" + conceptsText;
        }
      }

      // Обрабатываем explanations (старый формат - объект)
      if (
        materials.explanations &&
        typeof materials.explanations === "object" &&
        !Array.isArray(materials.explanations)
      ) {
        explanation +=
          "\n\nОбъяснения:\n" +
          Object.entries(materials.explanations)
            .map(([concept, exp]) => `• ${concept}: ${exp}`)
            .join("\n\n");
      }

      // Обрабатываем examples (новый формат - массив объектов)
      if (materials.examples && Array.isArray(materials.examples)) {
        examples = materials.examples
          .map((example: any, index: number) => {
            let exampleText = "";
            if (example.title) {
              exampleText += `${example.title}\n`;
            }
            if (example.code) {
              exampleText += `Код:\n${example.code}\n`;
            }
            if (example.description) {
              exampleText += `Описание: ${example.description}`;
            }
            return exampleText || `Пример ${index + 1}`;
          })
          .join("\n\n---\n\n");
      } else if (materials.examples && typeof materials.examples === "object") {
        // Старый формат - объект
        examples = Object.entries(materials.examples)
          .map(
            ([title, example]) =>
              `${title}:\n${
                typeof example === "string"
                  ? example
                  : JSON.stringify(example, null, 2)
              }`
          )
          .join("\n\n");
      }

      // Упрощенная версия - только названия концепций
      if (materials.keyConcepts && Array.isArray(materials.keyConcepts)) {
        simplified = materials.keyConcepts
          .map((item: any) =>
            typeof item === "object" && item.concept
              ? `• ${item.concept}`
              : `• ${item}`
          )
          .join("\n");
      } else if (
        materials.key_concepts &&
        Array.isArray(materials.key_concepts)
      ) {
        simplified = materials.key_concepts
          .map((item: any) =>
            typeof item === "object" && item.concept
              ? `• ${item.concept}`
              : `• ${item}`
          )
          .join("\n");
      }

      const updatedMaterials = {
        explanation: explanation || undefined,
        examples: examples || undefined,
        simplified: simplified || undefined,
      };

      setDraftMaterials(updatedMaterials);
      setViewTab("draft");
      await refreshLesson();
      showNotification("Материалы успешно сгенерированы (черновик)", "success");
    } catch (err: any) {
      console.error("❌ MaterialsTab - Error:", err);
      showNotification(
        err.response?.data?.message ||
          err.message ||
          "Ошибка генерации материалов",
        "error"
      );
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleMaterialChange = (
    field: keyof LessonMaterials,
    value: string,
    isDraft: boolean
  ) => {
    const updated = isDraft
      ? { ...draftMaterials, [field]: value }
      : { ...approvedMaterials, [field]: value };

    if (isDraft) {
      setDraftMaterials(updated);
    } else {
      setApprovedMaterials(updated);
      updateLessonContent("materials", updated);
    }
  };

  const handleApproved = async () => {
    await refreshLesson();
    setViewTab("approved");
  };

  const renderMaterials = (materials: LessonMaterials, isDraft: boolean) => {
    // Парсим материалы из черновика для красивого отображения
    const renderStructuredMaterials = () => {
      if (!currentLesson?.materialsDraftJson && !currentLesson?.materialsJson) {
        return null;
      }

      const materialsData = isDraft
        ? currentLesson.materialsDraftJson || {}
        : currentLesson.materialsJson || {};

      const materialsContent =
        materialsData.educational_materials || materialsData;

      return (
        <Box>
          {/* Ключевые концепции */}
          {(materialsContent.keyConcepts || materialsContent.key_concepts) && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Book size={20} color="#1976d2" />
                <Typography variant="h6">Ключевые концепции</Typography>
              </Box>
              <List>
                {(
                  materialsContent.keyConcepts ||
                  materialsContent.key_concepts ||
                  []
                ).map((item: any, index: number) => {
                  if (typeof item === "object" && item.concept) {
                    return (
                      <Paper
                        key={index}
                        sx={{ p: 2, mb: 1, bgcolor: "grey.50" }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {item.concept}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          whiteSpace="pre-wrap"
                        >
                          {item.explanation}
                        </Typography>
                      </Paper>
                    );
                  }
                  return (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {index + 1}. {item}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Примеры */}
          {materialsContent.examples && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Code size={20} color="#1976d2" />
                <Typography variant="h6">Примеры</Typography>
              </Box>
              {Array.isArray(materialsContent.examples)
                ? materialsContent.examples.map(
                    (example: any, index: number) => (
                      <Paper
                        key={index}
                        sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}
                      >
                        {example.title && (
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            gutterBottom
                          >
                            {example.title}
                          </Typography>
                        )}
                        {example.code && (
                          <Box
                            sx={{
                              mb: 1,
                              p: 1.5,
                              bgcolor: "grey.100",
                              borderRadius: 1,
                              fontFamily: "monospace",
                            }}
                          >
                            <Typography
                              variant="body2"
                              component="pre"
                              sx={{
                                m: 0,
                                whiteSpace: "pre-wrap",
                                fontSize: "0.875rem",
                              }}
                            >
                              {example.code}
                            </Typography>
                          </Box>
                        )}
                        {example.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            whiteSpace="pre-wrap"
                          >
                            {example.description}
                          </Typography>
                        )}
                      </Paper>
                    )
                  )
                : typeof materialsContent.examples === "object"
                ? Object.entries(materialsContent.examples).map(
                    ([title, example]: [string, any]) => (
                      <Paper
                        key={title}
                        sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          whiteSpace="pre-wrap"
                        >
                          {typeof example === "string"
                            ? example
                            : JSON.stringify(example, null, 2)}
                        </Typography>
                      </Paper>
                    )
                  )
                : null}
            </Box>
          )}

          {/* Визуальные пособия */}
          {materialsContent.visualAids &&
            Array.isArray(materialsContent.visualAids) &&
            materialsContent.visualAids.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Визуальные пособия
                </Typography>
                <List>
                  {materialsContent.visualAids.map(
                    (aid: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Typography variant="body1">• {aid}</Typography>
                          }
                        />
                      </ListItem>
                    )
                  )}
                </List>
              </Box>
            )}

          {/* Дополнительные ресурсы */}
          {materialsContent.additionalResources &&
            Array.isArray(materialsContent.additionalResources) &&
            materialsContent.additionalResources.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Дополнительные ресурсы
                </Typography>
                <List>
                  {materialsContent.additionalResources.map(
                    (resource: string, index: number) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              component="a"
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: "primary.main",
                                textDecoration: "none",
                              }}
                            >
                              {resource}
                            </Typography>
                          }
                        />
                      </ListItem>
                    )
                  )}
                </List>
              </Box>
            )}
        </Box>
      );
    };

    const structuredContent = renderStructuredMaterials();

    return (
      <Box>
        {isDraft && currentLesson && (
          <Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
            <ApproveButton
              lessonId={currentLesson.id}
              type="materials"
              hasDraft={!!currentLesson.materialsDraftJson}
              onApproved={handleApproved}
            />
          </Box>
        )}

        {structuredContent ? (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Typography variant="h6">
                {isDraft ? "Черновик материалов" : "Утвержденные материалы"}
              </Typography>
              {isDraft && (
                <Chip label="Черновик" color="warning" size="small" />
              )}
              {!isDraft && (
                <Chip label="Утверждены" color="success" size="small" />
              )}
            </Box>
            {structuredContent}
          </Paper>
        ) : (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Основной текст
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                value={materials.explanation || ""}
                onChange={(e) =>
                  handleMaterialChange("explanation", e.target.value, isDraft)
                }
                placeholder="Основной текст объяснения..."
                disabled={!isDraft}
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
                onChange={(e) =>
                  handleMaterialChange("examples", e.target.value, isDraft)
                }
                placeholder="Примеры использования..."
                disabled={!isDraft}
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
                onChange={(e) =>
                  handleMaterialChange("simplified", e.target.value, isDraft)
                }
                placeholder="Упрощённая версия для лучшего понимания..."
                disabled={!isDraft}
              />
            </Paper>
          </>
        )}
      </Box>
    );
  };

  if (!currentLesson) {
    return (
      <Typography color="text.secondary">
        Выберите урок для генерации материалов
      </Typography>
    );
  }

  const hasMaterials =
    Object.keys(approvedMaterials).length > 0 ||
    Object.keys(draftMaterials).length > 0;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Параметры генерации
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <PresetSelector
            type="materials"
            onSelectPreset={setSelectedPreset}
            selectedPresetId={selectedPreset?.id || null}
          />
          <FormControl fullWidth>
            <InputLabel>Тон изложения</InputLabel>
            <Select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              label="Тон изложения"
            >
              <MenuItem value="профессиональный">Профессиональный</MenuItem>
              <MenuItem value="дружелюбный">Дружелюбный</MenuItem>
              <MenuItem value="формальный">Формальный</MenuItem>
              <MenuItem value="простой">Простой</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Сложность</InputLabel>
            <Select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              label="Сложность"
            >
              <MenuItem value="низкий">Низкий</MenuItem>
              <MenuItem value="средний">Средний</MenuItem>
              <MenuItem value="высокий">Высокий</MenuItem>
            </Select>
          </FormControl>
          <LoadingButton
            variant="contained"
            onClick={generateMaterial}
            loading={generating}
            startIcon={<FileText size={16} />}
          >
            Сгенерировать материалы
          </LoadingButton>
        </Box>
      </Paper>

      {hasMaterials && (
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={viewTab}
            onChange={(_, newValue) => setViewTab(newValue)}
          >
            {Object.keys(draftMaterials).length > 0 && (
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    Черновик
                    <Chip label="Новый" color="warning" size="small" />
                  </Box>
                }
                value="draft"
              />
            )}
            {Object.keys(approvedMaterials).length > 0 && (
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

      {viewTab === "draft" && renderMaterials(draftMaterials, true)}
      {viewTab === "approved" && renderMaterials(approvedMaterials, false)}
      {viewTab === "versions" && currentLesson && (
        <VersionHistory lessonId={currentLesson.id} type="materials" />
      )}

      {!hasMaterials && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary" align="center">
            Материалы еще не сгенерированы
          </Typography>
        </Paper>
      )}
    </Box>
  );
};
