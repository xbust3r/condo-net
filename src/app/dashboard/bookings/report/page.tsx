"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  TrendingUp,
  CalendarRange,
  DollarSign,
  Shield,
  CheckCircle2,
  XCircle,
  Flag,
  FileText,
  Building2,
  Filter,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────

interface ReportData {
  filters: {
    condominium_id: number;
    building_id?: number | null;
    amenity_id?: number | null;
    date_from: string | null;
    date_to: string | null;
  };
  summary: {
    total_bookings: number;
    total_fees: number;
    deposits_held: number;
    deposits_applied: number;
    deposits_returned: number;
  };
  by_status: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
  by_building: Array<{
    building_id: number;
    building_name: string;
    bookings: number;
    revenue: number;
    deposits: number;
  }>;
  by_amenity: Array<{
    amenity_id: number;
    amenity_name: string;
    bookings: number;
    revenue: number;
    deposits: number;
  }>;
}

interface Building {
  id: number;
  name: string;
}

interface Amenity {
  id: number;
  name: string;
}

// ── Helpers ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_approval: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  confirmed: "text-chart-2",
  completed: "text-chart-3",
  cancelled: "text-destructive",
  pending_approval: "text-chart-1",
};

function formatCurrency(amount: number): string {
  return `S/ ${Number(amount).toFixed(2)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthAgo(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

// ── Component ───────────────────────────────────────────────────

export default function BookingReportPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [dateFrom, setDateFrom] = useState(monthAgo());
  const [dateTo, setDateTo] = useState(today());
  const [buildingId, setBuildingId] = useState<string>("all");
  const [amenityId, setAmenityId] = useState<string>("all");

  // Reference data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;
    fetchReport();
    fetchBuildings();
    fetchAmenities();
  }, [selectedCondominium, authLoading]);

  async function fetchReport() {
    setLoading(true);
    setError("");

    let url = `/bookings/report?condominium_id=${selectedCondominium!.id}`;
    if (buildingId !== "all") url += `&building_id=${buildingId}`;
    if (amenityId !== "all") url += `&amenity_id=${amenityId}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;

    const { data, error: apiErr } = await api.get<{
      success: boolean;
      data: ReportData;
    }>(url);

    if (apiErr) {
      setError(apiErr.message);
      setReport(null);
    } else if (data?.data) {
      setReport(data.data);
    }
    setLoading(false);
  }

  async function fetchBuildings() {
    const { data } = await api.get<{
      success: boolean;
      data: { items: Building[] };
    }>(`/buildings?condominium_id=${selectedCondominium!.id}&limit=200`);
    if (data?.data?.items) setBuildings(data.data.items);
  }

  async function fetchAmenities() {
    const { data } = await api.get<{
      success: boolean;
      data: { items: Amenity[] };
    }>(`/amenities?condominium_id=${selectedCondominium!.id}&limit=200`);
    if (data?.data?.items) setAmenities(data.data.items);
  }

  function handleFilter() {
    fetchReport();
  }

  // ── Render ────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Reporte de Reservas
            </h2>
            <p className="text-xs text-muted-foreground">
              Ingresos y estadísticas
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleFilter}>
          <Filter className="mr-1 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <Card className="border shadow-sm mb-4">
        <CardContent className="p-3">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={buildingId} onValueChange={(v) => setBuildingId(v ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Edificio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los edificios</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={amenityId} onValueChange={(v) => setAmenityId(v ?? "all")}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Área común" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {amenities.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center min-h-[30vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <div className="flex flex-col gap-3">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarRange className="h-4 w-4 text-chart-1" />
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">
                    Total Reservas
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {report.summary.total_bookings}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">
                    Ingresos
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(report.summary.total_fees)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-chart-4" />
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">
                    Garantías
                  </span>
                </div>
                <p className="text-2xl font-bold text-chart-4">
                  {formatCurrency(report.summary.deposits_held)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                  <span className="text-[11px] font-semibold uppercase text-muted-foreground/60">
                    Aplicadas
                  </span>
                </div>
                <p className="text-2xl font-bold text-chart-2">
                  {formatCurrency(report.summary.deposits_applied)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status breakdown */}
          {report.by_status.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                  Por estado
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.by_status.map((s) => (
                    <div
                      key={s.status}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                    >
                      <span
                        className={`text-sm font-medium ${STATUS_COLORS[s.status] || ""}`}
                      >
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.count}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(s.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By building */}
          {report.by_building.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                  Por edificio
                </p>
                <div className="flex flex-col gap-1">
                  {report.by_building.map((b) => (
                    <div
                      key={b.building_id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {b.building_name || `#${b.building_id}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          {b.bookings} res.
                        </span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 w-[80px] text-right">
                          {formatCurrency(b.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By amenity */}
          {report.by_amenity.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground/60 mb-2">
                  Por área común
                </p>
                <div className="flex flex-col gap-1">
                  {report.by_amenity.map((a) => (
                    <div
                      key={a.amenity_id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {a.amenity_name || `#${a.amenity_id}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs text-muted-foreground">
                          {a.bookings} res.
                        </span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 w-[80px] text-right">
                          {formatCurrency(a.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state for filtered results */}
          {report.summary.total_bookings === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <FileText className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No hay reservas en el período seleccionado.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
