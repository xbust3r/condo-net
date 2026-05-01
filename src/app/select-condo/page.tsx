"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  ChevronRight,
  MapPin,
  Home,
  LogOut,
  Loader2,
} from "lucide-react";

export default function SelectCondoPage() {
  const { user, selectedCondominium, selectCondominium, logout, isLoading } =
    useAuth();
  const router = useRouter();

  // If already have selected condo, redirect to dashboard
  useEffect(() => {
    if (selectedCondominium && !isLoading) {
      router.replace("/dashboard");
    }
  }, [selectedCondominium, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  function handleSelect(condo: NonNullable<typeof user>["condominiums"][0]) {
    selectCondominium(condo);
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            Condo-Net
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground"
        >
          <LogOut className="mr-1 h-4 w-4" />
          Salir
        </Button>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col px-4 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ¡Hola{user.profile?.first_name ? `, ${user.profile.first_name}` : ""}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Selecciona un condominio para continuar
          </p>
        </div>

        {/* Condo list */}
        {user.condominiums.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Home className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-center text-muted-foreground">
                No tienes condominios asociados.
                <br />
                Contacta a un administrador para que te asigne uno.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {user.condominiums.map((condo) => (
              <button
                key={condo.id}
                onClick={() => handleSelect(condo)}
                className="group flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
              >
                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {condo.name}
                  </h3>
                  {condo.city && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {[condo.city, condo.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {condo.code && (
                    <p className="text-xs text-muted-foreground/70">
                      Código: {condo.code}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
