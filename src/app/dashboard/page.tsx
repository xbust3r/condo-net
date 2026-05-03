"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Users,
  CreditCard,
  Building2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Bell,
  BellOff,
  MessageSquareWarning,
  CalendarRange,
  Settings2,
  User,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface PaymentStatus {
  is_up_to_date: boolean;
  pending_amount?: number;
  currency?: string;
  pending_count?: number;
}

interface AnnouncementItem {
  id: number;
  title: string;
  body?: string;
  created_at?: string;
  published_at?: string;
  updated_at?: string;
}

// ── Quick links (residente) ───────────────────────────────────────────────

const quickLinks = [
  { label: "Mis pagos", icon: CreditCard, color: "text-chart-3", bg: "bg-chart-3/10", path: "/dashboard/payments" },
  { label: "Comunicados", icon: Bell, color: "text-chart-1", bg: "bg-chart-1/10", path: "/dashboard/communications" },
  { label: "Incidencias", icon: MessageSquareWarning, color: "text-destructive", bg: "bg-destructive/10", path: "/dashboard/incidents" },
  { label: "Visitantes", icon: Users, color: "text-chart-2", bg: "bg-chart-2/10", path: "/dashboard/visitors" },
  { label: "Áreas comunes", icon: CalendarRange, color: "text-chart-4", bg: "bg-chart-4/10", path: "/dashboard/amenities" },
  { label: "Reservas", icon: CalendarRange, color: "text-chart-5", bg: "bg-chart-5/10", path: "/dashboard/bookings" },
  { label: "Configuración", icon: Settings2, color: "text-chart-5", bg: "bg-chart-5/10", path: "/dashboard/settings" },
  { label: "Mi perfil", icon: User, color: "text-chart-5", bg: "bg-chart-5/10", path: "/dashboard/profile" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency?: string) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency || "PEN",
  }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [commsCount, setCommsCount] = useState<number>(0);
  const [latestComm, setLatestComm] = useState<AnnouncementItem | null>(null);
  const [commsLoading, setCommsLoading] = useState(true);

  // ── Redirect if no condo selected ─────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
    }
  }, [selectedCondominium, authLoading, router]);

  // ── Fetch data on mount ───────────────────────────────────────────────

  useEffect(() => {
    if (!selectedCondominium) return;

    let cancelled = false;

    async function fetchAll() {
      // ── Payment status ──────────────────────────────────────────────
      setPaymentLoading(true);

      // Primary: /payments/status → fallback: /ar/user-summary → fallback: /ar/summary
      const { data: payData } = await api.get<{
        success: boolean;
        data: PaymentStatus;
      }>(`/payments/status?condominium_id=${selectedCondominium!.id}`);

      if (!cancelled) {
        if (payData?.data) {
          setPaymentStatus(payData.data);
        } else {
          // Fallback 1: AR user summary
          const { data: arData } = await api.get<{
            success: boolean;
            data: { is_up_to_date: boolean; pending_amount: number; currency?: string; pending_count: number };
          }>(`/ar/user-summary?condominium_id=${selectedCondominium!.id}`);

          if (!cancelled) {
            if (arData?.data) {
              setPaymentStatus(arData.data);
            } else {
              // Fallback 2: AR summary (may have different shape)
              const { data: arSumData } = await api.get<{
                success: boolean;
                data: { total_pending: number; currency?: string; count: number };
              }>(`/ar/summary?condominium_id=${selectedCondominium!.id}`);

              if (!cancelled) {
                if (arSumData?.data) {
                  setPaymentStatus({
                    is_up_to_date: arSumData.data.total_pending === 0,
                    pending_amount: arSumData.data.total_pending,
                    currency: arSumData.data.currency,
                    pending_count: arSumData.data.count,
                  });
                } else {
                  setPaymentStatus(null);
                }
              }
            }
          }
        }
        setPaymentLoading(false);
      }

      // ── Communications ───────────────────────────────────────────────
      setCommsLoading(true);

      // Primary: /communications → fallback: /announcements
      const { data: commData } = await api.get<{
        success: boolean;
        data: AnnouncementItem[];
        total: number;
        message: string;
      }>(`/communications?condominium_id=${selectedCondominium!.id}&limit=1`);

      if (!cancelled) {
        if (commData?.data && Array.isArray(commData.data)) {
          // Communications endpoint (if it exists) returns { data: [...items], total: N }
          setCommsCount(commData.total ?? commData.data.length);
          setLatestComm(commData.data[0] ?? null);
        } else {
          // Fallback: /announcements — response shape: { success, data: [...items], total: N }
          const { data: annData } = await api.get<{
            success: boolean;
            data: AnnouncementItem[];
            total: number;
            message: string;
          }>(`/announcements?condominium_id=${selectedCondominium!.id}&limit=1`);

          if (!cancelled) {
            if (annData?.data && Array.isArray(annData.data)) {
              // annData.data = array of items (confirmed backend shape)
              setCommsCount(annData.total ?? annData.data.length);
              setLatestComm(annData.data[0] ?? null);
            } else {
              setCommsCount(0);
              setLatestComm(null);
            }
          }
        }
        setCommsLoading(false);
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [selectedCondominium]);

  // ── Loading ───────────────────────────────────────────────────────────

  if (authLoading || !selectedCondominium) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Welcome */}
      <div className="mb-5">
        <p className="text-sm text-muted-foreground">
          ¡Hola{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {selectedCondominium.code && `${selectedCondominium.code} · `}
          {[selectedCondominium.city, selectedCondominium.country]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      {/* ── Status cards ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Payment status */}
        <Card
          className={`border shadow-sm overflow-hidden ${
            paymentStatus?.is_up_to_date
              ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800"
              : paymentStatus && !paymentStatus.is_up_to_date
                ? "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800"
                : ""
          }`}
        >
          <CardContent className="p-4">
            {paymentLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Verificando estado de pagos...
                </span>
              </div>
            ) : paymentStatus ? (
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    paymentStatus.is_up_to_date
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                  }`}
                >
                  {paymentStatus.is_up_to_date ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {paymentStatus.is_up_to_date
                      ? "¡Al día en sus pagos!"
                      : "Pagos pendientes"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {paymentStatus.is_up_to_date
                      ? "No tienes deudas registradas"
                      : paymentStatus.pending_amount != null
                        ? `Debes ${formatCurrency(paymentStatus.pending_amount, paymentStatus.currency)}${paymentStatus.pending_count ? ` en ${paymentStatus.pending_count} ${paymentStatus.pending_count === 1 ? "recibo" : "recibos"}` : ""}`
                        : "Tienes recibos pendientes de pago"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 opacity-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Estado de pagos
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    No disponible por el momento
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communications */}
        <Card
          className={`border shadow-sm overflow-hidden ${
            commsCount > 0
              ? "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800"
              : ""
          }`}
        >
          <CardContent className="p-4">
            {commsLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Buscando comunicados...
                </span>
              </div>
            ) : commsCount > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {commsCount === 1
                      ? "1 comunicado pendiente"
                      : `${commsCount} comunicados pendientes`}
                  </p>
                  {latestComm && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {latestComm.title}
                      {latestComm.created_at || latestComm.published_at
                        ? ` · ${formatDate(latestComm.created_at || latestComm.published_at)}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <BellOff className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Comunicados
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sin novedades
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Quick access menu ──────────────────────────────────────────── */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
        Acceso rápido
      </p>
      <div className="flex flex-col gap-1 mb-6">
        {quickLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => router.push(link.path)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation active:scale-[0.98]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${link.bg} ${link.color}`}>
              <link.icon className="h-5 w-5" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-foreground">
              {link.label}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
        ))}
      </div>

      {/* ── Condo info card ────────────────────────────────────────────── */}
      <Card className="border shadow-sm bg-gradient-to-br from-card to-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Condominio
            </span>
          </div>
          <h3 className="font-bold text-foreground">{selectedCondominium.name}</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {selectedCondominium.code && (
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">Código</p>
                <p className="text-sm font-medium text-foreground">{selectedCondominium.code}</p>
              </div>
            )}
            {selectedCondominium.city && (
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">Ciudad</p>
                <p className="text-sm font-medium text-foreground">{selectedCondominium.city}</p>
              </div>
            )}
            {selectedCondominium.address && (
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground/60 uppercase">Dirección</p>
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {selectedCondominium.address}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase">Tema</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {selectedCondominium.theme_id || "default"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
