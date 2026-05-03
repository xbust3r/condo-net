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
  Loader2,
  Settings2,
  DollarSign,
  Receipt,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

interface AmenitySettings {
  enable_amenity_booking_charges: boolean;
  include_amenity_bookings_in_receipts: boolean;
  include_amenity_bookings_in_building_balance: boolean;
  include_amenity_bookings_in_condominium_balance: boolean;
}

const DEFAULT_SETTINGS: AmenitySettings = {
  enable_amenity_booking_charges: false,
  include_amenity_bookings_in_receipts: false,
  include_amenity_bookings_in_building_balance: false,
  include_amenity_bookings_in_condominium_balance: false,
};

interface SettingRow {
  key: keyof AmenitySettings;
  label: string;
  description: string;
  icon: React.ElementType;
  requires?: keyof AmenitySettings;
  dependsOn?: keyof AmenitySettings;
}

const SETTINGS: SettingRow[] = [
  {
    key: "enable_amenity_booking_charges",
    label: "Habilitar cobros por reservas",
    description:
      "Permite generar cobros (AR) cuando se confirman reservas de áreas comunes",
    icon: DollarSign,
  },
  {
    key: "include_amenity_bookings_in_receipts",
    label: "Incluir reservas en recibos",
    description:
      "Muestra los cobros de reservas en los recibos de mantenimiento (funcionalidad futura)",
    icon: Receipt,
    dependsOn: "enable_amenity_booking_charges",
  },
  {
    key: "include_amenity_bookings_in_building_balance",
    label: "Incluir en balance de edificio",
    description:
      "Agrega los ingresos por reservas al balance contable de cada edificio",
    icon: Building2,
    dependsOn: "enable_amenity_booking_charges",
  },
  {
    key: "include_amenity_bookings_in_condominium_balance",
    label: "Incluir en balance del condominio",
    description:
      "Agrega los ingresos por reservas al balance consolidado del condominio. Se activa automáticamente si el balance de edificio está activo.",
    icon: Building2,
    dependsOn: "enable_amenity_booking_charges",
  },
];

export default function SettingsPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<AmenitySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function fetchSettings() {
      setLoading(true);
      const { data, error: apiErr } = await api.get<{
        success: boolean;
        data: {
          name: string;
          amenity_settings?: AmenitySettings;
        };
      }>(`/condominiums/${selectedCondominium!.id}`);

      if (apiErr) {
        setError(apiErr.message);
      } else if (data?.data) {
        const s = data.data.amenity_settings;
        if (s && typeof s === "object") {
          setSettings({
            enable_amenity_booking_charges:
              s.enable_amenity_booking_charges ?? false,
            include_amenity_bookings_in_receipts:
              s.include_amenity_bookings_in_receipts ?? false,
            include_amenity_bookings_in_building_balance:
              s.include_amenity_bookings_in_building_balance ?? false,
            include_amenity_bookings_in_condominium_balance:
              s.include_amenity_bookings_in_condominium_balance ?? false,
          });
        }
      }
      setLoading(false);
    }

    fetchSettings();
  }, [selectedCondominium, authLoading]);

  function toggle(key: keyof AmenitySettings) {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };

      // Enforce: building_balance=true forces condominium_balance=true
      if (key === "include_amenity_bookings_in_building_balance" && next[key]) {
        next.include_amenity_bookings_in_condominium_balance = true;
      }

      // Enforce: condominium_balance cannot be disabled if building_balance is on
      if (
        key === "include_amenity_bookings_in_condominium_balance" &&
        !next[key] &&
        next.include_amenity_bookings_in_building_balance
      ) {
        // Don't allow disabling condominium_balance while building is on
        return prev;
      }

      // If enabling parent, enable children cascade doesn't auto-enable
      // Only the building→condo rule is enforced
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    const { error: apiErr } = await api.put(
      `/condominiums/${selectedCondominium!.id}`,
      { amenity_settings: settings }
    );

    setSaving(false);
    if (apiErr) {
      setError(apiErr.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const parentEnabled = settings.enable_amenity_booking_charges;

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10 text-chart-1">
            <Settings2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Configuración
            </h2>
            <p className="text-xs text-muted-foreground">
              Reservas de áreas comunes
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : null}
          {saved ? "Guardado ✓" : "Guardar"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Settings list */}
      <div className="flex flex-col gap-3">
        {/* Master toggle card */}
        <Card
          className={`border shadow-sm transition-colors ${
            parentEnabled ? "border-green-200 dark:border-green-800" : ""
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggle("enable_amenity_booking_charges")}
                className={`mt-0.5 flex h-9 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${
                  parentEnabled ? "bg-green-500 justify-end" : "bg-muted justify-start"
                }`}
              >
                <span className="h-7 w-7 rounded-full bg-white shadow-sm" />
              </button>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground text-sm">
                    {SETTINGS[0].label}
                  </span>
                  {parentEnabled && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {SETTINGS[0].description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dependent settings */}
        <div
          className={`flex flex-col gap-2 transition-all ${
            !parentEnabled ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          {SETTINGS.slice(1).map((row) => {
            const isOn = settings[row.key];
            const isForced =
              row.key === "include_amenity_bookings_in_condominium_balance" &&
              settings.include_amenity_bookings_in_building_balance;

            return (
              <Card
                key={row.key}
                className={`border shadow-sm transition-colors ${
                  isOn ? "border-green-200 dark:border-green-800" : ""
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggle(row.key)}
                      disabled={isForced}
                      className={`mt-0.5 flex h-9 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${
                        isOn
                          ? "bg-green-500 justify-end"
                          : "bg-muted justify-start"
                      } ${isForced ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <span className="h-7 w-7 rounded-full bg-white shadow-sm" />
                    </button>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <row.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground text-sm">
                          {row.label}
                        </span>
                        {isForced && (
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            Automático
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {row.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Rule info */}
        {settings.include_amenity_bookings_in_building_balance && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              El balance de edificio está activo, por lo que el balance del
              condominio se habilita automáticamente. No se permite tener
              balance de edificio sin balance consolidado.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
