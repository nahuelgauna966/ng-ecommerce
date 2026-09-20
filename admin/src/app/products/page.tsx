"use client";

import { ImageIcon, Pencil, Plus, Search } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  type AdminProduct,
  type ProductCategory,
  type ProductDialogMode,
  ProductFormDialog,
} from "@/components/product-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";

interface PaginatedProducts {
  data: AdminProduct[];
  total: number;
  page: number;
  limit: number;
}

const PRODUCTS_PER_PAGE = 10;

function formatCurrency(price: number | string): string {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    style: "currency",
  }).format(Number(price));
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [activeDialog, setActiveDialog] = useState<{
    mode: ProductDialogMode;
    product?: AdminProduct;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const { data } = await api.get<ProductCategory[]>("/categories");
        if (isMounted) {
          setCategories(data);
        }
      } catch {
        // The products list remains usable if category loading fails.
      }
    }

    void loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data } = await api.get<PaginatedProducts>("/products", {
          params: {
            categoryId: categoryId || undefined,
            limit: PRODUCTS_PER_PAGE,
            page,
            search: debouncedSearch || undefined,
          },
        });
        if (isMounted) {
          setProducts(data);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("No se pudieron cargar los productos. Intentá nuevamente.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, [categoryId, debouncedSearch, page, refreshKey]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((products?.total ?? 0) / PRODUCTS_PER_PAGE)),
    [products?.total],
  );

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrá el catálogo de productos.
          </p>
        </div>
        <Button onClick={() => setActiveDialog({ mode: "create" })}>
          <Plus aria-hidden="true" />
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="flex h-9 w-full rounded-lg border bg-background py-1 pr-3 pl-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre..."
            type="search"
            value={search}
          />
        </div>
        <select
          aria-label="Filtrar por categoría"
          className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
          value={categoryId}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                  Cargando productos...
                </TableCell>
              </TableRow>
            ) : null}
            {errorMessage ? (
              <TableRow>
                <TableCell className="py-10 text-center text-destructive" colSpan={6}>
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !errorMessage && products?.data.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                  No hay productos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !errorMessage
              ? products?.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <Image
                          alt=""
                          className="size-10 rounded-md object-cover"
                          height={40}
                          unoptimized
                          src={product.imageUrl}
                          width={40}
                        />
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <ImageIcon aria-hidden="true" className="size-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category?.name ?? "Sin categoría"}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.stock?.quantity ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button aria-label={`Editar ${product.name}`} onClick={() => setActiveDialog({ mode: "edit", product })} size="icon-sm" variant="ghost">
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button aria-label={`Actualizar imagen de ${product.name}`} onClick={() => setActiveDialog({ mode: "image", product })} size="icon-sm" variant="ghost">
                          <ImageIcon aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {products?.total ?? 0} producto{products?.total === 1 ? "" : "s"} en total
        </p>
        <div className="flex items-center gap-3">
          <Button disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} variant="outline">
            Anterior
          </Button>
          <span>
            Página {products?.page ?? page} de {totalPages}
          </span>
          <Button disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)} variant="outline">
            Siguiente
          </Button>
        </div>
      </div>

      {activeDialog ? (
        <ProductFormDialog
          categories={categories}
          mode={activeDialog.mode}
          onClose={() => setActiveDialog(null)}
          onSaved={() => setRefreshKey((current) => current + 1)}
          product={activeDialog.product}
        />
      ) : null}
    </section>
  );
}