"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RejectProofDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  proofFile: string;
  proofId: number;
}

export function RejectProofDialog({
  open,
  onClose,
  onConfirm,
  proofFile,
  proofId,
}: RejectProofDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!reason.trim()) {
      setError("El motivo de rechazo es requerido.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (e: any) {
      setError(e?.message || "Error al rechazar el comprobante.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (!submitting) {
      setReason("");
      setError("");
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Rechazar Comprobante
          </DialogTitle>
          <DialogDescription>
            Estás por rechazar el comprobante{" "}
            <span className="font-medium text-foreground">{proofFile}</span>.
            Esto no registrará ningún pago. El residente podrá ver el motivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">
              Motivo del rechazo *
            </label>
            <Textarea
              placeholder="Ej: El comprobante está borroso, no se puede leer el código de transacción..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              rows={3}
              maxLength={500}
              className="mt-1.5"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/500 caracteres
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Rechazando...
              </>
            ) : (
              "Confirmar Rechazo"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
