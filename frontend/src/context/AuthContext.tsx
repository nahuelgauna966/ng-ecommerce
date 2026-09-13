import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { setUnauthorizedHandler } from '../services/api';

const TOKEN_KEY = 'jwt';
const LEGACY_TOKEN_KEY = 'auth_token';

// Coincide con el payload que firma el backend (ver JwtPayload en
// backend/src/modules/auth/auth.service.ts): sub, email, role, iat, exp.
// El backend no incluye "name" en el JWT, así que no lo tenemos disponible
// acá sin un endpoint adicional (ej. GET /users/me).
interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export type ProtectedRouteName =
  | 'Cart'
  | 'Checkout'
  | 'MyOrders'
  | 'Profile';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredToken: () => Promise<void>;
  intendedRoute: ProtectedRouteName | null;
  requestProtectedRoute: (route: ProtectedRouteName) => void;
  clearIntendedRoute: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeUser(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    if (payload.exp * 1000 < Date.now()) {
      return null;
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [intendedRoute, setIntendedRoute] =
    useState<ProtectedRouteName | null>(null);

  const loadStoredToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken =
        (await SecureStore.getItemAsync(TOKEN_KEY)) ??
        (await SecureStore.getItemAsync(LEGACY_TOKEN_KEY));
      if (!storedToken) {
        setToken(null);
        setUser(null);
        return;
      }
      const decodedUser = decodeUser(storedToken);
      if (!decodedUser) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
        setToken(null);
        setUser(null);
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, storedToken);
      await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
      setToken(storedToken);
      setUser(decodedUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (newToken: string) => {
    const decodedUser = decodeUser(newToken);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(decodedUser);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setIntendedRoute(null);
  }, []);

  const requestProtectedRoute = useCallback((route: ProtectedRouteName) => {
    setIntendedRoute(route);
  }, []);

  const clearIntendedRoute = useCallback(() => {
    setIntendedRoute(null);
  }, []);

  useEffect(() => {
    void loadStoredToken();
  }, [loadStoredToken]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      loadStoredToken,
      intendedRoute,
      requestProtectedRoute,
      clearIntendedRoute,
    }),
    [
      user,
      token,
      isLoading,
      login,
      logout,
      loadStoredToken,
      intendedRoute,
      requestProtectedRoute,
      clearIntendedRoute,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
