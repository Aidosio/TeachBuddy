'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Eye, EyeOff } from 'react-feather';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/entities/schemas';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { authResponseSchema } from '@/entities/schemas';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showNotification } = useUiStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError(null);
      const response = await api.post(endpoints.auth.register, data);
      
      // Обрабатываем разные форматы ответа
      let authData = response.data;
      
      // Если ответ содержит обертку с data
      if (authData && typeof authData === 'object' && 'data' in authData) {
        authData = authData.data;
      }
      
      // Схема сама нормализует token/accessToken
      const result = authResponseSchema.parse(authData);
      
      if (!result.accessToken) {
        throw new Error('Токен доступа не получен от сервера');
      }
      
      // Преобразуем fullName в name для совместимости с фронтендом
      const user = {
        ...result.user,
        name: result.user.fullName,
      };
      login(user, result.accessToken);
      showNotification('Регистрация успешна', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Register error:', err);
      const message =
        err.response?.data?.message || err.message || 'Ошибка регистрации. Попробуйте снова.';
      setError(message);
      showNotification(message, 'error');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Регистрация
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Создайте новый аккаунт
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('email')}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              autoComplete="email"
            />
            <TextField
              {...register('password')}
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register('fullName')}
              label="Имя (опционально)"
              fullWidth
              margin="normal"
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              autoComplete="name"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <Box textAlign="center">
              <Link href="/login" underline="hover">
                Уже есть аккаунт? Войти
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

