"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  MapPin,
  Home,
  LogOut,
  Loader2,
  LogIn,
} from "lucide-react";

function getUserRoleLabel(
  condoId: number,
  rolesByCondo?: Record<number, Array<{ id: number; name: string }>>
): { label: string; variant: "default" | "secondary" | "outline" } | null {
  if (!rolesByCondo) return null;
  const roles = rolesByCondo[condoId];
  if (!roles || roles.length === 0) return null;

  const roleNames = roles.map((r) => r.name.toLowerCase());

  if (roleNames.some((n) => n.includes("propietario") || n.includes("owner"))) {
    return { label: "Propietario", variant: "default" };
  }
  if (roleNames.some((n) => n.includes("inquilino") || n.includes("tenant"))) {
    return { label: "Inquilino", variant: "secondary" };
  }
  if (roleNames.some((n) => n.includes("residente") || n.includes("resident"))) {
    return { label: "Residente", variant: "outline" };
  }

  return {
    label: roles[0].name.charAt(0).toUpperCase() + roles[0].name.slice(1),
    variant: "outline",
  };
}

function formatAddress(condo: {
  address?: string;
  city?: string;
  country?: string;
}): string {
  const parts = [condo.address, condo.city, condo.country].filter(Boolean);
  return parts.join(", ");
}

export default function SelectCondoPage() {
  const { user, selectedCondominium, selectCondominium, logout, isLoading } =
    useAuth();
  const router = useRouter();

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
          <span className="font-semibold text-foreground">Condo-Net</span>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ¡Hola
            {user.profile?.first_name ? `, ${user.profile.first_name}` : ""}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Selecciona un condominio para continuar
          </p>
        </div>

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
          <div className="flex flex-col gap-4">
            {user.condominiums.map((condo) => {
              const role = getUserRoleLabel(
                condo.id,
                user.roles_by_condominium
              );
              const fullAddress = formatAddress(condo);

              return (
                <div
                  key={condo.id}
                  className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden"
                >
                  {/* Logo + Info */}
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary overflow-hidden">
                      {condo.logo_url ? (
                        <Image
                          src={condo.logo_url}
                          alt={`Logo ${condo.name}`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-8 w-8" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {condo.name}
                        </h3>
                        {role && (
                          <Badge
                            variant={role.variant}
                            className="text-[10px] shrink-0 px-1.5 py-0"
                          >
                            {role.label}
                          </Badge>
                        )}
                      </div>

                      {fullAddress && (
                        <p className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{fullAddress}</span>
                        </p>
                      )}

                      {condo.code && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          Código: {condo.code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="border-t bg-muted/30 px-4 py-2.5">
                    <Button
                      onClick={() => handleSelect(condo)}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <LogIn className="h-4 w-4" />
                      Ingresar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
