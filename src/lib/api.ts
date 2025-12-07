import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import { endpoints } from './api-endpoints';

let apiInstance: AxiosInstance | null = null;

const getApiInstance = (): AxiosInstance => {
  if (!apiInstance) {
    apiInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add token and log requests
    apiInstance.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Логирование запросов
        // Проверяем, является ли URL абсолютным
        const isAbsoluteUrl = config.url?.startsWith('http://') || config.url?.startsWith('https://');
        const fullUrl = isAbsoluteUrl ? config.url : `${config.baseURL}${config.url}`;
        
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: fullUrl,
          data: config.data,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization || undefined,
          },
        });
        
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and unwrap data
    apiInstance.interceptors.response.use(
      (response) => {
        // Логирование успешных ответов
        console.log('✅ API Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data,
        });
        
        // Бэкенд возвращает { data, statusCode, timestamp }
        // Извлекаем data из обертки для удобства использования
        if (response.data && typeof response.data === 'object') {
          // Проверяем, есть ли обертка с data и statusCode (формат бэкенда)
          if ('data' in response.data && 'statusCode' in response.data) {
            return {
              ...response,
              data: response.data.data,
            };
          }
          // Если уже есть user и accessToken напрямую, возвращаем как есть
          if ('user' in response.data && 'accessToken' in response.data) {
            return response;
          }
        }
        return response;
      },
      (error: AxiosError) => {
        // Логирование ошибок
        console.error('❌ API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message,
          responseData: error.response?.data,
        });
        
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        // Обработка ошибок бэкенда в формате { statusCode, message, error, timestamp, path }
        if (error.response?.data && typeof error.response.data === 'object') {
          const errorData = error.response.data as any;
          if (errorData.message) {
            error.message = errorData.message;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  return apiInstance;
};

export const api = {
  get: async <T = any>(url: string, config?: any) => {
    return getApiInstance().get<T>(url, config);
  },
  post: async <T = any>(url: string, data?: any, config?: any) => {
    return getApiInstance().post<T>(url, data, config);
  },
  put: async <T = any>(url: string, data?: any, config?: any) => {
    return getApiInstance().put<T>(url, data, config);
  },
  delete: async <T = any>(url: string, config?: any) => {
    return getApiInstance().delete<T>(url, config);
  },
};

export { endpoints };

