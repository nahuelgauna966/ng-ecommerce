"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export interface AdminCategory {
  id: number;
  name: string;
  description: string | null;
  products: Array<{ id: number }>;
}

const categorySchema = z.object({
  description: z.string().trim(),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function getApiError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message ?? "No se pudo guardar la categoría.";
  }

  return "No se pudo guardar la categoría. Intentá nuevamente.";
}

export function CategoryFormDialog({
  category,
  onClose,
  onSaved,
}: {
  category?: AdminCategory;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(category);
  const form = useForm<CategoryFormValues>({
    defaultValues: {
      description: category?.description ?? "",
      name: category?.name ?? "",
    },
    resolver: zodResolver(categorySchema),
  });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: CategoryFormValues) {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
      };
      if (category) {
        await api.put(`/categories/${category.id}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      onSaved();
      onClose();
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
      <section aria-labelledby="category-dialog-title" aria-modal="true" className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="category-dialog-title">{isEditing ? "Editar categoría" : "Nueva categoría"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Organizá los productos del catálogo.</p>
          </div>
          <Button aria-label="Cerrar" onClick={onClose} size="icon-sm" variant="ghost"><X aria-hidden="true" /></Button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="category-name">Nombre</label>
            <input className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" disabled={isSubmitting} id="category-name" {...form.register("name")} />
            {form.formState.errors.name?.message ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="category-description">Descripción <span className="font-normal text-muted-foreground">(opcional)</span></label>
            <textarea className="flex min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" disabled={isSubmitting} id="category-description" {...form.register("description")} />
          </div>
          {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="outline">Cancelar</Button>
            <Button disabled={isSubmitting} type="submit">{isSubmitting ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Guardando...</> : isEditing ? "Guardar cambios" : "Crear categoría"}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}