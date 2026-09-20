"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, LoaderCircle, X } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export interface ProductCategory {
  id: number;
  name: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  description?: string | null;
  imageUrl: string | null;
  price: number | string;
  category: ProductCategory | null;
  stock: { quantity: number } | null;
}

const productSchema = z.object({
  categoryId: z.number().int().positive("Seleccioná una categoría."),
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  initialStock: z.number().int().min(0, "El stock no puede ser negativo."),
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  price: z.number().positive("El precio debe ser mayor a cero."),
});

type ProductFormValues = z.infer<typeof productSchema>;
export type ProductDialogMode = "create" | "edit" | "image";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;
const inputClassName = "flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function getApiError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message ?? "No se pudo guardar el producto.";
  }

  return "No se pudo guardar el producto. Intentá nuevamente.";
}

export function ProductFormDialog({
  categories,
  mode,
  product,
  onClose,
  onSaved,
}: {
  categories: ProductCategory[];
  mode: ProductDialogMode;
  product?: AdminProduct;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ProductFormValues>({
    defaultValues: {
      categoryId: product?.category?.id ?? 0,
      description: product?.description ?? "",
      initialStock: product?.stock?.quantity ?? 0,
      name: product?.name ?? "",
      price: Number(product?.price ?? 0),
    },
    resolver: zodResolver(productSchema),
  });

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      setImageFile(null);
      setImagePreview(product?.imageUrl ?? null);
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      setFileError("Seleccioná una imagen JPG, PNG o WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > maxImageSize) {
      setFileError("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(productId: number) {
    if (!imageFile) {
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);
    await api.post(`/products/${productId}/image`, formData);
  }

  async function handleImageSubmit() {
    if (!product) {
      return;
    }

    if (!imageFile) {
      setFileError("Seleccioná una imagen para continuar.");
      return;
    }

    setApiError(null);
    setIsSubmitting(true);
    try {
      await uploadImage(product.id);
      onSaved();
      onClose();
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProductSubmit(values: ProductFormValues) {
    setApiError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const { data: createdProduct } = await api.post<AdminProduct>("/products", values);
        await uploadImage(createdProduct.id);
      } else if (product) {
        const fieldsToUpdate = Object.fromEntries(
          Object.entries(form.formState.dirtyFields)
            .filter(([, isDirty]) => isDirty)
            .map(([field]) => [field, values[field as keyof ProductFormValues]]),
        );

        if (Object.keys(fieldsToUpdate).length > 0) {
          await api.put(`/products/${product.id}`, fieldsToUpdate);
        }
        await uploadImage(product.id);
      }

      onSaved();
      onClose();
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isImageOnly = mode === "image";
  const title = isImageOnly ? "Actualizar imagen" : mode === "create" ? "Nuevo producto" : "Editar producto";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
      <section
        aria-labelledby="product-dialog-title"
        aria-modal="true"
        className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-xl border bg-card p-6 shadow-lg"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="product-dialog-title">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isImageOnly ? "Seleccioná una nueva imagen para el producto." : "Completá los datos del producto."}
            </p>
          </div>
          <Button aria-label="Cerrar" onClick={onClose} size="icon-sm" variant="ghost">
            <X aria-hidden="true" />
          </Button>
        </div>

        {isImageOnly ? (
          <div className="mt-6 space-y-4">
            <ImageField fileError={fileError} imagePreview={imagePreview} onChange={handleImageChange} />
            {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}
            <DialogActions isSubmitting={isSubmitting} onClose={onClose} onSubmit={handleImageSubmit} submitLabel="Guardar imagen" />
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleProductSubmit)}>
            <FormField error={form.formState.errors.name?.message} label="Nombre">
              <input className={inputClassName} disabled={isSubmitting} {...form.register("name")} />
            </FormField>
            <FormField error={form.formState.errors.description?.message} label="Descripción">
              <textarea className={`${inputClassName} min-h-24 py-2`} disabled={isSubmitting} {...form.register("description")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField error={form.formState.errors.price?.message} label="Precio">
                <input className={inputClassName} disabled={isSubmitting} min="0.01" step="0.01" type="number" {...form.register("price", { valueAsNumber: true })} />
              </FormField>
              <FormField error={form.formState.errors.initialStock?.message} label="Stock inicial">
                <input className={inputClassName} disabled={isSubmitting} min="0" step="1" type="number" {...form.register("initialStock", { valueAsNumber: true })} />
              </FormField>
            </div>
            <FormField error={form.formState.errors.categoryId?.message} label="Categoría">
              <select className={inputClassName} disabled={isSubmitting} {...form.register("categoryId", { valueAsNumber: true })}>
                <option value="0">Seleccioná una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </FormField>
            <ImageField fileError={fileError} imagePreview={imagePreview} onChange={handleImageChange} />
            {apiError ? <p className="text-sm text-destructive">{apiError}</p> : null}
            <DialogActions isSubmitting={isSubmitting} onClose={onClose} submitLabel={mode === "create" ? "Crear producto" : "Guardar cambios"} />
          </form>
        )}
      </section>
    </div>
  );
}

function FormField({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return <div className="space-y-2"><label className="text-sm font-medium">{label}</label>{children}{error ? <p className="text-sm text-destructive">{error}</p> : null}</div>;
}

function ImageField({ fileError, imagePreview, onChange }: { fileError: string | null; imagePreview: string | null; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="product-image">Imagen</label>
      <div className="flex items-center gap-4">
        {imagePreview ? (
          // A local object URL or an arbitrary Cloudinary URL is previewed before upload.
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Vista previa de la imagen" className="size-16 rounded-md object-cover" src={imagePreview} />
        ) : <div className="flex size-16 items-center justify-center rounded-md bg-muted text-muted-foreground"><ImageIcon aria-hidden="true" className="size-5" /></div>}
        <input accept="image/jpeg,image/png,image/webp" className="block text-sm" id="product-image" onChange={onChange} type="file" />
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Máximo 5 MB.</p>
      {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
    </div>
  );
}

function DialogActions({ isSubmitting, onClose, onSubmit, submitLabel }: { isSubmitting: boolean; onClose: () => void; onSubmit?: () => void; submitLabel: string }) {
  return <div className="flex justify-end gap-3 pt-2"><Button disabled={isSubmitting} onClick={onClose} type="button" variant="outline">Cancelar</Button><Button disabled={isSubmitting} onClick={onSubmit} type={onSubmit ? "button" : "submit"}>{isSubmitting ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Guardando...</> : submitLabel}</Button></div>;
}