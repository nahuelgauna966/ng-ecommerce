export const AUTH_TOKEN_STORAGE_KEY = "access_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}