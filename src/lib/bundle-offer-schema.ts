import { z } from "zod";

/**
 * "Birlikte Daha Güzel" formunun YAPISAL doğrulama kaynağı. Fiyat, formdaki
 * `companionPrice`'ın tamamlayıcının GERÇEK anlık bağımsız efektif fiyatından
 * düşük olup olmadığı gibi DB'ye bağımlı kontroller Zod'da DEĞİL, action
 * içinde (`admin-bundle-offers.ts`) yapılır — `discount-admin-form`/
 * `admin-discounts.ts` ile aynı iş bölümü.
 */
export const bundleOfferFormSchema = z
  .object({
    primaryVariantId: z.string().trim().min(1, "Ana ürün/varyant seçmelisiniz."),
    companionVariantId: z.string().trim().min(1, "Tamamlayıcı ürün/varyant seçmelisiniz."),
    companionPrice: z.string().trim().min(1, "Birlikte al fiyatı zorunludur."),
    sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
  })
  .refine((data) => data.primaryVariantId !== data.companionVariantId, {
    message: "Ana ve tamamlayıcı varyant aynı olamaz.",
    path: ["companionVariantId"],
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) {
        return true;
      }
      return new Date(data.startsAt) <= new Date(data.endsAt);
    },
    { message: "Bitiş tarihi başlangıç tarihinden önce olamaz.", path: ["endsAt"] },
  );

export type BundleOfferFormSchema = z.infer<typeof bundleOfferFormSchema>;
