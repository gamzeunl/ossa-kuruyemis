"use client";

import { useActionState, useState } from "react";
import {
  addProductImageAction,
  removeProductImageAction,
  setPrimaryProductImageAction,
  updateProductImageAltAction,
} from "@/actions/admin-products";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { ProductImageUploader, type UploadedProductImage } from "@/components/admin/product-image-uploader";
import { ProductImage } from "@/components/catalog/product-image";

export interface AdminProductImageData {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-colors";

function ImageRow({ productId, image }: { productId: string; image: AdminProductImageData }) {
  async function altAction(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await updateProductImageAltAction(productId, image.id, formData);
    return result.ok ? { message: null, success: true } : { message: result.message, success: false };
  }

  const [altState, altFormAction, altPending] = useActionState(altAction, initialState);

  async function primaryAction(): Promise<FormState> {
    const result = await setPrimaryProductImageAction(productId, image.id);
    return result.ok ? { message: null, success: true } : { message: result.message, success: false };
  }

  const [primaryState, primaryFormAction, primaryPending] = useActionState(primaryAction, initialState);

  return (
    <div className="border-border-muted flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start">
      <div className="bg-surface-muted border-border-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border">
        <ProductImage src={image.url} alt={image.altText ?? ""} sizes="96px" className="object-cover" />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {image.isPrimary ? (
          <span className="bg-brand/10 text-brand w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold">
            Ana Görsel
          </span>
        ) : null}

        <form action={altFormAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-foreground flex flex-1 flex-col gap-1 text-xs font-medium">
            Alt metin
            <input name="altText" type="text" defaultValue={image.altText ?? ""} className={inputClassName} />
          </label>
          <button
            type="submit"
            disabled={altPending}
            className="border-border-muted hover:border-brand min-h-9 shrink-0 rounded-full border px-4 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {altPending ? "Kaydediliyor…" : "Alt Metni Kaydet"}
          </button>
        </form>
        {altState.message ? <p className="text-xs font-medium text-red-700">{altState.message}</p> : null}

        <div className="flex flex-wrap items-center gap-4">
          {!image.isPrimary ? (
            <form action={primaryFormAction}>
              <button
                type="submit"
                disabled={primaryPending}
                className="text-brand text-xs font-semibold underline underline-offset-2 disabled:opacity-60"
              >
                {primaryPending ? "Kaydediliyor…" : "Ana Görsel Yap"}
              </button>
            </form>
          ) : null}
          <ContentDeleteForm
            action={removeProductImageAction.bind(null, productId, image.id)}
            confirmMessage="Bu görseli kaldırmak istediğinize emin misiniz?"
          />
        </div>
        {primaryState.message ? <p className="text-xs font-medium text-red-700">{primaryState.message}</p> : null}
      </div>
    </div>
  );
}

/**
 * Ürün görsellerini yönetir — mevcut `StorageProvider`/`resolveStorageProvider`
 * kullanılır (bkz. `admin-products.ts`), yeni bir upload sistemi KURULMAZ.
 * Her satır (alt metin/ana görsel/kaldır) ve yükleme formu BAĞIMSIZ, küçük
 * action'lardır — büyük "Kaydet" formuna dahil DEĞİLDİR (görsel işlemleri
 * anlık/tek adımlıdır).
 */
export function ProductImageManager({
  productId,
  images,
}: {
  productId: string;
  images: AdminProductImageData[];
}) {
  async function uploadAction(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await addProductImageAction(productId, formData);
    return result.ok ? { message: null, success: true } : { message: result.message, success: false };
  }

  const [uploadState, uploadFormAction, uploadPending] = useActionState(uploadAction, initialState);
  const [pendingUpload, setPendingUpload] = useState<UploadedProductImage | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [altText, setAltText] = useState("");

  // `addProductImageAction` başarıyla `ProductImage` satırını oluşturunca
  // mini-form'u sıfırla — bir sonraki görsel için önizleme/hidden URL temiz
  // başlar (bkz. `ProductCreateForm`'daki AYNI "orphan bırakma" ilkesi).
  // Render sırasında, önceki render'ın `uploadState`'iyle karşılaştırarak
  // sıfırlanır (React'in resmî "önceki render'dan bilgi sakla" deseni —
  // `useState`, `useRef` DEĞİL: ref'e render sırasında yazmak/okumak React
  // Compiler kurallarıyla uyumsuzdur). Bir `useEffect` İÇİNDE `setState`
  // çağırıp gereksiz ek render turu da YARATILMAZ.
  const [lastHandledUploadState, setLastHandledUploadState] = useState(uploadState);
  if (lastHandledUploadState !== uploadState) {
    setLastHandledUploadState(uploadState);
    if (uploadState.success && pendingUpload) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
      setPendingUpload(null);
      setAltText("");
    }
  }

  function handleUploaded(image: UploadedProductImage) {
    // Önceki yüklenmiş ama HENÜZ "Görsel Ekle"ye basılmadan değiştirilen bir
    // dosya varsa, onun fiziksel dosyası orphan kalmasın diye best-effort silinir.
    if (pendingUpload) {
      URL.revokeObjectURL(pendingUpload.previewUrl);
      void fetch(`/api/yonetim/urun-gorseli?url=${encodeURIComponent(pendingUpload.url)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    setPendingUpload(image);
  }

  function discardPendingUpload() {
    if (!pendingUpload) return;
    URL.revokeObjectURL(pendingUpload.previewUrl);
    void fetch(`/api/yonetim/urun-gorseli?url=${encodeURIComponent(pendingUpload.url)}`, {
      method: "DELETE",
    }).catch(() => {});
    setPendingUpload(null);
  }

  return (
    <section className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
      <h2 className="text-foreground text-base font-bold">Görseller</h2>

      {images.length === 0 ? (
        <p className="text-foreground/60 text-sm">Henüz görsel eklenmedi.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {images.map((image) => (
            <ImageRow key={image.id} productId={productId} image={image} />
          ))}
        </div>
      )}

      <form
        action={uploadFormAction}
        className="border-border-muted flex flex-col gap-3 rounded-lg border border-dashed p-4"
      >
        {uploadState.message ? (
          <p role="alert" className="text-xs font-medium text-red-700">
            {uploadState.message}
          </p>
        ) : null}
        <span className="text-foreground text-sm font-semibold">Yeni görsel ekle</span>

        {pendingUpload ? (
          <div className="flex items-center gap-3">
            <div className="bg-surface-muted border-border-muted relative h-20 w-20 overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: önizleme URL'i, next/image bunu desteklemez */}
              <img src={pendingUpload.previewUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <button
              type="button"
              onClick={discardPendingUpload}
              className="text-brand text-xs font-semibold underline underline-offset-2"
            >
              Değiştir
            </button>
          </div>
        ) : (
          <ProductImageUploader
            onUploaded={handleUploaded}
            onUploadingChange={setIsUploadingFile}
            buttonLabel="Ürün görseli seç"
          />
        )}
        <input type="hidden" name="imageUrl" value={pendingUpload?.url ?? ""} />

        <label className="text-foreground flex flex-col gap-1 text-xs font-medium">
          Alt metin <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input
            name="altText"
            type="text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            className={inputClassName}
          />
        </label>
        <p className="text-foreground/50 text-xs">
          JPEG, PNG veya WEBP, en fazla 5 MB — yükleme sırasında otomatik optimize edilir. Üründe hiç görsel yoksa
          yeni görsel otomatik ana görsel olur.
        </p>
        <button
          type="submit"
          disabled={uploadPending || isUploadingFile || !pendingUpload}
          className="bg-brand hover:bg-brand-dark text-brand-foreground w-fit min-h-10 rounded-full px-5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploadPending ? "Kaydediliyor…" : "Görsel Ekle"}
        </button>
      </form>
    </section>
  );
}
