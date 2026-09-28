import { ProductImage } from "@/components/catalog/product-image";

interface ImageUploadFieldProps {
  currentImageUrl: string | null;
  currentImageAlt?: string;
  /** Oluşturma formlarında (henüz mevcut görsel yokken) dosya zorunludur. */
  required?: boolean;
}

/** Banner/Etkinlik Kartı/Kategori Görseli formlarının ortak dosya yükleme alanı — `LocalStorageProvider`'a `admin-*.ts` action'ları içinde yazılır. */
export function ImageUploadField({ currentImageUrl, currentImageAlt, required }: ImageUploadFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-foreground text-sm font-medium">Görsel{required ? "" : " (isteğe bağlı)"}</span>
      {currentImageUrl ? (
        <div className="bg-surface-muted border-border-muted relative h-32 w-32 overflow-hidden rounded-xl border">
          <ProductImage src={currentImageUrl} alt={currentImageAlt ?? "Mevcut görsel"} sizes="128px" className="object-cover" />
        </div>
      ) : null}
      <input
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp"
        required={Boolean(required) && !currentImageUrl}
        className="border-border-muted file:bg-brand file:hover:bg-brand-dark w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-xs file:font-bold file:text-brand-foreground"
      />
      <p className="text-foreground/50 text-xs">
        {currentImageUrl
          ? "Yeni bir görsel seçerseniz mevcut görselin yerine geçer. JPEG, PNG veya WEBP, en fazla 5 MB."
          : "JPEG, PNG veya WEBP, en fazla 5 MB."}
      </p>
    </div>
  );
}
