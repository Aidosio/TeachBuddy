"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lessonSchema, type LessonInput } from "@/entities/schemas";
import { useUiStore } from "@/stores/useUiStore";
import { api, endpoints } from "@/lib/api";
import { lessonSchemaResponse } from "@/entities/schemas";
import { LoadingButton } from "@/shared/components/LoadingButton";

interface CreateLessonDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
}

export const CreateLessonDialog = ({
  open,
  onClose,
  onSuccess,
  courseId,
}: CreateLessonDialogProps) => {
  const { showNotification } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LessonInput>({
    resolver: zodResolver(lessonSchema),
  });

  const onSubmit = async (data: LessonInput) => {
    try {
      setIsSubmitting(true);
      const response = await api.post(endpoints.lessons.create(courseId), data);
      const lesson = lessonSchemaResponse.parse(response.data);
      showNotification("Тема успешно создана", "success");
      reset();
      onClose();
      onSuccess();
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || "Ошибка создания темы",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          m: { xs: 1, sm: 2 },
          width: { xs: "calc(100% - 16px)", sm: "auto" },
        },
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Добавить тему
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 1, sm: 2 } }}>
          <Box sx={{ pt: { xs: 0.5, sm: 1 } }}>
            <TextField
              {...register("title")}
              label="Название темы"
              fullWidth
              margin="normal"
              error={!!errors.title}
              helperText={errors.title?.message}
              autoFocus
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                },
              }}
            />
            <TextField
              {...register("goals")}
              label="Цели (опционально)"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors.goals}
              helperText={errors.goals?.message}
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 2 },
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: { xs: 1, sm: 1 },
            "& > *": {
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <Button
            variant="outlined"
            sx={{
              boxShadow: "none",
              width: { xs: "100%", sm: "auto" },
            }}
            onClick={handleClose}
          >
            Отмена
          </Button>
          <LoadingButton
            sx={{
              boxShadow: "none",
              width: { xs: "100%", sm: "auto" },
            }}
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            Создать
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};
