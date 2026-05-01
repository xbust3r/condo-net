"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Receipt } from "lucide-react";

interface PaymentItem {
  id: number;
  uuid: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  payment_date?: string;
  receipt_number?: string;
  ar_id?: number;
  unit_code?: string;
}

export default function PaymentsPage() {
  const { selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function fetchPayments() {
      setLoading(true);
      setError("");

      const { data, error: apiError } = await api.get<{
        success: boolean;
        data: { items: PaymentItem[]; total: number };
      }>(`/payments?condominium_id=${selectedCondominium!.id}&limit=200`);

      if (apiError) {
        setError(apiError.message || "Error al cargar pagos");
      } else if (data?.data?.items) {
        setPayments(data.data.items);
      }
      setLoading(false);
    }

    fetchPayments();
  }, [selectedCondominium, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Section title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
          <CreditCard className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pagos</h2>
          <p className="text-xs text-muted-foreground">{payments.length} registrados</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {payments.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-center text-sm text-muted-foreground">
              No se encontraron pagos registrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((p) => (
            <Card key={p.id} className="border shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {formatCurrency(p.amount, p.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.receipt_number
                      ? `Recibo ${p.receipt_number}`
                      : `Pago #${p.id}`}
                    {p.unit_code ? ` · ${p.unit_code}` : ""}
                    {p.payment_date ? ` · ${formatDate(p.payment_date)}` : ""}
                  </p>
                </div>
                {p.payment_method && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {p.payment_method}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
