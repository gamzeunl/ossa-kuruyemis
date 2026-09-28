"use client";

import { useActionState, useRef, useState } from "react";
import { createProductAction } from "@/actions/admin-products";
import { ADMIN_FORM_INPUT_CLASSNAME, ADMIN_FORM_LABEL_CLASSNAME, AdminFormSection } from "@/components/admin/admin-form-section";
import { ProductImageUploader, type UploadedProductImage } from "@/components/admin/product-image-uploader";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductCreateFormProps {
  categoryOptions: CategoryOption[];
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const labelClassName = ADMIN_FORM_LABEL_CLASSNAME;
const inputClassName = ADMIN_FORM_INPUT_CLASSNAME;

const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

const PRODUCT_STATUS_LABELS: Record<(typeof PRODUCT_STATUSES)[number], string> = {
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  ARCHIVED: "Arşivlendi",
};

/**
 * Ürün ekleme formu — en sık kullanılan bölümler (Temel Bilgiler/Fiyat &
 * Varyant/Görseller) her zaman açık, ikincil SEO bölümü katlanabilir (bkz.
 * `AdminFormSection`, `product-admin-form.tsx` ile AYNI ortak component).
 * İçindekiler/alerjen/besin değerleri gibi alanlar bu action'da henüz
 * DESTEKLENMEZ (bkz. `createProductAction`) — bunlar ürün oluşturulduktan
 * sonra düzenleme ekranından eklenir; burada var olmayan bir alan/bölüm
 * UYDURULMADI.
 */
export function ProductCreateForm({ categoryOptions }: ProductCreateFormProps) {
  const [variantKeys, setVariantKeys] = useState<number[]>([0]);
  const nextVariantKey = useRef(1);
  const [images, setImages] = useState<UploadedProductImage[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await createProductAction(formData);
    return result.ok
      ? { message: "Kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  function addVariant() {
    setVariantKeys((keys) => [...keys, nextVariantKey.current++]);
  }

  function removeVariant(key: number) {
    setVariantKeys((keys) => (keys.length > 1 ? keys.filter((existing) => existing !== key) : keys));
  }

  function handleImageUploaded(image: UploadedProductImage) {
    setImages((prev) => [...prev, image]);
  }

  /**
   * Görsel henüz hiçbir ürüne bağlanmadı (ürün daha oluşturulmadı) — bu
   * yüzden kaldırıldığında fiziksel dosyayı da best-effort silmek güvenlidir
   * (orphan dosya bırakmamak için, bkz. görev sonu raporu §7). Ürün formunun
   * kendi kaydı/akışı bu silme isteğinin sonucunu BEKLEMEZ.
   */
  function removeImage(index: number) {
    const image = images[index];
    if (!image) return;
    setImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(image.previewUrl);
    void fetch(`/api/yonetim/urun-gorseli?url=${encodeURIComponent(image.url)}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.message ? (
        <div
          role={state.success ? "status" : "alert"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.success
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <AdminFormSection title="Temel Bilgiler">
        <label className={labelClassName}>
          Ürün adı
          <input name="name" type="text" required className={inputClassName} />
        </label>

        <label className={labelClassName}>
          Slug
          <input name="slug" type="text" required placeholder="ör. kavrulmus-ic-findik" className={inputClassName} />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Kategori
            <select name="categoryId" required defaultValue="" className={inputClassName}>
              <option value="" disabled>
                Kategori seçin
              </option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Durum
            <select name="status" defaultValue="DRAFT" className={inputClassName}>
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PRODUCT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClassName}>
          Kısa açıklama <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <textarea name="shortDescription" rows={2} className={inputClassName} />
        </label>

        <label className={labelClassName}>
          Açıklama <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <textarea name="description" rows={5} className={inputClassName} />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-foreground flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isRecommended" />
            OSSA Öneriyor
          </label>

          <label className={labelClassName}>
            Yeni rozeti override
            <select name="newBadgeOverride" defaultValue="auto" className={inputClassName}>
              <option value="auto">Otomatik</option>
              <option value="show">Her zaman göster</option>
              <option value="hide">Her zaman gizle</option>
            </select>
          </label>
        </div>
      </AdminFormSection>

      <AdminFormSection title="Fiyat &amp; Varyant">
        <div className="flex flex-col gap-4">
          {variantKeys.map((key, position) => (
            <div key={key} className="border-border-muted flex flex-col gap-3 rounded-lg border p-3">
              <input type="hidden" name="variantIndex" value={key} />
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-xs font-semibold uppercase">Varyant {position + 1}</span>
                {variantKeys.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeVariant(key)}
                    className="text-xs font-semibold text-red-700 underline underline-offset-2"
                  >
                    Kaldır
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  Varyant adı
                  <input name={`variant-${key}-name`} type="text" required className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  SKU
                  <input name={`variant-${key}-sku`} type="text" required className={inputClassName} />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className={labelClassName}>
                  Gramaj (g) <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
                  <input name={`variant-${key}-weightGram`} type="number" min={1} className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Normal fiyat
                  <input
                    name={`variant-${key}-price`}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  İndirimli fiyat <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
                  <input name={`variant-${key}-discountPrice`} type="number" min={0} step="0.01" className={inputClassName} />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  İndirim başlangıcı <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
                  <input name={`variant-${key}-discountStartsAt`} type="datetime-local" className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  İndirim bitişi <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
                  <input name={`variant-${key}-discountEndsAt`} type="datetime-local" className={inputClassName} />
                </label>
              </div>

              <label className="text-foreground flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name={`variant-${key}-isActive`} defaultChecked />
                Aktif
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariant}
            className="border-border-muted hover:border-brand w-fit rounded-full border px-4 py-2 text-xs font-bold transition-colors"
          >
            + Varyant Ekle
          </button>
        </div>
      </AdminFormSection>

      <AdminFormSection title="Görseller" description="İlk eklenen görsel ana görsel olur.">
        {images.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <div
                key={image.url}
                className="bg-surface-muted border-border-muted relative h-20 w-20 overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: önizleme URL'i, next/image bunu desteklemez */}
                <img src={image.previewUrl} alt="" className="h-full w-full object-cover" />
                {index === 0 ? (
                  <span className="bg-brand/90 text-brand-foreground absolute top-1 left-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                    Ana
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Görseli kaldır"
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white"
                >
                  ×
                </button>
                <input type="hidden" name="imageUrls" value={image.url} />
              </div>
            ))}
          </div>
        ) : null}

        <ProductImageUploader
          onUploaded={handleImageUploaded}
          onUploadingChange={setIsUploadingImage}
          buttonLabel="Ürün görseli seç"
        />
        <p className="text-foreground/50 text-xs">
          JPEG, PNG veya WEBP, en fazla 5 MB — yükleme sırasında otomatik optimize edilir.
        </p>
        <label className={labelClassName}>
          Görsel alt metni <span className="text-foreground/40 font-normal">(isteğe bağlı, SEO)</span>
          <input name="imageAlt" type="text" className={inputClassName} />
        </label>
      </AdminFormSection>

      <div className="border-border-muted bg-surface-muted flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-foreground text-sm font-semibold">Stok</p>
        <p className="text-foreground/60 text-xs">
          Yeni ürün stoksuz oluşturulur. Stok miktarını ve içindekiler/alerjen/besin değerleri gibi ek ürün
          detaylarını, ürünü oluşturduktan sonra düzenleme ekranından ekleyebilirsiniz.
        </p>
      </div>

      <AdminFormSection title="SEO" collapsible defaultOpen={false}>
        <label className={labelClassName}>
          SEO başlığı <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input name="metaTitle" type="text" className={inputClassName} />
        </label>

        <label className={labelClassName}>
          SEO açıklaması <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <textarea name="metaDescription" rows={2} className={inputClassName} />
        </label>
      </AdminFormSection>

      <button
        type="submit"
        disabled={isPending || isUploadingImage}
        className="bg-brand hover:bg-brand-dark w-fit min-h-11 rounded-full px-6 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor…" : isUploadingImage ? "Görsel yükleniyor…" : "Ürünü Oluştur"}
      </button>
    </form>
  );
}
