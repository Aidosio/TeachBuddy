"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Fab,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Plus } from "react-feather";
import { useCourseStore } from "@/stores/useCourseStore";
import { useUiStore } from "@/stores/useUiStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { api, endpoints } from "@/lib/api";
import { courseSchemaResponse } from "@/entities/schemas";
import { CreateCourseDialog } from "@/features/courses/CreateCourseDialog";
import type { Course } from "@/entities/types";
import { z } from "zod";

export default function DashboardPage() {
  const router = useRouter();
  const { courses, setCourses } = useCourseStore();
  const { showNotification, setLoading, loading } = useUiStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.courses.list);
      const coursesData = z.array(courseSchemaResponse).parse(response.data);
      setCourses(coursesData);
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || "Ошибка загрузки курсов",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  if (loading && courses.length === 0) {
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

  return (
    <>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1">
          Мои курсы
        </Typography>
      </Box>

      {courses.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            У вас пока нет курсов
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Создайте первый курс, чтобы начать работу
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Создать курс
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.description || "Нет описания"}
                </Typography>
                {course.level && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Уровень: {course.level}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ padding: 2 }}>
                <Button
                  sx={{ width: "100%", textAlign: "center", boxShadow: "none" }}
                  variant="outlined"
                  size="small"
                  onClick={() => handleCourseClick(course.id)}
                >
                  Открыть
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus size={24} />
      </Fab>

      <CreateCourseDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={fetchCourses}
      />
    </>
  );
}
