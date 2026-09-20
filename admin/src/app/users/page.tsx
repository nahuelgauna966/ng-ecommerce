"use client";

import { Eye, Search, Shield, UserRoundCheck, UserRoundX, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
  isActive: boolean;
  createdAt: string;
  orderCount?: number;
}

interface UserDetail extends AdminUser {
  orders: Array<{ id: number; createdAt: string; status: string; total: number | string }>;
}

interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

const USERS_PER_PAGE = 10;

function formatDate(value: string) { return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value)); }
function formatCurrency(value: number | string) { return new Intl.NumberFormat("es-AR", { currency: "ARS", style: "currency" }).format(Number(value)); }
function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    return Array.isArray(message) ? message.join(", ") : message ?? "No se pudo actualizar el usuario.";
  }
  return "No se pudo actualizar el usuario. Intentá nuevamente.";
}

export default function UsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: "activation" | "role"; user: AdminUser } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      setIsLoading(true); setErrorMessage(null);
      try {
        const response = await api.get<PaginatedUsers>("/users", { params: { limit: USERS_PER_PAGE, page, role: role || undefined, search: debouncedSearch || undefined } });
        if (isMounted) setData(response.data);
      } catch {
        if (isMounted) setErrorMessage("No se pudieron cargar los usuarios. Intentá nuevamente.");
      } finally { if (isMounted) setIsLoading(false); }
    }
    void loadUsers();
    return () => { isMounted = false; };
  }, [debouncedSearch, page, role]);

  async function openUserDetail(userId: number) {
    setIsLoadingDetail(true); setErrorMessage(null);
    try { const { data: user } = await api.get<UserDetail>(`/users/${userId}`); setSelectedUser(user); }
    catch { setErrorMessage("No se pudo cargar el detalle del usuario."); }
    finally { setIsLoadingDetail(false); }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    const update: Partial<Pick<AdminUser, "isActive" | "role">> = type === "role"
      ? { role: user.role === "admin" ? "customer" : "admin" }
      : { isActive: !user.isActive };
    setIsUpdating(true); setToastMessage(null);
    try {
      await api.patch(`/users/${user.id}`, update);
      setData((current) => current ? { ...current, data: current.data.map((item) => item.id === user.id ? { ...item, ...update } : item) } : current);
      setSelectedUser((current) => current?.id === user.id ? { ...current, ...update } : current);
      setPendingAction(null);
      setToastMessage({ message: type === "role" ? "Rol actualizado correctamente." : update.isActive ? "Usuario reactivado correctamente." : "Usuario desactivado correctamente.", type: "success" });
    } catch (error) { setToastMessage({ message: getErrorMessage(error), type: "error" }); }
    finally { setIsUpdating(false); }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / USERS_PER_PAGE)), [data?.total]);
  const actionTitle = pendingAction?.type === "role" ? "¿Cambiar rol de usuario?" : pendingAction?.user.isActive ? "¿Desactivar usuario?" : "¿Reactivar usuario?";
  const actionDescription = pendingAction?.type === "role" ? `El usuario ${pendingAction.user.name} pasará a ser ${pendingAction.user.role === "admin" ? "cliente" : "administrador"}.` : pendingAction?.user.isActive ? `El usuario ${pendingAction.user.name} no podrá iniciar sesión hasta ser reactivado.` : `El usuario ${pendingAction?.user.name} podrá volver a iniciar sesión.`;

  return <section className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div><h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1><p className="mt-1 text-sm text-muted-foreground">Administrá los usuarios registrados y sus permisos.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="flex h-9 w-full rounded-lg border bg-background py-1 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o email..." type="search" value={search} /></div><select aria-label="Filtrar por rol" className="h-9 rounded-lg border bg-background px-3 text-sm" onChange={(event) => { setRole(event.target.value); setPage(1); }} value={role}><option value="">Todos los roles</option><option value="customer">Clientes</option><option value="admin">Administradores</option></select></div>
    <div className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead><TableHead>Registro</TableHead><TableHead>N° pedidos</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
      {isLoading ? <EmptyRow text="Cargando usuarios..." /> : null}{errorMessage ? <EmptyRow destructive text={errorMessage} /> : null}{!isLoading && !errorMessage && data?.data.length === 0 ? <EmptyRow text="No hay usuarios para los filtros seleccionados." /> : null}
      {!isLoading && !errorMessage ? data?.data.map((user) => <TableRow key={user.id}><TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell><Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "Administrador" : "Cliente"}</Badge></TableCell><TableCell>{formatDate(user.createdAt)}</TableCell><TableCell>{user.orderCount ?? 0}</TableCell><TableCell><Badge variant={user.isActive ? "default" : "outline"}>{user.isActive ? "Activo" : "Inactivo"}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button aria-label={`Ver ${user.name}`} onClick={() => void openUserDetail(user.id)} size="icon-sm" variant="ghost"><Eye aria-hidden="true" /></Button><Button aria-label={`Cambiar rol de ${user.name}`} onClick={() => setPendingAction({ type: "role", user })} size="icon-sm" variant="ghost"><Shield aria-hidden="true" /></Button><Button aria-label={`${user.isActive ? "Desactivar" : "Reactivar"} ${user.name}`} onClick={() => setPendingAction({ type: "activation", user })} size="icon-sm" variant="ghost">{user.isActive ? <UserRoundX aria-hidden="true" className="text-destructive" /> : <UserRoundCheck aria-hidden="true" />}</Button></div></TableCell></TableRow>) : null}
    </TableBody></Table></div>
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>{data?.total ?? 0} usuario{data?.total === 1 ? "" : "s"} en total</p><div className="flex items-center gap-3"><Button disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} variant="outline">Anterior</Button><span>Página {data?.page ?? page} de {totalPages}</span><Button disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)} variant="outline">Siguiente</Button></div></div>
    {isLoadingDetail ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20"><div className="rounded-xl border bg-card p-6 text-sm">Cargando detalle...</div></div> : null}
    {selectedUser ? <UserDetailDialog onClose={() => setSelectedUser(null)} user={selectedUser} /> : null}
    <AlertDialog open={Boolean(pendingAction)} onOpenChange={(isOpen) => { if (!isOpen && !isUpdating) setPendingAction(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{actionTitle}</AlertDialogTitle><AlertDialogDescription>{actionDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={isUpdating} onClick={(event) => { event.preventDefault(); void confirmAction(); }}>{isUpdating ? "Guardando..." : "Confirmar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    {toastMessage ? <div className={`fixed right-4 bottom-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border bg-card p-4 text-sm shadow-lg ${toastMessage.type === "error" ? "text-destructive" : "text-emerald-600"}`} role="status"><span>{toastMessage.message}</span><Button aria-label="Cerrar mensaje" onClick={() => setToastMessage(null)} size="icon-xs" variant="ghost">×</Button></div> : null}
  </section>;
}

function EmptyRow({ destructive = false, text }: { destructive?: boolean; text: string }) { return <TableRow><TableCell className={`py-10 text-center ${destructive ? "text-destructive" : "text-muted-foreground"}`} colSpan={7}>{text}</TableCell></TableRow>; }
function UserDetailDialog({ onClose, user }: { onClose: () => void; user: UserDetail }) { const totalSpent = user.orders.reduce((total, order) => total + (order.status === "cancelled" ? 0 : Number(order.total)), 0); return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4"><section aria-labelledby="user-detail-title" aria-modal="true" className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-xl border bg-card p-6 shadow-lg" role="dialog"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold" id="user-detail-title">{user.name}</h2><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></div><Button aria-label="Cerrar" onClick={onClose} size="icon-sm" variant="ghost"><X aria-hidden="true" /></Button></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><Detail label="Rol" value={user.role === "admin" ? "Administrador" : "Cliente"} /><Detail label="Registro" value={formatDate(user.createdAt)} /><Detail label="Total gastado" value={formatCurrency(totalSpent)} /></div><div className="mt-6"><h3 className="font-medium">Últimos pedidos</h3><div className="mt-3 divide-y rounded-lg border">{user.orders.slice(0, 5).map((order) => <div className="flex items-center justify-between gap-4 p-3 text-sm" key={order.id}><span>Pedido #{order.id} · {formatDate(order.createdAt)}</span><span className="font-medium">{formatCurrency(order.total)}</span></div>)}{user.orders.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Todavía no realizó pedidos.</p> : null}</div></div></section></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }