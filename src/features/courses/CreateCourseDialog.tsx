'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, type CourseInput } from '@/entities/schemas';
import { useCourseStore } from '@/stores/useCourseStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { courseSchemaResponse } from '@/entities/schemas';
import { LoadingButton } from '@/shared/components/LoadingButton';

interface CreateCourseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCourseDialog = ({
  open,
  onClose,
  onSuccess,
}: CreateCourseDialogProps) => {
  const { addCourse } = useCourseStore();
  const { showNotification } = useUiStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
  });

  const onSubmit = async (data: CourseInput) => {
    try {
      setIsSubmitting(true);
      const response = await api.post(endpoints.courses.create, data);
      const course = courseSchemaResponse.parse(response.data);
      addCourse(course);
      showNotification('Курс успешно создан', 'success');
      reset();
      onClose();
      onSuccess();
    } catch (err: any) {
      showNotification(
        err.response?.data?.message || err.message || 'Ошибка создания курса',
        'error'
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Создать новый курс</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              {...register('title')}
              label="Название курса"
              fullWidth
              margin="normal"
              error={!!errors.title}
              helperText={errors.title?.message}
              autoFocus
            />
            <TextField
              {...register('description')}
              label="Описание"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
            <TextField
              {...register('level')}
              label="Уровень (опционально)"
              fullWidth
              margin="normal"
              error={!!errors.level}
              helperText={errors.level?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Создать
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

