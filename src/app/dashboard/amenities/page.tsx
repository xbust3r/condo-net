"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  MapPin,
  Users,
  Clock,
  DollarSign,
  Shield,
  Pencil,
  Trash2,
  Building2,
  CalendarRange,
} from "lucide-react";

interface Amenity {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  location?: string;
  max_capacity?: number;
  booking_duration_min?: number;
  requires_approval: boolean;
  scope: string;
  booking_price: number;
  security_deposit_amount: number;
  is_reservable: boolean;
  status: string;
  building_id?: number;
  condominium_id: number;
}

interface Building {
  id: number;
  name: string;
  code: string;
}

export default function AmenitiesPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Amenity | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    max_capacity: 20,
    booking_duration_min: 60,
    requires_approval: false,
    scope: "CONDOMINIUM",
    building_id: 0,
    booking_price: 0,
    security_deposit_amount: 0,
    is_reservable: true,
  });

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;
    fetchAmenities();
    fetchBuildings();
  }, [selectedCondominium, authLoading]);

  async function fetchAmenities() {
    setLoading(true);
    setError("");
    const { data, error: apiErr } = await api.get<{
      success: boolean;
      data: { items: Amenity[]; total: number };
    }>(
      `/amenities?condominium_id=${selectedCondominium!.id}&limit=200`
    );

    if (apiErr) {
      setError(apiErr.message || "Error al cargar amenidades");
    } else if (data?.data?.items) {
      setAmenities(data.data.items);
    }
    setLoading(false);
  }

  async function fetchBuildings() {
    const { data } = await api.get<{
      success: boolean;
      data: { items: Building[]; total: number };
    }>(`/buildings?condominium_id=${selectedCondominium!.id}&limit=200`);

    if (data?.data?.items) setBuildings(data.data.items);
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      location: "",
      max_capacity: 20,
      booking_duration_min: 60,
      requires_approval: false,
      scope: "CONDOMINIUM",
      building_id: 0,
      booking_price: 0,
      security_deposit_amount: 0,
      is_reservable: true,
    });
    setEditing(null);
  }

  function openEdit(amenity: Amenity) {
    setEditing(amenity);
    setForm({
      name: amenity.name,
      description: amenity.description || "",
      location: amenity.location || "",
      max_capacity: amenity.max_capacity || 20,
      booking_duration_min: amenity.booking_duration_min || 60,
      requires_approval: amenity.requires_approval,
      scope: amenity.scope,
      building_id: amenity.building_id || 0,
      booking_price: amenity.booking_price || 0,
      security_deposit_amount: amenity.security_deposit_amount || 0,
      is_reservable: amenity.is_reservable,
    });
    setDialogOpen(true);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      condominium_id: selectedCondominium!.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      max_capacity: form.max_capacity,
      booking_duration_min: form.booking_duration_min,
      requires_approval: form.requires_approval,
      scope: form.scope,
      building_id: form.scope === "BUILDING" ? form.building_id : null,
      booking_price: form.booking_price,
      security_deposit_amount: form.security_deposit_amount,
      is_reservable: form.is_reservable,
    };

    if (editing) {
      const { error: apiErr } = await api.put(
        `/amenities/${editing.id}`,
        payload
      );
      if (apiErr) {
        setError(apiErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: apiErr } = await api.post("/amenities", payload);
      if (apiErr) {
        setError(apiErr.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setDialogOpen(false);
    resetForm();
    await fetchAmenities();
  }

  async function handleDelete(amenity: Amenity) {
    if (!confirm(`¿Eliminar "${amenity.name}"?`)) return;
    const { error: apiErr } = await api.delete(`/amenities/${amenity.id}`);
    if (apiErr) {
      setError(apiErr.message);
      return;
    }
    await fetchAmenities();
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const scopeLabel = (scope: string) =>
    scope === "CONDOMINIUM" ? "Todo el condominio" : "Por edificio";
  const statusVariant = (s: string) => (s === "active" ? "default" : "secondary");

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Áreas Comunes</h2>
            <p className="text-xs text-muted-foreground">
              {amenities.length} registradas
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Nueva
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Amenities list */}
      {amenities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay áreas comunes registradas.
            </p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Crear primera área común
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {amenities.map((a) => (
            <Card key={a.id} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">
                        {a.name}
                      </h3>
                      <Badge variant={statusVariant(a.status)} className="text-[10px]">
                        {a.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {a.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {a.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> Cap: {a.max_capacity || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {a.booking_duration_min || 0} min
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {scopeLabel(a.scope)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleDelete(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Pricing row */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-chart-3">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      S/ {Number(a.booking_price).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ reserva</span>
                  </span>
                  <span className="flex items-center gap-1 text-chart-4">
                    <Shield className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      S/ {Number(a.security_deposit_amount).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">garantía</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar área común" : "Nueva área común"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los campos del área común"
                : "Registra una nueva área común o amenidad"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Salón de Eventos"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ej: Piso 1, Torre A"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="desc">Descripción</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descripción del área común..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_capacity}
                  onChange={(e) =>
                    setForm({ ...form, max_capacity: Number(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.booking_duration_min}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      booking_duration_min: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Alcance</Label>
              <Select
                value={form.scope}
                onValueChange={(v) =>
                  setForm({ ...form, scope: v ?? "CONDOMINIUM", building_id: v === "BUILDING" ? form.building_id : 0 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONDOMINIUM">Todo el condominio</SelectItem>
                  <SelectItem value="BUILDING">Por edificio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.scope === "BUILDING" && (
              <div className="flex flex-col gap-1.5">
                <Label>Edificio</Label>
                <Select
                  value={form.building_id ? String(form.building_id) : ""}
                  onValueChange={(v) =>
                    setForm({ ...form, building_id: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name} ({b.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-3">
              <p className="text-sm font-semibold text-foreground mb-3">
                Precio y Garantía
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Precio de reserva (S/)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.booking_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        booking_price: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Garantía (S/)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.security_deposit_amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        security_deposit_amount: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_approval"
                checked={form.requires_approval}
                onChange={(e) =>
                  setForm({ ...form, requires_approval: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="requires_approval">Requiere aprobación</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_reservable"
                checked={form.is_reservable}
                onChange={(e) =>
                  setForm({ ...form, is_reservable: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="is_reservable">Reservable</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {editing ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
