"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Image,
  User,
  Calendar,
  Hash,
  Banknote,
  Loader2,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { RejectProofDialog } from "@/components/reject-proof-dialog";

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

interface ProofReviewBandejaProps {
  proofs: ProofItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  if (mime === "application/pdf") return <FileText className="h-10 w-10 text-red-500" />;
  return <Image className="h-10 w-10 text-blue-500" />;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProofReviewBandeja({
  proofs,
  loading,
  error,
  onRefresh,
}: ProofReviewBandejaProps) {
  const t = useTranslations("forms");
  const [bankNames, setBankNames] = useState<Record<number, string>>({});
  const [txnCodes, setTxnCodes] = useState<Record<number, string>>({});
  const [notesMap, setNotesMap] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [actionError, setActionError] = useState<Record<number, string>>({});
  const [rejectTarget, setRejectTarget] = useState<ProofItem | null>(null);

  async function handleApprove(proof: ProofItem) {
    const bank = bankNames[proof.id]?.trim();
    const txn = txnCodes[proof.id]?.trim();

    if (!bank || !txn) {
      setActionError((prev) => ({
        ...prev,
        [proof.id]: t("bankAndCodeRequired"),
      }));
      return;
    }

    setSubmitting((prev) => ({ ...prev, [proof.id]: true }));
    setActionError((prev) => ({ ...prev, [proof.id]: "" }));

    const { error: apiError } = await api.post(
      `/payment-proofs/${proof.id}/approve`,
      {
        bank_name: bank,
        transaction_code: txn,
        notes: notesMap[proof.id]?.trim() || undefined,
      }
    );

    if (apiError) {
      setActionError((prev) => ({ ...prev, [proof.id]: apiError.message }));
    } else {
      onRefresh();
    }

    setSubmitting((prev) => ({ ...prev, [proof.id]: false }));
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;

    const { error: apiError } = await api.post(
      `/payment-proofs/${rejectTarget.id}/reject`,
      { rejection_reason: reason }
    );

    if (apiError) {
      throw new Error(apiError.message);
    }

    setRejectTarget(null);
    onRefresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4 text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (proofs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Clock className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t("noPendingProofs")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {proofs.map((proof) => (
          <Card key={proof.id} className="border shadow-sm overflow-hidden">
            <CardContent className="p-4 space-y-3">
              {/* Header: file info + submitter */}
              <div className="flex items-start gap-3">
                {getFileIcon(proof.mime_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {proof.original_filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(proof.file_size_bytes)} · {proof.mime_type}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {t("pending")}
                </Badge>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {proof.submitted_by_name || `${t("user")} #${proof.submitted_by}`}
                </div>
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {proof.unit_code || `${t("unit")} #${proof.unit_id}`}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(proof.created_at)}
                </div>
                {proof.ar_amount != null && (
                  <div className="flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    {formatCurrency(proof.ar_amount)}
                  </div>
                )}
              </div>

              {proof.ar_reference && (
                <p className="text-xs text-muted-foreground">
                  {t("concept")}: {proof.ar_reference}
                </p>
              )}

              {/* File link */}
              <a
                href={proof.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Eye className="h-3 w-3" />
                {t("viewFile")}
              </a>

              {/* Admin data inputs */}
              <div className="space-y-2 pt-2 border-t">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      {t("bank")} *
                    </label>
                    <Input
                      placeholder="BCP, BBVA..."
                      value={bankNames[proof.id] || ""}
                      onChange={(e) => {
                        setBankNames((prev) => ({
                          ...prev,
                          [proof.id]: e.target.value,
                        }));
                        setActionError((prev) => ({ ...prev, [proof.id]: "" }));
                      }}
                      disabled={submitting[proof.id]}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      {t("transactionCode")} *
                    </label>
                    <Input
                      placeholder="N° de operación"
                      value={txnCodes[proof.id] || ""}
                      onChange={(e) => {
                        setTxnCodes((prev) => ({
                          ...prev,
                          [proof.id]: e.target.value,
                        }));
                        setActionError((prev) => ({ ...prev, [proof.id]: "" }));
                      }}
                      disabled={submitting[proof.id]}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">
                    {t("notes")}
                  </label>
                  <Textarea
                    placeholder={t("optional") + "..."}
                    value={notesMap[proof.id] || ""}
                    onChange={(e) =>
                      setNotesMap((prev) => ({
                        ...prev,
                        [proof.id]: e.target.value,
                      }))
                    }
                    disabled={submitting[proof.id]}
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Error */}
                {actionError[proof.id] && (
                  <p className="text-xs text-destructive">{actionError[proof.id]}</p>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectTarget(proof)}
                    disabled={submitting[proof.id]}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t("reject")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(proof)}
                    disabled={submitting[proof.id]}
                  >
                    {submitting[proof.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    {t("approvePayment")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject dialog */}
      {rejectTarget && (
        <RejectProofDialog
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          proofFile={rejectTarget.original_filename}
          proofId={rejectTarget.id}
        />
      )}
    </>
  );
}
