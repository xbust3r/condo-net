"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Home, DoorOpen } from "lucide-react";

interface UnitItem {
  id: number;
  uuid: string;
  code: string;
  unit_type?: string;
  floor_number?: number;
  private_area?: number;
  building_name?: string;
  status: number;
}

export default function UnitsPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function fetchUnits() {
      setLoading(true);
      setError("");

      const { data, error: apiError } = await api.get<{
        success: boolean;
        data: { items: UnitItem[]; total: number };
      }>("/units?limit=200");

      if (apiError) {
        setError(apiError.message || "Error al cargar unidades");
      } else if (data?.data?.items) {
        setUnits(data.data.items);
      }
      setLoading(false);
    }

    fetchUnits();
  }, [selectedCondominium, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const grouped = units.reduce<Record<string, UnitItem[]>>((acc, unit) => {
    const bldg = unit.building_name || "Sin edificio";
    if (!acc[bldg]) acc[bldg] = [];
    acc[bldg].push(unit);
    return acc;
  }, {});

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
          <Home className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Unidades</h2>
          <p className="text-xs text-muted-foreground">{units.length} registradas</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {units.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-center text-sm text-muted-foreground">
              No se encontraron unidades.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(grouped).map(([building, buildingUnits]) => (
            <div key={building}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {building}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({buildingUnits.length})
                </span>
              </h3>
              <div className="flex flex-col gap-1.5">
                {buildingUnits.map((unit) => (
                  <Card key={unit.id} className="border shadow-sm">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                        <Home className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 flex-col min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {unit.code || `Unidad #${unit.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {unit.unit_type || "Tipo no definido"}
                          {unit.floor_number != null
                            ? ` · Piso ${unit.floor_number}`
                            : ""}
                          {unit.private_area
                            ? ` · ${unit.private_area}m²`
                            : ""}
                        </p>
                      </div>
                      <Badge
                        variant={unit.status === 1 ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {unit.status === 1 ? "Activa" : "Inactiva"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
