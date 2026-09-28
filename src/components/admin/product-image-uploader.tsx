"use client";

import { useRef, useState } from "react";

export interface UploadedProductImage {
  url: string;
  previewUrl: string;
}

interface ProductImageUploaderProps {
  onUploaded: (image: UploadedProductImage) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  disabled?: boolean;
  buttonLabel?: string;
}

/**
 * Ürün görselini Server Action'a HİÇ göndermeden yükler — dosya, ayrı
 * `/api/yonetim/urun-gorseli` Route Handler'ına `fetch` ile POST edilir
 * (bkz. o dosyadaki üst yorum), yalnızca dönen küçük URL string'i
 * `onUploaded` ile çağırana bildirilir. `ProductCreateForm` (oluşturma,
 * çoklu görsel) ve `ProductImageManager` (düzenleme, tekli görsel) AYNI
 * component'i kullanır — iki ayrı upload sistemi KURULMADI.
 */
export function ProductImageUploader({
  onUploaded,
  onUploadingChange,
  disabled,
  buttonLabel = "Görsel seç",
}: ProductImageUploaderProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);
    onUploadingChange?.(true);
    const previewUrl = URL.createObjectURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/yonetim/urun-gorseli", { method: "POST", body: formData });
      const data: { url?: string; message?: string } = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        setStatus("error");
        setErrorMessage(data.message ?? "Görsel yüklenemedi.");
        URL.revokeObjectURL(previewUrl);
        return;
      }

      setStatus("idle");
      onUploaded({ url: data.url, previewUrl });
    } catch {
      setStatus("error");
      setErrorMessage("Görsel yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.");
      URL.revokeObjectURL(previewUrl);
    } finally {
      onUploadingChange?.(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || status === "uploading"}
        onChange={handleChange}
        aria-label={buttonLabel}
        className="border-border-muted file:bg-brand file:hover:bg-brand-dark w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-foreground disabled:cursor-not-allowed disabled:opacity-60"
      />
      {status === "uploading" ? (
        <p role="status" className="text-foreground/60 text-xs font-medium">
          Yükleniyor…
        </p>
      ) : null}
      {status === "error" && errorMessage ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
