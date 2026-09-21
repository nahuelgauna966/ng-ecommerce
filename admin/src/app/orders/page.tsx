"use client";

import { Eye, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

interface OrderSummary {
  id: number;
  status: string;
  total: number | string;
  createdAt: string;
  user: { id: number; name: string; email: string } | null;
  payment: { status: string; method: string } | null;
}

interface OrderDetail extends OrderSummary {
  orderDetails: Array<{
    id: number;
    quantity: number;
    unitPrice: number | string;
    product: { id: number; name: string } | null;
  }>;
}

interface PaginatedOrders {
  data: OrderSummary[];
  total: number;
  page: number;
  limit: number;
  todayOrders: number;
  todayRevenue: number;
}

const ORDERS_PER_PAGE = 10;
const statusLabels: Record<string, string> = {
  cancelled: "Cancelado",
  confirmed: "Confirmado",
  delivered: "Entregado",
  pending: "Pendiente",
  shipped: "Enviado",
};
const paymentLabels: Record<string, string> = {
  completed: "Pagado",
  failed: "Fallido",
  pending: "Pendiente",
  refunded: "Reintegrado",
};

function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat("es-AR", { currency: "ARS", style: "currency" }).format(Number(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusVariant(status: string): "default" | "outline" | "secondary" {
  return status === "cancelled" ? "outline" : status === "pending" ? "secondary" : "default";
}

export default function OrdersPage() {
  const [data, setData] = useState<PaginatedOrders | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [status, setStatus] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await api.get<PaginatedOrders>("/orders", {
          params: {
            from: from || undefined,
            limit: ORDERS_PER_PAGE,
            page,
            search: debouncedSearch || undefined,
            status: status || undefined,
            to: to || undefined,
          },
        });
        if (isMounted) setData(response.data);
      } catch {
        if (isMounted) setErrorMessage("No se pudieron cargar los pedidos. Intentá nuevamente.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadOrders();
    return () => { isMounted = false; };
  }, [debouncedSearch, from, page, status, to]);

  async function openOrderDetail(orderId: number) {
    setIsLoadingDetail(true);
    setErrorMessage(null);
    try {
      const { data: order } = await api.get<OrderDetail>(`/orders/${orderId}`);
      setSelectedOrder(order);
    } catch {
      setErrorMessage("No se pudo cargar el detalle del pedido.");
    } finally {
      setIsLoadingDetail(false);
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / ORDERS_PER_PAGE)), [data?.total]);

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div><h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1><p className="mt-1 text-sm text-muted-foreground">Consultá y administrá los pedidos recibidos.</p></div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Pedidos de hoy" value={String(data?.todayOrders ?? 0)} />
        <MetricCard label="Total facturado hoy" value={formatCurrency(data?.todayRevenue ?? 0)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative xl:col-span-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="flex h-9 w-full rounded-lg border bg-background py-1 pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por ID o email..." type="search" value={search} /></div>
        <select aria-label="Filtrar por estado" className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <div className="grid grid-cols-2 gap-3"><input aria-label="Desde" className="h-9 rounded-lg border bg-background px-3 text-sm" onChange={(event) => { setFrom(event.target.value); setPage(1); }} type="date" value={from} /><input aria-label="Hasta" className="h-9 rounded-lg border bg-background px-3 text-sm" onChange={(event) => { setTo(event.target.value); setPage(1); }} type="date" value={to} /></div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead>Total</TableHead><TableHead>Estado</TableHead><TableHead>Pago</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
        {isLoading ? <EmptyRow text="Cargando pedidos..." /> : null}
        {errorMessage ? <EmptyRow destructive text={errorMessage} /> : null}
        {!isLoading && !errorMessage && data?.data.length === 0 ? <EmptyRow text="No hay pedidos para los filtros seleccionados." /> : null}
        {!isLoading && !errorMessage ? data?.data.map((order) => <TableRow className="cursor-pointer" key={order.id} onClick={() => void openOrderDetail(order.id)}><TableCell className="font-medium">#{order.id}</TableCell><TableCell><div>{order.user?.name ?? "Cliente eliminado"}</div><div className="text-xs text-muted-foreground">{order.user?.email ?? "Sin email"}</div></TableCell><TableCell>{formatDate(order.createdAt)}</TableCell><TableCell>{formatCurrency(order.total)}</TableCell><TableCell><Badge variant={statusVariant(order.status)}>{statusLabels[order.status] ?? order.status}</Badge></TableCell><TableCell><Badge variant={order.payment?.status === "completed" ? "default" : "secondary"}>{order.payment ? paymentLabels[order.payment.status] ?? order.payment.status : "Sin pago"}</Badge></TableCell><TableCell className="text-right"><Button aria-label={`Ver pedido ${order.id}`} onClick={(event) => { event.stopPropagation(); void openOrderDetail(order.id); }} size="icon-sm" variant="ghost"><Eye aria-hidden="true" /></Button></TableCell></TableRow>) : null}
      </TableBody></Table></div>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>{data?.total ?? 0} pedido{data?.total === 1 ? "" : "s"} en total</p><div className="flex items-center gap-3"><Button disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} variant="outline">Anterior</Button><span>Página {data?.page ?? page} de {totalPages}</span><Button disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)} variant="outline">Siguiente</Button></div></div>

      {isLoadingDetail ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20"><div className="rounded-xl border bg-card p-6 text-sm">Cargando detalle...</div></div> : null}
      {selectedOrder ? <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function EmptyRow({ destructive = false, text }: { destructive?: boolean; text: string }) { return <TableRow><TableCell className={`py-10 text-center ${destructive ? "text-destructive" : "text-muted-foreground"}`} colSpan={7}>{text}</TableCell></TableRow>; }

function OrderDetailDialog({ onClose, order }: { onClose: () => void; order: OrderDetail }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4"><section aria-labelledby="order-detail-title" aria-modal="true" className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-xl border bg-card p-6 shadow-lg" role="dialog"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold" id="order-detail-title">Pedido #{order.id}</h2><p className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt)}</p></div><Button aria-label="Cerrar" onClick={onClose} size="icon-sm" variant="ghost"><X aria-hidden="true" /></Button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Detail label="Cliente" value={`${order.user?.name ?? "Cliente eliminado"} · ${order.user?.email ?? "Sin email"}`} /><Detail label="Pago" value={order.payment ? `${paymentLabels[order.payment.status] ?? order.payment.status} · ${order.payment.method}` : "Sin pago"} /></div><div className="mt-6"><h3 className="font-medium">Productos</h3><div className="mt-3 divide-y rounded-lg border">{order.orderDetails.map((item) => <div className="flex items-center justify-between gap-4 p-3 text-sm" key={item.id}><span>{item.product?.name ?? "Producto eliminado"} × {item.quantity}</span><span className="font-medium">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span></div>)}</div></div><div className="mt-6 flex items-center justify-between border-t pt-4"><Badge variant={statusVariant(order.status)}>{statusLabels[order.status] ?? order.status}</Badge><span className="text-lg font-semibold">{formatCurrency(order.total)}</span></div></section></div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }