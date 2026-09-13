import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const TOKEN_KEY = 'jwt';
let unauthorizedHandler: (() => Promise<void>) | null = null;
let isHandlingUnauthorized = false;

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setUnauthorizedHandler(
  handler: (() => Promise<void>) | null,
): void {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestUrl = error.config?.url ?? '';
    const isAuthRequest = /\/auth\/(login|register)$/.test(requestUrl);

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      !isHandlingUnauthorized
    ) {
      isHandlingUnauthorized = true;
      try {
        if (unauthorizedHandler) {
          await unauthorizedHandler();
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
        Alert.alert(
          'Sesión expirada',
          'Tu sesión ha expirado. Por favor iniciá sesión nuevamente.',
        );
      } finally {
        isHandlingUnauthorized = false;
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiError {
  message: string | string[];
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (message) {
      return message;
    }
    if (error.code === AxiosError.ERR_NETWORK) {
      return 'No se pudo conectar con el servidor. Revisá tu conexión.';
    }
  }
  return 'Ocurrió un error inesperado. Intentá nuevamente.';
}

export interface AuthResponse {
  access_token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterPayload) =>
    api.post('/auth/register', payload),
};

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  isActive: boolean;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsApi = {
  getAll: (page = 1, limit = 10) =>
    api.get<PaginatedProducts>('/products', { params: { page, limit } }),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
};

export interface Order {
  id: number;
  status: string;
  total: string;
  createdAt: string;
}

export const ordersApi = {
  getMyOrders: () => api.get<Order[]>('/orders/my-orders'),
};

export default api;
