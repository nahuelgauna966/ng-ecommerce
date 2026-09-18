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

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export const usersApi = {
  getMe: () => api.get<UserProfile>('/users/me'),
};

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  cloudinaryPublicId: string | null;
  isActive: boolean;
  category?: {
    id: number;
    name: string;
  };
  stock?: {
    quantity: number;
  };
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface Category {
  id: number;
  name: string;
}

export const productsApi = {
  getAll: (page = 1, limit = 10, categoryId?: number) =>
    api.get<PaginatedProducts>('/products', {
      params: { page, limit, ...(categoryId === undefined ? {} : { categoryId }) },
    }),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),
};

export interface Order {
  id: number;
  status: string;
  total: string;
  createdAt: string;
}

export interface OrderDetailItem {
  id: number;
  quantity: number;
  unitPrice: string;
  product: Pick<Product, 'id' | 'imageUrl' | 'name'> | null;
}

export interface Payment {
  method: string;
  status: string;
  createdAt: string;
}

export interface OrderDetails extends Order {
  orderDetails: OrderDetailItem[];
  payment?: Payment | null;
}

export interface CreateOrderPayload {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface CreatePaymentPayload {
  orderId: number;
}

export interface CreatePaymentResponse {
  clientSecret: string | null;
}

export const ordersApi = {
  create: (payload: CreateOrderPayload) => api.post<Order>('/orders', payload),
  getMyOrders: () => api.get<Order[]>('/orders/my-orders'),
  getById: (id: number) => api.get<OrderDetails>(`/orders/${id}`),
};

export const paymentsApi = {
  create: (payload: CreatePaymentPayload) =>
    api.post<CreatePaymentResponse>('/payments/create', payload),
};

export default api;
