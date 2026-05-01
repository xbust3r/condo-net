"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  Home,
  CreditCard,
  Building2,
  ChevronRight,
} from "lucide-react";

const quickLinks = [
  { label: "Residentes", icon: Users, color: "text-chart-1", bg: "bg-chart-1/10", path: "/dashboard/residents" },
  { label: "Unidades", icon: Home, color: "text-chart-2", bg: "bg-chart-2/10", path: "/dashboard/units" },
  { label: "Pagos", icon: CreditCard, color: "text-chart-3", bg: "bg-chart-3/10", path: "/dashboard/payments" },
  { label: "Torres", icon: Building2, color: "text-chart-4", bg: "bg-chart-4/10", path: "/dashboard/towers" },
];

export default function DashboardPage() {
  const { user, selectedCondominium, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !selectedCondominium) {
      router.replace("/select-condo");
    }
  }, [selectedCondominium, isLoading, router]);

  if (isLoading || !selectedCondominium) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Welcome */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          ¡Hola{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {selectedCondominium.code && `${selectedCondominium.code} · `}
          {[selectedCondominium.city, selectedCondominium.country]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      {/* Quick access menu */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
        Acceso rápido
      </p>
      <div className="flex flex-col gap-1 mb-6">
        {quickLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => router.push(link.path)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation active:scale-[0.98]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${link.bg} ${link.color}`}>
              <link.icon className="h-5 w-5" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-foreground">
              {link.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
        ))}
      </div>

      {/* Condo info card */}
      <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Condominio
            </span>
          </div>
          <h3 className="font-bold text-foreground">{selectedCondominium.name}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {selectedCondominium.code && (
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">Código</p>
                <p className="text-sm font-medium text-foreground">{selectedCondominium.code}</p>
              </div>
            )}
            {selectedCondominium.city && (
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">Ciudad</p>
                <p className="text-sm font-medium text-foreground">{selectedCondominium.city}</p>
              </div>
            )}
            {selectedCondominium.country && (
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">País</p>
                <p className="text-sm font-medium text-foreground">{selectedCondominium.country}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase">Tema</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {selectedCondominium.theme_id || "default"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
