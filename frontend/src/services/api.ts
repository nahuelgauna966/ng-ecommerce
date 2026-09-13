import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

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

export interface ApiError {
  message: string;
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
