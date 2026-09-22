export const AUTH_TOKEN_STORAGE_KEY = "access_token";
const AUTH_TOKEN_CHANGED_EVENT = "ng-admin-auth-token-changed";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
  }
}

export function subscribeToAuthToken(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onChange);
}