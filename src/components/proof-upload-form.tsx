"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, FileText, Image, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

// ── Constants ──────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Types ──────────────────────────────────────────────────────────────────

interface ProofUploadFormProps {
  arId: number;
  condominiumId: number;
  unitId: number;
  arReference?: string;
  arAmount?: number;
  unitCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (mime === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />;
  return <Image className="h-8 w-8 text-blue-500" />;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProofUploadForm({
  arId,
  condominiumId,
  unitId,
  arReference,
  arAmount,
  unitCode,
  onSuccess,
  onCancel,
}: ProofUploadFormProps) {
  const t = useTranslations("forms");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ─────────────────────────────────────────────────────────

  const validateFile = useCallback((f: File): string | null => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return t("invalidFormat", { ext });
    }
    if (!ALLOWED_MIME_TYPES.includes(f.type) && f.type !== "") {
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return t("fileTypeNotAllowed", { type: f.type || t("unknown") });
      }
    }
    if (f.size > MAX_FILE_SIZE) {
      return t("fileSizeExceeded", { maxSize: formatSize(MAX_FILE_SIZE) });
    }
    if (f.size === 0) {
      return t("fileEmpty");
    }
    return null;
  }, [t]);

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleFileSelect(f: File | null) {
    setError("");
    if (!f) {
      setFile(null);
      return;
    }
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFileSelect(f || null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("ar_id", String(arId));
    formData.append("condominium_id", String(condominiumId));
    formData.append("unit_id", String(unitId));
    formData.append("file", file);

    const { error: apiError } = await api.upload("/payment-proofs", formData);

    if (apiError) {
      setError(apiError.message);
      setUploading(false);
      return;
    }

    setUploading(false);
    onSuccess();
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card className="border shadow-md">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{t("uploadPaymentProof")}</h3>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={uploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* AR Info */}
        {arReference && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">{t("concept")}:</span>{" "}
              <span className="font-medium">{arReference}</span>
            </p>
            {arAmount != null && (
              <p>
                <span className="text-muted-foreground">{t("pendingAmount")}:</span>{" "}
                <span className="font-semibold">
                  S/ {arAmount.toFixed(2)}
                </span>
              </p>
            )}
            {unitCode && (
              <p>
                <span className="text-muted-foreground">{t("unit")}:</span>{" "}
                <span className="font-medium">{unitCode}</span>
              </p>
            )}
          </div>
        )}

        {/* Drop zone */}
        {!file ? (
          <div
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              className={`h-10 w-10 ${
                dragOver ? "text-primary" : "text-muted-foreground/50"
              }`}
            />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {t("dragFileHere")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("clickToSelect")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground/60">
              {t("fileFormats")}: JPG, PNG, WebP, PDF · {t("maxSize")} {formatSize(MAX_FILE_SIZE)}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            />
          </div>
        ) : (
          /* File preview */
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {file.type || t("unknown")} · {formatSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={uploading}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                {t("uploading")}
              </>
            ) : (
              t("uploadProof")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
