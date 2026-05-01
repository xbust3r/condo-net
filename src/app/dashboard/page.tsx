"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  LogOut,
  Loader2,
  ArrowLeft,
  Users,
  Home,
  CreditCard,
} from "lucide-react";

export default function DashboardPage() {
  const { user, selectedCondominium, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !selectedCondominium) {
      router.replace("/select-condo");
    }
  }, [selectedCondominium, isLoading, router]);

  if (isLoading || !selectedCondominium) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/select-condo")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Cambiar
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            {selectedCondominium.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {selectedCondominium.code && `${selectedCondominium.code} · `}
            {[selectedCondominium.city, selectedCondominium.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>

        {/* Quick actions grid — mobile first, 2-col */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-center">Residentes</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
                <Home className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-center">Unidades</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                <CreditCard className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-center">Pagos</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
            <CardContent className="flex flex-col items-center gap-2 p-4 pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-center">Torres</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
