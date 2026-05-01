"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users, UserX } from "lucide-react";

interface Resident {
  user_id: number;
  full_name: string;
  role: string;
  status: string;
  unit_code?: string;
}

export default function ResidentsPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function fetchResidents() {
      setLoading(true);
      setError("");

      const { data, error: apiError } = await api.get<{
        success: boolean;
        data: { users: Resident[] };
      }>(`/condominiums/${selectedCondominium!.id}/users`);

      if (apiError) {
        setError(apiError.message || "Error al cargar residentes");
      } else if (data?.data?.users) {
        setResidents(data.data.users);
      }
      setLoading(false);
    }

    fetchResidents();
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Residentes</h2>
          <p className="text-xs text-muted-foreground">{residents.length} registrados</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {residents.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <UserX className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-center text-sm text-muted-foreground">
              No se encontraron residentes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {residents.map((r) => (
            <Card key={r.user_id} className="border shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-chart-1/10 text-chart-1 text-sm">
                    {r.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {r.full_name || `Usuario #${r.user_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.role}
                    {r.unit_code ? ` · ${r.unit_code}` : ""}
                  </p>
                </div>
                <Badge
                  variant={r.status === "active" ? "default" : "secondary"}
                  className="text-xs shrink-0"
                >
                  {r.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
