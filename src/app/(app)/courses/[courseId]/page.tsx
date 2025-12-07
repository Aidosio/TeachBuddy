"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Edit, Delete, Plus, ArrowLeft, Trash } from "react-feather";
import { useCourseStore } from "@/stores/useCourseStore";
import { useUiStore } from "@/stores/useUiStore";
import { api, endpoints } from "@/lib/api";
import { lessonSchemaResponse, courseSchemaResponse } from "@/entities/schemas";
import { z } from "zod";
import { CreateLessonDialog } from "@/features/lessons/CreateLessonDialog";
import { EditLessonDialog } from "@/features/lessons/EditLessonDialog";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import type { Lesson } from "@/entities/types";

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { currentCourse, setCurrentCourse } = useCourseStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchLessons();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.courses.detail(courseId));
      const course = courseSchemaResponse.parse(response.data);
      setCurrentCourse(course);
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || "Ошибка загрузки курса",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await api.get(endpoints.courses.lessons(courseId));
      const lessonsData = z.array(lessonSchemaResponse).parse(response.data);
      setLessons(lessonsData);
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || "Ошибка загрузки тем",
        "error"
      );
    }
  };

  const handleLessonClick = (lessonId: string) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}`);
  };

  const handleEditClick = (lesson: Lesson) => {
    setLessonToEdit(lesson);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (lessonId: string) => {
    setLessonToDelete(lessonId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!lessonToDelete) return;
    try {
      await api.delete(endpoints.lessons.delete(lessonToDelete));
      showNotification("Тема удалена", "success");
      setLessons(lessons.filter((l) => l.id !== lessonToDelete));
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
    } catch (err: any) {
      console.error("❌ Delete lesson error:", err);

      // Обработка специфичных ошибок
      let errorMessage = "Ошибка удаления темы";
      const responseMessage = err.response?.data?.message || err.message;

      if (responseMessage) {
        // Если ошибка связана с foreign key constraint
        if (
          responseMessage.includes("foreign key constraint") ||
          responseMessage.includes("lesson_contents")
        ) {
          errorMessage =
            "Невозможно удалить тему: есть связанные материалы. Сначала удалите все материалы урока.";
        } else {
          errorMessage = responseMessage;
        }
      }

      showNotification(errorMessage, "error");
    }
  };

  if (loading && !currentCourse) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentCourse) {
    return null;
  }

  return (
    <>
      <Breadcrumbs
        sx={{
          mb: { xs: 1.5, sm: 2 },
          "& .MuiBreadcrumbs-ol": {
            flexWrap: "wrap",
          },
        }}
      >
        <Link
          component="button"
          variant="body1"
          onClick={() => router.push("/dashboard")}
          sx={{ cursor: "pointer", fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          Курсы
        </Link>
        <Typography
          color="text.primary"
          sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
        >
          {currentCourse.title}
        </Typography>
      </Breadcrumbs>

      <Box
        sx={{
          mb: { xs: 3, sm: 4 },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: { xs: 2, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            onClick={() => router.push("/dashboard")}
            sx={{ ml: { xs: -1, sm: 0 } }}
          >
            <ArrowLeft size={20} />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: "1.5rem", sm: "2.125rem" },
                wordBreak: "break-word",
              }}
            >
              {currentCourse.title}
            </Typography>
            {currentCourse.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  wordBreak: "break-word",
                }}
              >
                {currentCourse.description}
              </Typography>
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            width: { xs: "100%", sm: "auto" },
            minWidth: { xs: "auto", sm: "160px" },
            whiteSpace: "nowrap",
          }}
        >
          Добавить тему
        </Button>
      </Box>

      {lessons.length === 0 ? (
        <Box textAlign="center" py={{ xs: 6, sm: 8 }} px={{ xs: 2, sm: 0 }}>
          <Typography
            variant="h6"
            color="text.secondary"
            gutterBottom
            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            В этом курсе пока нет тем
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Создайте первую тему для начала работы
          </Typography>
        </Box>
      ) : (
        <List sx={{ px: { xs: 0, sm: 0 } }}>
          {lessons.map((lesson) => (
            <ListItem
              key={lesson.id}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                mb: 1,
                pr: { xs: 1, sm: 3 },
                pl: { xs: 1, sm: 2 },
                py: { xs: 1.5, sm: 2 },
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: { xs: 1.5, sm: 0 },
              }}
            >
              <ListItemText
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  flex: { xs: "none", sm: "1 1 auto" },
                  m: 0,
                }}
                primary={
                  <>
                    {lesson.goals && (
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        component="span"
                        display="block"
                        sx={{
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          mb: { xs: 0.5, sm: 0.5 },
                          wordBreak: "break-word",
                        }}
                      >
                        Цель: {lesson.goals}
                      </Typography>
                    )}
                    {lesson.title && (
                      <Typography
                        color="text.primary"
                        variant="body1"
                        component="span"
                        display="block"
                        sx={{
                          fontSize: { xs: "0.875rem", sm: "1rem" },
                          wordBreak: "break-word",
                        }}
                      >
                        Название: {lesson.title}
                      </Typography>
                    )}
                  </>
                }
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 1 },
                  width: { xs: "100%", sm: "auto" },
                  justifyContent: { xs: "flex-end", sm: "flex-start" },
                }}
              >
                <Button
                  sx={{
                    minHeight: { xs: "36px", sm: "20px" },
                    minWidth: { xs: "36px", sm: "20px" },
                    padding: { xs: "8px", sm: "10px" },
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                  }}
                  variant="contained"
                  onClick={() => handleEditClick(lesson)}
                >
                  <Edit size={20} />
                </Button>
                <Button
                  sx={{
                    minHeight: { xs: "36px", sm: "20px" },
                    minWidth: { xs: "36px", sm: "20px" },
                    padding: { xs: "8px", sm: "10px" },
                    backgroundColor: "error.light",
                    "&:hover": {
                      backgroundColor: "error.dark",
                    },
                  }}
                  variant="contained"
                  onClick={() => handleDeleteClick(lesson.id)}
                >
                  <Trash size={20} />
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <CreateLessonDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchLessons}
        courseId={courseId}
      />

      <EditLessonDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setLessonToEdit(null);
        }}
        onSuccess={fetchLessons}
        lesson={lessonToEdit}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Удалить тему?"
        message="Вы уверены, что хотите удалить эту тему? Это действие нельзя отменить."
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setLessonToDelete(null);
        }}
        confirmText="Удалить"
      />
    </>
  );
}
