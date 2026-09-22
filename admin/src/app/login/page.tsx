"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { setAuthToken } from "@/lib/auth-token";
import { api, type AuthResponse, type LoginPayload } from "@/lib/api";

interface ApiError {
  message?: string | string[];
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  return "No se pudo iniciar sesión. Intentá nuevamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { data } = await api.post<AuthResponse>("/auth/login", credentials);
      setAuthToken(data.access_token);
      router.replace("/");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
      <section className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">NG E-commerce</p>
          <h1 className="text-2xl font-semibold tracking-tight">Panel administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá con tus credenciales de administrador.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="flex h-9 w-full rounded-lg border bg-transparent px-3 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={isSubmitting}
              id="email"
              onChange={(event) =>
                setCredentials((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="admin@ng.com"
              required
              type="email"
              value={credentials.email}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className="flex h-9 w-full rounded-lg border bg-transparent px-3 py-1 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={isSubmitting}
              id="password"
              onChange={(event) =>
                setCredentials((current) => ({ ...current, password: event.target.value }))
              }
              required
              type="password"
              value={credentials.password}
            />
          </div>

          {errorMessage ? (
            <p aria-live="polite" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </section>
    </main>
  );
}