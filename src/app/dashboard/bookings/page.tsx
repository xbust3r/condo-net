"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CalendarRange,
  Plus,
  CheckCircle2,
  XCircle,
  Flag,
  Undo2,
  ShieldAlert,
  ShieldCheck,
  Clock,
  MapPin,
  User,
  Home,
  DollarSign,
  Filter,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────

interface Booking {
  id: number;
  uuid: string;
  condominium_id: number;
  building_id: number;
  amenity_id: number;
  unit_id: number;
  owner_id: number;
  booking_date: string;
  start_at: string;
  end_at: string;
  status: string;
  booking_fee_amount?: number;
  security_deposit_amount?: number;
  deposit_status?: string;
  notes?: string;
  unit_number_snapshot: string;
  owner_name_snapshot: string;
  amenity_name?: string;
  building_name?: string;
  ar_id?: number | null;
  ar_deposit_id?: number | null;
}

interface Amenity {
  id: number;
  name: string;
}

interface Building {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  unit_number: string;
  building_id: number;
}

interface Resident {
  user_id: number;
  full_name: string;
}

// ── Helpers ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Borrador", variant: "secondary" },
  pending_approval: { label: "Pendiente", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  completed: { label: "Completada", variant: "secondary" },
};

const DEPOSIT_LABELS: Record<string, string> = {
  none: "Sin garantía",
  pending: "Garantía pendiente",
  paid: "Garantía pagada",
  returned: "Garantía devuelta",
  partially_applied: "Aplicada parcial",
  applied: "Garantía aplicada",
  forfeited: "Perdida",
};

function formatDateTime(dateStr: string, timeStr: string): string {
  const d = new Date(dateStr + "T" + timeStr);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ───────────────────────────────────────────────────

export default function BookingsPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);

  // Create form state
  const [form, setForm] = useState({
    amenity_id: 0,
    building_id: 0,
    unit_id: 0,
    owner_id: 0,
    booking_date: "",
    start_at: "",
    end_at: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  // Cancel dialog
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Deposit dialog
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositTarget, setDepositTarget] = useState<Booking | null>(null);
  const [depositAction, setDepositAction] = useState<"return" | "apply">(
    "return"
  );
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositNotes, setDepositNotes] = useState("");
  const [depositing, setDepositing] = useState(false);

  // ── Auth guard ────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
    }
  }, [selectedCondominium, authLoading, router]);

  // ── Data fetching ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCondominium) return;
    fetchBookings();
    fetchAmenitiesForForm();
    fetchBuildingsForForm();
  }, [selectedCondominium, statusFilter, buildingFilter]);

  async function fetchBookings() {
    setLoading(true);
    setError("");

    let url = `/bookings?condominium_id=${selectedCondominium!.id}&limit=200`;
    if (statusFilter !== "all") url += `&status=${statusFilter}`;
    if (buildingFilter !== "all") url += `&building_id=${buildingFilter}`;

    const { data, error: apiErr } = await api.get<{
      success: boolean;
      data: { items: Booking[]; total: number };
    }>(url);

    if (apiErr) {
      setError(apiErr.message || "Error al cargar reservas");
    } else if (data?.data?.items) {
      setBookings(data.data.items);
    }
    setLoading(false);
  }

  async function fetchAmenitiesForForm() {
    const { data } = await api.get<{
      success: boolean;
      data: { items: Amenity[] };
    }>(
      `/amenities?condominium_id=${selectedCondominium!.id}&limit=200&status=active`
    );
    if (data?.data?.items) setAmenities(data.data.items);
  }

  async function fetchBuildingsForForm() {
    const { data } = await api.get<{
      success: boolean;
      data: { items: Building[] };
    }>(`/buildings?condominium_id=${selectedCondominium!.id}&limit=200`);
    if (data?.data?.items) setBuildings(data.data.items);
  }

  async function fetchUnitsForForm(buildingId: number) {
    const { data } = await api.get<{
      success: boolean;
      data: { items: Unit[] };
    }>(`/units?building_id=${buildingId}&limit=200`);
    if (data?.data?.items) setUnits(data.data.items);
  }

  async function fetchResidentsForForm() {
    const { data } = await api.get<{
      success: boolean;
      data: { users: Array<{ user: { id: number; email: string } | null; profile: { first_name?: string; last_name?: string } | null }> };
    }>(`/condominiums/${selectedCondominium!.id}/users`);

    if (data?.data?.users) {
      const mapped: Resident[] = data.data.users
        .filter((u) => u.user)
        .map((u) => ({
          user_id: u.user!.id,
          full_name:
            [u.profile?.first_name, u.profile?.last_name]
              .filter(Boolean)
              .join(" ") || u.user!.email,
        }));
      setResidents(mapped);
    }
  }

  // ── Actions ───────────────────────────────────────────────────

  async function handleCreate() {
    if (!form.amenity_id || !form.building_id || !form.unit_id || !form.owner_id) return;
    setCreating(true);

    const { error: apiErr } = await api.post("/bookings", {
      condominium_id: selectedCondominium!.id,
      building_id: form.building_id,
      amenity_id: form.amenity_id,
      unit_id: form.unit_id,
      owner_id: form.owner_id,
      booking_date: form.booking_date,
      start_at: `${form.booking_date}T${form.start_at}:00`,
      end_at: `${form.booking_date}T${form.end_at}:00`,
      notes: form.notes || null,
    });

    setCreating(false);
    if (apiErr) {
      setError(apiErr.message);
      return;
    }
    setCreateOpen(false);
    resetForm();
    await fetchBookings();
  }

  async function handleAction(
    booking: Booking,
    action: "confirm" | "complete" | "cancel"
  ) {
    if (action === "cancel") {
      setCancelTarget(booking);
      setCancelReason("");
      setCancelOpen(true);
      return;
    }

    setActionLoading(booking.id);
    const { error: apiErr } = await api.post(`/bookings/${booking.id}/${action}`);
    setActionLoading(null);

    if (apiErr) {
      setError(apiErr.message);
      return;
    }
    await fetchBookings();
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return;
    setCancelling(true);

    const { error: apiErr } = await api.post(`/bookings/${cancelTarget.id}/cancel`, {
      reason: cancelReason || "Cancelado por administrador",
    });

    setCancelling(false);
    if (apiErr) {
      setError(apiErr.message);
      return;
    }
    setCancelOpen(false);
    setCancelTarget(null);
    await fetchBookings();
  }

  async function handleDepositAction(booking: Booking, action: "return" | "apply") {
    setDepositTarget(booking);
    setDepositAction(action);
    setDepositAmount(booking.security_deposit_amount || 0);
    setDepositNotes("");
    setDepositOpen(true);
  }

  async function handleDepositConfirm() {
    if (!depositTarget) return;
    setDepositing(true);

    if (depositAction === "return") {
      const { error: apiErr } = await api.post(
        `/bookings/${depositTarget.id}/deposit/return?notes=${encodeURIComponent(depositNotes || "")}`
      );
      if (apiErr) setError(apiErr.message);
    } else {
      const { error: apiErr } = await api.post(
        `/bookings/${depositTarget.id}/deposit/apply`,
        {
          action: "apply",
          amount: depositAmount,
          notes: depositNotes || null,
        }
      );
      if (apiErr) setError(apiErr.message);
    }

    setDepositing(false);
    setDepositOpen(false);
    setDepositTarget(null);
    await fetchBookings();
  }

  function resetForm() {
    setForm({
      amenity_id: 0,
      building_id: 0,
      unit_id: 0,
      owner_id: 0,
      booking_date: "",
      start_at: "",
      end_at: "",
      notes: "",
    });
  }

  // ── Render ────────────────────────────────────────────────────

  if (authLoading || loading) {
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-5/10 text-chart-5">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Reservas</h2>
            <p className="text-xs text-muted-foreground">
              {bookings.length} reservas
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            fetchAmenitiesForForm();
            fetchBuildingsForForm();
            fetchResidentsForForm();
            setCreateOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Nueva
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => setError("")}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={buildingFilter} onValueChange={(v) => setBuildingFilter(v ?? "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Edificio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CalendarRange className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay reservas registradas.
            </p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Crear primera reserva
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => {
            const statusCfg = STATUS_CONFIG[b.status] || {
              label: b.status,
              variant: "secondary" as const,
            };
            const isActionable = b.status === "draft" || b.status === "confirmed";
            const loadingThis = actionLoading === b.id;

            return (
              <Card key={b.id} className="border shadow-sm">
                <CardContent className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {b.amenity_name || `Amenidad #${b.amenity_id}`}
                        </h3>
                        <Badge
                          variant={statusCfg.variant}
                          className="text-[10px]"
                        >
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.building_name && `${b.building_name} · `}
                        {formatDateTime(b.booking_date, b.start_at)} →{" "}
                        {new Date(
                          b.booking_date + "T" + b.end_at
                        ).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Status actions */}
                    {isActionable && (
                      <div className="flex gap-1 shrink-0">
                        {b.status === "draft" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => handleAction(b, "confirm")}
                            disabled={!!loadingThis}
                          >
                            {loadingThis ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        {b.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => handleAction(b, "complete")}
                            disabled={!!loadingThis}
                          >
                            {loadingThis ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Flag className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleAction(b, "cancel")}
                          disabled={!!loadingThis}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Home className="h-3 w-3" />
                      {b.unit_number_snapshot}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {b.owner_name_snapshot}
                    </span>
                  </div>

                  {/* Amounts row */}
                  <div className="flex items-center gap-3 text-sm mt-1">
                    {b.booking_fee_amount != null && b.booking_fee_amount > 0 && (
                      <span className="flex items-center gap-1 text-chart-3">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          S/ {Number(b.booking_fee_amount).toFixed(2)}
                        </span>
                      </span>
                    )}
                    {b.deposit_status &&
                      b.deposit_status !== "none" &&
                      b.security_deposit_amount != null &&
                      b.security_deposit_amount > 0 && (
                        <span className="flex items-center gap-1 text-chart-4">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            S/ {Number(b.security_deposit_amount).toFixed(2)}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-normal ml-1">
                            {DEPOSIT_LABELS[b.deposit_status] || b.deposit_status}
                          </Badge>
                        </span>
                      )}
                  </div>

                  {/* Deposit actions */}
                  {b.deposit_status === "paid" && (
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleDepositAction(b, "return")}
                      >
                        <Undo2 className="h-3 w-3 mr-1" />
                        Devolver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive"
                        onClick={() => handleDepositAction(b, "apply")}
                      >
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Dialog ─────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva reserva</DialogTitle>
            <DialogDescription>
              Registra una reserva de área común
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Edificio *</Label>
              <Select
                value={form.building_id ? String(form.building_id) : ""}
                onValueChange={(v) => {
                  const bId = Number(v);
                  setForm({ ...form, building_id: bId, unit_id: 0 });
                  fetchUnitsForForm(bId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar edificio" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Área común *</Label>
              <Select
                value={form.amenity_id ? String(form.amenity_id) : ""}
                onValueChange={(v) =>
                  setForm({ ...form, amenity_id: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar área" />
                </SelectTrigger>
                <SelectContent>
                  {amenities.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Unidad *</Label>
              <Select
                value={form.unit_id ? String(form.unit_id) : ""}
                onValueChange={(v) =>
                  setForm({ ...form, unit_id: Number(v) })
                }
                disabled={!form.building_id}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      form.building_id
                        ? "Seleccionar unidad"
                        : "Primero selecciona edificio"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.unit_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Propietario *</Label>
              <Select
                value={form.owner_id ? String(form.owner_id) : ""}
                onValueChange={(v) =>
                  setForm({ ...form, owner_id: Number(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar propietario" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((r) => (
                    <SelectItem key={r.user_id} value={String(r.user_id)}>
                      {r.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.booking_date}
                onChange={(e) =>
                  setForm({ ...form, booking_date: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Hora inicio *</Label>
                <Input
                  type="time"
                  value={form.start_at}
                  onChange={(e) =>
                    setForm({ ...form, start_at: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Hora fin *</Label>
                <Input
                  type="time"
                  value={form.end_at}
                  onChange={(e) =>
                    setForm({ ...form, end_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                creating ||
                !form.amenity_id ||
                !form.building_id ||
                !form.unit_id ||
                !form.owner_id ||
                !form.booking_date ||
                !form.start_at ||
                !form.end_at
              }
            >
              {creating ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Crear reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ─────────────────────────────────────── */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cancelar esta reserva?
              {cancelTarget && (
                <span className="block mt-1 font-medium text-foreground">
                  {cancelTarget.amenity_name} —{" "}
                  {cancelTarget.unit_number_snapshot} —{" "}
                  {cancelTarget.booking_date}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label>Motivo</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo de la cancelación..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              Cancelar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deposit Dialog ────────────────────────────────────── */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {depositAction === "return"
                ? "Devolver garantía"
                : "Aplicar garantía"}
            </DialogTitle>
            <DialogDescription>
              {depositTarget && (
                <span className="block mt-1">
                  {depositAction === "return"
                    ? "La garantía será devuelta en su totalidad."
                    : "La garantía se aplicará por daños o incumplimiento."}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {depositAction === "apply" && (
            <div className="flex flex-col gap-1.5">
              <Label>Monto a aplicar (S/)</Label>
              <Input
                type="number"
                min={0}
                max={depositTarget?.security_deposit_amount || 0}
                step="0.01"
                value={depositAmount}
                onChange={(e) =>
                  setDepositAmount(Number(e.target.value) || 0)
                }
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Notas</Label>
            <Textarea
              value={depositNotes}
              onChange={(e) => setDepositNotes(e.target.value)}
              placeholder={
                depositAction === "return"
                  ? "Motivo de devolución..."
                  : "Descripción de daños..."
              }
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDepositOpen(false)}
              disabled={depositing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDepositConfirm}
              disabled={depositing}
              variant={depositAction === "apply" ? "destructive" : "default"}
            >
              {depositing ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {depositAction === "return" ? "Devolver" : "Aplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
