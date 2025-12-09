'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableContainer,
} from '@mui/material';
import { Clock, Eye, ChevronDown, Target, Book, Activity, CheckCircle } from 'react-feather';
import { api, endpoints } from '@/lib/api';
import { useUiStore } from '@/stores/useUiStore';
import { formatDate } from '@/shared/utils/formatDate';
import type { ContentVersion, ContentType } from '@/entities/types';

interface VersionHistoryProps {
  lessonId: string;
  type: ContentType;
  onSelectVersion?: (version: ContentVersion) => void;
}

export const VersionHistory = ({ lessonId, type, onSelectVersion }: VersionHistoryProps) => {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { showNotification } = useUiStore();

  useEffect(() => {
    fetchVersions();
  }, [lessonId, type]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.lessons.versions(lessonId, type));
      setVersions(response.data || []);
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка загрузки версий',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (version: ContentVersion) => {
    try {
      const response = await api.get(endpoints.lessons.version(lessonId, version.id));
      setSelectedVersion(response.data);
      setPreviewOpen(true);
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка загрузки версии',
        'error'
      );
    }
  };

  const handleSelectVersion = (version: ContentVersion) => {
    if (onSelectVersion) {
      onSelectVersion(version);
    }
    setPreviewOpen(false);
  };

  const renderContentPreview = (payloadJson: any) => {
    if (!payloadJson) return null;

    if (type === 'plan') {
      return (
        <Box>
          {payloadJson.objectives && payloadJson.objectives.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Target size={20} color="#1976d2" />
                <Typography variant="h6">Цели урока</Typography>
              </Box>
              <List>
                {payloadJson.objectives.map((objective: string, index: number) => (
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

          {payloadJson.materials && payloadJson.materials.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Book size={20} color="#1976d2" />
                <Typography variant="h6">Материалы</Typography>
              </Box>
              <List>
                {payloadJson.materials.map((material: string, index: number) => (
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

          {payloadJson.activities && payloadJson.activities.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Activity size={20} color="#1976d2" />
                <Typography variant="h6">Активности</Typography>
              </Box>
              {payloadJson.activities.map((activity: any, index: number) => (
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

          {payloadJson.assessment && (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CheckCircle size={20} color="#1976d2" />
                <Typography variant="h6">Оценка</Typography>
              </Box>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" whiteSpace="pre-wrap">
                  {payloadJson.assessment}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      );
    }

    if (type === 'materials') {
      const materials = payloadJson.educational_materials || payloadJson;
      return (
        <Box>
          {/* Обрабатываем keyConcepts - может быть массивом объектов или массивом строк */}
          {materials.keyConcepts && Array.isArray(materials.keyConcepts) && materials.keyConcepts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Book size={20} color="#1976d2" />
                <Typography variant="h6">Ключевые концепции</Typography>
              </Box>
              <List>
                {materials.keyConcepts.map((item: any, index: number) => {
                  // Если это объект с полями concept и explanation
                  if (typeof item === 'object' && item.concept) {
                    return (
                      <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {item.concept}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                          {item.explanation}
                        </Typography>
                      </Paper>
                    );
                  }
                  // Если это строка
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

          {/* Обрабатываем key_concepts (старый формат) */}
          {materials.key_concepts && Array.isArray(materials.key_concepts) && materials.key_concepts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Book size={20} color="#1976d2" />
                <Typography variant="h6">Ключевые концепции</Typography>
              </Box>
              <List>
                {materials.key_concepts.map((concept: any, index: number) => {
                  if (typeof concept === 'object' && concept.concept) {
                    return (
                      <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          {concept.concept}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                          {concept.explanation}
                        </Typography>
                      </Paper>
                    );
                  }
                  return (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {index + 1}. {concept}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Обрабатываем explanations (старый формат) */}
          {materials.explanations && typeof materials.explanations === 'object' && !Array.isArray(materials.explanations) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Объяснения
              </Typography>
              {Object.entries(materials.explanations).map(([concept, explanation]: [string, any]) => (
                <Paper key={concept} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {concept}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                    {explanation}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}

          {/* Обрабатываем examples - может быть массивом объектов или объектом */}
          {materials.examples && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Примеры
              </Typography>
              {Array.isArray(materials.examples) ? (
                // Новый формат: массив объектов
                materials.examples.map((example: any, index: number) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {example.title || `Пример ${index + 1}`}
                    </Typography>
                    {example.code && (
                      <Box sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace' }}>
                        <Typography variant="body2" component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                          {example.code}
                        </Typography>
                      </Box>
                    )}
                    {example.description && (
                      <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                        {example.description}
                      </Typography>
                    )}
                  </Paper>
                ))
              ) : typeof materials.examples === 'object' ? (
                // Старый формат: объект с ключами
                Object.entries(materials.examples).map(([title, example]: [string, any]) => (
                  <Paper key={title} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">
                      {typeof example === 'string' ? example : JSON.stringify(example, null, 2)}
                    </Typography>
                  </Paper>
                ))
              ) : null}
            </Box>
          )}

          {/* Дополнительные ресурсы */}
          {materials.additionalResources && Array.isArray(materials.additionalResources) && materials.additionalResources.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Дополнительные ресурсы
              </Typography>
              <List>
                {materials.additionalResources.map((resource: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" component="a" href={resource} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                          {resource}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Визуальные пособия */}
          {materials.visualAids && Array.isArray(materials.visualAids) && materials.visualAids.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Визуальные пособия
              </Typography>
              <List>
                {materials.visualAids.map((aid: string, index: number) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          • {aid}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      );
    }

    if (type === 'tests') {
      const questions = payloadJson.questions || [];
      
      const renderQuestionContent = (question: any) => {
        switch (question.type) {
          case 'multiple-choice':
            if (question.options && question.options.length > 0) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  {question.options.map((option: string, optIndex: number) => (
                    <Box
                      key={optIndex}
                      sx={{
                        p: 1,
                        mb: 0.5,
                        borderRadius: 1,
                        bgcolor: optIndex === question.correctOptionIndex ? 'success.light' : 'grey.100',
                        border: optIndex === question.correctOptionIndex ? '2px solid' : '1px solid',
                        borderColor: optIndex === question.correctOptionIndex ? 'success.main' : 'grey.300',
                      }}
                    >
                      <Typography
                        variant="body2"
                        color={optIndex === question.correctOptionIndex ? 'success.dark' : 'text.primary'}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {optIndex === question.correctOptionIndex && <CheckCircle size={16} />}
                        {String.fromCharCode(65 + optIndex)}. {option}
                        {optIndex === question.correctOptionIndex && (
                          <Chip label="Правильный ответ" size="small" color="success" />
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              );
            }
            return null;

          case 'short-answer':
            if (question.answer) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="success.dark" fontWeight="bold">
                      Правильный ответ:
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                      {question.answer}
                    </Typography>
                  </Paper>
                </Box>
              );
            }
            return null;

          case 'true-false':
            return (
              <Box sx={{ ml: 4, mt: 1 }}>
                {question.options?.map((option: string, optIndex: number) => (
                  <Box
                    key={optIndex}
                    sx={{
                      p: 1,
                      mb: 0.5,
                      borderRadius: 1,
                      bgcolor: optIndex === question.correctOptionIndex ? 'success.light' : 'grey.100',
                      border: optIndex === question.correctOptionIndex ? '2px solid' : '1px solid',
                      borderColor: optIndex === question.correctOptionIndex ? 'success.main' : 'grey.300',
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={optIndex === question.correctOptionIndex ? 'success.dark' : 'text.primary'}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      {optIndex === question.correctOptionIndex && <CheckCircle size={16} />}
                      {option}
                    </Typography>
                  </Box>
                ))}
              </Box>
            );

          case 'fill-blanks':
            if (question.additionalData?.blanks) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="success.dark" fontWeight="bold">
                      Правильные ответы:
                    </Typography>
                    {question.additionalData.blanks.map((blank: any, idx: number) => (
                      <Typography key={idx} variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                        Пробел {blank.position + 1}: <strong>{blank.correctAnswer}</strong>
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              );
            }
            return null;

          case 'matching':
            if (question.additionalData?.pairs) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Typography variant="body2" color="success.dark" fontWeight="bold" sx={{ mb: 1 }}>
                    Правильные пары:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
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
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="success.dark" fontWeight="bold" sx={{ mb: 1 }}>
                      Правильный порядок:
                    </Typography>
                    {question.additionalData.correctOrder.map((idx: number, orderIdx: number) => (
                      <Typography key={orderIdx} variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                        {orderIdx + 1}. {question.options?.[idx] || ''}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              );
            }
            return null;

          case 'numeric':
            if (question.additionalData?.correctAnswer !== undefined) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="success.dark" fontWeight="bold">
                      Правильный ответ: <strong>{question.additionalData.correctAnswer}</strong>
                    </Typography>
                    {question.additionalData.tolerance !== undefined && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Допуск: ±{question.additionalData.tolerance}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              );
            }
            return null;

          case 'code':
            if (question.additionalData) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  {question.additionalData.language && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Язык: {question.additionalData.language}
                    </Typography>
                  )}
                  {question.additionalData.testCases && question.additionalData.testCases.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="success.dark" fontWeight="bold" sx={{ mb: 0.5 }}>
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
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
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
                  </Paper>
                </Box>
              );
            }
            return null;

          case 'matrix':
            if (question.additionalData?.rows && question.additionalData?.columns && question.additionalData?.correctAnswers) {
              return (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Typography variant="body2" color="success.dark" fontWeight="bold" sx={{ mb: 1 }}>
                    Правильные ответы:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
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
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="success.dark" fontWeight="bold" sx={{ mb: 1 }}>
                      Зоны размещения:
                    </Typography>
                    {question.additionalData.dropZones.map((zone: string, idx: number) => (
                      <Typography key={idx} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {idx + 1}. {zone}
                      </Typography>
                    ))}
                    <Typography variant="body2" color="success.dark" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
                      Элементы для перетаскивания:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {question.additionalData.items.map((item: string, idx: number) => (
                        <Chip key={idx} label={item} size="small" />
                      ))}
                    </Box>
                  </Paper>
                </Box>
              );
            }
            return null;

          case 'diagram':
            return (
              <Box sx={{ ml: 4, mt: 1 }}>
                <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    {question.additionalData?.description || 'Требуется создать схему/диаграмму'}
                  </Typography>
                </Paper>
              </Box>
            );

          default:
            return (
              <Box sx={{ ml: 4, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Тип вопроса: {question.type}
                </Typography>
              </Box>
            );
        }
      };

      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Вопросы ({questions.length})
          </Typography>
          {questions.map((question: any, index: number) => (
            <Paper key={question.id || index} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="start" gap={1} mb={1}>
                <Typography variant="h6" color="primary">
                  {index + 1}.
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ mb: 0.5 }}>
                    {question.question}
                  </Typography>
                  <Chip
                    label={question.type}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Box>
              </Box>
              
              {renderQuestionContent(question)}

              {question.explanation && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    Пояснение:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {question.explanation}
                  </Typography>
                </Box>
              )}

              {index < questions.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Paper>
          ))}
        </Box>
      );
    }

    if (type === 'presentation') {
      const presentation = payloadJson;
      return (
        <Box>
          {presentation.title && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {presentation.title}
              </Typography>
            </Box>
          )}
          {presentation.slides && Array.isArray(presentation.slides) && presentation.slides.length > 0 && (
            <Box>
              {presentation.slides.map((slide: any, index: number) => (
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
              ))}
            </Box>
          )}
        </Box>
      );
    }

    // Fallback для неизвестных типов
    return (
      <Box>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem' }}>
          {JSON.stringify(payloadJson, null, 2)}
        </pre>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (versions.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">
          История версий пуста
        </Typography>
      </Paper>
    );
  }

  const typeLabels: Record<ContentType, string> = {
    plan: 'План',
    materials: 'Материалы',
    tests: 'Тесты',
    presentation: 'Презентация',
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Clock size={20} />
          <Typography variant="h6">
            История версий ({typeLabels[type]})
          </Typography>
        </Box>
        <List>
          {versions.map((version) => (
            <ListItem key={version.id} divider>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1">
                      Версия от {formatDate(version.createdAt)}
                    </Typography>
                    {version.id === versions[0]?.id && (
                      <Chip label="Последняя" size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    Создано: {formatDate(version.createdAt)}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handlePreview(version)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <Eye size={16} />
                </IconButton>
                {onSelectVersion && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleSelectVersion(version)}
                  >
                    Выбрать
                  </Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6">
              Просмотр версии от {selectedVersion && formatDate(selectedVersion.createdAt)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {typeLabels[type]}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
            {selectedVersion?.payloadJson ? (
              renderContentPreview(selectedVersion.payloadJson)
            ) : (
              <Typography color="text.secondary">Данные версии отсутствуют</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Закрыть</Button>
          {onSelectVersion && selectedVersion && (
            <Button
              variant="contained"
              onClick={() => handleSelectVersion(selectedVersion)}
            >
              Выбрать эту версию
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

