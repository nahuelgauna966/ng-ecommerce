"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, LoaderCircle, X } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  brand?: string | null;
  componentType?: ComponentType | null;
  hardwareSpecs?: Record<string, string | number | string[]> | null;
  isFeatured?: boolean;
}

type ComponentType =
  | "cpu"
  | "gpu"
  | "motherboard"
  | "ram"
  | "psu"
  | "storage"
  | "case"
  | "cooler"
  | "peripheral"
  | "other";

const componentOptions: { value: ComponentType; label: string }[] = [
  { value: "cpu", label: "Procesador (CPU)" },
  { value: "gpu", label: "Placa de video (GPU)" },
  { value: "motherboard", label: "Motherboard" },
  { value: "ram", label: "Memoria RAM" },
  { value: "psu", label: "Fuente (PSU)" },
  { value: "storage", label: "Almacenamiento" },
  { value: "case", label: "Gabinete" },
  { value: "cooler", label: "Refrigeración" },
  { value: "peripheral", label: "Periférico" },
  { value: "other", label: "Otro" },
];

const hardwareFields: Record<
  ComponentType,
  { key: string; label: string; kind: "text" | "number" | "list" }[]
> = {
  cpu: [
    { key: "socket", label: "Socket", kind: "text" },
    { key: "powerDrawWatts", label: "Consumo estimado (W)", kind: "number" },
    { key: "supportedCpuModels", label: "Modelos de CPU admitidos (separados por coma)", kind: "list" },
  ],
  gpu: [
    { key: "powerDrawWatts", label: "Consumo estimado (W)", kind: "number" },
    { key: "lengthMm", label: "Largo (mm)", kind: "number" },
    { key: "powerConnectors", label: "Conectores de alimentación (separados por coma)", kind: "list" },
  ],
  motherboard: [
    { key: "socket", label: "Socket", kind: "text" },
    { key: "memoryType", label: "Tipo de memoria (DDR4, DDR5...)", kind: "text" },
    { key: "maxMemoryGb", label: "Memoria máxima (GB)", kind: "number" },
    { key: "formFactor", label: "Formato (ATX, Micro-ATX...)", kind: "text" },
    { key: "supportedCpuModels", label: "Modelos de CPU admitidos (separados por coma)", kind: "list" },
  ],
  ram: [
    { key: "memoryType", label: "Tipo de memoria (DDR4, DDR5...)", kind: "text" },
    { key: "capacityGb", label: "Capacidad total (GB)", kind: "number" },
    { key: "speedMhz", label: "Velocidad (MHz)", kind: "number" },
    { key: "moduleCount", label: "Cantidad de módulos", kind: "number" },
  ],
  psu: [
    { key: "wattage", label: "Potencia (W)", kind: "number" },
    { key: "connectors", label: "Conectores disponibles (separados por coma)", kind: "list" },
  ],
  storage: [
    { key: "interface", label: "Interfaz (NVMe, SATA...)", kind: "text" },
    { key: "capacityGb", label: "Capacidad (GB)", kind: "number" },
  ],
  case: [
    { key: "supportedFormFactors", label: "Formatos admitidos (separados por coma)", kind: "list" },
    { key: "maxGpuLengthMm", label: "Largo máximo de GPU (mm)", kind: "number" },
  ],
  cooler: [
    { key: "sockets", label: "Sockets admitidos (separados por coma)", kind: "list" },
    { key: "maxTdpWatts", label: "TDP máximo (W)", kind: "number" },
    { key: "heightMm", label: "Altura (mm)", kind: "number" },
  ],
  peripheral: [],
  other: [],
};

const productSchema = z.object({
  brand: z.string().max(100, "La marca no puede superar 100 caracteres."),
  categoryId: z.number().int().positive("Seleccioná una categoría."),
  componentType: z.union([z.enum(componentOptions.map((option) => option.value) as [ComponentType, ...ComponentType[]]), z.literal("")]),
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  hardwareValues: z.record(z.string(), z.string()),
  isFeatured: z.boolean(),
  initialStock: z.number().int().min(0, "El stock no puede ser negativo."),
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  price: z.number().positive("El precio debe ser mayor a cero."),
});

type ProductFormValues = z.infer<typeof productSchema>;
export type ProductDialogMode = "create" | "edit" | "image";

function getProductPayload(values: ProductFormValues) {
  const componentType = values.componentType || null;
  const specs: Record<string, string | number | string[]> = {};
  if (componentType) {
    for (const { key, kind } of hardwareFields[componentType]) {
      const value = values.hardwareValues[key]?.trim();
      if (!value) {
        continue;
      }
      if (kind === "number") {
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) {
          specs[key] = numericValue;
        }
      } else if (kind === "list") {
        specs[key] = value.split(",").map((item) => item.trim()).filter(Boolean);
      } else {
        specs[key] = value;
      }
    }
  }

  return {
    name: values.name,
    description: values.description,
    price: values.price,
    categoryId: values.categoryId,
    initialStock: values.initialStock,
    brand: values.brand.trim() || null,
    componentType,
    hardwareSpecs: Object.keys(specs).length > 0 ? specs : null,
    isFeatured: values.isFeatured,
  };
}

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
      brand: product?.brand ?? "",
      componentType: product?.componentType ?? "",
      description: product?.description ?? "",
      hardwareValues: Object.fromEntries(
        Object.entries(product?.hardwareSpecs ?? {}).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(", ") : String(value),
        ]),
      ),
      isFeatured: product?.isFeatured ?? false,
      initialStock: product?.stock?.quantity ?? 0,
      name: product?.name ?? "",
      price: Number(product?.price ?? 0),
    },
    resolver: zodResolver(productSchema),
  });
  const selectedComponentType = useWatch({ control: form.control, name: "componentType" });

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
        const { data: createdProduct } = await api.post<AdminProduct>("/products", getProductPayload(values));
        await uploadImage(createdProduct.id);
      } else if (product) {
        const payload = getProductPayload(values);
        const fieldsToUpdate: Record<string, unknown> = {};
        const dirtyFields = form.formState.dirtyFields;
        for (const field of ["name", "description", "price", "categoryId", "initialStock"] as const) {
          if (dirtyFields[field]) {
            fieldsToUpdate[field] = values[field];
          }
        }
        if (dirtyFields.brand) fieldsToUpdate.brand = payload.brand;
        if (dirtyFields.componentType) fieldsToUpdate.componentType = payload.componentType;
        if (dirtyFields.isFeatured) fieldsToUpdate.isFeatured = payload.isFeatured;
        if (dirtyFields.hardwareValues || dirtyFields.componentType) {
          fieldsToUpdate.hardwareSpecs = payload.hardwareSpecs;
        }

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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Marca">
                <input className={inputClassName} disabled={isSubmitting} placeholder="Ej.: AMD, ASUS" {...form.register("brand")} />
              </FormField>
              <FormField label="Tipo de componente">
                <select
                  className={inputClassName}
                  disabled={isSubmitting}
                  {...form.register("componentType", {
                    onChange: () => form.setValue("hardwareValues", {}, { shouldDirty: true }),
                  })}
                >
                  <option value="">Producto general (sin especificaciones)</option>
                  {componentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </FormField>
            </div>
            {selectedComponentType ? (
              <fieldset className="space-y-4 rounded-lg border p-4">
                <legend className="px-1 text-sm font-medium">Especificaciones técnicas</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {hardwareFields[selectedComponentType as ComponentType].map((field) => (
                    <FormField key={field.key} label={field.label}>
                      <input
                        className={inputClassName}
                        disabled={isSubmitting}
                        inputMode={field.kind === "number" ? "decimal" : "text"}
                        placeholder={field.kind === "list" ? "Separá los valores con comas" : undefined}
                        type={field.kind === "number" ? "number" : "text"}
                        {...form.register(`hardwareValues.${field.key}` as const)}
                      />
                    </FormField>
                  ))}
                </div>
                {hardwareFields[selectedComponentType as ComponentType].length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este tipo de producto no requiere especificaciones para el armador.</p>
                ) : null}
              </fieldset>
            ) : null}
            <label className="flex items-center gap-2 text-sm font-medium">
              <input className="size-4 accent-primary" disabled={isSubmitting} type="checkbox" {...form.register("isFeatured")} />
              Mostrar como producto destacado
            </label>
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