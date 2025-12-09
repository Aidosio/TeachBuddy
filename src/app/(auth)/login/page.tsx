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
import { loginSchema, type LoginInput } from '@/entities/schemas';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUiStore } from '@/stores/useUiStore';
import { api, endpoints } from '@/lib/api';
import { authResponseSchema } from '@/entities/schemas';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showNotification } = useUiStore();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError(null);
      // Определяем язык из браузера или используем 'ru' по умолчанию
      const language = typeof window !== 'undefined' 
        ? (navigator.language || navigator.languages?.[0] || 'ru').split('-')[0]
        : 'ru';
      
      const response = await api.post(endpoints.auth.login, {
        ...data,
        language,
      });
      
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
      showNotification('Успешный вход', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const message =
        err.response?.data?.message || err.message || 'Ошибка входа. Проверьте данные.';
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
            Вход
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Войдите в свой аккаунт
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
              autoComplete="current-password"
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
            <Box textAlign="center">
              <Link href="/register" underline="hover">
                У меня ещё нет аккаунта
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

