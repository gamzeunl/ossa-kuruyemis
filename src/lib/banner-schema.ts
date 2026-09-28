import { z } from "zod";

/**
 * Hero ve Tam Genişlik banner formlarının ortak doğrulama kaynağı. `isActive`
 * (checkbox) ve görsel dosyası Zod dışında, action içinde ayrıca ele alınır
 * (bkz. `admin-products.ts`'teki `isRecommended` deseni).
 */
export const bannerFormSchema = z
  .object({
    title: z.string().trim().min(1, "Başlık zorunludur.").max(200, "Başlık en fazla 200 karakter olabilir."),
    subtitle: z.string().trim().max(300, "Alt başlık/açıklama en fazla 300 karakter olabilir.").optional(),
    primaryButtonLabel: z
      .string()
      .trim()
      .min(1, "Buton metni zorunludur.")
      .max(60, "Buton metni en fazla 60 karakter olabilir."),
    primaryButtonHref: z
      .string()
      .trim()
      .min(1, "Buton linki zorunludur.")
      .max(500, "Buton linki en fazla 500 karakter olabilir."),
    secondaryButtonLabel: z.string().trim().max(60, "Buton metni en fazla 60 karakter olabilir.").optional(),
    secondaryButtonHref: z.string().trim().max(500, "Buton linki en fazla 500 karakter olabilir.").optional(),
    imageAlt: z.string().trim().max(200, "Alt metin en fazla 200 karakter olabilir.").optional(),
    sortOrder: z.coerce.number().int("Sıra bir tam sayı olmalı.").min(0).max(9999),
  })
  .refine((data) => Boolean(data.secondaryButtonLabel) === Boolean(data.secondaryButtonHref), {
    message: "İkinci buton metni ve linki birlikte doldurulmalı ya da ikisi de boş bırakılmalı.",
    path: ["secondaryButtonHref"],
  });

export type BannerFormSchema = z.infer<typeof bannerFormSchema>;
