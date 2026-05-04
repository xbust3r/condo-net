"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { LangSwitcher } from "@/components/i18n/lang-switcher";

export interface TabConfig {
  id: string;
  key: string;
  icon: LucideIcon;
  path: string;
}

// ── Default admin tabs ──────────────────────────────────────────────────

const ADMIN_TABS: Omit<TabConfig, "key">[] = [
  { id: "dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "residents",  icon: Users,        path: "/dashboard/residents" },
  { id: "units",      icon: Home,         path: "/dashboard/units" },
  { id: "payments",   icon: CreditCard,   path: "/dashboard/payments" },
  { id: "receipts",   icon: Receipt,      path: "/dashboard/payment-proofs" },
  { id: "towers",     icon: Building2,    path: "/dashboard/towers" },
];

const RESIDENT_TABS: Omit<TabConfig, "key">[] = [
  { id: "dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "payments",  icon: CreditCard,      path: "/dashboard/payments" },
  { id: "proofs",    icon: Receipt,          path: "/dashboard/payment-proofs" },
  { id: "amenities", icon: CalendarRange,   path: "/dashboard/amenities" },
  { id: "receipts",  icon: Receipt,         path: "/dashboard/receipts" },
  { id: "profile",   icon: User,            path: "/dashboard/profile" },
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
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  const baseTabs = tabs ?? (role === "resident" ? RESIDENT_TABS : ADMIN_TABS);
  const activeTabs: TabConfig[] = baseTabs.map((tab) => ({
    ...tab,
    key: tab.id,
  }));

  // Determine active tab: match the tab whose path is a prefix of current pathname
  const activeId =
    activeTabs.findLast((tab) => pathname.startsWith(tab.path))?.id ?? "dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar with LangSwitcher */}
      <div className="sticky top-0 z-40 flex items-center justify-end px-4 py-2 bg-background/95 backdrop-blur border-b">
        <LangSwitcher />
      </div>

      {/* Main content area */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom"
        role="navigation"
        aria-label={t("dashboard")}
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
                  {t(tab.id)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
