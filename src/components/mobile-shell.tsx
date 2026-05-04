"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Home,
  CreditCard,
  Building2,
  LayoutDashboard,
  Bell,
  CalendarRange,
  MessageSquareWarning,
  User,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

// ── Default admin tabs ──────────────────────────────────────────────────

const ADMIN_TABS: TabConfig[] = [
  { id: "dashboard", label: "Inicio",   icon: LayoutDashboard, path: "/dashboard" },
  { id: "residents",  label: "Residentes", icon: Users,        path: "/dashboard/residents" },
  { id: "units",      label: "Unidades",   icon: Home,         path: "/dashboard/units" },
  { id: "payments",   label: "Pagos",      icon: CreditCard,   path: "/dashboard/payments" },
  { id: "receipts",   label: "Comprob.",   icon: Receipt,      path: "/dashboard/payment-proofs" },
  { id: "towers",     label: "Torres",     icon: Building2,    path: "/dashboard/towers" },
];

const RESIDENT_TABS: TabConfig[] = [
  { id: "dashboard", label: "Inicio",    icon: LayoutDashboard, path: "/dashboard" },
  { id: "payments",  label: "Pagos",     icon: CreditCard,      path: "/dashboard/payments" },
  { id: "proofs",    label: "Comprob.",  icon: Receipt,          path: "/dashboard/payment-proofs" },
  { id: "amenities", label: "Áreas",     icon: CalendarRange,   path: "/dashboard/amenities" },
  { id: "receipts",  label: "Recibos",   icon: Receipt,         path: "/dashboard/receipts" },
  { id: "profile",   label: "Perfil",    icon: User,            path: "/dashboard/profile" },
];

// ── Component ───────────────────────────────────────────────────────────

export function MobileShell({
  children,
  tabs,
  role = "admin",
}: {
  children: React.ReactNode;
  tabs?: TabConfig[];
  role?: "admin" | "resident";
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTabs = tabs ?? (role === "resident" ? RESIDENT_TABS : ADMIN_TABS);

  // Determine active tab: match the tab whose path is a prefix of current pathname,
  // preferring the most specific match
  const activeId =
    activeTabs.findLast((t) => pathname.startsWith(t.path))?.id ?? "dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main content area */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom"
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {activeTabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-1 rounded-lg transition-colors",
                  "active:scale-95 touch-manipulation",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
                    isActive && "bg-primary/10"
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
