"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminCategory, CategoryFormDialog } from "@/components/category-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message ?? "No se pudo eliminar la categoría.";
  }
  return "No se pudo eliminar la categoría. Intentá nuevamente.";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [dialogCategory, setDialogCategory] = useState<AdminCategory | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const { data } = await api.get<AdminCategory[]>("/categories");
        if (isMounted) setCategories(data);
      } catch {
        if (isMounted) setErrorMessage("No se pudieron cargar las categorías. Intentá nuevamente.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadCategories();
    return () => { isMounted = false; };
  }, [refreshKey]);

  function openCreateDialog() {
    setDialogCategory(undefined);
    setIsFormOpen(true);
  }

  function openEditDialog(category: AdminCategory) {
    setDialogCategory(category);
    setIsFormOpen(true);
  }

  async function handleDelete() {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setToastMessage(null);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      setCategories((current) => current.filter((category) => category.id !== categoryToDelete.id));
      setCategoryToDelete(null);
      setToastMessage({ message: "Categoría eliminada correctamente.", type: "success" });
    } catch (error) {
      setToastMessage({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-semibold tracking-tight">Categorías</h1><p className="mt-1 text-sm text-muted-foreground">Organizá el catálogo de productos.</p></div>
        <Button onClick={openCreateDialog}><Plus aria-hidden="true" />Nueva categoría</Button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Descripción</TableHead><TableHead>N° de productos</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell className="py-10 text-center text-muted-foreground" colSpan={4}>Cargando categorías...</TableCell></TableRow> : null}
            {errorMessage ? <TableRow><TableCell className="py-10 text-center text-destructive" colSpan={4}>{errorMessage}</TableCell></TableRow> : null}
            {!isLoading && !errorMessage && categories.length === 0 ? <TableRow><TableCell className="py-10 text-center text-muted-foreground" colSpan={4}>Todavía no hay categorías.</TableCell></TableRow> : null}
            {!isLoading && !errorMessage ? categories.map((category) => <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="max-w-md text-muted-foreground">{category.description || "Sin descripción"}</TableCell>
              <TableCell><Badge variant="secondary">{category.products?.length ?? 0}</Badge></TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button aria-label={`Editar ${category.name}`} onClick={() => openEditDialog(category)} size="icon-sm" variant="ghost"><Pencil aria-hidden="true" /></Button><Button aria-label={`Eliminar ${category.name}`} onClick={() => setCategoryToDelete(category)} size="icon-sm" variant="ghost"><Trash2 aria-hidden="true" className="text-destructive" /></Button></div></TableCell>
            </TableRow>) : null}
          </TableBody>
        </Table>
      </div>

      {isFormOpen ? <CategoryFormDialog category={dialogCategory} onClose={() => setIsFormOpen(false)} onSaved={() => { setRefreshKey((current) => current + 1); setToastMessage({ message: dialogCategory ? "Categoría actualizada correctamente." : "Categoría creada correctamente.", type: "success" }); }} /> : null}

      <AlertDialog open={Boolean(categoryToDelete)} onOpenChange={(isOpen) => { if (!isOpen && !isDeleting) setCategoryToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. La categoría &quot;{categoryToDelete?.name}&quot; será eliminada permanentemente.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={isDeleting} onClick={(event) => { event.preventDefault(); void handleDelete(); }}>{isDeleting ? "Eliminando..." : "Eliminar"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toastMessage ? <div className={`fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border bg-card p-4 text-sm shadow-lg ${toastMessage.type === "error" ? "text-destructive" : "text-emerald-600"}`} role="status"><span>{toastMessage.message}</span><Button aria-label="Cerrar mensaje" onClick={() => setToastMessage(null)} size="icon-xs" variant="ghost">×</Button></div> : null}
    </section>
  );
}