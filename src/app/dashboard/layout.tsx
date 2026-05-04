"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Building2, ArrowLeft } from "lucide-react";

function resolveRole(
  rolesByCondo?: Record<number, Array<{ id: number; role?: string; name?: string }>>,
  condoId?: number | null
): "admin" | "resident" {
  if (!rolesByCondo || !condoId) return "resident";
  const roles = rolesByCondo[condoId];
  if (!roles || roles.length === 0) return "resident";
  const names = roles.map((r) => (r.role ?? r.name ?? "").toLowerCase());
  if (names.some((n) => n.includes("admin") || n.includes("super"))) {
    return "admin";
  }
  return "resident";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, selectedCondominium, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !selectedCondominium?.id) {
      router.replace("/select-condo");
    }
  }, [selectedCondominium, isLoading, router]);

  if (isLoading || !selectedCondominium?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDashboard = pathname === "/dashboard";

  const userRole = resolveRole(user?.roles_by_condominium, selectedCondominium?.id);

  return (
    <MobileShell role={userRole}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/80 px-4 py-2.5 backdrop-blur-sm safe-area-top">
        {/* Back button on sub-pages */}
        {!isDashboard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 w-8 p-0 -ml-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Building2 className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-sm text-foreground truncate">
            {selectedCondominium.name}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground h-8 w-8 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {children}
    </MobileShell>
  );
}
