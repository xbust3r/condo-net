"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Image,
  Eye,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { ProofUploadForm } from "@/components/proof-upload-form";
import { ProofReviewBandeja } from "@/components/proof-review-bandeja";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProofItem {
  id: number;
  uuid: string;
  ar_id: number;
  unit_id: number;
  condominium_id: number;
  submitted_by: number;
  file_url: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  status: "pending_review" | "approved" | "rejected";
  bank_name?: string;
  transaction_code?: string;
  notes?: string;
  rejection_reason?: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
  reviewed_at?: string;
  payment_id?: number;
  receipt_id?: number;
  created_at: string;
  submitted_by_name?: string;
  unit_code?: string;
  condominium_name?: string;
  ar_reference?: string;
  ar_amount?: number;
  receipt_number?: string;
}

interface ARItem {
  id: number;
  uuid: string;
  reference_code?: string;
  description?: string;
  amount: number;
  paid_amount: number;
  pending_amount: number;
  status: string;
  due_date?: string;
  period?: string;
  unit_id?: number;
  unit_code?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
}

function getFileIcon(mime: string) {
  if (mime === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />;
  return <Image className="h-8 w-8 text-blue-500" />;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending_review":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> Pendiente
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" /> Aprobado
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Rechazado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PaymentProofsPage() {
  const { user, selectedCondominium, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [pendingARs, setPendingARs] = useState<ARItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<ARItem | null>(null);
  const [activeTab, setActiveTab] = useState("my-proofs");

  // Admin check
  const isAdmin = useCallback(() => {
    if (!user?.roles_by_condominium || !selectedCondominium?.id) return false;
    const roles = user.roles_by_condominium[selectedCondominium.id] || [];
    return roles.some((r: any) =>
      ["admin", "accountant", "super_admin"].includes(r.role || r.name)
    );
  }, [user, selectedCondominium]);

  const admin = isAdmin();

  // ── Fetch proofs ──────────────────────────────────────────────────────

  const fetchProofs = useCallback(async () => {
    if (!selectedCondominium?.id) return;

    const params = new URLSearchParams({
      condominium_id: String(selectedCondominium.id),
      limit: "200",
    });

    // If resident, only fetch own proofs
    if (!admin && user?.id) {
      params.set("submitted_by", String(user.id));
    }

    const { data, error: apiError } = await api.get<{
      success: boolean;
      data: { items: ProofItem[]; total: number };
    }>(`/payment-proofs?${params}`);

    if (apiError) {
      setError(apiError.message);
    } else if (data?.data?.items) {
      setProofs(data.data.items);
    }
  }, [selectedCondominium, user, admin]);

  // ── Fetch pending ARs (for upload) ────────────────────────────────────

  const fetchPendingARs = useCallback(async () => {
    if (!selectedCondominium?.id || !user?.ownerships) return;

    const ownerships = user.ownerships.filter(
      (o) => o.condominium_id === selectedCondominium.id
    );

    if (ownerships.length === 0) return;

    const results = await Promise.all(
      ownerships.map(async (own) => {
        const { data } = await api.get<{
          success: boolean;
          data: { items: ARItem[]; total: number };
        }>(
          `/accounts-receivable?condominium_id=${selectedCondominium.id}&unit_id=${own.unit_id}&status=pending&status=partial&status=overdue&limit=50`
        );
        return data?.data?.items || [];
      })
    );

    setPendingARs(results.flat().filter((ar) => ar.pending_amount > 0));
  }, [selectedCondominium, user]);

  // ── Initial load ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !selectedCondominium) {
      router.replace("/select-condo");
      return;
    }
    if (!selectedCondominium) return;

    async function load() {
      setLoading(true);
      await Promise.all([fetchProofs(), fetchPendingARs()]);
      setLoading(false);
    }
    load();
  }, [selectedCondominium, authLoading, router, fetchProofs, fetchPendingARs]);

  // ── Loading ───────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Admin pending proofs ──────────────────────────────────────────────

  const adminPending = proofs.filter((p) => p.status === "pending_review");

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col px-4 py-4 pb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Comprobantes de Pago
            </h2>
            <p className="text-xs text-muted-foreground">
              {proofs.length} comprobante{proofs.length !== 1 ? "s" : ""}
              {admin ? ` · ${adminPending.length} pendiente${adminPending.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchProofs} title="Actualizar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Admin: pending review bandeja */}
      {admin && adminPending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
            <Clock className="h-4 w-4 text-amber-500" />
            Pendientes de Revisión ({adminPending.length})
          </h3>
          <ProofReviewBandeja
            proofs={adminPending}
            loading={false}
            error=""
            onRefresh={fetchProofs}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="my-proofs" className="flex-1">
            Mis Comprobantes
          </TabsTrigger>
          {!admin && pendingARs.length > 0 && (
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="h-3 w-3 mr-1" />
              Subir
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Proofs tab */}
        <TabsContent value="my-proofs" className="mt-3 space-y-3">
          {/* Upload button for resident */}
          {!admin && !showUpload && pendingARs.length > 0 && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (pendingARs.length === 1) {
                  setUploadTarget(pendingARs[0]);
                }
                setShowUpload(true);
              }}
            >
              <Upload className="h-4 w-4" />
              Subir Comprobante
            </Button>
          )}

          {/* Upload form */}
          {showUpload && (
            <ProofUploadForm
              arId={uploadTarget?.id || pendingARs[0]?.id || 0}
              condominiumId={selectedCondominium?.id || 0}
              unitId={uploadTarget?.unit_id || pendingARs[0]?.unit_id || 0}
              arReference={
                uploadTarget?.reference_code ||
                pendingARs[0]?.reference_code
              }
              arAmount={uploadTarget?.pending_amount ?? pendingARs[0]?.pending_amount}
              unitCode={uploadTarget?.unit_code || pendingARs[0]?.unit_code}
              onSuccess={() => {
                setShowUpload(false);
                setUploadTarget(null);
                fetchProofs();
              }}
              onCancel={() => {
                setShowUpload(false);
                setUploadTarget(null);
              }}
            />
          )}

          {/* AR selector for upload (if multiple pending) */}
          {!admin && showUpload && !uploadTarget && pendingARs.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Selecciona el mantenimiento a pagar:
              </p>
              {pendingARs.map((ar) => (
                <Card
                  key={ar.id}
                  className="border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setUploadTarget(ar)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {ar.reference_code || ar.description || `AR #${ar.id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ar.unit_code} · Vence: {formatDate(ar.due_date)}
                      </p>
                    </div>
                    <span className="font-semibold text-sm">
                      {formatCurrency(ar.pending_amount)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Proofs list */}
          {proofs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <Receipt className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-center text-sm text-muted-foreground">
                  No has subido comprobantes aún.
                </p>
              </CardContent>
            </Card>
          ) : (
            proofs.map((proof) => (
              <Card key={proof.id} className="border shadow-sm overflow-hidden">
                <CardContent className="p-4 space-y-2">
                  {/* File info + status */}
                  <div className="flex items-start gap-3">
                    {getFileIcon(proof.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {proof.original_filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(proof.file_size_bytes)} ·{" "}
                        {formatDate(proof.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(proof.status)}
                  </div>

                  {/* AR info */}
                  {proof.ar_reference && (
                    <p className="text-xs text-muted-foreground">
                      Concepto: {proof.ar_reference}
                      {proof.ar_amount != null &&
                        ` · ${formatCurrency(proof.ar_amount)}`}
                    </p>
                  )}

                  {/* Approved: receipt info */}
                  {proof.status === "approved" && proof.receipt_number && (
                    <p className="text-xs text-green-600 font-medium">
                      Recibo: {proof.receipt_number}
                    </p>
                  )}

                  {/* Rejected: reason */}
                  {proof.status === "rejected" && proof.rejection_reason && (
                    <p className="text-xs text-destructive">
                      Motivo: {proof.rejection_reason}
                    </p>
                  )}

                  {/* Admin-only fields */}
                  {admin && proof.bank_name && (
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                      <p>Banco: {proof.bank_name}</p>
                      {proof.transaction_code && (
                        <p>Cód. Transacción: {proof.transaction_code}</p>
                      )}
                      {proof.reviewed_by_name && (
                        <p>Revisado por: {proof.reviewed_by_name}</p>
                      )}
                    </div>
                  )}

                  {/* File link */}
                  <a
                    href={proof.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Eye className="h-3 w-3" />
                    Ver archivo
                  </a>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
