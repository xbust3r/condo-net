"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Download, Eye, Calendar, Hash, Banknote } from "lucide-react";

interface ReceiptItem {
  id: number;
  uuid: string;
  receipt_number: string;
  issued_at: string;
  amount_paid: number;
  payment_method: string;
  reference?: string;
  notes?: string;
  unit_code?: string;
  ar_id?: number;
  ar_reference?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function paymentMethodLabel(m: string): string {
  const map: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
    deposit: "Depósito",
    yape: "Yape / Plin",
    other: "Otro",
  };
  return map[m] ?? m;
}

export default function ReceiptsPage() {
  const { selectedCondominium, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function fetchReceipts() {
      setLoading(true);
      setError("");

      // Fetch receipts for all units the user owns
      const ownerships = user?.ownerships ?? [];
      const unitIds = ownerships
        .filter((o) => o.condominium_id === selectedCondominium!.id)
        .map((o) => o.unit_id);

      if (unitIds.length === 0) {
        setReceipts([]);
        setLoading(false);
        return;
      }

      // Fetch receipts for each unit in parallel
      const results = await Promise.all(
        unitIds.map(async (unitId) => {
          const { data, error: apiError } = await api.get<{
            success: boolean;
            data: { items: ReceiptItem[]; total: number };
          }>(`/receipts?unit_id=${unitId}&limit=50`);

          if (apiError) return [] as ReceiptItem[];
          return (data?.data?.items ?? []) as ReceiptItem[];
        })
      );

      const allReceipts = results.flat().sort(
        (a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
      );

      setReceipts(allReceipts);
      setLoading(false);
    }

    fetchReceipts();
  }, [selectedCondominium, authLoading, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            Recibos de Mantenimiento
          </h1>
          <p className="text-xs text-muted-foreground">
            {receipts.length} comprobante{receipts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {receipts.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No tienes recibos aún
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Los comprobantes aparecerán aquí cuando registres pagos
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <Card
              key={r.id}
              className="border shadow-sm overflow-hidden hover:bg-muted/30 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Receipt number + date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs">
                        <Hash className="h-3 w-3 mr-1" />
                        {r.receipt_number}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(r.issued_at)}
                      </span>
                    </div>

                    {/* Amount + method */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold text-foreground">
                        {formatCurrency(r.amount_paid)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <Banknote className="h-3 w-3 mr-1" />
                        {paymentMethodLabel(r.payment_method)}
                      </Badge>
                    </div>

                    {/* Reference */}
                    {r.ar_reference && (
                      <p className="text-xs text-muted-foreground">
                        Concepto: {r.ar_reference}
                      </p>
                    )}
                    {r.unit_code && (
                      <p className="text-xs text-muted-foreground/60">
                        Unidad: {r.unit_code}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    title="Ver recibo"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
