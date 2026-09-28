import { z } from "zod";
import { isSafeHttpUrl } from "@/lib/safe-url";

/** Boş string'i `undefined`'a çevirir; doluysa `Decimal`'a çevrilebilir bir sayı olmalı. */
const optionalDecimalString = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^\d{1,9}(\.\d{1,3})?$/.test(value), {
    message: "Geçerli bir pozitif sayı giriniz.",
  });

const NUTRITION_REFERENCE_TYPES = ["REFERENCE_AVERAGE", "OSSA_LAB_ANALYSIS"] as const;
const NUTRITION_CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW", "RECIPE_REQUIRED"] as const;

/**
 * Ürün "Ürün Bilgileri" + "Besin Değerleri" alanlarının yönetim formu doğrulama
 * kaynağı (`/yonetim/urunler/[id]`). Tüm alanlar OPSİYONEL — hiçbiri zorunlu
 * değil, eksik/yanlış veri girişini engellemez. `nutritionSourceUrl` yalnızca
 * `http:`/`https:` protokolüne izin verir (bkz. `isSafeHttpUrl`) — admin'in
 * girdiği URL PDP'de doğrudan `href` olarak render edileceğinden `javascript:`
 * gibi güvensiz şemalar reddedilir.
 */
export const productInfoFormSchema = z.object({
  description: z.string().trim().max(4000, "Ürün açıklaması en fazla 4000 karakter olabilir.").optional(),
  shortDescription: z.string().trim().max(300, "Kısa açıklama en fazla 300 karakter olabilir.").optional(),
  ingredients: z.string().trim().max(1000, "İçindekiler en fazla 1000 karakter olabilir.").optional(),
  storageConditions: z.string().trim().max(500, "Saklama koşulları en fazla 500 karakter olabilir.").optional(),
  deliveryInfo: z.string().trim().max(1000, "Teslimat bilgisi en fazla 1000 karakter olabilir.").optional(),
  allergenInfo: z.string().trim().max(500, "Alerjen bilgisi en fazla 500 karakter olabilir.").optional(),
  originInfo: z.string().trim().max(300, "Menşe bilgisi en fazla 300 karakter olabilir.").optional(),
  usageSuggestion: z.string().trim().max(500, "Kullanım önerisi en fazla 500 karakter olabilir.").optional(),

  nutritionEnergyKcal: optionalDecimalString,
  nutritionEnergyKj: optionalDecimalString,
  nutritionFat: optionalDecimalString,
  nutritionSaturatedFat: optionalDecimalString,
  nutritionCarbohydrate: optionalDecimalString,
  nutritionSugars: optionalDecimalString,
  nutritionFiber: optionalDecimalString,
  nutritionProtein: optionalDecimalString,
  nutritionSalt: optionalDecimalString,
  nutritionSourceName: z.string().trim().max(200, "Kaynak adı en fazla 200 karakter olabilir.").optional(),
  nutritionSourceUrl: z
    .string()
    .trim()
    .max(500, "Kaynak URL'si en fazla 500 karakter olabilir.")
    .optional()
    .refine((value) => !value || isSafeHttpUrl(value), {
      message: "Kaynak URL'si yalnızca http:// veya https:// ile başlayabilir.",
    }),
  nutritionSourceProduct: z.string().trim().max(200, "Kaynak ürün adı en fazla 200 karakter olabilir.").optional(),
  nutritionReferenceType: z.enum(NUTRITION_REFERENCE_TYPES).optional(),
  nutritionConfidence: z.enum(NUTRITION_CONFIDENCE_LEVELS).optional(),
});

export type ProductInfoFormSchema = z.infer<typeof productInfoFormSchema>;
