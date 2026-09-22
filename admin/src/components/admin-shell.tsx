"use client";

import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState, useSyncExternalStore } from "react";

import {
  clearAuthToken,
  getAuthToken,
  subscribeToAuthToken,
} from "@/lib/auth-token";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/products", icon: Package, label: "Productos" },
  { href: "/categories", icon: Tags, label: "Categorías" },
  { href: "/orders", icon: ClipboardList, label: "Pedidos" },
  { href: "/users", icon: Users, label: "Usuarios" },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAuthToken();
    router.push("/login");
  }

  return (
    <>
      <div className="flex h-16 items-center border-b px-6">
        <Link className="font-semibold tracking-tight" href="/" onClick={onNavigate}>
          NG Admin
        </Link>
      </div>
      <nav aria-label="Navegación principal" className="flex-1 space-y-1 p-4">
        {navigationItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              href={href}
              key={href}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={handleLogout}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const authToken = useSyncExternalStore(
    subscribeToAuthToken,
    getAuthToken,
    () => undefined,
  );

  useEffect(() => {
    if (authToken === undefined) {
      return;
    }

    if (pathname === "/login") {
      if (authToken) {
        router.replace("/");
      }
    } else if (!authToken) {
      router.replace("/login");
    }
  }, [authToken, pathname, router]);

  if (authToken === undefined || (pathname === "/login" ? Boolean(authToken) : !authToken)) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted/40 p-6 text-sm text-muted-foreground">
        Verificando sesión...
      </main>
    );
  }

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="min-h-svh bg-muted/40 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden min-h-svh flex-col border-r bg-background lg:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-16 items-center border-b bg-background px-4 lg:hidden">
          <button
            aria-expanded={isMobileMenuOpen}
            aria-label="Abrir menú"
            className="rounded-md p-2 hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
          <span className="ml-3 font-semibold">NG Admin</span>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />
          <aside className="relative flex h-full w-72 flex-col bg-background shadow-xl">
            <button
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 rounded-md p-2 hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
              type="button"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}