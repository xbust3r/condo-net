"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Building } from "lucide-react";

interface BuildingItem {
  id: number;
  uuid: string;
  code: string;
  name: string;
  building_type?: string;
  floors_count?: number;
  basements_count?: number;
  units_planned?: number;
  status: number;
}

export default function TowersPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function fetchBuildings() {
      setLoading(true);
      setError("");

      const { data, error: apiError } = await api.get<{
        success: boolean;
        data: { items: BuildingItem[]; total: number };
      }>(`/buildings?condominium_id=${selectedCondominium!.id}&limit=200`);

      if (apiError) {
        setError(apiError.message || "Error al cargar torres");
      } else if (data?.data?.items) {
        setBuildings(data.data.items);
      }
      setLoading(false);
    }

    fetchBuildings();
  }, [selectedCondominium, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
          <Building2 className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Torres</h2>
          <p className="text-xs text-muted-foreground">{buildings.length} edificios</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {buildings.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Building className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-center text-sm text-muted-foreground">
              No se encontraron torres o edificios.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {buildings.map((b) => (
            <Card key={b.id} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-chart-4/10 text-chart-4">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex flex-1 flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{b.name}</h3>
                      <Badge
                        variant={b.status === 1 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {b.status === 1 ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {b.code && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Código: {b.code}
                      </p>
                    )}
                    {b.building_type && (
                      <p className="text-xs text-muted-foreground">
                        Tipo: {b.building_type}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-muted px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">Pisos</p>
                        <p className="text-sm font-semibold text-foreground">
                          {b.floors_count ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">Sótanos</p>
                        <p className="text-sm font-semibold text-foreground">
                          {b.basements_count ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">Unidades</p>
                        <p className="text-sm font-semibold text-foreground">
                          {b.units_planned ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
