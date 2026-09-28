"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { deleteProductVariantAction, updateProductAdminAction } from "@/actions/admin-products";
import { ADMIN_FORM_INPUT_CLASSNAME, ADMIN_FORM_LABEL_CLASSNAME, AdminFormSection } from "@/components/admin/admin-form-section";
import { ContentDeleteForm } from "@/components/admin/content-delete-form";
import { formatPrice } from "@/lib/format-money";
import { NEW_PRODUCT_DAYS } from "@/lib/product-badges";

export interface AdminVariantFormData {
  id: string;
  name: string;
  sku: string;
  weightGram: number | null;
  price: string;
  isActive: boolean;
  /** Salt bilgi amaçlı — bu form indirim YAZMAZ, yalnızca "Haftanın Fırsatları"na yönlendirme ipucu gösterir. */
  hasActiveDiscount: boolean;
}

export interface AdminProductNutritionFormData {
  energyKcal: string;
  energyKj: string;
  fat: string;
  saturatedFat: string;
  carbohydrate: string;
  sugars: string;
  fiber: string;
  protein: string;
  salt: string;
  sourceName: string;
  sourceUrl: string;
  sourceProduct: string;
  referenceType: "" | "REFERENCE_AVERAGE" | "OSSA_LAB_ANALYSIS";
  confidence: "" | "HIGH" | "MEDIUM" | "LOW" | "RECIPE_REQUIRED";
}

export interface AdminProductFormData {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isRecommended: boolean;
  newBadgeOverride: boolean | null;
  categoryId: string;
  description: string;
  shortDescription: string;
  ingredients: string;
  storageConditions: string;
  deliveryInfo: string;
  allergenInfo: string;
  originInfo: string;
  usageSuggestion: string;
  nutrition: AdminProductNutritionFormData;
  metaTitle: string;
  metaDescription: string;
  variants: AdminVariantFormData[];
}

export interface AdminCategoryOption {
  id: string;
  name: string;
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const PRODUCT_STATUS_LABELS: Record<(typeof PRODUCT_STATUSES)[number], string> = {
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  ARCHIVED: "Arşivlendi",
};

const META_TITLE_MAX = 200;
const META_DESCRIPTION_MAX = 300;

const labelClassName = ADMIN_FORM_LABEL_CLASSNAME;
const inputClassName = ADMIN_FORM_INPUT_CLASSNAME;

function CharacterCount({ value, max }: { value: string; max: number }) {
  const isOver = value.length > max;
  return (
    <span className={`text-[11px] font-normal ${isOver ? "text-red-600" : "text-foreground/40"}`}>
      {value.length}/{max} karakter
    </span>
  );
}

export function ProductAdminForm({
  product,
  categoryOptions,
}: {
  product: AdminProductFormData;
  categoryOptions: AdminCategoryOption[];
}) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await updateProductAdminAction(product.id, formData);
    return result.ok
      ? { message: "Değişiklikler kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  const [metaTitle, setMetaTitle] = useState(product.metaTitle);
  const [metaDescription, setMetaDescription] = useState(product.metaDescription);

  const [newVariantKeys, setNewVariantKeys] = useState<number[]>([]);
  const nextNewVariantKey = useRef(0);

  function addVariantRow() {
    setNewVariantKeys((keys) => [...keys, nextNewVariantKey.current++]);
  }

  function removeVariantRow(key: number) {
    setNewVariantKeys((keys) => keys.filter((existing) => existing !== key));
  }

  const canDeleteVariants = product.variants.length > 1;

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Ürün adı
            <input name="name" type="text" required defaultValue={product.name} className={inputClassName} />
          </label>
          <label className={labelClassName}>
            Slug
            <input name="slug" type="text" required defaultValue={product.slug} className={inputClassName} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClassName}>
            Ana Kategori
            <select name="categoryId" required defaultValue={product.categoryId} className={inputClassName}>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span className="text-foreground/50 text-[11px] font-normal">
              Ürün yalnızca tek bir ana kategoriye bağlı olabilir; değiştirirseniz eski kategori ilişkisi kaldırılır.
            </span>
          </label>
          <label className={labelClassName}>
            Ürün Durumu
            <select name="status" defaultValue={product.status} className={inputClassName}>
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PRODUCT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="border-border-muted flex items-center gap-2.5 rounded-lg border p-3 text-sm font-medium">
            <input type="checkbox" name="isRecommended" defaultChecked={product.isRecommended} />
            OSSA Öneriyor
          </label>
          <label className={labelClassName}>
            Yeni rozeti
            <select
              name="newBadgeOverride"
              defaultValue={
                product.newBadgeOverride === true ? "show" : product.newBadgeOverride === false ? "hide" : "auto"
              }
              className={inputClassName}
            >
              <option value="auto">Otomatik hesapla (oluşturmadan {NEW_PRODUCT_DAYS} gün)</option>
              <option value="show">Zorla göster</option>
              <option value="hide">Zorla gizle</option>
            </select>
          </label>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Ürün İçeriği"
        description="Hiçbir alan zorunlu değil — boş bırakılan alanlar ürün detay sayfasında gösterilmez."
        collapsible
      >

        <label className={labelClassName}>
          Kısa açıklama
          <textarea
            name="shortDescription"
            rows={2}
            defaultValue={product.shortDescription}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Ürün açıklaması
          <textarea name="description" rows={4} defaultValue={product.description} className={inputClassName} />
        </label>

        <label className={labelClassName}>
          İçindekiler
          <textarea name="ingredients" rows={3} defaultValue={product.ingredients} className={inputClassName} />
        </label>

        <label className={labelClassName}>
          Saklama koşulları
          <textarea
            name="storageConditions"
            rows={2}
            defaultValue={product.storageConditions}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          Teslimat bilgileri{" "}
          <span className="text-foreground/40 font-normal">
            (isteğe bağlı — boş bırakılırsa tüm ürünlerde ortak kargo metni gösterilir)
          </span>
          <textarea name="deliveryInfo" rows={2} defaultValue={product.deliveryInfo} className={inputClassName} />
        </label>

        <label className={labelClassName}>
          Alerjen bilgisi{" "}
          <span className="text-foreground/40 font-normal">(yalnızca kesin biliniyorsa — tahmin etmeyin)</span>
          <textarea name="allergenInfo" rows={2} defaultValue={product.allergenInfo} className={inputClassName} />
        </label>

        <label className={labelClassName}>
          Kullanım önerisi
          <textarea name="usageSuggestion" rows={2} defaultValue={product.usageSuggestion} className={inputClassName} />
        </label>

        <label className={labelClassName}>
          Menşe{" "}
          <span className="text-foreground/40 font-normal">(gerçekten doğrulanmadıysa boş bırakın)</span>
          <input name="originInfo" type="text" defaultValue={product.originInfo} className={inputClassName} />
        </label>
      </AdminFormSection>

      <AdminFormSection
        title="Besin Değerleri"
        description="100 g için ortalama değerler. Kaynağı olmayan bir değer girmeyin — tedarikçi etiketi/analizi gelene kadar boş bırakmak yanlış bilgi vermekten daha iyidir."
        collapsible
        defaultOpen={false}
      >

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className={labelClassName}>
            Enerji (kcal)
            <input
              name="nutritionEnergyKcal"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.energyKcal}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Enerji (kJ)
            <input
              name="nutritionEnergyKj"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.energyKj}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Yağ (g)
            <input
              name="nutritionFat"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.fat}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Doymuş yağ (g)
            <input
              name="nutritionSaturatedFat"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.saturatedFat}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Karbonhidrat (g)
            <input
              name="nutritionCarbohydrate"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.carbohydrate}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Şekerler (g)
            <input
              name="nutritionSugars"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.sugars}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Lif (g)
            <input
              name="nutritionFiber"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.fiber}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Protein (g)
            <input
              name="nutritionProtein"
              type="number"
              step="0.01"
              min={0}
              defaultValue={product.nutrition.protein}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Tuz (g)
            <input
              name="nutritionSalt"
              type="number"
              step="0.001"
              min={0}
              defaultValue={product.nutrition.salt}
              className={inputClassName}
            />
          </label>
        </div>

        <div className="border-border-muted mt-2 flex flex-col gap-3 border-t pt-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">Kaynak</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClassName}>
              Kaynak adı
              <input
                name="nutritionSourceName"
                type="text"
                defaultValue={product.nutrition.sourceName}
                className={inputClassName}
                placeholder="ör. USDA FoodData Central"
              />
            </label>
            <label className={labelClassName}>
              Kaynak ürün adı
              <input
                name="nutritionSourceProduct"
                type="text"
                defaultValue={product.nutrition.sourceProduct}
                className={inputClassName}
                placeholder="ör. Nuts, almonds, raw"
              />
            </label>
          </div>
          <label className={labelClassName}>
            Kaynak URL
            <input
              name="nutritionSourceUrl"
              type="url"
              defaultValue={product.nutrition.sourceUrl}
              className={inputClassName}
              placeholder="https://…"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClassName}>
              Referans türü
              <select name="nutritionReferenceType" defaultValue={product.nutrition.referenceType} className={inputClassName}>
                <option value="">Seçiniz</option>
                <option value="REFERENCE_AVERAGE">Genel referans ortalaması</option>
                <option value="OSSA_LAB_ANALYSIS">OSSA laboratuvar analizi</option>
              </select>
            </label>
            <label className={labelClassName}>
              Güven seviyesi
              <select name="nutritionConfidence" defaultValue={product.nutrition.confidence} className={inputClassName}>
                <option value="">Seçiniz</option>
                <option value="HIGH">Yüksek</option>
                <option value="MEDIUM">Orta</option>
                <option value="LOW">Düşük</option>
                <option value="RECIPE_REQUIRED">Reçete/etiket gerekli</option>
              </select>
            </label>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Varyantlar ve Fiyat"
        description={
          <>
            İndirim yönetimi burada değil —{" "}
            <Link href="/yonetim/kampanyalar/haftanin-firsatlari" className="text-brand font-semibold underline">
              Haftanın Fırsatları
            </Link>{" "}
            ekranından yapılır.
          </>
        }
        headerAction={
          <button
            type="button"
            onClick={addVariantRow}
            className="border-border-muted hover:border-brand rounded-full border px-4 py-2 text-xs font-bold transition-colors"
          >
            + Yeni Varyant Ekle
          </button>
        }
      >

        <div className="flex flex-col gap-3">
          {product.variants.map((variant) => (
            <div key={variant.id} className="border-border-muted flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-foreground text-sm font-semibold">
                  {variant.name} — normal fiyat {formatPrice(variant.price)}
                  {variant.hasActiveDiscount ? (
                    <span className="text-brand ml-2 text-xs font-semibold">Aktif indirimde</span>
                  ) : null}
                </p>
                {canDeleteVariants ? (
                  <ContentDeleteForm
                    action={deleteProductVariantAction.bind(null, product.id, variant.id)}
                    confirmMessage="Bu varyantı silmek istediğinize emin misiniz? Geçmiş sipariş/kampanyalarda kullanılıyorsa silinemez, bunun yerine pasifleştirin."
                  />
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  Varyant adı
                  <input
                    name={`existingVariant-${variant.id}-name`}
                    type="text"
                    required
                    defaultValue={variant.name}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  SKU
                  <input
                    name={`existingVariant-${variant.id}-sku`}
                    type="text"
                    required
                    defaultValue={variant.sku}
                    className={inputClassName}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  Gramaj (g) <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
                  <input
                    name={`existingVariant-${variant.id}-weightGram`}
                    type="number"
                    min={1}
                    defaultValue={variant.weightGram ?? ""}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Normal fiyat
                  <input
                    name={`existingVariant-${variant.id}-price`}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    defaultValue={variant.price}
                    className={inputClassName}
                  />
                </label>
              </div>
              <label className="flex w-fit items-center gap-2.5 text-xs font-medium">
                <input
                  type="checkbox"
                  name={`existingVariant-${variant.id}-isActive`}
                  defaultChecked={variant.isActive}
                />
                Aktif (satın alınabilir)
              </label>
            </div>
          ))}

          {newVariantKeys.map((key, position) => (
            <div key={key} className="border-brand/40 flex flex-col gap-3 rounded-xl border border-dashed p-4">
              <input type="hidden" name="newVariantIndex" value={key} />
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-xs font-semibold uppercase">Yeni Varyant {position + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVariantRow(key)}
                  className="text-xs font-semibold text-red-700 underline underline-offset-2"
                >
                  Kaldır
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  Varyant adı
                  <input name={`newVariant-${key}-name`} type="text" required className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  SKU
                  <input name={`newVariant-${key}-sku`} type="text" required className={inputClassName} />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClassName}>
                  Gramaj (g) <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
                  <input name={`newVariant-${key}-weightGram`} type="number" min={1} className={inputClassName} />
                </label>
                <label className={labelClassName}>
                  Normal fiyat
                  <input
                    name={`newVariant-${key}-price`}
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className={inputClassName}
                  />
                </label>
              </div>
              <label className="flex w-fit items-center gap-2.5 text-xs font-medium">
                <input type="checkbox" name={`newVariant-${key}-isActive`} defaultChecked />
                Aktif (satın alınabilir)
              </label>
            </div>
          ))}
        </div>
      </AdminFormSection>

      <AdminFormSection title="SEO" collapsible>
        <label className={labelClassName}>
          <span className="flex items-center justify-between">
            Meta başlık
            <CharacterCount value={metaTitle} max={META_TITLE_MAX} />
          </span>
          <input
            name="metaTitle"
            type="text"
            value={metaTitle}
            onChange={(event) => setMetaTitle(event.target.value)}
            className={inputClassName}
          />
        </label>

        <label className={labelClassName}>
          <span className="flex items-center justify-between">
            Meta açıklama
            <CharacterCount value={metaDescription} max={META_DESCRIPTION_MAX} />
          </span>
          <textarea
            name="metaDescription"
            rows={2}
            value={metaDescription}
            onChange={(event) => setMetaDescription(event.target.value)}
            className={inputClassName}
          />
        </label>
      </AdminFormSection>

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand text-brand-foreground hover:bg-brand-dark w-fit min-h-11 rounded-full px-6 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
